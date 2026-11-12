# JourneyLink — Kết nối từng hành trình

Web App cho đề tài **Hệ thống giám sát, lưu trữ và chia sẻ hành trình dựa trên GPS**, môn ET4711. React + JavaScript ES6 + CSS, Leaflet/OpenStreetMap, dữ liệu mẫu và GPS mô phỏng. Không cần tài khoản, API key hoặc backend.

## Chạy trên Windows

Yêu cầu Node.js **22.12+** (khuyến nghị Node 24, môi trường đã kiểm tra: 24.18.0).

Mở PowerShell tại thư mục dự án:

```powershell
Set-Location -LiteralPath 'C:\Users\admin\Downloads\Web & Mobile Application Programming\JourneyLink'
npm.cmd ci
npm.cmd run dev
```

Mở **http://127.0.0.1:5173**. Nếu cổng đã bận, Vite in cổng thay thế trong terminal. Dừng bằng Ctrl+C. Trên macOS/Linux dùng `npm` thay `npm.cmd`.

`npm.cmd` tránh lỗi ExecutionPolicy của PowerShell. Scripts gọi trực tiếp CLI bằng Node để hoạt động cả khi đường dẫn cha chứa dấu `&`.

```powershell
npm.cmd run build
npm.cmd run preview
```

Bản build ở `dist/`, preview mặc định **http://127.0.0.1:4173**. Phải dùng HTTP server, không mở `index.html` bằng `file://`. Hash routes và `base: './'` cho phép host static trong thư mục con. Chưa xuất bản lên Internet.

## Trình diễn trong 5 phút

1. **Tổng quan / Theo dõi trực tiếp:** chọn một người ở danh sách hoặc marker; xem vị trí, tốc độ và thời điểm cập nhật. Chỉ hiện tuyến khi chủ sở hữu chọn rõ **Hành trình trực tiếp** trong quyền cấp cho người nhận tại **Vòng kết nối**. Bấm tạm dừng/tiếp tục mô phỏng, chọn vòng Gia đình/Bạn bè.
2. **Lịch sử:** tìm địa điểm, chọn người hoặc khoảng ngày; mở một chuyến đi, phát lại, đổi tốc độ 1×/10×/30×/60×, kéo thanh thời gian, xuất JSON mẫu.
3. **Vòng kết nối:** tắt quyền lịch sử đã cấp cho Ngọc Linh. **Quyền riêng tư → Hồ sơ demo → Ngọc Linh**, mở lịch sử: hành trình của Minh Trường không còn xuất hiện, cả khi mở URL chi tiết trực tiếp.
4. Đổi lại Minh Trường. Thu hồi một quyền, mời lại người đó với thời hạn và phạm vi mới. Đổi sang hồ sơ người nhận để chấp nhận. Đây là lời mời nội bộ bản demo, không gửi email.
5. **Thống kê:** chọn hôm nay/7 ngày/30 ngày và dữ liệu của tôi/tất cả được cấp quyền. **Thông báo:** tạo SOS mô phỏng, đánh dấu đã đọc và đã xử lý.
6. **Quyền riêng tư:** đổi tên, tạm dừng chia sẻ trực tiếp. Thay đổi lưu qua reload. Đặt lại bản demo có bước xác nhận riêng.

**Chia sẻ lịch sử:** đánh dấu các chuyến của mình tại **Lịch sử**, bấm **Chia sẻ N hành trình**, chọn người nhận và thời hạn. Có thể chia sẻ một chuyến từ trang chi tiết hoặc toàn bộ lịch sử. Người nhận chấp nhận và chủ sở hữu thu hồi trong **Vòng kết nối**. [Hướng dẫn và phạm vi quyền](docs/HISTORY-SHARING.md).

## Kiểm thử

```powershell
npm.cmd test
npm.cmd run test:browser
npm.cmd run test:e2e
```

`test:browser` cài Chromium cho Playwright (chỉ cần lần đầu). E2E tự chạy Vite ở cổng **5176**; cần cổng này trống. Test dùng browser context riêng, không tác động dữ liệu demo trong trình duyệt cá nhân. Xem kết quả thực tế tại [docs/TEST-RESULTS.md](docs/TEST-RESULTS.md), HTML report ở `playwright-report/index.html`. Ảnh giao diện tại `docs/screenshots/`.

## Cấu trúc

```text
src/
  App.jsx                  # layout, sidebar, hash navigation
  domain.js                # quyền, khoảng cách, lọc, thống kê, nội suy GPS
  data/seed.js             # nguồn dữ liệu mẫu tập trung
  services/repository.js   # adapter đọc/ghi localStorage và kiểm tra dữ liệu
  state/Store.jsx          # dữ liệu dùng chung và đồng hồ cập nhật
  components/              # bản đồ, thành phần UI, danh sách thông báo
  pages/                   # các màn hình nghiệp vụ
tests/                     # unit và Playwright E2E
docs/                      # phân tích, kiến trúc, đối chiếu học liệu, kiểm thử
```

## Phạm vi và giới hạn

- Đây là **frontend demo**. Đổi hồ sơ là chuyển vai trình diễn, không phải đăng nhập; kiểm soát quyền phía client minh họa nghiệp vụ, không bảo vệ dữ liệu trước DevTools.
- Tuyến mẫu sử dụng hình học đầy đủ từ mạng đường OpenStreetMap qua OSRM, lưu sẵn trong `src/data/road-routes.json`. Marker live/replay đi dọc tuyến, giữ các góc rẽ. Không nhận GPS thật, không tính tuyến mới theo yêu cầu hay giao thông trực tiếp, không đo tốc độ thiết bị, không hỗ trợ GPS nền. Dữ liệu mẫu cũ tự nâng cấp tuyến khi tải lại, giữ hồ sơ/quyền/thông báo.
- Vị trí mô phỏng chạy theo đồng hồ trình duyệt. Hà mất cập nhật, Nam dừng, Linh di chuyển. Vòng Gia đình/Bạn bè là nhóm mẫu để phân loại/lọc, chưa có quản trị nhóm tùy ý.
- LocalStorage chỉ trên **cùng trình duyệt và origin**; các cổng/host khác nhau có dữ liệu khác nhau. Không đồng bộ nhiều thiết bị hoặc nhiều tab đang mở.
- Bản đồ nền OpenStreetMap cần Internet. Khi tile lỗi vẫn giữ tuyến/marker và có thông báo thử lại. Font có fallback hệ thống. Không có ảnh đại diện bên ngoài: dùng chữ viết tắt.
- SOS chỉ tạo sự kiện nội bộ, không gửi SMS/email/push, không gọi cứu hộ. Thông báo đến nơi/mất cập nhật ban đầu là sự kiện mẫu, chưa có engine phát hiện tự động.
- Chưa có API server; hợp đồng tích hợp tương lai nằm trong [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tài liệu bàn giao

- [Phân tích yêu cầu, ý tưởng và phạm vi](docs/ANALYSIS.md)
- [Đối chiếu học liệu, chuẩn đầu ra và phần mở rộng](docs/COURSE-MAPPING.md)
- [Kiến trúc, dữ liệu và hợp đồng API dự kiến](docs/ARCHITECTURE.md)
- [Hướng dẫn chức năng và tình huống bảo vệ](docs/FEATURES.md)
- [Kiểm thử thực tế và giới hạn](docs/TEST-RESULTS.md)
- [Tuyến bám đường phố và nâng cấp dữ liệu cũ](docs/ROAD-ROUTES.md)

Thông tin đối chiếu môn học và nguồn tham khảo được tóm tắt trong [bảng đối chiếu](docs/COURSE-MAPPING.md).
