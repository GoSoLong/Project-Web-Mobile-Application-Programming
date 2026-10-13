const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PUBLIC_DIR = path.join(__dirname, "public");
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const vehicles = [
  {
    id: "VH-001",
    plate: "30K-123.45",
    name: "Hyundai Solati",
    driver: "Nguyễn Minh Khôi",
    status: "in_trip",
    location: {
      latitude: 21.0368,
      longitude: 105.7824,
      updatedAt: "2026-10-13T12:00:00.000Z",
    },
    trips: [
      {
        id: "TR-2408",
        origin: "Hà Nội",
        destination: "Sân bay Nội Bài",
        startedAt: "2026-10-13T08:15:00.000Z",
        endedAt: null,
        distanceMeters: null,
        status: "Đang di chuyển",
      },
      {
        id: "TR-2391",
        origin: "Hà Nội",
        destination: "Hạ Long",
        startedAt: "2026-10-12T07:20:00.000Z",
        endedAt: "2026-10-12T09:05:00.000Z",
        distanceMeters: 161200,
        status: "Hoàn thành",
      },
    ],
  },
  {
    id: "VH-002",
    plate: "29H-678.90",
    name: "Ford Transit",
    driver: "Trần Thu Hà",
    status: "idle",
    location: {
      latitude: 21.0278,
      longitude: 105.8342,
      updatedAt: "2026-10-13T11:58:00.000Z",
    },
    trips: [
      {
        id: "TR-2383",
        origin: "Gia Lâm",
        destination: "Sân bay Nội Bài",
        startedAt: "2026-10-12T02:00:00.000Z",
        endedAt: "2026-10-12T03:25:00.000Z",
        distanceMeters: 34500,
        status: "Hoàn thành",
      },
    ],
  },
  {
    id: "VH-003",
    plate: "30F-334.56",
    name: "Mitsubishi Xpander",
    driver: "Vũ Mai Linh",
    status: "no_signal",
    location: null,
    trips: [],
  },
];

function sendJson(response, method, statusCode, body) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(method === "HEAD" ? undefined : JSON.stringify(body));
}

function createServer() {
  return http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
      sendJson(response, request.method, 400, { error: "Đường dẫn không hợp lệ." });
      return;
    }

    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] === "api") {
      if (segments.length === 2 && segments[1] === "vehicles") {
        sendJson(response, request.method, 200, {
          data: vehicles.map(({ trips, ...vehicle }) => vehicle),
          generatedAt: new Date().toISOString(),
          source: "sample",
        });
        return;
      }

      if (segments.length >= 3 && segments[1] === "vehicles") {
        const vehicle = vehicles.find((item) => item.id === segments[2]);
        if (!vehicle) {
          sendJson(response, request.method, 404, { error: "Không tìm thấy phương tiện." });
          return;
        }

        if (segments.length === 3) {
          sendJson(response, request.method, 200, { data: vehicle });
          return;
        }
        if (segments.length === 4 && segments[3] === "trips") {
          sendJson(response, request.method, 200, { data: vehicle.trips });
          return;
        }
      }

      sendJson(response, request.method, 404, { error: "Không tìm thấy API." });
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
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const server = createServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`PreMVP đang chạy tại http://localhost:${port}`);
    console.log("API đang sử dụng dữ liệu mẫu trong server.js.");
  });
}

module.exports = { createServer };
