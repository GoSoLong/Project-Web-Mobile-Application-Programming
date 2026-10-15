# Hệ thống quản lý, theo dõi và giám sát phương tiện.

PreMVP web-only cho đề tài quản lý, theo dõi và giám sát phương tiện (ET4711). Dashboard phục vụ điều phối viên: xem đội xe, vị trí, trạng thái và chuyến gần đây. Tài xế không thao tác bắt đầu/kết thúc chuyến trên dashboard.

## Mục tiêu và người dùng

**Tên đề tài:** Hệ thống quản lý, theo dõi và giám sát phương tiện.

**Mục tiêu MVP:** xây dựng hệ thống cho một đội xe nhỏ. Tài xế dùng ứng dụng di động để xem xe được giao, bắt đầu/kết thúc chuyến và ghi nhận vị trí trong chuyến. Điều phối viên dùng website để theo dõi trạng thái phương tiện, vị trí mới nhất và lịch sử chuyến. Quản trị viên quản lý người dùng, phương tiện và phân công tài xế.

**Các vai trò dự kiến:**

- **Quản trị viên:** quản lý tài khoản và vai trò; thêm/sửa phương tiện; phân công tài xế.
- **Điều phối viên:** theo dõi đội xe, trạng thái chuyến, vị trí và lịch sử trên web; không thay tài xế bắt đầu hoặc kết thúc chuyến.
- **Tài xế:** đăng nhập ứng dụng mobile, xem xe được giao, bắt đầu/kết thúc chuyến và cho phép ứng dụng gửi GPS trong chuyến.

## Phạm vi MVP mục tiêu

Các yêu cầu dưới đây là mục tiêu cần hoàn thành trước khi báo cáo; chúng không đồng nghĩa với tính năng đã có trong PreMVP hiện tại.

### Website điều phối và quản trị

- Đăng nhập và hiển thị chức năng phù hợp vai trò.
- Giao diện sử dụng được trên máy tính và điện thoại.
- Xem danh sách phương tiện, tài xế được phân công và trạng thái chuyến.
- Xem vị trí mới nhất của xe trên bản đồ, tọa độ dự phòng và thời điểm cập nhật.
- Xem lịch sử chuyến cùng các bản ghi vị trí thuộc chuyến.
- Cho phép quản trị viên thêm/sửa phương tiện và tài khoản, quản lý vai trò và phân công tài xế.

### Ứng dụng mobile cho tài xế

- Đăng nhập và xem phương tiện được phân công.
- Bắt đầu và kết thúc chuyến trên ứng dụng.
- Xin quyền truy cập vị trí; khi chuyến đang chạy và được cấp quyền, gửi tọa độ GPS lên máy chủ định kỳ.
- Hiển thị trạng thái gửi dữ liệu và thông báo lỗi quyền vị trí hoặc lỗi kết nối.

## Luồng nghiệp vụ chính dự kiến

1. Quản trị viên tạo tài khoản tài xế, tạo phương tiện và phân công tài xế.
2. Tài xế đăng nhập mobile, xem phương tiện được giao và bắt đầu chuyến.
3. Ứng dụng xin quyền vị trí; khi được cấp, gửi tọa độ lên server định kỳ, dự kiến **mỗi 15 giây** trong khi chuyến đang chạy.
4. Server kiểm tra và lưu từng bản ghi vị trí gắn với chuyến tương ứng.
5. Website điều phối tải dữ liệu khoảng **mỗi 10 giây**, hiển thị vị trí mới nhất cùng thời điểm cập nhật.
6. Tài xế kết thúc chuyến; điều phối viên xem thông tin chuyến và lịch sử các bản ghi vị trí.

Các chu kỳ 15 giây và 10 giây là cấu hình dự kiến cho MVP; cần kiểm tra quyền nền, mức tiêu thụ pin và điều kiện mạng trên thiết bị thật trước khi chốt.

## Mô hình dữ liệu chính dự kiến

| Thực thể | Thuộc tính nghiệp vụ chính | Quan hệ |
|---|---|---|
| **User** | Tên, thông tin đăng nhập, vai trò (`admin`, `dispatcher`, `driver`), trạng thái tài khoản | Tài khoản tài xế có thể được gán cho phương tiện và tham gia các chuyến |
| **Vehicle** | Mã xe/biển số, loại xe, trạng thái, tài xế được phân công | Có thể có nhiều chuyến theo thời gian; có tài xế được phân công |
| **Trip** | Phương tiện, tài xế, thời điểm bắt đầu/kết thúc, trạng thái chuyến | Mỗi chuyến thuộc về một phương tiện và một tài xế; có nhiều bản ghi vị trí |
| **LocationRecord** | Chuyến đi, vĩ độ, kinh độ, thời điểm ghi nhận | Mỗi bản ghi thuộc về một chuyến; dùng để tìm vị trí mới nhất và xem lại lịch sử |

