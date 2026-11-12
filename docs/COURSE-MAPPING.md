# Đối chiếu đề cương và học liệu

## Đề cương có thể xác minh

Nguồn: `../ET4711 - Lap trinh web va ung dung di dong.pdf`, **2024.0.1**, 10 trang, bản text ở `research/13-*.txt`. Trang 1: 3 tín chỉ, 45 tiết lý thuyết + 15 tiết bài tập/BTL; HTML5/CSS3/JavaScript, NodeJS, React Native. Trang 2–4: CLO M1–M4. Trang 4–5: đánh giá quá trình 40% (thảo luận 10%, bài tập cá nhân/nhóm 30%); cuối kỳ 60%, thi viết hoặc dự án nhóm kết hợp trình bày/hỏi đáp. Không có rubric riêng JourneyLink trong tài liệu này.

| CLO | Yêu cầu từ đề cương | Bằng chứng JourneyLink | Giới hạn |
|---|---|---|---|
| M1.1 | HTML, CSS trình bày tĩnh | Semantic layout, forms, sidebar, typography | Cần tự giải thích source khi bảo vệ |
| M1.2 | CSS trình bày nội dung động | Hover/focus, responsive, switch/menu transitions | Animation marker do JS/Leaflet |
| M1.3 | JS giao diện tương tác phức tạp | Tìm/lọc, replay, mời và thay đổi quyền | Dữ liệu mô phỏng |
| M2.1 | Website động NodeJS | Node chạy Vite/build tooling | **Không có backend Node nghiệp vụ**, chưa chứng minh đầy đủ CLO này |
| M2.2 | Cookie, session, dữ liệu, form | Form và localStorage | Chưa có cookie/session/auth thật |
| M2.3 | SPA | React components/hooks/context + hash navigation | Không dùng React Router vì route đơn giản |
| M2.4 | Bảo mật, responsive, đa người dùng | Responsive, escape text, mô hình quyền có hướng | Đa hồ sơ chỉ minh họa; chưa có isolation server, SEO động |
| M3.1–M3.3 | React Native, cảm biến, server/mobile | Mô tả API tích hợp dự kiến | **Không triển khai Mobile**, không tự nhận đạt nhóm M3 |
| M4.1–M4.2 | Phân tích, mô hình hóa, giải pháp | ANALYSIS, ARCHITECTURE, bảng ưu tiên | Có tài liệu để trình bày |
| M4.3 | Nhóm, báo cáo, trình bày | README, kịch bản demo, test evidence | Chưa có danh sách nhóm/lịch sử đóng góp của sinh viên |

Lịch tuần trong đề cương: HTML tuần 1; CSS tuần 2–3; client JS tuần 4–5; Node/HTTP/Express/form/session/AJAX/SPA tuần 6–8; React tuần 9; React Native tuần 10–11; Hook tuần 12; animation tuần 13; cảm biến tuần 14; server tuần 15; persistent storage tuần 16. Đây là **kế hoạch giảng dạy**, không khẳng định nội dung nào đã được học trên lớp đến hôm nay.

Slide `Lecture No1 start/ET4711-Start.pdf`, trang 2 ghi **2026.0.1, cập nhật 09/2026**, có React, Hooks, accessibility, testing và CI/CD. Trang 3 là poster định hướng BTL trao đổi đa phương tiện Web–Mobile, không phải rubric GPS; cần giảng viên xác nhận nếu môn yêu cầu bắt buộc hướng đó. Các trang 4–5 nhấn mạnh semantic HTML, Git, GitHub Pages, DOM và kiểm thử. Đã xem ảnh render vì PDF này không có text có ích; không suy nội dung dựa tên file.

## Ma trận học liệu → kỹ thuật → chức năng

Nhóm **A**: có bằng chứng trong học liệu, áp dụng trực tiếp. **B**: có nền tảng trong học liệu, mở rộng cho nghiệp vụ GPS. **C**: bổ sung ngoài phần chi tiết đã xác minh. **D**: có học liệu nhưng không cần trong phạm vi hiện tại. Tên file dưới đây tương ứng `research/manifest.json`; những tài liệu đồng chủ đề được gộp để tránh lặp.

