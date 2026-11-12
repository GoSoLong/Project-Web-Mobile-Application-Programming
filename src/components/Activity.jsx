import { Bell, CheckCheck, MapPin, TriangleAlert } from "lucide-react";
import { useStore } from "../state/Store.jsx";
import { timeLabel } from "../domain.js";
export default function Activity({ compact = false }) {
  const { data, user, update } = useStore();
  const items = data.notifications
    .filter((n) => n.recipientId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const mark = (id) =>
    update((s) => {
      s.notifications.find((n) => n.id === id).read = true;
      return s;
    });
  if (!items.length)
    return <p className="muted empty-small">Bạn chưa có thông báo mới.</p>;
  return (
    <div className="activity-list">
      {(compact ? items.slice(0, 3) : items).map((n) => {
        const Icon = ["sos", "stale"].includes(n.type)
          ? TriangleAlert
          : n.type === "arrival"
            ? MapPin
            : Bell;
        return (
          <article className={`activity ${n.read ? "read" : ""}`} key={n.id}>
            <span className={`activity-icon ${n.type}`}>
              <Icon size={18} />
            </span>
            <div className="activity-copy">
              <strong>{n.title}</strong>
              <p>{n.body}</p>
              <small>
                {timeLabel(n.createdAt)} · Dữ liệu demo
                {n.resolved ? " · Đã xử lý" : ""}
              </small>
            </div>
            {!compact && (
              <div className="activity-buttons">
                {!n.read && (
                  <button className="btn small" onClick={() => mark(n.id)}>
                    Đã đọc
                  </button>
                )}
                {["sos", "stale"].includes(n.type) && !n.resolved && (
                  <button
                    className="btn small"
                    onClick={() =>
                      update((s) => {
                        Object.assign(
                          s.notifications.find((x) => x.id === n.id),
                          { resolved: true, read: true },
                        );
                        return s;
                      })
                    }
                  >
                    <CheckCheck size={15} />
                    Đã xử lý
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
