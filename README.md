# Fleet PreMVP — bản nền nhóm

Bộ khung Node.js chạy được cho đồ án ET4711. Thư mục này là bản nền để nhóm phát triển tiếp thành dashboard theo dõi đội xe; chưa bao gồm bản đồ, tuyến OSRM hoặc mô phỏng vị trí động.

## Yêu cầu

- Node.js 18 trở lên
- Không cần cài package bên ngoài

## Chạy ứng dụng

Mở terminal tại thư mục `PreMVP`, sau đó chạy:

```powershell
npm start
```

Mở `http://localhost:3000`. Nếu cổng 3000 đang được dùng, chọn cổng khác:

```powershell
$env:PORT = "3001"
npm start
```

Dừng server bằng `Ctrl+C`.

## Chạy kiểm thử

```powershell
npm test
```

Kiểm thử dùng test runner tích hợp của Node.js và không cần cài dependency.

## Cấu trúc dự án

```text
PreMVP/
├── public/
│   ├── app.js          # Client: gọi API, tìm xe, chọn xe và hiển thị chuyến
│   ├── index.html      # Giao diện dashboard nền
│   └── styles.css      # Kiểu dáng responsive cơ bản
├── test/
│   └── server.test.js  # Kiểm thử HTTP API và static files
├── package.json        # Lệnh start/test, yêu cầu Node.js
├── README.md           # Hướng dẫn nhóm
└── server.js           # HTTP server, dữ liệu mẫu và API
```

## API hiện có

Các API chỉ đọc, trả JSON và dùng dữ liệu mẫu trong `server.js`:

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| `GET` | `/api/vehicles` | Danh sách xe, trạng thái và vị trí gần nhất |
| `GET` | `/api/vehicles/:id` | Chi tiết một xe |
| `GET` | `/api/vehicles/:id/trips` | Các chuyến gần đây của xe |

Ví dụ:

```powershell
curl.exe http://localhost:3000/api/vehicles
curl.exe http://localhost:3000/api/vehicles/VH-001/trips
```

Server chỉ chấp nhận `GET` và `HEAD`. Dữ liệu là mẫu tĩnh trong bộ nhớ; hiện chưa có database, xác thực, ghi nhận GPS hoặc API cập nhật dữ liệu.

## Gợi ý phân công phát triển

- **M1 — Danh sách xe:** tìm `renderVehicles()` và xử lý tìm kiếm trong `public/app.js`; mở rộng dữ liệu/API danh sách trong `server.js`.
- **M2 — Chi tiết và vị trí:** tìm `renderDetails()` trong `public/app.js`; bổ sung bản đồ, tọa độ, marker và endpoint vị trí trong `server.js`.
- **M3 — Chuyến và cập nhật:** tìm `loadTrips()` và `loadDashboard()` trong `public/app.js`; mở rộng dữ liệu chuyến/API và thêm cập nhật định kỳ ở client/server.

Các thành viên cùng chỉnh sửa và review chéo; thống nhất phần API trước khi tích hợp. Sau khi bản nền được push lên `main`, mỗi người nên phát triển trên branch tính năng riêng và mở Pull Request.

## Tiếp theo

1. Bổ sung lọc trạng thái và trải nghiệm chọn xe.
2. Tích hợp bản đồ và hiển thị marker theo tọa độ.
3. Hoàn thiện dữ liệu chuyến, điểm đi/đến và lịch sử vị trí mẫu.
4. Thêm mô phỏng cập nhật vị trí, trạng thái tải/lỗi và kiểm thử tương ứng.
