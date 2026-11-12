import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Route,
  Users,
  Clock3,
  Navigation,
  MapPin,
  ShieldCheck,
  Pause,
  Play,
} from "lucide-react";
import { useStore } from "../state/Store.jsx";
import {
  aggregate,
  hasAccess,
  liveView,
  number,
  timeLabel,
  visibleJourneys,
} from "../domain.js";
import JourneyMap from "../components/JourneyMap.jsx";
import {
  Avatar,
  Empty,
  Metric,
  PageHeading,
  SectionTitle,
  Status,
} from "../components/UI.jsx";
import Activity from "../components/Activity.jsx";
export default function Overview({ liveOnly = false }) {
  const { data, user, now } = useStore();
  const [circle, setCircle] = useState("all"),
    [selected, setSelected] = useState("linh"),
    [running, setRunning] = useState(true),
    [frozen, setFrozen] = useState(now);
  const live = data.journeys
    .filter(
      (j) =>
        j.status !== "completed" &&
        hasAccess(data, user.id, j.ownerId, "live", now),
    )
    .map((j) => ({
      ...liveView(data, user.id, j, now, running ? now : frozen),
      user: data.users.find((u) => u.id === j.ownerId),
    }))
    .filter((j) => j.point && (circle === "all" || j.user.circle === circle));
  const current = live.find((j) => j.user.id === selected) || live[0];
  const trips = visibleJourneys(data, user.id, now).filter(
    (j) => j.status === "completed",
  );
  const week = aggregate(trips, 7, now),
    total = week.reduce(
      (a, d) => ({
        distance: a.distance + d.distance,
        seconds: a.seconds + d.seconds,
        trips: a.trips + d.trips,
      }),
      { distance: 0, seconds: 0, trips: 0 },
    );
  return (
    <>
      <PageHeading
        eyebrow={liveOnly ? "JOURNEY LIVE" : "MỖI HÀNH TRÌNH, MỘT KẾT NỐI"}
        title={
          liveOnly
            ? "Cùng nhau trên bản đồ"
            : `Chào ${user.name.split(" ").at(-1)}, một ngày an tâm.`
        }
        description={
          liveOnly
            ? "Theo dõi những người đã chủ động chia sẻ vị trí với bạn."
            : "Một góc nhìn nhỏ, để luôn gần những người quan trọng."
        }
      >
        <a className="btn primary" href="#/sharing">
          <Users size={17} />
          Quản lý vòng kết nối
          <ArrowUpRight size={16} />
        </a>
      </PageHeading>
      {!liveOnly && (
        <div className="metrics">
          <Metric
            label="Đang chia sẻ với bạn"
            value={live.length}
            unit="người"
            icon={Users}
            detail="Theo quyền xem trực tiếp hiện tại"
          />
          <Metric
            label="Quãng đường tuần này"
            value={total.distance}
            unit="km"
            icon={Route}
            detail={`${total.trips} hành trình được phép xem`}
          />
          <Metric
            label="Thời lượng hành trình"
            value={total.seconds / 3600}
            unit="giờ"
            icon={Clock3}
            detail="Tổng thời lượng chuyến đi trong 7 ngày"
          />
          <Metric
            label="Kết nối có kiểm soát"
            value={
              data.grants.filter(
                (g) =>
                  g.ownerId === user.id &&
                  g.status === "accepted" &&
                  g.expiresAt > now &&
                  (g.live || g.history),
              ).length
            }
            unit="quyền"
            icon={ShieldCheck}
            detail="Bạn có thể thu hồi bất cứ lúc nào"
          />
        </div>
      )}
      <section className="panel live-panel">
        <div className="panel-head">
          <div>
            <h2>
              <span className="pulse" /> Những người đang đồng hành
            </h2>
            <p>Vị trí mô phỏng · Chỉ hiển thị khi bạn có quyền truy cập</p>
          </div>
          <div className="live-tools">
            <label className="sr-only" htmlFor="circle">
              Vòng kết nối
            </label>
            <select
              id="circle"
              value={circle}
              onChange={(e) => setCircle(e.target.value)}
            >
              <option value="all">Tất cả vòng kết nối</option>
              {data.circles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              className="btn small"
              aria-label={running ? "Tạm dừng mô phỏng" : "Tiếp tục mô phỏng"}
              onClick={() => {
                setFrozen(now);
                setRunning(!running);
              }}
            >
              {running ? <Pause size={15} /> : <Play size={15} />}
              <span>{running ? "Tạm dừng" : "Tiếp tục"}</span>
            </button>
          </div>
        </div>
        <div className="live-layout">
          <div className="people-panel">
            <div className="people-caption">
              VÒNG KẾT NỐI CỦA BẠN <span>{live.length}</span>
            </div>
            {live.length ? (
              live.map((j) => (
                <button
                  className={`person-card ${current?.id === j.id ? "active" : ""}`}
                  key={j.id}
                  onClick={() => setSelected(j.user.id)}
                >
                  <div className="person-top">
                    <Avatar user={j.user} />
                    <div>
                      <strong>{j.user.name}</strong>
                      <span>
                        {data.circles.find((c) => c.id === j.user.circle)?.name}
                      </span>
                    </div>
                    <ArrowUpRight size={16} />
                  </div>
                  <Status status={j.status} />
                  <div className="person-location">
                    <MapPin size={13} />
                    <span>
                      {j.sharingJourney
                        ? `Hành trình trực tiếp · ${j.to}`
                        : "Chỉ chia sẻ vị trí"}
                    </span>
                  </div>
                  <div className="person-bottom">
                    <span>{number(j.speed, 0)} km/h</span>
                    <small>
                      {j.status === "stale"
                        ? `${Math.floor((now - j.updatedAt) / 60000)} phút trước`
                        : running
                          ? "Vừa cập nhật · mô phỏng"
                          : "Mô phỏng đang tạm dừng"}
                    </small>
                  </div>
                </button>
              ))
            ) : (
              <Empty title="Chưa có vị trí được chia sẻ">
                Chọn vòng khác hoặc kiểm tra quyền và thời hạn chia sẻ.
              </Empty>
            )}
            <div className="people-note">
              <ShieldCheck size={17} />
              <span>
                Chia sẻ là lựa chọn.
                <br />
                An tâm là kết nối.
              </span>
            </div>
          </div>
          <div className="live-map">
            <JourneyMap
              people={live}
              route={current?.trail || []}
              selectedId={current?.user.id}
              onSelect={setSelected}
              fitKey={`${user.id}-${circle}-${current?.id}-${current?.sharingJourney}`}
            />
            {current && (
              <div className="journey-overlay">
                <div className="journey-overlay-title">
                  <span className="route-symbol">
                    <Navigation size={19} />
                  </span>
                  <div>
                    <strong>
                      {current.sharingJourney
                        ? current.title
                        : "Vị trí trực tiếp"}
                    </strong>
                    <small>
                      {current.user.name} · {timeLabel(current.updatedAt)}
                    </small>
                  </div>
                  <Status status={current.status} />
                </div>
                {current.sharingJourney ? (
                  <>
                    <div className="route-caption">
                      <span>{current.from}</span>
                      <ArrowRight size={15} />
                      <span>{current.to}</span>
                    </div>
                    <div className="journey-progress">
                      <i style={{ width: `${current.progress * 100}%` }} />
                    </div>
                    <div className="overlay-foot">
                      <span>
                        {number(current.traveled.distance)} km đã di chuyển
                      </span>
                      <span>
                        {number(current.progress * 100, 0)}% tuyến mẫu
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="overlay-foot">
                    <span>Chỉ vị trí hiện tại · Không chia sẻ hành trình</span>
                    <span>{number(current.speed, 0)} km/h</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      {!liveOnly && (
        <div className="below-grid">
          <section className="panel padded">
            <SectionTitle
              title="Nhịp di chuyển trong tuần"
              caption="Quãng đường từ các chuyến đi được phép xem"
              href="#/analytics"
              action="Khám phá thống kê"
            />
            <div className="mini-bars">
              {week.map((d) => (
                <div key={d.day}>
                  <span>{number(d.distance)}</span>
                  <i
                    style={{
                      height: `${Math.max(3, (d.distance / Math.max(1, ...week.map((x) => x.distance))) * 90)}px`,
                    }}
                  />
                  <small>
                    {d.day.slice(8)}/{d.day.slice(5, 7)}
                  </small>
                </div>
              ))}
            </div>
            <div className="chart-footer">
              <span>
                <i /> Quãng đường (km)
              </span>
              <strong>{number(total.distance)} km / 7 ngày</strong>
            </div>
          </section>
          <section className="panel padded">
            <SectionTitle
              title="Những cập nhật gần đây"
              href="#/notifications"
            />
            <Activity compact />
          </section>
        </div>
      )}
    </>
  );
}
