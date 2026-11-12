import { useState } from "react";
import { Share2, X } from "lucide-react";
import { useStore } from "../state/Store.jsx";
import { dayLabel, hasAccess } from "../domain.js";
import { addHistoryShare } from "../services/historySharing.js";
import { Info } from "./UI.jsx";
export default function HistoryShareForm({
  journeyIds = [],
  allowAll = true,
  onClose,
}) {
  const { data, user, now, update } = useStore();
  const [scope, setScope] = useState(journeyIds.length ? "selected" : "all");
  const [viewer, setViewer] = useState(""),
    [duration, setDuration] = useState("60"),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const selected = data.journeys.filter(
    (j) =>
      journeyIds.includes(j.id) &&
      j.ownerId === user.id &&
      j.status === "completed",
  );
  const submit = (e) => {
    e.preventDefault();
    try {
      const next = addHistoryShare(
        data,
        user.id,
        viewer,
        scope === "all" && allowAll ? null : selected.map((j) => j.id),
        Number(duration),
        now,
        crypto.randomUUID(),
        crypto.randomUUID(),
      );
      update(() => next);
      setError("");
      setSent(true);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <section
      className="panel padded history-share-form"
      aria-label="Chia sẻ lịch sử hành trình"
    >
      <div className="section-title">
        <div>
          <h2>
            <Share2 size={17} /> Chia sẻ lịch sử hành trình
          </h2>
          <p>
            Người nhận xem được tuyến, điểm dừng và phát lại sau khi chấp nhận
            lời mời.
          </p>
        </div>
        <button
          className="icon-button"
          aria-label="Đóng chia sẻ lịch sử"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      {sent ? (
        <div>
          <p className="feedback" role="status">
            Đã gửi lời mời chia sẻ{" "}
            {scope === "all"
              ? "toàn bộ lịch sử"
              : `${selected.length} hành trình`}
            . Chuyển sang hồ sơ người nhận tại Cài đặt để chấp nhận trong Vòng
            kết nối.
          </p>
          <a className="btn primary" href="#/sharing">
            Quản lý lịch sử đã chia sẻ
          </a>
        </div>
      ) : (
        <form onSubmit={submit}>
          {allowAll && (
            <div className="history-scope">
              <label>
                <input
                  type="radio"
                  name="history-scope"
                  value="all"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                />
                Toàn bộ lịch sử, gồm cả hành trình hoàn thành sau này
              </label>
              <label>
                <input
                  type="radio"
                  name="history-scope"
                  value="selected"
                  checked={scope === "selected"}
                  onChange={() => setScope("selected")}
                />
                Chỉ các hành trình đã chọn ({selected.length})
              </label>
            </div>
          )}
          {scope === "selected" && (
            <div className="shared-trip-preview">
              {selected.length ? (
                selected.map((j) => (
                  <p key={j.id}>
                    <strong>
                      {j.from} → {j.to}
                    </strong>
                    <small>
                      {dayLabel(j.startedAt)} · {j.title}
                    </small>
                  </p>
                ))
              ) : (
                <p>
                  Đóng biểu mẫu và đánh dấu các chuyến của bạn trong danh sách
                  trước khi chia sẻ.
                </p>
              )}
            </div>
          )}
          <div className="form-row">
            <label>
              Người nhận lịch sử
              <select
                required
                value={viewer}
                onChange={(e) => setViewer(e.target.value)}
              >
                <option value="">Chọn người nhận</option>
                {data.users
                  .filter((u) => u.id !== user.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Thời hạn xem lịch sử
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="15">15 phút</option>
                <option value="60">1 giờ</option>
                <option value="1440">24 giờ</option>
                <option value="10080">7 ngày</option>
              </select>
            </label>
          </div>
          {viewer &&
            scope === "selected" &&
            hasAccess(data, viewer, user.id, "history", now) && (
              <Info>
                Người này đã có quyền xem toàn bộ lịch sử của bạn. Chia sẻ từng
                chuyến không thu hẹp quyền đã cấp trước đó.
              </Info>
            )}
          <p className="share-demo-note">
            Chia sẻ trong bản demo trên trình duyệt này; không gửi email hoặc
            cấp quyền xem vị trí trực tiếp.
          </p>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn primary" type="submit">
            <Share2 size={16} />
            Gửi lời mời chia sẻ
          </button>
        </form>
      )}
    </section>
  );
}
