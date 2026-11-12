import { useEffect, useState } from "react";
import {
  Bell,
  ChartNoAxesCombined,
  ChevronRight,
  Compass,
  History as HistoryIcon,
  LayoutDashboard,
  Map,
  Menu,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useStore } from "./state/Store.jsx";
import { dayLabel } from "./domain.js";
import { Avatar } from "./components/UI.jsx";
import Overview from "./pages/Overview.jsx";
import History from "./pages/History.jsx";
import Sharing from "./pages/Sharing.jsx";
import Analytics from "./pages/Analytics.jsx";
import Notifications from "./pages/Notifications.jsx";
import Settings from "./pages/Settings.jsx";
const navigation = [
  ["overview", "Tổng quan", LayoutDashboard],
  ["live", "Theo dõi trực tiếp", Map],
  ["history", "Lịch sử hành trình", HistoryIcon],
  ["sharing", "Vòng kết nối", Users],
  ["analytics", "Phân tích di chuyển", ChartNoAxesCombined],
  ["notifications", "Thông báo & an toàn", Bell],
  ["settings", "Quyền riêng tư", SettingsIcon],
];
function getRoute() {
  return location.hash.replace(/^#\/?/, "") || "overview";
}
export default function App() {
  const { data, user, now } = useStore();
  const [route, setRoute] = useState(getRoute),
    [menu, setMenu] = useState(false);
  const [page, id] = route.split("/");
  const nav = navigation.find((n) => n[0] === page);
  const unread = data.notifications.filter(
    (n) => n.recipientId === user.id && !n.read,
  ).length;
  useEffect(() => {
    const handler = () => {
      setRoute(getRoute());
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    document.title = `${nav?.[1] || "Không tìm thấy trang"} · JourneyLink`;
  }, [nav]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  let content;
  switch (page) {
    case "overview":
      content = <Overview key={`${user.id}-overview`} />;
      break;
    case "live":
      content = <Overview key={`${user.id}-live`} liveOnly />;
      break;
    case "history":
      content = <History journeyId={id} />;
      break;
    case "sharing":
      content = <Sharing />;
      break;
    case "analytics":
      content = <Analytics />;
      break;
    case "notifications":
      content = <Notifications />;
      break;
    case "settings":
      content = <Settings />;
      break;
    default:
      content = (
        <div className="empty">
          <h1>Trang không tồn tại</h1>
          <a className="btn primary" href="#/overview">
            Về tổng quan
          </a>
        </div>
      );
  }
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content").focus();
        }}
      >
        Đến nội dung chính
      </a>
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label="Đóng điều hướng"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a className="brand" href="#/overview">
          <span className="brand-icon">
            <Compass size={25} />
          </span>
          <span>
            Journey<span className="brand-light">Link</span>
            <small>KẾT NỐI TỪNG HÀNH TRÌNH</small>
          </span>
        </a>
        <button
          className="mobile-menu-close icon-button"
          onClick={() => setMenu(false)}
          aria-label="Đóng menu"
        >
          <X size={20} />
        </button>
        <div className="workspace-label">KHÔNG GIAN CỦA BẠN</div>
        <nav aria-label="Điều hướng chính">
          {navigation.map(([key, label, Icon], index) => (
            <a
              key={key}
              className={`${page === key ? "active" : ""} ${index === 5 ? "nav-separated" : ""}`}
              aria-current={page === key ? "page" : undefined}
              href={`#/${key}`}
            >
              <Icon size={19} />
              <span>{label}</span>
              {key === "notifications" && unread > 0 && (
                <b className="nav-count">{unread}</b>
              )}
              {page === key && <span className="nav-active-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-message">
            <ShieldCheck size={23} />
            <strong>An tâm trên mọi nẻo đường</strong>
            <p>Chỉ chia sẻ với người bạn chọn, trong thời gian bạn muốn.</p>
            <a href="#/sharing">
              Quản lý chia sẻ
              <ChevronRight size={15} />
            </a>
          </div>
          <a href="#/settings" className="sidebar-account">
            <Avatar user={user} />
            <span>
              <strong>{user.name}</strong>
              <small>Tài khoản trải nghiệm</small>
            </span>
            <SettingsIcon size={17} />
          </a>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="Mở menu"
              aria-expanded={menu}
            >
              <Menu size={21} />
            </button>
            <span>Không gian cá nhân</span>
            <ChevronRight size={14} />
            <strong>{nav?.[1] || "Không tìm thấy"}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-tag">
              <i />
              Bản demo · GPS mô phỏng
            </span>
            <span className="topbar-date">{dayLabel(now)}</span>
            <a
              className="notification-button icon-button"
              href="#/notifications"
              aria-label={`Thông báo, ${unread} chưa đọc`}
            >
              <Bell size={19} />
              {unread > 0 && <i />}
            </a>
            <a href="#/settings" aria-label="Mở hồ sơ">
              <Avatar user={user} size="tiny" />
            </a>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {content}
        </main>
        <footer className="footer">
          <span>
            JourneyLink <i>·</i> Kết nối từng hành trình
          </span>
          <span>Dữ liệu mẫu & mô phỏng · Bài tập lớn ET4711</span>
        </footer>
      </div>
    </div>
  );
}
