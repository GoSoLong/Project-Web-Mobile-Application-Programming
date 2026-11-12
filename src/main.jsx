import React from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import App from "./App.jsx";
import { Store } from "./state/Store.jsx";
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="boot">
        <h1>Không thể hiển thị trang</h1>
        <p>Dữ liệu hoặc thành phần giao diện gặp lỗi.</p>
        <button className="btn" onClick={() => location.reload()}>
          Tải lại trang
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Store>
        <App />
      </Store>
    </ErrorBoundary>
  </React.StrictMode>,
);
