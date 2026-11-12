# Kiểm thử và kết quả thực tế

Ngày thực hiện: **12/11/2026**, môi trường Windows/PowerShell, Node.js **24.18.0**, Chromium cài qua Playwright. Kết quả dưới đây là lệnh đã chạy, không phải checklist dự kiến. Không chạy GitHub Actions hay triển khai Internet.

## Tách vị trí trực tiếp và hành trình trực tiếp — kết quả hiện tại

- `npm.cmd test`: **14 passed, 0 failed**. Kiểm tra vị trí không có tuyến/điểm đến, cấp quyền đúng ID hành trình, hết hạn/thu hồi/pause, kiểm tra scope lưu trữ.
- `npm.cmd run test:e2e`: **22 passed, 0 failed**, 1,4 phút. Bài mới xác nhận marker vẫn hiện khi không có đường; không hiện điểm đến/progress/legend; chủ sở hữu chọn chuyến và lưu qua reload; đúng người mới có tuyến; chọn người khác hoặc bỏ chia sẻ chuyến xóa toàn bộ đường trên cả live/overview. Các bài responsive 320 px đến desktop và chia sẻ lịch sử vẫn đạt.
- `npm.cmd run build`: thành công, 1602 modules. `node tests/production-smoke.mjs`: **PASS**, 7 trang, 0 pageerror. Đã xem ảnh production với chế độ chỉ vị trí và không có đường hành trình.

## Mốc cập nhật chia sẻ lịch sử

- `npm.cmd test`: **13 passed, 0 failed**, gồm kiểm tra phạm vi từng chuyến, lời mời chờ chấp nhận, toàn bộ lịch sử, chủ sở hữu, lời mời trùng, hết hạn và thu hồi.
- `npm.cmd run test:e2e`: **21 passed, 0 failed**, 1,6 phút. Ba bài mới kiểm tra chia sẻ từ chi tiết, chặn URL trước chấp nhận, chỉ xem chuyến được chọn, không chia sẻ tiếp, thu hồi; chọn hai chuyến trên màn hình 390 px và lưu qua reload; toàn bộ lịch sử tự hết hạn ngay khi đang mở trang chi tiết.
- `npm.cmd run build`: thành công, 1602 modules; JS 465,95 kB (gzip 140,65 kB), CSS 48,15 kB (gzip 13,93 kB).
- `node tests/production-smoke.mjs`: **PASS**, đủ 7 trang trên preview 4173, 0 pageerror. [Kết quả production](production-smoke.json).
- Đã xem ảnh biểu mẫu chia sẻ trên mobile, không tràn ngang: [ảnh giao diện](screenshots/history-sharing-mobile.png). [Hướng dẫn chia sẻ](HISTORY-SHARING.md).

## Mốc cập nhật tuyến bám đường phố

- `npm.cmd test`: **11 passed, 0 failed, 0 skipped**, gồm kiểm tra giữ toàn bộ đỉnh góc rẽ của ba tuyến nguồn, đoạn mẫu tối đa 12 m, độ dài khớp OSRM trong sai số 2%, timestamp đầu/cuối và đúng 60 giây dừng.
- `npm.cmd run test:e2e`: **18 passed, 0 failed, 0 skipped**, 59,5 giây. Bổ sung kiểm tra nâng cấp các tuyến đã lưu qua repository, giữ tên hồ sơ, grant đã thu hồi và thông báo đã đọc, sau đó mở replay thành công.
- `npm.cmd run build`: thành công, 1599 modules; JS khoảng 455,16 kB, gzip 138,06 kB. `node tests/production-smoke.mjs`: PASS trên đủ 7 trang, không pageerror.
- Đã chụp và xem trực quan cả ba tuyến: [Bách khoa → Hoàn Kiếm](screenshots/road-bach-khoa-hoan-kiem.png), [Thống Nhất → Văn Miếu](screenshots/road-thong-nhat-van-mieu.png), [Nhà hát Lớn → Trúc Bạch](screenshots/road-nha-hat-truc-bach.png). Tuyến theo geometry mạng đường; không nối thẳng qua ô phố.
- Report HTML từ lượt đầy đủ gần nhất có **18 bài**. [Nguồn tuyến và cách migration](ROAD-ROUTES.md). Các mục bên dưới lưu kết quả của mốc phiên bản ban đầu, trước cập nhật tuyến bám đường.

