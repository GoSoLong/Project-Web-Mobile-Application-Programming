import { ArrowUpRight, CircleHelp, MapPin } from "lucide-react";
import { number } from "../domain.js";
export function Avatar({ user, size = "", className = "" }) {
  return (
    <span
      className={`avatar ${size} ${className}`}
      style={{ "--avatar-color": user.color }}
    >
      {user.initials}
    </span>
  );
}
export const statusLabels = {
  moving: "Đang di chuyển",
  stopped: "Đang dừng",
  stale: "Mất cập nhật",
  arrived: "Đã đến nơi",
  completed: "Hoàn thành",
};
export function Status({ status }) {
  return (
    <span className={`status ${status}`}>
      <i />
      {statusLabels[status] || status}
    </span>
  );
}
export function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow || "KHÔNG GIAN HÀNH TRÌNH"}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  );
}
export function Empty({ title = "Chưa có dữ liệu", children }) {
  return (
    <div className="empty">
      <MapPin size={28} />
      <h3>{title}</h3>
      <p>{children || "Hãy thử điều chỉnh bộ lọc hoặc quyền chia sẻ."}</p>
    </div>
  );
}
export function Metric({ label, value, unit, icon: Icon, detail }) {
  return (
    <article className="metric">
      <div className="metric-top">
        <span>{label}</span>
        {Icon && <Icon size={18} />}
      </div>
      <div className="metric-value">
        {typeof value === "number" ? number(value) : value}
        <small>{unit}</small>
      </div>
      <div className="metric-detail">{detail}</div>
    </article>
  );
}
export function SectionTitle({ title, caption, href, action = "Xem tất cả" }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {caption && <p>{caption}</p>}
      </div>
      {href && (
        <a className="text-link" href={href}>
          {action}
          <ArrowUpRight size={16} />
        </a>
      )}
    </div>
  );
}
export function Info({ children }) {
  return (
    <div className="info">
      <CircleHelp size={17} />
      <span>{children}</span>
    </div>
  );
}
