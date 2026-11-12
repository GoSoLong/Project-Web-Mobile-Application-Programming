# Tuyến hành trình bám đường phố

Dữ liệu trước dùng waypoint thưa và nối thẳng, khiến tuyến có thể cắt ô phố. Phiên bản này thay bằng geometry đầy đủ từ [OSRM Route service](https://project-osrm.org/docs/v5.24.0/api/#route-service), `profile=driving`, `overview=full`, `geometries=geojson`, dữ liệu mạng đường OpenStreetMap. Có attribution OpenStreetMap trên bản đồ và trong file dữ liệu. Đây là tuyến đường mẫu, không phải chuyến GPS thu thực tế hay tính toán giao thông thời gian thực.

| Tuyến | Đỉnh geometry nguồn | Độ dài OSRM | Một số đường đi qua |
|---|---:|---:|---|
| Bách khoa → Hồ Hoàn Kiếm | 188 | 3.640,6 m | Đại Cồ Việt, Phố Huế, Hàng Bài, Đinh Tiên Hoàng |
| Thống Nhất → Văn Miếu | 134 | 3.799,1 m | Lê Duẩn, Xã Đàn, Tôn Đức Thắng, Cát Linh |
| Nhà hát Lớn → Hồ Trúc Bạch | 146 | 3.660,9 m | Tràng Tiền, Tông Đản, Hàng Vôi, Trần Nhật Duật, Châu Long |

Nguồn và thời điểm tải: `src/data/road-routes.json`. Đường vòng có thể do hướng lưu thông của profile lái xe; không ép đi thẳng qua đường một chiều. Điểm đầu/cuối snap vào đường gần địa điểm, độ lệch lần lượt được lưu trong `snappedEndpoints`.

Geometry được lưu sẵn để app không phụ thuộc routing server khi trình diễn. Mọi góc rẽ nguồn được giữ lại; đoạn dài được chia nhỏ tối đa 12 m, thời gian đi phân phối theo quãng đường. Live, replay, điểm dừng và thống kê dùng cùng dữ liệu. Lịch sử giữ đúng 60 giây dừng, không tính các đoạn di chuyển ngắn là đang dừng. Leaflet không đơn giản hóa polyline để tránh cắt góc.

Khi mở lại app, repository tự nâng cấp các chuyến mẫu cũ trong localStorage bằng ID/địa điểm/nguồn xác định. Hồ sơ, quyền, lời mời, thông báo và mốc thời gian chuyến đi giữ nguyên. Không cần đặt lại demo; không thay thế dữ liệu GPS nguồn device. Mỗi chuyến gắn `geometryVersion: 2` để migration chỉ chạy một lần.

Để cập nhật lại ba tuyến khi phát triển: `node scripts/fetch-road-routes.mjs`, sau đó build lại. Chỉ script này cần kết nối OSRM. Bản đồ nền vẫn cần Internet như trước.
