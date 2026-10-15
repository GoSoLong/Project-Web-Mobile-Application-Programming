const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PUBLIC_DIR = path.join(__dirname, "public");
const ROUTING_SERVICE = process.env.ROUTING_SERVICE_URL || "https://router.project-osrm.org";
const ROUTING_TIMEOUT_MS = 12_000;
const ROUTING_REQUEST_INTERVAL_MS = 1_000;
const SIMULATION_STEP_METERS = 60;
const MAX_PUBLIC_ROUTE_POINTS = 1_200;
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const INITIAL_VEHICLES = [
  {
    id: "VH-001",
    plate: "30K-123.45",
    name: "Hyundai Solati",
    type: "Xe khách",
    driver: "Nguyễn Minh Khôi",
    status: "in_trip",
    currentTripId: "TR-2408",
    lastLocation: [21.0368, 105.7824],
    routeEndpoints: [[21.0368, 105.7824], [21.07, 105.827]],
    route: [],
    routeCumulativeMeters: [],
    routeDistanceMeters: 0,
    routeProgressMeters: 0,
    routeStatus: "loading",
    updatedAt: Date.now() - 18_000,
    trips: [
      { id: "TR-2408", startedAt: "08:15", endedAt: null, origin: "Hà Nội", originCoordinates: [21.0368, 105.7824], destination: "Sân bay Nội Bài", destinationCoordinates: [21.07, 105.827], status: "Đang di chuyển" },
      { id: "TR-2391", startedAt: "Hôm qua, 14:20", endedAt: "Hôm qua, 16:05", origin: "Hà Nội", originCoordinates: [21.0278, 105.8342], destination: "Hạ Long", destinationCoordinates: [20.951, 107.080], status: "Hoàn thành" },
    ],
  },
  {
    id: "VH-002",
    plate: "29H-678.90",
    name: "Ford Transit",
    type: "Xe van",
    driver: "Trần Thu Hà",
    status: "in_trip",
    currentTripId: "TR-2409",
    lastLocation: [21.061, 105.843],
    routeEndpoints: [[21.061, 105.843], [21.035, 105.813]],
    route: [],
    routeCumulativeMeters: [],
    routeDistanceMeters: 0,
    routeProgressMeters: 0,
    routeStatus: "loading",
    updatedAt: Date.now() - 42_000,
    trips: [
      { id: "TR-2409", startedAt: "08:42", endedAt: null, origin: "Long Biên", originCoordinates: [21.061, 105.843], destination: "Khu công nghiệp Thăng Long", destinationCoordinates: [21.035, 105.813], status: "Đang di chuyển" },
    ],
  },
  {
    id: "VH-003",
    plate: "30G-456.78",
    name: "Toyota Hilux",
    type: "Xe bán tải",
    driver: "Lê Quốc Bảo",
    status: "idle",
    currentTripId: null,
    lastLocation: [21.0278, 105.8342],
    routeEndpoints: [],
    route: [],
    routeCumulativeMeters: [],
    routeDistanceMeters: 0,
    routeProgressMeters: 0,
    routeStatus: "not_applicable",
    updatedAt: Date.now() - 4 * 60_000,
    trips: [
      { id: "TR-2398", startedAt: "Hôm qua, 13:10", endedAt: "Hôm qua, 15:40", origin: "Mỹ Đình", originCoordinates: [21.028, 105.782], destination: "Long Biên", destinationCoordinates: [21.045, 105.888], status: "Hoàn thành" },
    ],
  },
  {
    id: "VH-004",
    plate: "29C-112.23",
    name: "Isuzu QKR",
    type: "Xe tải nhẹ",
    driver: "Phạm Đức Anh",
    status: "in_trip",
    currentTripId: "TR-2410",
    lastLocation: [21.078, 105.768],
    routeEndpoints: [[21.078, 105.768], [21.058, 105.812]],
    route: [],
    routeCumulativeMeters: [],
    routeDistanceMeters: 0,
    routeProgressMeters: 0,
    routeStatus: "loading",
    updatedAt: Date.now() - 12_000,
    trips: [
      { id: "TR-2410", startedAt: "09:05", endedAt: null, origin: "Tây Hồ", originCoordinates: [21.078, 105.768], destination: "Hoài Đức", destinationCoordinates: [21.058, 105.812], status: "Đang di chuyển" },
    ],
  },
  {
    id: "VH-005",
    plate: "30F-334.56",
    name: "Mitsubishi Xpander",
    type: "Xe dịch vụ",
    driver: "Vũ Mai Linh",
    status: "no_signal",
    currentTripId: null,
    lastLocation: null,
    routeEndpoints: [],
    route: [],
    routeCumulativeMeters: [],
    routeDistanceMeters: 0,
    routeProgressMeters: 0,
    routeStatus: "not_applicable",
    updatedAt: null,
    trips: [],
  },
];

