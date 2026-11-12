import { CheckCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useStore } from "../state/Store.jsx";
import Activity from "../components/Activity.jsx";
import { Info, PageHeading } from "../components/UI.jsx";
export default function Notifications() {
  const { data, user, now, update } = useStore();
  const [feedback, setFeedback] = useState("");
  const unread = data.notifications.filter(
    (n) => n.recipientId === user.id && !n.read,
  ).length;
  const simulate = () => {
    update((s) => {
      s.notifications.unshift({
        id: crypto.randomUUID(),
        recipientId: user.id,
        ownerId: user.id,
        type: "sos",
        title: "Tín hiệu SOS mô phỏng",
        body: "Tình huống kiểm thử tại Đại học Bách khoa Hà Nội (21.0048, 105.8431). Không gửi liên hệ khẩn cấp.",
        createdAt: now,
        read: false,
        resolved: false,
      });
      return s;
    });
    setFeedback("Đã tạo cảnh báo demo trong danh sách.");
  };
  return (
    <>
      <PageHeading
        eyebrow="SAFETY & NOTIFICATIONS"
        title="Những cập nhật bạn quan tâm"
        description={`${unread} thông báo chưa đọc · Mọi cảnh báo trong bản này đều là dữ liệu demo.`}
      >
        <button
          className="btn"
          disabled={!unread}
          onClick={() =>
            update((s) => {
              s.notifications.forEach((n) => {
                if (n.recipientId === user.id) n.read = true;
              });
              return s;
            })
          }
        >
          <CheckCheck size={17} />
          Đánh dấu tất cả đã đọc
        </button>
        <button className="btn" onClick={simulate}>
          <TriangleAlert size={17} />
          Tạo SOS mô phỏng
        </button>
      </PageHeading>
      <Info>
        Cảnh báo chỉ nằm trong trình duyệt này. Bản demo không phát hiện tai
        nạn, gửi SMS, push notification hoặc gọi cứu hộ.
      </Info>
      {feedback && (
        <p role="status" className="feedback">
          {feedback}
        </p>
      )}
      <section className="panel padded">
        <Activity />
      </section>
    </>
  );
}
