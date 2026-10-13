const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createServer } = require("../server");

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("serves the dashboard and client JavaScript", async () => {
  const page = await fetch(baseUrl);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Điều phối đội xe/);

  const script = await fetch(`${baseUrl}/app.js`);
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type"), /javascript/);
});

test("lists sample vehicles with location and status", async () => {
  const response = await fetch(`${baseUrl}/api/vehicles`);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.source, "sample");
  assert.equal(result.data.length, 3);
  assert.equal(result.data[0].status, "in_trip");
  assert.equal(typeof result.data[0].location.latitude, "number");
  assert.equal(result.data[2].location, null);
});

test("returns vehicle details and trips", async () => {
  const detailResponse = await fetch(`${baseUrl}/api/vehicles/VH-001`);
  assert.equal(detailResponse.status, 200);
  assert.equal((await detailResponse.json()).data.plate, "30K-123.45");

  const tripsResponse = await fetch(`${baseUrl}/api/vehicles/VH-001/trips`);
  assert.equal(tripsResponse.status, 200);
  const trips = (await tripsResponse.json()).data;
  assert.equal(trips.length, 2);
  assert.equal(trips[0].origin, "Hà Nội");
  assert.equal(trips[1].distanceMeters, 161200);
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