Đây là mô hình nghiệp vụ mức khái quát để thống nhất API và dữ liệu; nhóm có thể điều chỉnh kiểu dữ liệu/khóa khi triển khai lưu trữ, nhưng cần giữ được các quan hệ và luồng lịch sử nói trên.

## Chạy ứng dụng

Cần Node.js 18 trở lên. Không cần cài package:

```powershell
npm start
```

Mở `http://localhost:3000`. Dừng server bằng `Ctrl+C`.

```powershell
npm test
```

## Dữ liệu và API

Nền bản đồ là tile đường phố OpenStreetMap thật, hiển thị bằng Leaflet. Server truy vấn OSRM Route Service để lấy geometry tuyến lái xe theo mạng đường phố, rồi di chuyển vị trí mô phỏng dọc theo các điểm hình học của tuyến (60 m cho mỗi chu kỳ 8 giây); không tự nối thẳng các điểm GPS. Đích của mỗi chuyến đang chạy được đánh dấu bằng ghim đỏ tại đầu cuối tuyến đã được OSRM khớp vào đường. Các tuyến chỉ được truy vấn lúc khởi động và giữ trong bộ nhớ. Vị trí vẫn là mô phỏng, không phải GPS trực tiếp; website đọc dữ liệu định kỳ mỗi 10 giây. Cần Internet để tải thư viện/map tiles và lấy tuyến đường.

- `GET /api/vehicles` — danh sách xe, trạng thái, vị trí mới nhất và đường đi mẫu.
- `GET /api/vehicles/:id` — thông tin xe.
- `GET /api/vehicles/:id/trips` — chuyến gần đây, điểm đi/đến, tuyến đường bộ và khoảng cách OSRM. Chọn một dòng chuyến để xem tuyến cùng điểm đầu/cuối trên bản đồ.
- `GET /api/vehicles/:id/location/latest` — vị trí mới nhất.

Server chỉ nhận `GET` và `HEAD`; không có API tạo/kết thúc chuyến. Dữ liệu mẫu và các tuyến OSRM nằm trong bộ nhớ, được lấy lại khi khởi động lại server; các tuyến chuyến cũ được tải theo yêu cầu khi mở danh sách của xe và giữ trong bộ nhớ để tái sử dụng. Nếu dịch vụ định tuyến lỗi hoặc không tìm được tuyến, dashboard báo tuyến không khả dụng thay vì vẽ đoạn thẳng giả. Dùng `ROUTING_SERVICE_URL` để chỉ định một OSRM-compatible routing service khác. Attribution OpenStreetMap được giữ hiển thị trên bản đồ; tuân thủ [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/), không tải trước hoặc bulk-download tile từ tile server công cộng. Dịch vụ OSRM công cộng chỉ phù hợp demo nhẹ, không có SLA; không dùng làm hạ tầng production.

## Phân công theo lát cắt nghiệp vụ

Mỗi người phụ trách một luồng xuyên suốt và cùng tham gia lập trình web đến 30/10, sau đó cùng tham gia lập trình app. Phân công dưới đây là trọng tâm/đầu mối, không có nghĩa một thành viên chỉ viết một loại code: mỗi người đều làm giao diện, gọi API, thay đổi server tối thiểu khi luồng mình cần, và viết kiểm thử. Không chia nhóm thành frontend/backend hoặc nhóm web/app riêng.

| Thành viên | Lát cắt nghiệp vụ | Điểm bắt đầu trong code web hiện tại | Việc tiếp tục trên web đến 30/10 | Việc làm trên app từ 31/10 |
|---|---|---|---|---|
| **M1 — Đội xe & điều phối** | Nhận diện xe, tài xế được gán, trạng thái và chọn xe | `public/app.js`: `getVisibleVehicles()`, `renderStats()`, `renderVehicleList()`, `selectVehicle()`; `server.js`: `INITIAL_VEHICLES`, `publicVehicle()`, `GET /api/vehicles` | Hoàn thiện chi tiết xe và tọa độ dạng chữ; nhất quán trạng thái xe/không tín hiệu; kiểm thử tìm/lọc/chọn xe | Làm màn hình xe và tài xế được gán; gọi API danh sách/chi tiết; kiểm thử chọn đúng xe và trạng thái rỗng/offline |
| **M2 — Vị trí & bản đồ** | Tọa độ, thời điểm, độ mới vị trí và bản đồ | `public/app.js`: `initializeMap()`, `renderMap()`, `markerStyle()`, `focusSelectedVehicle()`; `server.js`: `fetchDrivingRoute()`, `loadVehicleRoutes()`, `publicVehicle()` | Hoàn thiện fallback tọa độ chữ, thông báo khi map/tuyến không khả dụng; kiểm thử vị trí và tuyến mô phỏng | Làm xin quyền/đọc vị trí trên thiết bị và màn hình trạng thái GPS; gọi API vị trí tối thiểu; kiểm thử quyền bị từ chối, mất mạng và dữ liệu cũ |
| **M3 — Chuyến & đồng bộ** | Chuyến gần đây, vòng đời chuyến và đồng bộ trạng thái | `public/app.js`: `loadTrips()`, `selectTripRoute()`, `loadVehicles()`; `server.js`: `publicTrip()`, `loadTripRoute()`, `GET /api/vehicles/:id/trips` | Hoàn thiện thông tin chuyến/độ dài tuyến, chọn chuyến xem map; kiểm thử tải lại, lỗi API và danh sách rỗng | Làm màn hình chuyến; luồng tài xế bắt đầu/kết thúc chuyến; nối trạng thái tối thiểu lên web và kiểm thử đồng bộ |

