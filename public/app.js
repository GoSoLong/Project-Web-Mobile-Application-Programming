// =================================================================
// TẬP TIN: app.js
// NHIỆM VỤ M2: Chi tiết xe và vị trí
// Mô tả: Xử lý hiển thị danh sách xe, xem chi tiết thông tin xe, 
//        bản đồ Leaflet, vị trí mới nhất, thời điểm cập nhật và 
//        gọi đầy đủ các API liên quan.
// =================================================================

const STATUS_LABELS = {
  in_trip: "Đang có chuyến",
  idle: "Đang dừng",
  no_signal: "Mất tín hiệu",
};

const state = {
  vehicles: [],
  selectedId: null,
  filter: "all",
  search: "",
  map: null,
  markers: new Map(), // Lưu trữ Leaflet Markers theo vehicle.id
  requestVersion: 0,
};

const elements = {
  vehicleList: document.querySelector("#vehicle-list"),
  vehicleDetails: document.querySelector("#vehicle-details"),
  vehicleSearch: document.querySelector("#vehicle-search"),
  vehicleCount: document.querySelector("#vehicle-count"),
  refreshBtn: document.querySelector("#refresh-button"),
  mapUpdated: document.querySelector("#map-updated"),
  footerUpdate: document.querySelector("#footer-update"),
  mapStatus: document.querySelector("#map-status"),
  toast: document.querySelector("#toast"),
};

