# Chia sẻ lịch sử hành trình

1. Trong **Lịch sử**, đánh dấu một hoặc nhiều chuyến của mình rồi bấm **Chia sẻ N hành trình**. Hoặc mở chi tiết một chuyến và bấm **Chia sẻ hành trình**.
2. Chọn người nhận, thời hạn 15 phút / 1 giờ / 24 giờ / 7 ngày và gửi lời mời. Nút **Chia sẻ lịch sử** còn cho phép chia sẻ toàn bộ lịch sử, gồm các chuyến hoàn thành sau này.
3. Trong **Quyền riêng tư → Hồ sơ demo**, chuyển sang người nhận. Mở **Vòng kết nối → Lịch sử được chia sẻ với bạn**, chọn **Chấp nhận lịch sử**.
4. Trong **Lịch sử**, lọc **Phạm vi lịch sử → Được chia sẻ với tôi** để xem tuyến đường, điểm dừng và phát lại các chuyến được cấp quyền.
5. Chủ sở hữu thu hồi tại **Vòng kết nối → Lịch sử bạn chia sẻ**. Hết hạn hoặc thu hồi sẽ chặn cả URL chi tiết, danh sách và thống kê.

Grant mới có `kind: 'history'`, `live: false`, `history: true`. `journeyIds` chứa danh sách chuyến hoàn thành của chủ sở hữu; bỏ trường này nghĩa là toàn bộ lịch sử. Lời mời chờ chấp nhận chưa cấp quyền. Người nhận không được chia sẻ tiếp chuyến của người khác.

Các quyền được cộng gộp: thu hồi một lời mời không xóa quyền từ lời mời khác hoặc quyền toàn bộ lịch sử đã cấp trước đó. Quyền chia sẻ trực tiếp cũ không thay đổi. Dữ liệu đã lưu được giữ nguyên.

Đây là luồng nội bộ trong frontend demo, lưu bằng localStorage trên cùng trình duyệt. Không gửi email, không tạo liên kết công khai hoặc đồng bộ giữa thiết bị. Kiểm soát quyền phía client phục vụ trình diễn, chưa phải bảo mật phía máy chủ.
