import { useState } from "react";
import { Check, Clock3, Plus, Users, X } from "lucide-react";
import { useStore } from "../state/Store.jsx";
import { dayLabel, timeLabel } from "../domain.js";
import {
  Avatar,
  Empty,
  Info,
  PageHeading,
  SectionTitle,
} from "../components/UI.jsx";
import HistoryShares from "../components/HistoryShares.jsx";
export default function Sharing() {
  const { data, user, now, update } = useStore();
  const [adding, setAdding] = useState(false),
    [viewer, setViewer] = useState(""),
    [duration, setDuration] = useState("60"),
    [live, setLive] = useState(true),
    [liveJourneyId, setLiveJourneyId] = useState(""),
    [history, setHistory] = useState(false),
    [feedback, setFeedback] = useState("");
  const outgoing = data.grants.filter(
      (g) => g.ownerId === user.id && g.kind !== "history" && !g.journeyIds,
    ),
    incoming = data.grants.filter(
      (g) => g.viewerId === user.id && g.kind !== "history" && !g.journeyIds,
    );
  const activeJourneys = data.journeys.filter(
    (j) => j.ownerId === user.id && j.status !== "completed",
  );
  const change = (id, patch) =>
    update((s) => {
      const g = s.grants.find((g) => g.id === id && g.ownerId === user.id);
      if (g) Object.assign(g, patch);
      return s;
    });
  const invite = (e) => {
    e.preventDefault();
    if (!viewer || viewer === user.id || (!live && !history)) {
      setFeedback("Chọn người nhận và ít nhất một quyền chia sẻ.");
      return;
    }
    if (
      outgoing.some(
        (g) =>
          g.viewerId === viewer && g.status !== "revoked" && g.expiresAt > now,
      )
    ) {
      setFeedback(
        "Người này đã có quyền hoặc lời mời còn hiệu lực. Hãy sửa quyền hiện tại.",
      );
      return;
    }
    update((s) => {
      const id = crypto.randomUUID();
      s.grants.push({
        id,
        ownerId: user.id,
        viewerId: viewer,
        live,
        liveJourneyIds: live && liveJourneyId ? [liveJourneyId] : [],
        history,
        status: "pending",
        expiresAt: now + Number(duration) * 60000,
      });
      s.notifications.unshift({
        id: crypto.randomUUID(),
        recipientId: viewer,
        ownerId: user.id,
        type: "sharing",
        title: `${user.name} mời bạn theo dõi`,
        body: "Mở Vòng kết nối để chấp nhận hoặc từ chối lời mời mẫu.",
        createdAt: now,
        read: false,
        resolved: false,
      });
      return s;
    });
    setFeedback(
      "Đã tạo lời mời trong dữ liệu demo. Người nhận có thể chấp nhận khi chuyển hồ sơ tại Cài đặt.",
    );
    setAdding(false);
    setViewer("");
    setLiveJourneyId("");
  };
  return (
    <>
      <PageHeading
        eyebrow="JOURNEY CIRCLE"
        title="Gần nhau, theo cách bạn chọn"
        description="Bạn quyết định ai được xem, được xem gì và trong bao lâu."
      >
        <button
          className="btn primary"
          onClick={() => {
            setAdding(!adding);
            setFeedback("");
          }}
        >
          <Plus size={17} />
          {adding ? "Đóng lời mời" : "Mời người theo dõi"}
        </button>
      </PageHeading>
      <Info>
        Đây là chia sẻ trong bộ dữ liệu demo trên trình duyệt. Lời mời không gửi
        email và không cấp quyền theo dõi ngoài thiết bị này.
      </Info>
      <div className="history-sharing-entry">
        <div>
          <h2>Chia sẻ các hành trình đã đi</h2>
          <p>
            Chọn một chuyến, nhiều chuyến hoặc toàn bộ lịch sử, rồi mời người
            nhận xem và phát lại.
          </p>
        </div>
        <a className="btn primary" href="#/history">
          Chia sẻ lịch sử hành trình
        </a>
      </div>
      <HistoryShares />
      {feedback && (
        <p className="feedback" role="status">
          {feedback}
        </p>
      )}
      {adding && (
        <form className="panel padded invite-form" onSubmit={invite}>
          <SectionTitle
            title="Một kết nối mới"
            caption="Lời mời chỉ có hiệu lực sau khi người nhận chấp nhận."
          />
          <div className="form-row">
            <label>
              Người nhận
              <select
                required
                value={viewer}
                onChange={(e) => setViewer(e.target.value)}
              >
                <option value="">Chọn người trong bộ demo</option>
                {data.users
                  .filter((u) => u.id !== user.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {u.email}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Thời hạn
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="15">15 phút</option>
                <option value="60">1 giờ</option>
                <option value="1440">24 giờ</option>
              </select>
            </label>
          </div>
          <div className="form-row checks">
            <label>
              <input
                type="checkbox"
                checked={live}
                onChange={(e) => {
                  setLive(e.target.checked);
                  if (!e.target.checked) setLiveJourneyId("");
                }}
              />
              Vị trí trực tiếp
            </label>
            <label>
              <input
                type="checkbox"
                checked={history}
                onChange={(e) => setHistory(e.target.checked)}
              />
              Lịch sử & phát lại
            </label>
            <button className="btn primary" type="submit">
              Tạo lời mời demo
            </button>
          </div>
          <label>
            Hành trình trực tiếp
            <select
              value={liveJourneyId}
              disabled={!live}
              onChange={(e) => setLiveJourneyId(e.target.value)}
            >
              <option value="">Chỉ chia sẻ vị trí hiện tại</option>
              {activeJourneys.map((j) => (
                <option value={j.id} key={j.id}>
                  {j.title} · {j.from} → {j.to}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            Vị trí trực tiếp chỉ hiện điểm GPS hiện tại. Chọn một hành trình để
            chia sẻ thêm tuyến đã đi, điểm đầu và điểm đến của chuyến đó.
          </p>
        </form>
      )}
      <div className="circle-grid">
        {data.circles.map((c) => (
          <article className="panel circle-card" key={c.id}>
            <span className={`circle-icon ${c.id}`}>
              <Users size={22} />
            </span>
            <div>
              <h2>{c.name}</h2>
              <p>{c.description}</p>
              <div className="circle-members">
                {data.users
                  .filter((u) => u.circle === c.id)
                  .map((u) => (
                    <span key={u.id} title={u.name}>
                      <Avatar user={u} size="tiny" />
                    </span>
                  ))}
                <small>
                  {data.users.filter((u) => u.circle === c.id).length} hồ sơ mẫu
                </small>
              </div>
            </div>
          </article>
        ))}
      </div>
      <section className="panel padded">
        <SectionTitle
          title="Bạn đang chia sẻ với ai?"
          caption="Trực tiếp chỉ chia sẻ vị trí GPS. Chọn một hành trình đang diễn ra để chia sẻ thêm tuyến đường với người nhận."
        />
        {outgoing.length ? (
          <div className="grant-list">
            {outgoing.map((g) => {
              const person = data.users.find((u) => u.id === g.viewerId),
                expired = g.expiresAt <= now,
                disabled = expired || g.status === "revoked";
              return (
                <article className="grant" key={g.id}>
                  <div className="grant-person">
                    <Avatar user={person} />
                    <div>
                      <strong>{person.name}</strong>
                      <small>
                        {g.status === "revoked"
                          ? "Đã thu hồi"
                          : expired
                            ? "Đã hết hạn"
                            : g.status === "pending"
                              ? "Đang chờ chấp nhận"
                              : "Đang có hiệu lực"}
                      </small>
                    </div>
                  </div>
                  <div className="grant-permissions">
                    <label>
                      <input
                        type="checkbox"
                        checked={g.live}
                        disabled={disabled}
                        onChange={(e) =>
                          change(g.id, {
                            live: e.target.checked,
                            ...(!e.target.checked
                              ? { liveJourneyIds: [] }
                              : {}),
                          })
                        }
                      />
                      Trực tiếp
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={g.history}
                        disabled={disabled}
                        onChange={(e) =>
                          change(g.id, { history: e.target.checked })
                        }
                      />
                      Lịch sử
                    </label>
                    <label>
                      Hành trình trực tiếp
                      <select
                        aria-label={`Hành trình trực tiếp với ${person.name}`}
                        disabled={disabled || !g.live}
                        value={
                          activeJourneys.find((j) =>
                            g.liveJourneyIds?.includes(j.id),
                          )?.id || ""
                        }
                        onChange={(e) =>
                          change(g.id, {
                            liveJourneyIds: e.target.value
                              ? [e.target.value]
                              : [],
                          })
                        }
                      >
                        <option value="">Chỉ vị trí hiện tại</option>
                        {activeJourneys.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="grant-expiry">
                    <Clock3 size={14} />
                    <span>
                      {dayLabel(g.expiresAt)}
                      <small>{timeLabel(g.expiresAt)}</small>
                    </span>
                  </div>
                  {g.status !== "revoked" && (
                    <button
                      className="btn small danger-text"
                      onClick={() => change(g.id, { status: "revoked" })}
                    >
                      Thu hồi
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <Empty title="Bạn chưa cấp quyền cho ai" />
        )}
      </section>
      <section className="panel padded space-top">
        <SectionTitle
          title="Những người chia sẻ với bạn"
          caption="Chỉ chủ sở hữu mới có thể chỉnh sửa phạm vi và thời hạn quyền truy cập."
        />
        {incoming.length ? (
          <div className="grant-list">
            {incoming.map((g) => {
              const person = data.users.find((u) => u.id === g.ownerId),
                valid = g.expiresAt > now && g.status === "accepted";
              return (
                <article className="grant" key={g.id}>
                  <div className="grant-person">
                    <Avatar user={person} />
                    <div>
                      <strong>{person.name}</strong>
                      <small>
                        {g.status === "revoked"
                          ? "Đã thu hồi"
                          : g.expiresAt <= now
                            ? "Đã hết hạn"
                            : g.status === "pending"
                              ? "Lời mời mới"
                              : "Đã chấp nhận"}
                      </small>
                    </div>
                  </div>
                  <div className="permission-chips">
                    {g.live && <span>Vị trí trực tiếp</span>}
                    {g.live &&
                      g.liveJourneyIds?.some((id) =>
                        data.journeys.some(
                          (j) => j.id === id && j.status !== "completed",
                        ),
                      ) && <span>Hành trình trực tiếp</span>}
                    {g.history && <span>Lịch sử</span>}
                  </div>
                  {g.status === "pending" && g.expiresAt > now ? (
                    <div className="inline-actions">
                      <button
                        className="btn small primary"
                        onClick={() =>
                          update((s) => {
                            s.grants.find((x) => x.id === g.id).status =
                              "accepted";
                            return s;
                          })
                        }
                      >
                        <Check size={15} />
                        Chấp nhận
                      </button>
                      <button
                        className="btn small"
                        onClick={() =>
                          update((s) => {
                            s.grants.find((x) => x.id === g.id).status =
                              "revoked";
                            return s;
                          })
                        }
                      >
                        <X size={15} />
                        Từ chối
                      </button>
                    </div>
                  ) : (
                    <span className={valid ? "text-green" : "muted"}>
                      {valid ? "Có quyền truy cập" : "Không có quyền truy cập"}
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <Empty title="Chưa có lời mời chia sẻ" />
        )}
      </section>
    </>
  );
}