Cả nhóm cùng review chéo, tích hợp trên nhánh tính năng và demo hàng tuần. Server chỉ bổ sung endpoint/kiểm tra dữ liệu/lưu trữ tối thiểu nếu luồng demo cần; không xây backend phức tạp hoặc realtime chuyên sâu.

## Timeline theo tuần — 02/10/2026 đến 31/12/2026

Timeline dưới đây là kế hoạch công việc và điều kiện nghiệm thu cần đạt vào cuối mỗi khoảng thời gian. **PreMVP chỉ được dùng để mô tả trạng thái thực tế đến 15/10**, không phải một mốc trong bảng timeline. Tuần 30/10–05/11 ghi riêng ngày chốt web 30/10 và ngày bắt đầu app 31/10.

| Tuần | Công việc chính | Kết quả cần đạt / tiêu chí nghiệm thu | M1 — Đội xe & điều phối | M2 — Vị trí & bản đồ | M3 — Chuyến & đồng bộ |
|---|---|---|---|---|---|
| **02–08/10** | Khởi tạo web Node.js; thống nhất vai trò, dữ liệu mẫu và API đọc. | Cả nhóm chạy cùng repo; response xe thống nhất; API có test server cơ bản. | Lên trường dữ liệu xe/tài xế/trạng thái; dựng danh sách và chọn xe web. | Chốt tọa độ/thời gian; dựng vị trí mẫu và vùng bản đồ web. | Chốt vòng đời chuyến; dựng bảng chuyến và API đọc chuyến web. |
| **09–15/10** | Hoàn thiện luồng giám sát web: danh sách, trạng thái, chuyến, bản đồ mô phỏng. | Chọn xe/chuyến hoạt động; lỗi API được báo; bộ kiểm thử tự động chạy được. | Hoàn thiện tìm/lọc/chọn xe, bộ đếm và trạng thái danh sách. | Hoàn thiện OSM, tuyến OSRM và marker vị trí mô phỏng; báo lỗi tuyến. | Hoàn thiện chuyến, điểm đi/đến, khoảng cách, xem tuyến và refresh. |
| **16–22/10** | Chỉ làm web: hoàn thiện chi tiết xe và phương án dự phòng vị trí. | Chi tiết có mã/biển số/trạng thái/tài xế/tọa độ chữ/thời điểm; thiếu vị trí dễ nhận biết. | Làm chi tiết xe dễ đọc; rà soát nhãn trạng thái và chọn xe. | Nối tọa độ chữ; vẫn đọc được vị trí khi map lỗi. | Có trạng thái tải/rỗng/lỗi cho chuyến; thời điểm đồng bộ rõ. |
| **23–29/10** | Chỉ làm web: responsive, xử lý lỗi và kiểm thử hồi quy. | Web dùng được desktop/màn hình hẹp; API/map lỗi không làm hỏng luồng; regression đạt. | Kiểm thử tìm/lọc/chọn xe và xe offline. | Kiểm thử marker/tuyến, tile/OSRM lỗi và fallback tọa độ. | Kiểm thử chuyến rỗng/lỗi, refresh 10 giây và xem tuyến. |
| **30/10–05/11** | 30/10 nghiệm thu, đóng băng web; từ 31/10 khởi tạo app và gọi API hiện có. | Web được chốt ngày 30/10; app chạy trên emulator/thiết bị và đọc được API từ 31/10. | 30/10 nghiệm thu danh sách web; từ 31/10 dựng danh sách xe/tài xế app. | 30/10 nghiệm thu map/fallback; từ 31/10 dựng cấu hình app và xin quyền vị trí. | 30/10 nghiệm thu chuyến web; từ 31/10 dựng điều hướng và danh sách chuyến app. |
| **06–12/11** | Làm màn hình app theo lát cắt; kết nối đọc API hiện có. | App xem được xe/thông tin/chuyến; có trạng thái tải, lỗi và mất mạng. | Hoàn thiện xe/tài xế được gán; xử lý xe trống/offline. | Hoàn thiện xin quyền/đọc vị trí; xử lý quyền bị từ chối. | Hoàn thiện danh sách/chi tiết chuyến; xử lý chưa có chuyến. |
| **13–19/11** | Làm vị trí thiết bị và hợp đồng gửi dữ liệu tối thiểu. | Payload vị trí hợp lệ được gửi; API nhận đúng xe; web hiện tọa độ và thời điểm nhận. | Liên kết tài xế với xe mẫu; app thao tác đúng xe được gán. | Gửi latitude/longitude/timestamp; kiểm tra tọa độ và lỗi mạng cơ bản. | Gắn chuyến hiện tại với xe; kiểm tra đồng bộ sau khi nhận vị trí. |
| **20–26/11** | Hoàn thiện vòng đời chuyến tài xế; chỉ bổ sung API cần thiết. | Tài xế bắt đầu/kết thúc chuyến trên app; web phản ánh trạng thái và lịch sử tối thiểu. | Kiểm thử xe được gán và tài xế xuyên app/web. | Vị trí chuyến hiện đúng marker/xe trên web. | Hoàn thiện bắt đầu/kết thúc và cập nhật trạng thái; API giữ phạm vi tối thiểu. |
| **27/11–03/12** | Tích hợp E2E; lưu dữ liệu cần cho demo. | Một luồng app → server → web dùng cùng dữ liệu; dữ liệu demo cần thiết còn đọc được sau restart. | Tích hợp danh sách/chi tiết với dữ liệu chung; thử nhiều xe. | Tích hợp GPS app → server → web đúng xe/tọa độ/thời điểm. | Tích hợp chuyến app → server → web; kiểm tra tạo/đóng chuyến và lịch sử. |
| **04–10/12** | Kiểm thử tình huống lỗi và nghiệm thu chức năng MVP. | Lỗi quyền GPS/mạng/dữ liệu cũ/API/trạng thái rỗng có thông báo; luồng chính vẫn chạy. | Kiểm thử tìm/lọc khi lỗi mạng; sửa lỗi có regression test. | Kiểm thử quyền, tọa độ sai/cũ, tile/routing lỗi và fallback. | Kiểm thử chuyển trạng thái, gửi lặp, lịch sử rỗng và lỗi đồng bộ. |
| **11–17/12** | Đóng băng chức năng; chuẩn bị demo online/local. | URL demo hoặc hướng dẫn local hoạt động; luồng chính được chạy thử; có kịch bản dự phòng dịch vụ ngoài. | Hoàn thiện giao diện và kịch bản điều phối. | Xác nhận app/quyền GPS; chuẩn bị vị trí mẫu dự phòng. | Kiểm tra API/hướng dẫn chạy/kịch bản E2E; khóa tính năng trước 17/12. |
| **18–24/12** | Hoàn tất báo cáo kỹ thuật và tổng duyệt lần một. | Báo cáo khớp kiến trúc/API/test/phân công; cả 3 thành viên trình bày được phần mình. | Viết nội dung web đội xe; tập demo điều phối. | Viết nội dung vị trí/GPS/map; tập demo app. | Tổng hợp chuyến/API/test; điều phối tổng duyệt. |
| **25–31/12** | Ổn định bản cuối, kiểm thử và báo cáo ngày 31/12. | Mã khớp bản demo; regression đạt; backup/local fallback và báo cáo/thuyết trình sẵn sàng. | Regression danh sách/chi tiết; hỗ trợ demo cuối. | Regression app/vị trí/map; xác nhận quyền thiết bị. | Regression chuyến/API; kiểm soát checklist nộp và demo. |

## Giới hạn có chủ đích

- Chỉ có web điều phối viên; chưa có ứng dụng tài xế.
- Dashboard chỉ giám sát; không có thao tác nghiệp vụ của tài xế.
- Chưa có xác thực, phân quyền, cơ sở dữ liệu bền vững hoặc theo dõi GPS thật.
- Dịch vụ tile công cộng là best-effort, không có SLA; nếu triển khai rộng hơn, hãy chọn nhà cung cấp tile phù hợp hoặc tự vận hành.
- Dịch vụ định tuyến OSRM công cộng cũng là phụ thuộc bên ngoài; với triển khai thực tế, nhóm cần tự vận hành OSRM hoặc chọn nhà cung cấp định tuyến có SLA.
- Khi làm ứng dụng mobile, app tài xế sẽ là client gửi chuyến/vị trí; dashboard tiếp tục chỉ hiển thị dữ liệu.