function cloneVehicles() {
  return INITIAL_VEHICLES.map((vehicle) => ({
    ...vehicle,
    lastLocation: vehicle.lastLocation && [...vehicle.lastLocation],
    routeEndpoints: vehicle.routeEndpoints.map((point) => [...point]),
    route: vehicle.route.map((point) => [...point]),
    routeCumulativeMeters: [...vehicle.routeCumulativeMeters],
    trips: vehicle.trips.map((trip) => ({ ...trip })),
  }));
}

function distanceMeters([lat1, lon1], [lat2, lon2]) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(lat2 - lat1);
  const longitudeDelta = radians(lon2 - lon1);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2))
    * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function buildRouteMetrics(points) {
  const cumulativeMeters = [0];
  for (let index = 1; index < points.length; index += 1) {
    cumulativeMeters.push(cumulativeMeters[index - 1] + distanceMeters(points[index - 1], points[index]));
  }
  return { cumulativeMeters, distanceMeters: cumulativeMeters.at(-1) || 0 };
}

function interpolateRoutePosition(points, cumulativeMeters, progressMeters) {
  for (let index = 1; index < points.length; index += 1) {
    if (progressMeters > cumulativeMeters[index]) continue;
    const segmentDistance = cumulativeMeters[index] - cumulativeMeters[index - 1];
    const segmentProgress = segmentDistance
      ? (progressMeters - cumulativeMeters[index - 1]) / segmentDistance
      : 0;
    return [
      points[index - 1][0] + (points[index][0] - points[index - 1][0]) * segmentProgress,
      points[index - 1][1] + (points[index][1] - points[index - 1][1]) * segmentProgress,
    ];
  }
  return [...points.at(-1)];
}

function simplifyRoute(points) {
  if (points.length <= MAX_PUBLIC_ROUTE_POINTS) return points;
  const stride = (points.length - 1) / (MAX_PUBLIC_ROUTE_POINTS - 1);
  return Array.from({ length: MAX_PUBLIC_ROUTE_POINTS }, (_, index) => points[Math.round(index * stride)]);
}