## Lịch sử kiểm thử phiên bản ban đầu

| Lệnh / lượt kiểm tra | Kết quả thực tế |
|---|---|
| npm.cmd install | Thành công; 70 package được thêm; audit tại thời điểm cài báo 0 vulnerabilities |
| npm.cmd test | **9 passed, 0 failed, 0 skipped** |
| npm.cmd run build | Thành công, 1596 modules; tạo `dist/` |
| npm.cmd run test:e2e — toàn bộ | **17 passed, 0 failed, 0 skipped**, 49,4 giây |
| E2E sau chỉnh padding bản đồ / định dạng CSS | **5 passed**, gồm dashboard/marker và 4 kích thước màn hình; 20,3 giây |
| node tests/production-smoke.mjs | **PASS** với bản dist trên preview; 7 route, 0 pageerror |

Build cuối: JS ~442,40 kB, gzip ~133,70 kB; CSS ~46,08 kB, gzip ~13,52 kB. Đây là số liệu build, chưa phải đo hiệu năng thực tế trên thiết bị yếu. Audit không thay thế kiểm toán bảo mật.

Ở mốc ban đầu, lượt đầy đủ 17 bài đạt trước thay đổi padding fitBounds và định dạng CSS; sau đó chạy lại 5 bài liên quan đến bản đồ/bố cục và smoke test production. Report của mốc này đã được thay bằng lượt đầy đủ 18 bài ở cập nhật bám đường phía trên. Kết quả production mới nhất máy đọc được ở [production-smoke.json](production-smoke.json).

## 9 bài kiểm thử logic

| Nhóm | Kết quả |
|---|---|
| Bộ seed: liên kết owner, timestamp tăng, tọa độ hợp lệ, metrics có ý nghĩa | PASS |
| Quyền pending/accepted/revoked, ranh giới hết hạn, tách live/history, chủ sở hữu | PASS |
| Pause live: chặn người khác xem trực tiếp, giữ lịch sử | PASS |
| Grant có hướng: thu hồi quyền cấp đi không đổi quyền nhận vào | PASS |
| Replay nội suy theo timestamp, giữ stop, clamp đầu/cuối, empty points | PASS |
| Từ khóa, owner, ngày Việt Nam và mốc đổi ngày UTC+7 | PASS |
| Thống kê tổng khớp nguồn, zero fill, loại chuyến live | PASS |
| Snapshot mô phỏng: tiến độ, đến đích và thời điểm stale | PASS |
| Từ chối dữ liệu lưu bị hỏng/không tương thích | PASS |

Nguồn: `tests/domain.test.js`, chạy bằng Node built-in test runner.

## 17 bài E2E đã chạy

| STT | Bài kiểm tra | Kết quả |
|---:|---|---|
| 1 | Dashboard, Leaflet thật, 3 marker, chọn marker, pause/resume mô phỏng, lọc vòng, control map | PASS |
| 2 | Điều hướng 7 trang, reload từng trang, route lạ, thu pageerror | PASS |
| 3 | Tìm kiếm, lọc người, xóa lọc, empty state, khoảng ngày sai | PASS |
| 4 | Replay tiến thời gian, pause, chọn 60×, reset, seek cuối, tự kết thúc, tải JSON | PASS |
| 5 | Bỏ history cấp đi, reload giữ thay đổi, đổi người nhận, chặn danh sách và URL detail | PASS |
| 6 | Pause live của Linh, quay lại Trường không còn marker Linh | PASS |
| 7 | Thu hồi, tạo lời mời, chưa chấp nhận không có quyền, nhận lời rồi xem được | PASS |
| 8 | Grant hết hạn không còn marker; UI rỗng rõ ràng | PASS |
| 9 | Tạo SOS demo, xử lý, đọc tất cả, reload còn trạng thái | PASS |
| 10 | Analytics tổng khớp bộ GPS lưu, đổi khoảng và phạm vi dữ liệu | PASS |
| 11 | Đổi tên dài, reload, hủy reset, xác nhận reset cập nhật form | PASS |
| 12 | JSON lưu bị lỗi → khôi phục; chặn request tile → thông báo tải map lỗi | PASS |
| 13 | Chuyến không có tọa độ → empty map state, không pageerror | PASS |
| 14 | Desktop 1440×1000: 6 trang không tràn ngang, ảnh full page | PASS |
| 15 | Tablet 820×1180: 6 trang không tràn ngang, ảnh full page | PASS |
| 16 | Mobile 390×844: menu điều hướng, 6 trang không tràn ngang, ảnh full page | PASS |
| 17 | Mobile nhỏ 320×740: menu điều hướng, 6 trang không tràn ngang, ảnh full page | PASS |

