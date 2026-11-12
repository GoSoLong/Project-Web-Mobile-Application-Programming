import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Download,
  MapPin,
  Pause,
  Play,
  Route,
  Search,
  Share2,
  SkipBack,
} from "lucide-react";
import { useStore } from "../state/Store.jsx";
import {
  dayLabel,
  filterJourneys,
  hasAccess,
  metrics,
  number,
  pointAt,
  timeLabel,
  visibleJourneys,
} from "../domain.js";
import {
  Avatar,
  Empty,
  Info,
  Metric,
  PageHeading,
  Status,
} from "../components/UI.jsx";
import JourneyMap from "../components/JourneyMap.jsx";
import HistoryShareForm from "../components/HistoryShareForm.jsx";
export default function History({ journeyId }) {
  const { data, user, now } = useStore();
  const [query, setQuery] = useState(""),
    [ownerId, setOwner] = useState("all"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [view, setView] = useState("all"),
    [selectedIds, setSelectedIds] = useState([]),
    [sharing, setSharing] = useState(false);
  if (journeyId) return <JourneyDetail key={journeyId} journeyId={journeyId} />;
  const all = visibleJourneys(data, user.id, now).filter(
    (j) => j.status === "completed",
  );
  const invalidRange = from && to && from > to;
  const trips = invalidRange
    ? []
    : filterJourneys(
        all.filter(
          (j) =>
            view === "all" ||
            (view === "mine" ? j.ownerId === user.id : j.ownerId !== user.id),
        ),
        data.users,
        { query, ownerId, from, to },
      ).sort((a, b) => b.startedAt - a.startedAt);
  return (
    <>
      <PageHeading
        eyebrow="JOURNEY TIMELINE"
        title="Mỗi chuyến đi, một câu chuyện"
        description="Tìm lại những cung đường đã qua và phát lại từng khoảnh khắc."
      >
        <button className="btn primary" onClick={() => setSharing(!sharing)}>
          <Share2 size={16} />
          {selectedIds.length
            ? `Chia sẻ ${selectedIds.length} hành trình`
            : "Chia sẻ lịch sử"}
        </button>
      </PageHeading>
      {sharing && (
        <HistoryShareForm
          key={`${user.id}-${selectedIds.join(",")}`}
          journeyIds={selectedIds}
          onClose={() => setSharing(false)}
        />
      )}
      <div className="panel filter-bar">
        <label className="search-input">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm hành trình, địa điểm, người đi…"
            aria-label="Tìm hành trình"
          />
        </label>
        <label>
          Người di chuyển
          <select value={ownerId} onChange={(e) => setOwner(e.target.value)}>
            <option value="all">Tất cả mọi người</option>
            {data.users
              .filter(
                (u) => u.id === user.id || all.some((j) => j.ownerId === u.id),
              )
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Phạm vi lịch sử
          <select value={view} onChange={(e) => setView(e.target.value)}>
            <option value="all">Tất cả được phép xem</option>
            <option value="mine">Hành trình của tôi</option>
            <option value="shared">Được chia sẻ với tôi</option>
          </select>
        </label>
        <label>
          Từ ngày
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className="btn"
          onClick={() => {
            setQuery("");
            setOwner("all");
            setFrom("");
            setTo("");
            setView("all");
          }}
        >
          Xóa bộ lọc
        </button>
      </div>
      {invalidRange && (
        <div className="field-error" role="alert">
          Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.
        </div>
      )}
      <div className="results-line">
        <strong>{trips.length} hành trình</strong>
        <span>Dữ liệu mẫu · Sắp xếp mới nhất</span>
      </div>
      {trips.length ? (
        <div className="trip-grid">
          {trips.map((j) => {
            const owner = data.users.find((u) => u.id === j.ownerId),
              m = metrics(j.points);
            return (
              <article className="panel trip-card" key={j.id}>
                <div className="trip-card-top">
                  <Avatar user={owner} />
                  <div>
                    <strong>{owner.name}</strong>
                    <small>
                      {dayLabel(j.startedAt)} · {timeLabel(j.startedAt)}
                    </small>
                  </div>
                  <Status status="completed" />
                </div>
                {j.ownerId === user.id && (
                  <label className="trip-select">
                    <input
                      type="checkbox"
                      aria-label={`Chọn hành trình ${j.id}`}
                      checked={selectedIds.includes(j.id)}
                      onChange={(e) =>
                        setSelectedIds((ids) =>
                          e.target.checked
                            ? [...ids, j.id]
                            : ids.filter((id) => id !== j.id),
                        )
                      }
                    />
                    Chọn để chia sẻ
                  </label>
                )}
                {j.ownerId !== user.id && (
                  <span className="shared-history-badge">
                    <Share2 size={12} />
                    Được chia sẻ với bạn
                  </span>
                )}
                <h2>{j.title}</h2>
                <div className="trip-route">
                  <span>
                    <i />
                    {j.from}
                  </span>
                  <span>
                    <i />
                    {j.to}
                  </span>
                </div>
                <div className="trip-numbers">
                  <span>
                    <Route size={15} />
                    {number(m.distance)} km
                  </span>
                  <span>
                    <Clock3 size={15} />
                    {number(m.seconds / 60, 0)} phút
                  </span>
                </div>
                <a className="trip-link" href={`#/history/${j.id}`}>
                  Xem chi tiết & phát lại
                  <ArrowUpRight size={17} />
                </a>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel">
          <Empty title="Không tìm thấy hành trình">
            Thử đổi từ khóa, thời gian hoặc quyền xem lịch sử.
          </Empty>
        </div>
      )}
    </>
  );
}
function JourneyDetail({ journeyId }) {
  const { data, user, now } = useStore();
  const journey = data.journeys.find(
    (j) => j.id === journeyId && j.status === "completed",
  );
  const authorized =
    journey &&
    hasAccess(data, user.id, journey.ownerId, "history", now, journey.id);
  const [cursor, setCursor] = useState(journey?.points[0]?.timestamp || 0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(30),
    [sharing, setSharing] = useState(false);
  const points = journey?.points || [],
    start = points[0]?.timestamp || 0,
    end = points.at(-1)?.timestamp || 0;
  useEffect(() => {
    if (!playing || !authorized || !points.length) return;
    const id = setInterval(
      () =>
        setCursor((previous) => {
          const next = Math.min(end, previous + 250 * speed);
          return next;
        }),
      250,
    );
    return () => clearInterval(id);
  }, [playing, speed, end, authorized, points.length]);
  useEffect(() => {
    if (cursor >= end) setPlaying(false);
  }, [cursor, end]);
  if (!authorized)
    return (
      <>
        <PageHeading title="Hành trình không khả dụng" />
        <div className="panel">
          <Empty title="Không có quyền xem hoặc hành trình không tồn tại">
            Quyền xem lịch sử có thể đã hết hạn hoặc được thu hồi.
          </Empty>
          <a className="btn" href="#/history">
            Về lịch sử
          </a>
        </div>
      </>
    );
  const owner = data.users.find((u) => u.id === journey.ownerId),
    m = metrics(points),
    point = pointAt(points, cursor);
  const download = () => {
    const blob = new Blob(
      [JSON.stringify({ source: "JourneyLink sample data", journey }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = `journeylink-${journey.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <a className="back-link" href="#/history">
        <ArrowLeft size={16} />
        Lịch sử hành trình
      </a>
      <PageHeading
        eyebrow="JOURNEY REPLAY"
        title={journey.title}
        description={`${owner.name} · ${dayLabel(journey.startedAt)} · Dữ liệu mẫu`}
      >
        {journey.ownerId === user.id && (
          <button className="btn primary" onClick={() => setSharing(!sharing)}>
            <Share2 size={16} />
            Chia sẻ hành trình
          </button>
        )}
        <button className="btn" onClick={download}>
          <Download size={16} />
          Xuất dữ liệu mẫu
        </button>
      </PageHeading>
      {sharing && journey.ownerId === user.id && (
        <HistoryShareForm
          key={journey.id}
          journeyIds={[journey.id]}
          allowAll={false}
          onClose={() => setSharing(false)}
        />
      )}
      <div className="metrics">
        <Metric
          label="Quãng đường"
          value={m.distance}
          unit="km"
          icon={Route}
          detail={`${journey.from} → ${journey.to}`}
        />
        <Metric
          label="Thời lượng"
          value={m.seconds / 60}
          unit="phút"
          icon={Clock3}
          detail={`${timeLabel(start)} – ${timeLabel(end)}`}
        />
        <Metric
          label="Tốc độ trung bình"
          value={m.averageSpeed}
          unit="km/h"
          icon={Route}
          detail="Quãng đường / toàn bộ thời lượng"
        />
        <Metric
          label="Thời gian dừng"
          value={m.stoppedSeconds / 60}
          unit="phút"
          icon={MapPin}
          detail={`${journey.stops.length} điểm dừng mẫu`}
        />
      </div>
      {points.length ? (
        <section className="panel replay-panel">
          <JourneyMap
            route={points}
            stops={journey.stops}
            replayPoint={point}
            fitKey={journey.id}
            className="replay-map"
          />
          <div className="replay-controls">
            <div className="replay-top">
              <div>
                <span className="eyebrow">PHÁT LẠI THEO THỜI GIAN GPS</span>
                <h2 data-testid="replay-time">{timeLabel(cursor)}</h2>
              </div>
              <div className="replay-buttons">
                <button
                  className="btn"
                  aria-label="Về đầu hành trình"
                  onClick={() => {
                    setCursor(start);
                    setPlaying(false);
                  }}
                >
                  <SkipBack size={17} />
                </button>
                <button
                  className="btn primary"
                  aria-label={
                    playing ? "Tạm dừng phát lại" : "Phát lại hành trình"
                  }
                  onClick={() => {
                    if (cursor >= end) setCursor(start);
                    setPlaying(!playing);
                  }}
                >
                  {playing ? <Pause size={17} /> : <Play size={17} />}{" "}
                  {playing ? "Tạm dừng" : "Phát lại"}
                </button>
                <label>
                  Tốc độ
                  <select
                    aria-label="Tốc độ phát lại"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  >
                    {[1, 10, 30, 60].map((s) => (
                      <option key={s} value={s}>
                        {s}×
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <input
              aria-label="Tiến trình phát lại"
              type="range"
              min={start}
              max={end || 1}
              step="1000"
              value={cursor}
              onChange={(e) => setCursor(Number(e.target.value))}
            />
            <div className="range-labels">
              <span>{timeLabel(start)} · Bắt đầu</span>
              <span>{timeLabel(end)} · Kết thúc</span>
            </div>
          </div>
        </section>
      ) : (
        <div className="panel">
          <Empty title="Hành trình chưa có tọa độ" />
        </div>
      )}
      <div className="panel padded timeline">
        <h2>Dấu mốc trên hành trình</h2>
        <div>
          <MapPin size={18} />
          <section>
            <strong>{journey.from}</strong>
            <p>{timeLabel(start)} · Bắt đầu hành trình</p>
          </section>
        </div>
        {journey.stops.map((s, i) => (
          <div key={i}>
            <Clock3 size={18} />
            <section>
              <strong>{s.label}</strong>
              <p>
                {points[s.pointIndex]
                  ? timeLabel(points[s.pointIndex].timestamp)
                  : "Chưa có thời gian"}{" "}
                · {s.note}
              </p>
            </section>
          </div>
        ))}
        <div>
          <MapPin size={18} />
          <section>
            <strong>{journey.to}</strong>
            <p>{timeLabel(end)} · Kết thúc hành trình</p>
          </section>
        </div>
      </div>
      <Info>
        Tuyến mẫu bám mạng đường OpenStreetMap; marker phát lại đi theo các đoạn
        đường này. Thời gian và vị trí di chuyển vẫn là mô phỏng, không phải GPS
        thật.
      </Info>
    </>
  );
}
