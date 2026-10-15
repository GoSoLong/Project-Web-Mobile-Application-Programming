const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createServer } = require("../server");

let server;
let baseUrl;

before(async () => {
  server = createServer({
    simulate: false,
    routeRequestIntervalMs: 0,
    routeProvider: async (start, destination) => [
      start,
      [(start[0] + destination[0]) / 2 + 0.001, (start[1] + destination[1]) / 2],
      destination,
    ],
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("serves the dashboard and trip-selection client", async () => {
  const page = await fetch(baseUrl);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Giám sát đội xe/);
  assert.match(html, /id="trip-list"/);

  const script = await fetch(`${baseUrl}/app.js`);
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type"), /javascript/);
  const app = await script.text();
  assert.match(app, /async function loadTrips/);
  assert.match(app, /function selectTripRoute/);
});

test("lists vehicles with latest position, status, and active route", async () => {
  const response = await fetch(`${baseUrl}/api/vehicles`);
  assert.equal(response.status, 200);
  const result = await response.json();

  assert.equal(result.source, "simulation");
  assert.equal(result.data.length, 5);
  const active = result.data.find((vehicle) => vehicle.id === "VH-001");
  assert.equal(active.status, "in_trip");
  assert.equal(active.routeStatus, "ready");
  assert.equal(active.route.length, 3);
  assert.equal(typeof active.location.latitude, "number");
  assert.equal(typeof active.location.updatedAt, "string");
  assert.equal(result.data.find((vehicle) => vehicle.id === "VH-005").location, null);
});

test("returns recent trips with route data associated with their vehicle", async () => {
  const detailResponse = await fetch(`${baseUrl}/api/vehicles/VH-001`);
  assert.equal(detailResponse.status, 200);
  assert.equal((await detailResponse.json()).data.plate, "30K-123.45");

  const tripsResponse = await fetch(`${baseUrl}/api/vehicles/VH-001/trips`);
  assert.equal(tripsResponse.status, 200);
  const trips = (await tripsResponse.json()).data;
  assert.equal(trips.length, 2);

  const activeTrip = trips.find((trip) => trip.id === "TR-2408");
  assert.equal(activeTrip.origin, "Hà Nội");
  assert.equal(activeTrip.status, "Đang di chuyển");
  assert.equal(activeTrip.routeStatus, "ready");
  assert.ok(activeTrip.routeDistanceMeters > 0);
  assert.equal(activeTrip.route.length, 3);
  assert.deepEqual(activeTrip.originCoordinates, {
    latitude: 21.0368,
    longitude: 105.7824,
  });

  const completedTrip = trips.find((trip) => trip.id === "TR-2391");
  assert.equal(completedTrip.destination, "Hạ Long");
  assert.equal(completedTrip.status, "Hoàn thành");
  assert.equal(completedTrip.routeStatus, "ready");
  assert.ok(completedTrip.routeDistanceMeters > 0);
});

test("returns latest location for a vehicle and null when no location exists", async () => {
  const latestResponse = await fetch(`${baseUrl}/api/vehicles/VH-001/location/latest`);
  assert.equal(latestResponse.status, 200);
  const latest = (await latestResponse.json()).data;
  assert.equal(typeof latest.latitude, "number");
  assert.equal(typeof latest.longitude, "number");
  assert.equal(typeof latest.updatedAt, "string");

  const missingResponse = await fetch(`${baseUrl}/api/vehicles/VH-005/location/latest`);
  assert.equal(missingResponse.status, 200);
  assert.equal((await missingResponse.json()).data, null);
});

test("returns 404 for unknown vehicles and API paths", async () => {
  const vehicle = await fetch(`${baseUrl}/api/vehicles/UNKNOWN`);
  assert.equal(vehicle.status, 404);

  const route = await fetch(`${baseUrl}/api/unknown`);
  assert.equal(route.status, 404);
});

test("allows only GET and HEAD requests", async () => {
  const response = await fetch(`${baseUrl}/api/vehicles`, { method: "POST" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});
