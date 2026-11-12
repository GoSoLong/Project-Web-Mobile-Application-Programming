import { useState } from "react";
import { Clock3, Route, TrendingUp, Waypoints } from "lucide-react";
import { useStore } from "../state/Store.jsx";
import { aggregate, number, visibleJourneys } from "../domain.js";
import { Empty, Metric, PageHeading, SectionTitle } from "../components/UI.jsx";
export default function Analytics() {
  const { data, user, now } = useStore();
  const [period, setPeriod] = useState(7),
    [owner, setOwner] = useState("self");
  const trips = visibleJourneys(data, user.id, now).filter(
    (j) =>
      j.status === "completed" && (owner === "all" || j.ownerId === user.id),
  );
  const days = aggregate(trips, period, now),
    previous = aggregate(trips, period, now - period * 86400000);
  const sum = (rows) =>
    rows.reduce(
      (a, b) => ({
        distance: a.distance + b.distance,
        seconds: a.seconds + b.seconds,
        trips: a.trips + b.trips,
        stoppedSeconds: a.stoppedSeconds + b.stoppedSeconds,
      }),
      { distance: 0, seconds: 0, trips: 0, stoppedSeconds: 0 },
    );
  const total = sum(days),
    prev = sum(previous),
    max = Math.max(1, ...days.map((d) => d.distance));
  return (
    <>
      <PageHeading
        eyebrow="JOURNEY INSIGHTS"
        title="Hiểu hơn những hành trình"
        description="Nhìn lại nhịp di chuyển, dành thời gian cho những điều quan trọng."
      >
        <label className="select-label">
          Khoảng thời gian
          <select
            aria-label="Khoảng thống kê"
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
          >
            <option value={1}>Hôm nay</option>
            <option value={7}>7 ngày gần nhất</option>
            <option value={30}>30 ngày gần nhất</option>
          </select>
        </label>
        <label className="select-label">
          Dữ liệu
          <select
            aria-label="Phạm vi thống kê"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option value="self">Của tôi</option>
            <option value="all">Tất cả được cấp quyền</option>
          </select>
        </label>
      </PageHeading>
      <div className="metrics">
        <Metric
          label="Tổng quãng đường"
          value={total.distance}
          unit="km"
          icon={Route}
          detail={`${prev.distance ? number(((total.distance - prev.distance) / prev.distance) * 100) : "—"}% so với kỳ trước`}
        />
        <Metric
          label="Tổng thời gian"
          value={total.seconds / 3600}
          unit="giờ"
          icon={Clock3}
          detail={`Kỳ trước: ${number(prev.seconds / 3600)} giờ`}
        />
        <Metric
          label="Hành trình hoàn thành"
          value={total.trips}
          unit="chuyến"
          icon={Waypoints}
          detail={`Kỳ trước: ${prev.trips} chuyến`}
        />
        <Metric
          label="Tốc độ trung bình"
          value={total.seconds ? total.distance / (total.seconds / 3600) : 0}
          unit="km/h"
          icon={TrendingUp}
          detail="Tính cả thời gian dừng"
        />
      </div>
      <section className="panel padded">
        <SectionTitle
          title="Từng ngày, từng cung đường"
          caption="Quãng đường (km) · Tính trực tiếp từ tọa độ của hành trình"
        />
        {total.trips ? (
          <div className="analytics-chart">
            <svg
              viewBox="0 0 900 230"
              role="img"
              aria-label={`Biểu đồ quãng đường trong ${period} ngày`}
            >
              <title>Quãng đường theo ngày</title>
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <line
                    x1="40"
                    x2="880"
                    y1={190 - i * 42}
                    y2={190 - i * 42}
                    stroke="#e7ebe7"
                    strokeDasharray="4 5"
                  />
                  <text x="2" y={195 - i * 42} fontSize="11" fill="#7d8781">
                    {number((max * i) / 4, 0)}
                  </text>
                </g>
              ))}
              {days.map((d, i) => {
                const w = 820 / days.length,
                  x = 48 + i * w,
                  height = (d.distance / max) * 168;
                return (
                  <g key={d.day}>
                    <rect
                      x={x}
                      y={190 - height}
                      width={Math.min(48, w - 5)}
                      height={height || 1}
                      fill={i === days.length - 1 ? "#b7d779" : "#177663"}
                      rx="4"
                    >
                      <title>
                        {d.day}: {number(d.distance)} km · {d.trips} chuyến
                      </title>
                    </rect>
                    {(period <= 7 || i % 5 === 0 || i === days.length - 1) && (
                      <text x={x + 8} y="215" fontSize="11" fill="#7d8781">
                        {d.day.slice(8)}/{d.day.slice(5, 7)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <Empty title="Chưa có hành trình trong khoảng này" />
        )}
        <div className="chart-footer">
          <span>
            <i />
            Quãng đường mỗi ngày
          </span>
          <span>Dữ liệu mẫu · Múi giờ Việt Nam</span>
        </div>
      </section>
      <div className="below-grid">
        <section className="panel padded">
          <SectionTitle
            title="Di chuyển & dừng nghỉ"
            caption="Thời lượng dựa trên timestamp của tọa độ"
          />
          <div className="time-split">
            <span
              style={{
                width: `${total.seconds ? Math.max(0, ((total.seconds - total.stoppedSeconds) / total.seconds) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="split-values">
            <div>
              <strong>
                {number((total.seconds - total.stoppedSeconds) / 60)} phút
              </strong>
              <span>Di chuyển</span>
            </div>
            <div>
              <strong>{number(total.stoppedSeconds / 60)} phút</strong>
              <span>Dừng nghỉ (tốc độ dưới 0,5 km/h)</span>
            </div>
          </div>
        </section>
        <section className="panel padded">
          <SectionTitle
            title="So với kỳ trước"
            caption={`Hai khoảng ${period} ngày liên tiếp`}
          />
          <div className="comparison">
            <span>Quãng đường</span>
            <strong>{number(total.distance)} km</strong>
            <small>Kỳ trước: {number(prev.distance)} km</small>
          </div>
          <div className="comparison">
            <span>Số hành trình</span>
            <strong>{total.trips} chuyến</strong>
            <small>Kỳ trước: {prev.trips} chuyến</small>
          </div>
        </section>
      </div>
    </>
  );
}