async function fetchDrivingRoute(start, destination) {
  const coordinates = [start, destination]
    .map(([latitude, longitude]) => `${longitude},${latitude}`)
    .join(";");
  const url = new URL(`/route/v1/driving/${coordinates}`, ROUTING_SERVICE);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");

  const response = await fetch(url, { signal: AbortSignal.timeout(ROUTING_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Dịch vụ định tuyến trả về HTTP ${response.status}.`);
  const result = await response.json();
  const coordinatesResult = result.code === "Ok" && result.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coordinatesResult) || coordinatesResult.length < 2) {
    throw new Error(`Không tìm thấy tuyến đường phù hợp (${result.code || "lỗi dữ liệu"}).`);
  }

  return coordinatesResult.map(([longitude, latitude]) => [latitude, longitude]);
}

async function loadVehicleRoutes(vehicles, routeProvider, requestIntervalMs) {
  const routableVehicles = vehicles.filter((vehicle) => vehicle.routeEndpoints.length === 2);
  for (const [index, vehicle] of routableVehicles.entries()) {
    if (index > 0 && requestIntervalMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, requestIntervalMs));
    }

    try {
      const route = await routeProvider(...vehicle.routeEndpoints);
      if (!Array.isArray(route) || route.length < 2) {
        throw new Error("Dịch vụ định tuyến trả về tuyến không hợp lệ.");
      }
      const metrics = buildRouteMetrics(route);
      vehicle.route = route;
      vehicle.routeCumulativeMeters = metrics.cumulativeMeters;
      vehicle.routeDistanceMeters = metrics.distanceMeters;
      vehicle.routeProgressMeters = 0;
      vehicle.lastLocation = [...route[0]];
      vehicle.updatedAt = Date.now();
      vehicle.routeStatus = "ready";
    } catch (error) {
      vehicle.routeStatus = "unavailable";
      vehicle.routeError = error.message;
      console.error(`Không tải được tuyến đường cho ${vehicle.id}: ${error.message}`);
    }
  }
}

function publicVehicle(vehicle) {
  const [latitude, longitude] = vehicle.lastLocation || [];
  const activeTrip = vehicle.trips.find((trip) => trip.id === vehicle.currentTripId);
  const routeDestination = vehicle.route.at(-1);
  return {
    id: vehicle.id,
    plate: vehicle.plate,
    name: vehicle.name,
    type: vehicle.type,
    driver: vehicle.driver,
    status: vehicle.status,
    currentTripId: vehicle.currentTripId,
    location: vehicle.lastLocation
      ? { latitude, longitude, updatedAt: new Date(vehicle.updatedAt).toISOString() }
      : null,
    routeStatus: vehicle.routeStatus,
    routeError: vehicle.routeError || null,
    routeDistanceMeters: vehicle.routeDistanceMeters,
    destination: vehicle.routeStatus === "ready" && activeTrip && routeDestination
      ? {
        name: activeTrip.destination,
        latitude: routeDestination[0],
        longitude: routeDestination[1],
      }
      : null,
    route: simplifyRoute(vehicle.route).map(([routeLatitude, routeLongitude]) => ({
      latitude: routeLatitude,
      longitude: routeLongitude,
    })),
  };
}

function publicTrip(trip, routeData) {
  return {
    id: trip.id,
    startedAt: trip.startedAt,
    endedAt: trip.endedAt,
    origin: trip.origin,
    destination: trip.destination,
    status: trip.status,
    routeStatus: routeData.routeStatus,
    routeDistanceMeters: routeData.routeDistanceMeters,
    route: routeData.route.map(([latitude, longitude]) => ({ latitude, longitude })),
    originCoordinates: routeData.originCoordinates
      ? { latitude: routeData.originCoordinates[0], longitude: routeData.originCoordinates[1] }
      : null,
    destinationCoordinates: routeData.destinationCoordinates
      ? { latitude: routeData.destinationCoordinates[0], longitude: routeData.destinationCoordinates[1] }
      : null,
    routeError: routeData.routeError || null,
  };
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

function createServer({
  simulate = true,
  routeProvider = fetchDrivingRoute,
  routeRequestIntervalMs = ROUTING_REQUEST_INTERVAL_MS,
  simulationIntervalMs = 8_000,
} = {}) {
  const vehicles = cloneVehicles();
  let simulationTimer;
  const tripRouteCache = new Map();
  const routesReady = loadVehicleRoutes(vehicles, routeProvider, routeRequestIntervalMs);

  async function loadTripRoute(vehicle, trip) {
    if (trip.id === vehicle.currentTripId && vehicle.routeStatus === "ready") {
      return {
        routeStatus: "ready",
        routeDistanceMeters: vehicle.routeDistanceMeters,
        route: vehicle.route,
        originCoordinates: vehicle.route[0],
        destinationCoordinates: vehicle.route.at(-1),
      };
    }

    if (!Array.isArray(trip.originCoordinates) || !Array.isArray(trip.destinationCoordinates)) {
      return {
        routeStatus: "unavailable",
        routeDistanceMeters: null,
        route: [],
        originCoordinates: null,
        destinationCoordinates: null,
        routeError: "Chuyến chưa có đủ tọa độ điểm đi và điểm đến.",
      };
    }

    const cacheKey = `${vehicle.id}:${trip.id}`;
    if (!tripRouteCache.has(cacheKey)) {
      const routePromise = (async () => {
        const route = await routeProvider(trip.originCoordinates, trip.destinationCoordinates);
        if (!Array.isArray(route) || route.length < 2) {
          throw new Error("Dịch vụ định tuyến trả về tuyến không hợp lệ.");
        }
        const metrics = buildRouteMetrics(route);
        return {
          routeStatus: "ready",
          routeDistanceMeters: metrics.distanceMeters,
          route,
          originCoordinates: route[0],
          destinationCoordinates: route.at(-1),
        };
      })().catch((error) => {
        console.error(`Không tải được tuyến chuyến ${trip.id}: ${error.message}`);
        return {
          routeStatus: "unavailable",
          routeDistanceMeters: null,
          route: [],
          originCoordinates: trip.originCoordinates,
          destinationCoordinates: trip.destinationCoordinates,
          routeError: error.message,
        };
      });
      tripRouteCache.set(cacheKey, routePromise);
    }
    return tripRouteCache.get(cacheKey);
  }

  const server = http.createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
      sendJson(response, 400, { error: "Đường dẫn không hợp lệ." });
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }

    if (pathname.startsWith("/api/")) {
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length === 2 && segments[1] === "vehicles") {
        routesReady.then(() => {
          sendJson(response, 200, {
            data: vehicles.map(publicVehicle),
            generatedAt: new Date().toISOString(),
            source: "simulation",
          });
        });
        return;
      }

      if (segments.length >= 3 && segments[1] === "vehicles") {
        routesReady.then(() => {
          const vehicle = vehicles.find((item) => item.id === segments[2]);
          if (!vehicle) {
            sendJson(response, 404, { error: "Không tìm thấy phương tiện." });
            return;
          }

          if (segments.length === 3) {
            sendJson(response, 200, { data: publicVehicle(vehicle) });
            return;
          }

          if (segments.length === 4 && segments[3] === "trips") {
            Promise.all(vehicle.trips.map(async (trip) => (
              publicTrip(trip, await loadTripRoute(vehicle, trip))
            ))).then((trips) => {
              sendJson(response, 200, { data: trips });
            });
            return;
          }

          if (segments.length === 5 && segments[3] === "location" && segments[4] === "latest") {
            sendJson(response, 200, { data: publicVehicle(vehicle).location });
            return;
          }

          sendJson(response, 404, { error: "Không tìm thấy API." });
        });
        return;
      }

      sendJson(response, 404, { error: "Không tìm thấy API." });
      return;
    }

    const requestedPath = pathname === "/" ? "/index.html" : pathname;
    const filePath = path.resolve(PUBLIC_DIR, `.${requestedPath}`);
    const relativePath = path.relative(PUBLIC_DIR, filePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      response.writeHead(403);
      response.end();
      return;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(error.code === "ENOENT" ? 404 : 500);
        response.end(error.code === "ENOENT" ? "Không tìm thấy trang." : "Không thể đọc tệp.");
        return;
      }

      response.writeHead(200, {
        "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(request.method === "HEAD" ? undefined : content);
    });
  });

  if (simulate) {
    simulationTimer = setInterval(() => {
      for (const vehicle of vehicles) {
        if (vehicle.status !== "in_trip" || vehicle.routeStatus !== "ready") continue;
        const roundTripDistance = vehicle.routeDistanceMeters * 2;
        const roundTripProgress = (vehicle.routeProgressMeters + SIMULATION_STEP_METERS) % roundTripDistance;
        vehicle.routeProgressMeters = roundTripProgress <= vehicle.routeDistanceMeters
          ? roundTripProgress
          : roundTripDistance - roundTripProgress;
        vehicle.lastLocation = interpolateRoutePosition(
          vehicle.route,
          vehicle.routeCumulativeMeters,
          vehicle.routeProgressMeters,
        );
        vehicle.updatedAt = Date.now();
      }
    }, simulationIntervalMs);
    simulationTimer.unref();
    server.once("close", () => clearInterval(simulationTimer));
  }

  return server;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const server = createServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server M2 đang chạy tại http://localhost:${port}`);
    console.log("Vị trí và hành trình là dữ liệu mô phỏng; tuyến đường được lấy từ OSRM.");
  });
}

module.exports = { createServer };