// -----------------------------------------------------------------
// 1. CÁC HÀM TIỆN ÍCH & ĐỊNH DẠNG (UTILITIES)
// -----------------------------------------------------------------
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function formatTime(value) {
  if (!value) return "Chưa có tín hiệu";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Chưa có tín hiệu";
  
  const elapsed = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (elapsed < 60) return `${elapsed} giây trước`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)} phút trước`;
  
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatCoordinates(location) {
  if (!location || location.latitude == null || location.longitude == null) {
    return "Chưa có dữ liệu vị trí";
  }
  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

function vehicleSvgIcon() {
  return '<svg viewBox="0 0 32 32" aria-hidden="true" width="20" height="20"><path fill="currentColor" d="M5 19.5 7.2 12a2.5 2.5 0 0 1 2.4-1.8h12.8a2.5 2.5 0 0 1 2.4 1.8l2.2 7.5v6a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5V24H9v1.5A1.5 1.5 0 0 1 7.5 27h-1A1.5 1.5 0 0 1 5 25.5zM8 18h16l-1.5-5H9.5zM10 21a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm12 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>';
}

function getSelectedVehicle() {
  return state.vehicles.find((v) => v.id === state.selectedId) || null;
}

function getVisibleVehicles() {
  const query = state.search.trim().toLocaleLowerCase("vi");
  return state.vehicles.filter((vehicle) => {
    const matchesFilter = state.filter === "all" || vehicle.status === state.filter;
    const searchable = `${vehicle.id} ${vehicle.plate} ${vehicle.name || ''} ${vehicle.driver || ''}`.toLocaleLowerCase("vi");
    return matchesFilter && (!query || searchable.includes(query));
  });
}

function showToast(message, isSuccess = false) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.className = `toast visible ${isSuccess ? "success" : "error"}`;
  clearTimeout(elements.toast._timeout);
  elements.toast._timeout = setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 3200);
}

// -----------------------------------------------------------------
// 2. KHỞI TẠO VÀ XỬ LÝ BẢN ĐỒ LEAFLET (MAP HANDLING)
// -----------------------------------------------------------------
function initializeMap() {
  const mapContainer = document.querySelector("#leaflet-map");
  if (!mapContainer) return;

  if (!window.L) {
    if (elements.mapStatus) {
      elements.mapStatus.textContent = "Không tải được thư viện bản đồ Leaflet. Kiểm tra kết nối Internet.";
      elements.mapStatus.hidden = false;
    }
    return;
  }

  // Tọa độ trung tâm mặc định (Hà Nội)
  state.map = L.map("leaflet-map", {
    center: [21.0285, 105.8542],
    zoom: 12,
    zoomControl: true,
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
  }).addTo(state.map);

  window.setTimeout(() => {
    if (state.map) state.map.invalidateSize();
  }, 100);
}

function renderMap() {
  if (!state.map) return;

  const activeIds = new Set();

  state.vehicles.forEach((vehicle) => {
    if (!vehicle.location) return;

    activeIds.add(vehicle.id);
    const pos = [vehicle.location.latitude, vehicle.location.longitude];
    const isSelected = vehicle.id === state.selectedId;

    const markerColor = vehicle.status === "in_trip" ? "#3980e2" : (vehicle.status === "idle" ? "#e2a344" : "#9ba6b5");

    let marker = state.markers.get(vehicle.id);
    if (!marker) {
      marker = L.circleMarker(pos, {
        radius: isSelected ? 10 : 7,
        fillColor: markerColor,
        color: "#ffffff",
        weight: isSelected ? 3 : 2,
        fillOpacity: 1,
      })
        .bindTooltip(`<strong>${escapeHtml(vehicle.plate)}</strong> (${escapeHtml(vehicle.id)})`, {
          direction: "top",
          offset: [0, -8],
          className: "leaflet-vehicle-label",
        })
        .on("click", () => selectVehicle(vehicle.id))
        .addTo(state.map);

      state.markers.set(vehicle.id, marker);
    } else {
      marker.setLatLng(pos);
      marker.setStyle({
        radius: isSelected ? 10 : 7,
        fillColor: markerColor,
        weight: isSelected ? 3 : 2,
      });
    }
  });

  // Xóa Marker của xe không còn tồn tại trong danh sách
  for (const [id, marker] of state.markers) {
    if (!activeIds.has(id)) {
      marker.remove();
      state.markers.delete(id);
    }
  }
}

function focusVehicleLocation(vehicle) {
  if (state.map && vehicle?.location) {
    state.map.panTo([vehicle.location.latitude, vehicle.location.longitude], {
      animate: true,
      duration: 0.5,
    });
  }
}

// -----------------------------------------------------------------
// 3. HIỂN THỊ GIAO DIỆN (UI RENDERING)
// -----------------------------------------------------------------
function renderVehicleList() {
  if (!elements.vehicleList) return;

  const vehicles = getVisibleVehicles();

  if (elements.vehicleCount) {
    elements.vehicleCount.textContent = state.vehicles.length;
  }

  // Cập nhật số lượng trên các chip lọc
  const filterAllCount = document.querySelector("#filter-all");
  const filterMovingCount = document.querySelector("#filter-moving");
  const filterIdleCount = document.querySelector("#filter-idle");

  if (filterAllCount) filterAllCount.textContent = state.vehicles.length;
  if (filterMovingCount) filterMovingCount.textContent = state.vehicles.filter(v => v.status === "in_trip").length;
  if (filterIdleCount) filterIdleCount.textContent = state.vehicles.filter(v => v.status === "idle").length;

  if (!vehicles.length) {
    elements.vehicleList.innerHTML = '<div class="empty-list">Không tìm thấy phương tiện phù hợp.</div>';
    return;
  }

  elements.vehicleList.innerHTML = vehicles.map((vehicle) => `
    <button class="vehicle-item ${vehicle.id === state.selectedId ? "selected" : ""}" 
            type="button" 
            data-vehicle-id="${escapeHtml(vehicle.id)}">
      <span class="vehicle-thumb">${vehicleSvgIcon()}</span>
      <span class="vehicle-main">
        <span class="vehicle-line">
          <strong>${escapeHtml(vehicle.plate)}</strong>
          <span class="status-badge ${escapeHtml(vehicle.status)}">${escapeHtml(STATUS_LABELS[vehicle.status] || vehicle.status)}</span>
        </span>
        <span class="vehicle-model">${escapeHtml(vehicle.name || "N/A")} · ${escapeHtml(vehicle.id)}</span>
        <span class="vehicle-meta">
          <span class="vehicle-driver">${escapeHtml(vehicle.driver || "Chưa phân công")}</span>
          <span class="vehicle-time">${formatTime(vehicle.location?.updatedAt)}</span>
        </span>
      </span>
    </button>
  `).join("");
}

function renderVehicleDetails(vehicle) {
  if (!elements.vehicleDetails) return;

  if (!vehicle) {
    elements.vehicleDetails.innerHTML = '<p class="empty">Chọn một phương tiện để xem thông tin chi tiết.</p>';
    return;
  }

  const locationText = formatCoordinates(vehicle.location);
  const updatedAtText = formatTime(vehicle.location?.updatedAt);
  const statusLabel = STATUS_LABELS[vehicle.status] || vehicle.status;

  elements.vehicleDetails.innerHTML = `
    <div class="vehicle-detail-card">
      <div class="detail-header">
        <h3>${escapeHtml(vehicle.plate)} (${escapeHtml(vehicle.id)})</h3>
        <span class="status-badge ${escapeHtml(vehicle.status)}">${escapeHtml(statusLabel)}</span>
      </div>
      <dl class="detail-list">
        <dt>Loại xe / Tên:</dt>
        <dd>${escapeHtml(vehicle.name || "N/A")} ${vehicle.type ? `(${escapeHtml(vehicle.type)})` : ""}</dd>
        
        <dt>Tài xế phụ trách:</dt>
        <dd>${escapeHtml(vehicle.driver || "Chưa phân công")}</dd>
        
        <dt>Tọa độ mới nhất:</dt>
        <dd><strong>${escapeHtml(locationText)}</strong></dd>
        
        <dt>Thời điểm cập nhật:</dt>
        <dd>${escapeHtml(updatedAtText)}</dd>
      </dl>
    </div>
  `;
}

function updateStatusTimestamps(generatedAt) {
  const formattedTime = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(generatedAt || Date.now()));

  if (elements.mapUpdated) elements.mapUpdated.textContent = `Cập nhật lúc ${formattedTime}`;
  if (elements.footerUpdate) elements.footerUpdate.textContent = `Đã đồng bộ lúc ${formattedTime}`;
}

// -----------------------------------------------------------------
// 4. XỬ LÝ CHỌN XE & GỌI API (API CALLS & SELECTION)
// -----------------------------------------------------------------
async function selectVehicle(vehicleId) {
  state.selectedId = vehicleId;
  const vehicle = getSelectedVehicle();

  renderVehicleList();
  renderVehicleDetails(vehicle);
  renderMap();

  if (vehicle) {
    focusVehicleLocation(vehicle);
    
    // Gọi API lấy thông tin chi tiết xe (/api/vehicles/:id)
    fetchVehicleDetail(vehicleId);
    
    // Gọi API lấy riêng vị trí mới nhất (/api/vehicles/:id/location/latest)
    fetchLatestLocation(vehicleId);
  }
}

async function fetchVehicleDetail(vehicleId) {
  try {
    const response = await fetch(`/api/vehicles/${encodeURIComponent(vehicleId)}`);
    if (!response.ok) return;
    const result = await response.json();
    if (result.data) {
      // Cập nhật lại thông tin đầy đủ vào state
      const index = state.vehicles.findIndex(v => v.id === vehicleId);
      if (index !== -1) {
        state.vehicles[index] = { ...state.vehicles[index], ...result.data };
        if (state.selectedId === vehicleId) {
          renderVehicleDetails(state.vehicles[index]);
        }
      }
    }
  } catch (error) {
    console.error(`Lỗi khi gọi API chi tiết xe ${vehicleId}:`, error);
  }
}

async function fetchLatestLocation(vehicleId) {
  try {
    const response = await fetch(`/api/vehicles/${encodeURIComponent(vehicleId)}/location/latest`);
    if (!response.ok) return;
    const result = await response.json();
    if (result.data) {
      const index = state.vehicles.findIndex(v => v.id === vehicleId);
      if (index !== -1) {
        state.vehicles[index].location = result.data;
        if (state.selectedId === vehicleId) {
          renderVehicleDetails(state.vehicles[index]);
          renderMap();
        }
      }
    }
  } catch (error) {
    console.error(`Lỗi khi gọi API vị trí mới nhất của xe ${vehicleId}:`, error);
  }
}

async function loadVehicles({ silent = false, showSuccess = false } = {}) {
  if (elements.refreshBtn && !silent) elements.refreshBtn.disabled = true;

  try {
    const response = await fetch("/api/vehicles");
    if (!response.ok) throw new Error(`Lỗi máy chủ (${response.status})`);
    
    const result = await response.json();
    if (!Array.isArray(result.data)) throw new Error("Dữ liệu không đúng định dạng mảng.");

    state.vehicles = result.data;

    // Tự động chọn xe đầu tiên nếu chưa chọn xe nào
    if (!state.selectedId && state.vehicles.length > 0) {
      state.selectedId = state.vehicles[0].id;
    }

    renderVehicleList();
    renderVehicleDetails(getSelectedVehicle());
    renderMap();
    updateStatusTimestamps(result.generatedAt);

    if (showSuccess) showToast("Đã đồng bộ dữ liệu vị trí mới nhất.", true);
  } catch (error) {
    if (elements.footerUpdate) elements.footerUpdate.textContent = "Không thể kết nối máy chủ";
    if (!silent) showToast(`Không thể tải dữ liệu: ${error.message}`);
  } finally {
    if (elements.refreshBtn) elements.refreshBtn.disabled = false;
  }
}

// -----------------------------------------------------------------
// 5. LẮNG NGHE SỰ KIỆN & KHỞI CHẠY (EVENTS & INITIALIZATION)
// -----------------------------------------------------------------
if (elements.vehicleList) {
  elements.vehicleList.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-vehicle-id]");
    if (btn) selectVehicle(btn.dataset.vehicleId);
  });
}

if (elements.vehicleSearch) {
  elements.vehicleSearch.addEventListener("input", () => {
    state.search = elements.vehicleSearch.value;
    renderVehicleList();
  });

  elements.vehicleSearch.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      elements.vehicleSearch.focus();
    }
  });
}

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    state.filter = chip.dataset.filter;
    document.querySelectorAll(".filter-chip").forEach((c) => c.classList.toggle("selected", c === chip));
    renderVehicleList();
  });
});

if (elements.refreshBtn) {
  elements.refreshBtn.addEventListener("click", () => {
    loadVehicles({ showSuccess: true });
  });
}

// Cập nhật ngày hôm nay ở thẻ UI
const todayDateEl = document.querySelector("#today-date");
if (todayDateEl) {
  todayDateEl.textContent = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

// Khởi tạo hệ thống
initializeMap();
loadVehicles().then(() => {
  const selected = getSelectedVehicle();
  if (selected) focusVehicleLocation(selected);
});

// Tự động đồng bộ vị trí ngầm mỗi 10 giây
window.setInterval(() => {
  loadVehicles({ silent: true });
}, 10_000);