| Học liệu được cung cấp | Nội dung kỹ thuật có thể đối chiếu | Áp dụng | Nhóm |
|---|---|---|---|
| ET4711-ND1_Hello_Web.pdf (9 trang), ET4710-TH1_Hello_Web.docx | HTML → DOM, tách HTML/CSS/JS, DevTools | `index.html`, JSX, CSS riêng, kiểm tra DOM | A |
| ET4710-ND1_Ngon_ngu_HTML.pdf (17 trang) và bản Slides (21 trang) | Tag/attribute, semantic content, form | Header/nav/main/footer, label, button/link | A |
| P1.1_HTML_Language.pdf (54 trang) | HTML elements, hyperlink, media, forms, structure | Route links, cấu trúc thẻ, metadata | A |
| P1.2_CSS_HUST.pdf (142 trang) | Selector/cascade, box model, layout, responsive, effects | Grid/Flex, token, media queries, trạng thái focus | A |
| P1.3_Client_Side_Scripting.pdf (122 trang) | JS, DOM/events, timer, SVG/canvas, form | Form filters, timer replay, SVG charts | A/B |
| P1.4_Server_Side_Development.pdf (87 trang) | HTTP, Express, EJS, form, cookie/session, DB, JSON, Fetch, security, SPA | Hợp đồng API, SPA; không dựng server không cần thiết | B/D |
| Hands_on_HTML_ngu_nghia_GitHub_Pages_Kiem_thu_DOM.docx | Semantic tags, accessible form, responsive, Git/Pages, evidence | Semantic JSX, label/focus, responsive, test report | A |
| Hello_Calculator_MVP_v1.0_HTML_Source_Analysis.pdf (11 trang) | Semantic DOM, form/button type, accessible output | UI composition, form validation | A |
| Hello_Calculator_MVP_v1.0_CSS_Source_Analysis.pdf (21 trang) | :root tokens, Grid, clamp, overflow, reduced motion, responsive 320px | CSS variables, layout, long names, reduced-motion | A |
| Hello_Calculator_MVP_v1.0_JavaScript_Source_Analysis.pdf (28 trang) | ES Modules, state, pure functions, guard/error state, event dispatch, unit tests | `domain.js`, filters/metrics/access, Node tests | A/B |
| Hello_Calculator_MVP_v1.0_Developer_Guide_Annotated_Source.pdf (37 trang) | Model/view split, keyboard interaction, regression/unit/browser acceptance | Data/domain/UI split, test cases và kết quả thực | A/B |
| Hello_Calculator_MVP_v1.0_Development_Process_Slides.pdf (14 trang) | Requirements → model → UI → test → deploy | Phân tích, xây dựng, kiểm thử, bàn giao | A |
| Hello_Calculator_MVP_v1.0_User_Manual.pdf (7 trang) | Trình bày workflow, trạng thái, lỗi, cách dùng | README demo, giới hạn và help text | A |
| Hello_Calculator_MVP_v1.0_Web_Programming_Lecture.pdf (14 trang) | HTML/CSS/JS → tương tác → model/state → tests | Tổ chức bài tập dễ giải thích | A |
| Huong_dan_GitHub_Pages_Hello_Calculator_MVP_v1.0.pdf (10 trang) | Static hosting, đường dẫn tương đối, PASS-by-PASS | `base:'./'`, hash routes, build dist | A; chưa deploy |
| Nen_tang_NodeJS_va_phat_trien_ung_dung_Web.pdf (4 trang) | HTTP/REST, req/res, Event Loop, Promise, npm | Tooling Node, adapter bất đồng bộ, API design | A/B |
| Hoc_lieu_MVP_Mini_Message_Board_HTTP.pdf (6 trang) | GET/POST/JSON, status codes, client/server, lỗi và bằng chứng | Cấu trúc dữ liệu/API tương lai; không claim chạy API | B |
| HandsOn_CI_MVP3_Playwright_Actions_SQLite_Pages.pdf (8 trang) | Node test, Playwright, test DB tách biệt, CI, report thật | Node unit + Playwright context riêng, ảnh và HTML report | A; SQLite/CI chưa làm |
| AI_Chat_Developer_Guide.pdf (6 trang) | React/Vite/hooks, API adapter, component state, JSON persistence | React + Vite, `repository.js`, Store/context | A/B |
| Huong_dan_Chay_Kiem_thu_AI_Chat_Demo_Free_VSCode_Windows.pdf (4 trang) | Demo/offline vs external API, chạy/test/build trên Windows | Nhãn mô phỏng, lệnh npm.cmd, test thật | A |
| ET4711-Start.pdf (5 trang ảnh) | Web/Node/Mobile, React, test/CI, semantic/Git | Sơ đồ toàn cảnh và phạm vi Web | A/B/D |

Hai PDF Node/HTTP xuất hiện ở cả `23-10/` và thư mục `NỀN TẢNG NODE.JS.../`; SHA256 trùng nên không tính thành hai nội dung khác nhau. Các bài mẫu hiện có được giữ nguyên; chỉ đọc các thành phần minh họa như `script.js`, model Calculator, HTTP server, README MVP3 và React App/package của AI Chat.

## Kiến thức mở rộng đã chọn

| Phần mở rộng | Vì sao cần | Cách giữ đơn giản |
|---|---|---|
| Leaflet + OpenStreetMap | Bản đồ phải pan/zoom/marker/polyline thật | Một component quản lý instance qua ref, cleanup khi unmount |
| Haversine | Tính quãng đường từ tọa độ | Một hàm thuần có kiểm thử, không gọi dịch vụ tính phí |
| Nội suy theo timestamp | Replay phải biểu đạt thời gian và dừng | Hàm `pointAt`, timer 250ms, tốc độ có thể chọn |
| Quyền có hướng và thời hạn | Cốt lõi nghiệp vụ chia sẻ | Một collection grants, một hàm `hasAccess` dùng chung |
| Context API/localStorage | Nhiều trang dùng cùng dữ liệu và state demo | Một Store, adapter repository, schema version |

[Leaflet reference](https://leafletjs.com/reference) là nguồn kỹ thuật chính cho map/tile/marker/polyline. React/Vite/lucide dùng cùng họ công cụ của bài mẫu React đã cung cấp. Biểu đồ dùng SVG trong học liệu client JS; không thêm chart library, Redux, WebSocket, database hoặc microservices.

Những phần không cần hiện tại: OpenAI/streaming của bài Chatbot, EJS, MySQL/SQLite, upload file, cookie/session backend, React Native, camera, WebRTC, Docker và public CI/deployment. Không vì có trong tài liệu mà thêm vào sản phẩm không đúng mục đích.
