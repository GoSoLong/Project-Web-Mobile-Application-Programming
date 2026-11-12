# Chức năng đã triển khai và kịch bản demo

## Các trang

| URL hash | Nội dung và control hoạt động |
|---|---|
| #/overview | Chỉ số tổng quan; lọc vòng; chọn người/marker; pause/resume mô phỏng; route đã đi; biểu đồ 7 ngày; thông báo gần đây |
| #/live | Theo dõi nhiều người được cấp quyền trực tiếp, trạng thái moving/stopped/stale/arrived, tốc độ và thời điểm cập nhật, map pan/zoom/fit/định vị |
| #/history | Tìm kiếm, lọc người/ngày/của tôi/được chia sẻ; chọn nhiều chuyến hoặc toàn bộ lịch sử để chia sẻ có thời hạn |
| #/history/:id | Kiểm tra quyền từng chuyến, map/stop; replay/tốc độ/seek; xuất JSON; chủ sở hữu chia sẻ chuyến đang xem |
| #/sharing | Quản lý lời mời lịch sử riêng, xem phạm vi, chấp nhận/từ chối/thu hồi; vòng mẫu và quyền live/history toàn bộ |
| #/analytics | Ngày/7 ngày/30 ngày; của tôi/tất cả được phép; SVG chart; thời gian di chuyển/dừng và so kỳ trước |
| #/notifications | Danh sách theo hồ sơ, đã đọc, đọc tất cả, xử lý cảnh báo; tạo SOS mô phỏng có mô tả tọa độ mẫu |
| #/settings | Đổi tên, pause live của hồ sơ, đổi hồ sơ demo, reset có xác nhận |

Route không tồn tại có liên kết trở về tổng quan. Detail không tồn tại/không có quyền có thông báo, không hiển thị tọa độ. Header có link hồ sơ và thông báo. Sidebar/header navigation đều hoạt động. Các hành động thay đổi dữ liệu lưu localStorage; bộ lọc, trạng thái play và vị trí camera bản đồ là state màn hình.

## Tình huống 1: theo dõi hành trình về nhà

Hồ sơ mặc định Minh Trường. Mở Tổng quan hoặc Theo dõi trực tiếp: ba người có quyền chia sẻ vị trí đang hiệu lực. Mặc định chỉ hiện marker GPS, tốc độ và thời điểm cập nhật; không hiện tuyến, điểm đầu, điểm đến hoặc tiến độ. Tạm dừng mô phỏng để marker đứng yên, tiếp tục để chạy. Chọn Nam thấy đang dừng; chọn Hà thấy mất cập nhật. Chọn vòng Bạn bè chỉ còn Nam.

Để chia sẻ hành trình trực tiếp: chuyển sang Ngọc Linh tại Quyền riêng tư, mở Vòng kết nối, trong quyền cấp cho Minh Trường chọn **Hành trình trực tiếp → Về nhà cùng nhau**. Chuyển lại Minh Trường và mở Theo dõi trực tiếp: chọn Linh mới thấy tuyến đã đi và thông tin chuyến; chọn Nam vẫn chỉ thấy vị trí. Chủ sở hữu chọn lại **Chỉ vị trí hiện tại** để ẩn tuyến. Quyền chỉ áp dụng cho đúng ID chuyến, không tự cấp cho chuyến sau. Dữ liệu cũ chỉ có `live: true` được hiểu là chia sẻ vị trí.

Không có Mobile hoạt động phía sau. Màn hình luôn ghi “GPS mô phỏng”; `source` của các chuyến này là simulated. Sau khi mô phỏng tới đích, snapshot đổi arrived nhưng không tự sinh lịch sử mới hay gửi arrival notification; những điều đó cần pipeline sự kiện phiên bản sau.

## Tình huống 2: replay làm điểm nhấn bảo vệ

Mở Lịch sử, tìm “Bách khoa”, chọn một chuyến. Xem start/end/stop và thời điểm. Chọn 60× rồi phát lại. Kéo range đến giữa chuyến; dừng/phát tiếp, về đầu. Marker tính bằng timestamp nên thời gian đứng tại stop được giữ lại. Xuất JSON chỉ chứa chuyến đang được phép xem cùng nhãn nguồn dữ liệu mẫu.

## Tình huống 3: chứng minh quyền có hướng

1. Hồ sơ Trường → Vòng kết nối → phần **Bạn đang chia sẻ với ai?**, bỏ Lịch sử của Linh.
2. Settings → đổi hồ sơ Ngọc Linh → Lịch sử. Chuyến của Trường không xuất hiện. Mở ID trực tiếp cũng bị chặn ở UI.
3. Trở về Trường: vẫn xem được lịch sử Linh vì grant Linh → Trường chưa đổi.
4. Thu hồi grant Trường → Nam. Mời lại Nam, bật history, chọn 15 phút. Trạng thái pending chưa cấp quyền.
5. Đổi sang Nam → Vòng kết nối → Chấp nhận. Hành trình Trường mới xuất hiện.
6. Thử bật pause live của Linh rồi quay lại Trường: marker Linh biến mất nhưng lịch sử vẫn theo grant history.

Đây là minh họa nghiệp vụ ở client. Không dùng DevTools làm cách thao tác sản phẩm; cũng không tuyên bố dữ liệu thật được bảo vệ bằng client filtering.

## Tình huống 4: thông báo và dữ liệu bền qua reload

Thông báo & an toàn → tạo SOS mô phỏng → sự kiện mới, badge chưa đọc tăng → đánh dấu đã xử lý → đọc tất cả → reload. Trạng thái giữ nguyên. Không gửi liên hệ hoặc dịch vụ bên ngoài. Quay về Settings đổi tên rồi reload; tên giữ lại. Đặt lại demo yêu cầu xác nhận và chỉ thay khóa `journeylink.demo.v1`.

## Những phần chưa có

Mobile, GPS thiết bị, thiết bị nền, đăng nhập/đăng ký, API server, database, nhiều máy dùng chung, gửi email/SMS/push, link chia sẻ công khai, CRUD nhóm, geofence, saved places, ETA giao thông, engine tự động arrival/stale, tải tile offline và CI/public deployment. Nhóm và email là hồ sơ mẫu, không liên hệ người thật. Thống kê không hiển thị vị trí thường ghé vì chưa có thuật toán gom cụm và dữ liệu đủ đáng tin.
