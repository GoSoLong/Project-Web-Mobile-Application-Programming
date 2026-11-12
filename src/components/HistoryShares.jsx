import { useStore } from "../state/Store.jsx";
import { dayLabel, timeLabel } from "../domain.js";
import { Avatar, Empty, SectionTitle } from "./UI.jsx";
export default function HistoryShares() {
  const { data, user, now, update } = useStore();
  const shares = data.grants.filter(
    (g) => g.kind === "history" || g.journeyIds,
  );
  const change = (id, status) =>
    update((s) => {
      const grant = s.grants.find((g) => g.id === id);
      if (
        grant &&
        ((status === "accepted" &&
          grant.viewerId === user.id &&
          grant.status === "pending" &&
          grant.expiresAt > now) ||
          (status === "revoked" &&
            (grant.ownerId === user.id ||
              (grant.viewerId === user.id && grant.status === "pending"))))
      )
        grant.status = status;
      return s;
    });
  return (
    <div className="space-top">
      {["out", "in"].map((direction) => {
        const outgoing = direction === "out",
          items = shares.filter(
            (g) => (outgoing ? g.ownerId : g.viewerId) === user.id,
          );
        return (
          <section className="panel padded space-top" key={direction}>
            <SectionTitle
              title={
                outgoing
                  ? "Lịch sử bạn chia sẻ"
                  : "Lịch sử được chia sẻ với bạn"
              }
              caption={
                outgoing
                  ? "Quản lý người nhận, phạm vi hành trình và thời hạn."
                  : "Chấp nhận lời mời để xem các chuyến đi đã được chủ sở hữu chọn."
              }
            />
            {!items.length ? (
              <Empty
                title={
                  outgoing
                    ? "Chưa chia sẻ lịch sử hành trình"
                    : "Chưa nhận lịch sử được chia sẻ"
                }
              >
                <a className="text-link" href="#/history">
                  Mở lịch sử hành trình
                </a>
              </Empty>
            ) : (
              items.map((g) => {
                const person = data.users.find(
                  (u) => u.id === (outgoing ? g.viewerId : g.ownerId),
                );
                const expired = g.expiresAt <= now,
                  active = !expired && g.status === "accepted";
                const trips = data.journeys.filter(
                  (j) =>
                    j.ownerId === g.ownerId &&
                    j.status === "completed" &&
                    (!g.journeyIds || g.journeyIds.includes(j.id)),
                );
                return (
                  <article
                    className="history-share-row"
                    data-share-id={g.id}
                    key={g.id}
                  >
                    <div className="history-share-summary">
                      <div className="grant-person">
                        <Avatar user={person} />
                        <div>
                          <strong>
                            {outgoing ? "Chia sẻ với" : "Từ"} {person.name}
                          </strong>
                          <small>
                            {g.status === "revoked"
                              ? "Đã thu hồi / từ chối"
                              : expired
                                ? "Đã hết hạn"
                                : g.status === "pending"
                                  ? "Chờ chấp nhận"
                                  : "Đang chia sẻ"}
                          </small>
                        </div>
                      </div>
                      <span className="history-share-scope">
                        {g.journeyIds
                          ? `${g.journeyIds.length} hành trình đã chọn`
                          : "Toàn bộ lịch sử"}
                      </span>
                      <span className="muted">
                        Hết hạn {dayLabel(g.expiresAt)} ·{" "}
                        {timeLabel(g.expiresAt)}
                      </span>
                    </div>
                    <details>
                      <summary>
                        Xem phạm vi chia sẻ ({trips.length} chuyến)
                      </summary>
                      <div className="shared-trip-preview">
                        {trips.map((j) => (
                          <p key={j.id}>
                            {outgoing || active ? (
                              <a
                                className="text-link"
                                href={`#/history/${j.id}`}
                              >
                                {j.from} → {j.to} · {dayLabel(j.startedAt)}
                              </a>
                            ) : (
                              <span>
                                {j.title} · {dayLabel(j.startedAt)}
                              </span>
                            )}
                          </p>
                        ))}
                      </div>
                    </details>
                    <div className="inline-actions">
                      {outgoing && g.status !== "revoked" && (
                        <button
                          className="btn small danger-text"
                          onClick={() => change(g.id, "revoked")}
                        >
                          Thu hồi chia sẻ
                        </button>
                      )}
                      {!outgoing && !expired && g.status === "pending" && (
                        <>
                          <button
                            className="btn small primary"
                            onClick={() => change(g.id, "accepted")}
                          >
                            Chấp nhận lịch sử
                          </button>
                          <button
                            className="btn small"
                            onClick={() => change(g.id, "revoked")}
                          >
                            Từ chối lịch sử
                          </button>
                        </>
                      )}
                      {!outgoing && active && (
                        <a
                          className="btn small primary"
                          href={
                            g.journeyIds?.length === 1
                              ? `#/history/${g.journeyIds[0]}`
                              : "#/history"
                          }
                        >
                          Xem hành trình được chia sẻ
                        </a>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        );
      })}
    </div>
  );
}