Nguồn: `tests/e2e/journeylink.spec.js`, context trình duyệt tách biệt theo bài. E2E tự mở Vite cổng 5176. Test lỗi tile cố ý abort kết nối OpenStreetMap; không coi lỗi network đó là lỗi React.

## Kiểm tra production và ảnh bằng chứng

Đã build và mở Vite preview tại `http://127.0.0.1:4173`. Script `tests/production-smoke.mjs` xác minh bootstrap HTTP 200, route active đúng, heading hiện ở 7 trang, 3 marker trong tổng quan, màn hình replay mở được, **không phát sinh pageerror**. Hash navigation không gửi lại HTTP document và có thể trả null response; script phân biệt trường hợp này.

- [Dashboard production](screenshots/production-overview.png)
- [Chia sẻ production](screenshots/production-sharing.png)
- [Thống kê production](screenshots/production-analytics.png)
- [Replay production](screenshots/production-replay.png)
- [Desktop](screenshots/desktop.png), [tablet](screenshots/tablet.png), [mobile](screenshots/mobile.png), [320px](screenshots/small-mobile.png)

Đã xem trực quan ảnh desktop/mobile trong quá trình hoàn thiện, điều chỉnh map để fit tất cả người theo dõi và chừa khoảng cho bảng tóm tắt tuyến.

## Lỗi đã phát hiện và sửa

1. Windows có dấu `&` ở đường dẫn làm lệnh qua shim Vite chạy sai. Scripts gọi CLI bằng Node; dùng `npm.cmd` để không vướng PowerShell ExecutionPolicy.
2. Reset demo thay hồ sơ nhưng input tên vẫn giữ state cũ khi cùng user ID. Đồng bộ input theo cả ID và tên hồ sơ; E2E đã kiểm tra lại.
3. Map chỉ fit tuyến được chọn nên marker khác nằm ngoài viewport. FitBounds bao gồm người hiện tại và route, có padding cho overlay; E2E click marker và responsive đã đạt.
4. Selector test chọn tên không trùng accessible name và assertion trên nhiều phần tử gây strict violation. Bổ sung aria-label cho marker, sửa selector và kiểm tra số phần tử phù hợp; không dùng force click để che lỗi viewport.
5. Ghi localStorage trong updater React không phù hợp StrictMode. Chuyển lưu sang effect theo state đã commit; kiểm tra persistence/permission/reload sau sửa đạt.

## Chưa kiểm tra / chưa triển khai

- Chưa kiểm thử Safari, Firefox, thiết bị điện thoại thật, screen reader, kiểm toán WCAG/SEO đầy đủ.
- Chưa thử tải nhiều người dùng, kiểm thử pentest, mobile GPS hoặc API thật; chưa có các thành phần này.
- Chưa triển khai hoặc kiểm chứng URL Internet, CI, HTTPS production, cookie/session backend.
- Không test khả năng gửi cứu hộ vì sản phẩm chỉ có sự kiện SOS nội bộ, không có delivery.
- Không đo độ chính xác GPS thực địa; tọa độ mẫu không chứng minh định tuyến hoặc khả năng an toàn thực tế.

## Cách chạy lại

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run test:browser
npm.cmd run test:e2e
```

Smoke production: ở terminal 1 chạy `npm.cmd run preview -- --port 4173 --strictPort`; ở terminal 2 chạy `node tests/production-smoke.mjs`. Cần cổng 4173 và 5176 trống cho từng bộ tương ứng. Không lấy kết quả của bài bị skip làm PASS.
