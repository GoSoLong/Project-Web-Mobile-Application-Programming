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
  trackingVehicleId: null,
  selectedTripRoute: null,
  tripRoutes: new Map(),
  filter: "all",
  search: "",
  map: null,
  markers: new Map(), // Lưu trữ Leaflet Markers theo vehicle.id
  destinationMarkers: new Map(),
  tripOriginMarker: null,
  tripDestinationMarker: null,
  routeLayer: null,
  hasFittedInitialRoutes: false,
  requestVersion: 0,
};

const elements = {
  vehicleList: document.querySelector("#vehicle-list"),
  tripList: document.querySelector("#trip-list"),
  vehicleDetails: document.querySelector("#vehicle-details"),
  vehicleSearch: document.querySelector("#vehicle-search"),
  vehicleCount: document.querySelector("#vehicle-count"),
  tripCount: document.querySelector("#trip-count"),
  tripsSubtitle: document.querySelector("#trips-subtitle"),
  routeStatus: document.querySelector("#route-status"),
  viewAllTrips: document.querySelector("#view-all-trips"),
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

function setMapStatus(message) {
  if (!elements.mapStatus) return;
  elements.mapStatus.textContent = message;
  elements.mapStatus.hidden = !message;
}

function updateRouteStatus(vehicle, trip = null) {
  if (!elements.routeStatus) return;
  if (trip) {
    if (trip.routeStatus === "ready") {
      const distanceKm = new Intl.NumberFormat("vi-VN", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(trip.routeDistanceMeters / 1000);
      elements.routeStatus.textContent = `Chuyến ${trip.id} · Tuyến đường bộ · ${distanceKm} km`;
      elements.routeStatus.classList.remove("route-error");
    } else {
      elements.routeStatus.textContent = `Không tải được tuyến chuyến ${trip.id}`;
      elements.routeStatus.classList.add("route-error");
    }
  } else if (!vehicle) {
    elements.routeStatus.textContent = "Chọn marker xe để theo dõi tuyến và điểm đến";
    elements.routeStatus.classList.remove("route-error");
  } else if (vehicle.routeStatus === "ready") {
    const distanceKm = new Intl.NumberFormat("vi-VN", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(vehicle.routeDistanceMeters / 1000);
    elements.routeStatus.textContent = `Tuyến đường bộ · ${distanceKm} km`;
    elements.routeStatus.classList.remove("route-error");
  } else if (vehicle.routeStatus === "unavailable") {
    elements.routeStatus.textContent = "Không lấy được tuyến đường bộ";
    elements.routeStatus.classList.add("route-error");
  } else if (vehicle.routeStatus === "loading") {
    elements.routeStatus.textContent = "Đang lấy tuyến đường bộ…";
    elements.routeStatus.classList.remove("route-error");
  } else {
    elements.routeStatus.textContent = "Xe không có chuyến đang chạy";
    elements.routeStatus.classList.remove("route-error");
  }
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
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
  })
    .on("tileerror", () => setMapStatus("Không tải được một số ô bản đồ. Kiểm tra Internet hoặc thử làm mới trang."))
    .on("tileload", () => setMapStatus(""))
    .addTo(state.map);

  window.setTimeout(() => {
    if (state.map) state.map.invalidateSize();
  }, 100);
}

function destinationIcon() {
  return L.divIcon({
    className: "destination-icon-container",
    html: '<svg class="destination-pin" viewBox="0 0 32 40" role="img" aria-label="Điểm đến"><path d="M16 1C7.72 1 1 7.72 1 16c0 10.5 15 23 15 23s15-12.5 15-23C31 7.72 24.28 1 16 1Z" fill="#e53935" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="5.3" fill="#fff"/></svg>',
    iconSize: [32, 40],
    iconAnchor: [16, 39],
    tooltipAnchor: [0, -34],
  });
}

function renderMap() {
  const trackedVehicle = state.vehicles.find((vehicle) => vehicle.id === state.trackingVehicleId) || null;
  const selectedTrip = state.selectedTripRoute;
  updateRouteStatus(trackedVehicle, selectedTrip);
  if (!state.map) return;

  const activeIds = new Set();
  const activeDestinationIds = new Set();

  state.vehicles.forEach((vehicle) => {
    if (vehicle.location) {
      activeIds.add(vehicle.id);
      const position = [vehicle.location.latitude, vehicle.location.longitude];
      const isSelected = vehicle.id === state.selectedId;
      const markerColor = vehicle.status === "in_trip"
        ? "#3980e2"
        : vehicle.status === "idle" ? "#e2a344" : "#9ba6b5";

      let marker = state.markers.get(vehicle.id);
      if (!marker) {
        marker = L.circleMarker(position, {
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
          .on("click", () => selectVehicle(vehicle.id, { trackRoute: true }))
          .addTo(state.map);

        state.markers.set(vehicle.id, marker);
      } else {
        marker.setLatLng(position);
        marker.setStyle({
          radius: isSelected ? 10 : 7,
          fillColor: markerColor,
          weight: isSelected ? 3 : 2,
        });
      }
    }

    if (vehicle.id === state.trackingVehicleId && vehicle.status === "in_trip" && vehicle.destination) {
      activeDestinationIds.add(vehicle.id);
      const destinationPosition = [vehicle.destination.latitude, vehicle.destination.longitude];
      const destinationLabel = `${vehicle.plate} · Điểm đến: ${vehicle.destination.name}`;
      let destinationMarker = state.destinationMarkers.get(vehicle.id);
      if (!destinationMarker) {
        destinationMarker = L.marker(destinationPosition, {
          icon: destinationIcon(),
          keyboard: true,
          zIndexOffset: 1000,
          title: destinationLabel,
        })
          .bindTooltip(escapeHtml(destinationLabel), {
            direction: "top",
            className: "destination-tooltip",
          })
          .on("click", () => selectVehicle(vehicle.id, { trackRoute: true }))
          .addTo(state.map);
        state.destinationMarkers.set(vehicle.id, destinationMarker);
      } else {
        destinationMarker.setLatLng(destinationPosition);
        destinationMarker.options.title = destinationLabel;
        destinationMarker.setTooltipContent(escapeHtml(destinationLabel));
      }
    }
  });

  for (const [vehicleId, marker] of state.markers) {
    if (!activeIds.has(vehicleId)) {
      marker.remove();
      state.markers.delete(vehicleId);
    }
  }

  for (const [vehicleId, marker] of state.destinationMarkers) {
    if (!activeDestinationIds.has(vehicleId)) {
      marker.remove();
      state.destinationMarkers.delete(vehicleId);
    }
  }

  if (selectedTrip) {
    const origin = selectedTrip.originCoordinates;
    const destination = selectedTrip.destinationCoordinates;
    if (origin) {
      if (!state.tripOriginMarker) {
        state.tripOriginMarker = L.circleMarker([origin.latitude, origin.longitude], {
          radius: 7,
          color: "#fff",
          weight: 2,
          fillColor: "#2baa7a",
          fillOpacity: 1,
        }).addTo(state.map);
      } else {
        state.tripOriginMarker.setLatLng([origin.latitude, origin.longitude]);
      }
      state.tripOriginMarker.bindTooltip(`Điểm đi: ${escapeHtml(selectedTrip.origin)}`);
    }
    if (destination) {
      if (!state.tripDestinationMarker) {
        state.tripDestinationMarker = L.marker([destination.latitude, destination.longitude], {
          icon: destinationIcon(),
          keyboard: true,
          zIndexOffset: 1000,
        }).addTo(state.map);
      } else {
        state.tripDestinationMarker.setLatLng([destination.latitude, destination.longitude]);
      }
      state.tripDestinationMarker.bindTooltip(`Điểm đến: ${escapeHtml(selectedTrip.destination)}`, {
        direction: "top",
        className: "destination-tooltip",
      });
    }
  } else {
    state.tripOriginMarker?.remove();
    state.tripDestinationMarker?.remove();
    state.tripOriginMarker = null;
    state.tripDestinationMarker = null;
  }

  state.routeLayer?.remove();
  const routePoints = selectedTrip
    ? selectedTrip.routeStatus === "ready" ? selectedTrip.route : []
    : trackedVehicle?.routeStatus === "ready" ? trackedVehicle.route : [];
  if (routePoints.length > 1) {
    state.routeLayer = L.polyline(
      routePoints.map((point) => [point.latitude, point.longitude]),
      {
        color: "#3678e5",
        weight: 4,
        opacity: 0.8,
        dashArray: "7 7",
        lineCap: "round",
      },
    ).addTo(state.map);
  } else {
    state.routeLayer = null;
  }

  if (!state.hasFittedInitialRoutes) {
    const routes = state.vehicles
      .filter((vehicle) => vehicle.routeStatus === "ready" && vehicle.route.length > 1)
      .flatMap((vehicle) => vehicle.route.map((point) => [point.latitude, point.longitude]));
    if (routes.length) {
      state.map.fitBounds(L.latLngBounds(routes), { padding: [20, 20], maxZoom: 13 });
      state.hasFittedInitialRoutes = true;
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

function renderStats() {
  const counts = state.vehicles.reduce((result, vehicle) => {
    result[vehicle.status] = (result[vehicle.status] || 0) + 1;
    return result;
  }, {});

  const values = {
    "#stat-total": state.vehicles.length,
    "#stat-moving": counts.in_trip || 0,
    "#stat-idle": counts.idle || 0,
    "#stat-offline": counts.no_signal || 0,
    "#nav-vehicle-count": state.vehicles.length,
    "#filter-all": state.vehicles.length,
    "#filter-moving": counts.in_trip || 0,
    "#filter-idle": counts.idle || 0,
  };
  for (const [selector, value] of Object.entries(values)) {
    const element = document.querySelector(selector);
    if (element) element.textContent = new Intl.NumberFormat("vi-VN").format(value);
  }
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

function renderTrips(trips, vehicle) {
  if (!elements.tripList) return;
  if (!trips.length) {
    elements.tripList.innerHTML = '<tr><td class="empty-table" colspan="8">Phương tiện chưa có chuyến gần đây.</td></tr>';
    if (elements.tripCount) elements.tripCount.textContent = "0 chuyến";
    return;
  }

  elements.tripList.innerHTML = trips.map((trip) => {
    const selected = state.selectedTripRoute?.id === trip.id
      && state.selectedTripRoute?.vehicleId === vehicle.id;
    const distance = trip.routeStatus === "ready" && Number.isFinite(trip.routeDistanceMeters)
      ? `${new Intl.NumberFormat("vi-VN", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(trip.routeDistanceMeters / 1000)} km`
      : "Không khả dụng";
    const time = `${trip.startedAt || "Chưa rõ"}${trip.endedAt ? ` – ${trip.endedAt}` : ""}`;

    return `
      <tr class="trip-row${selected ? " selected" : ""}" tabindex="0"
          data-trip-id="${escapeHtml(trip.id)}" aria-selected="${selected}">
        <td>${escapeHtml(trip.id)}</td>
        <td><span class="table-vehicle"><span class="table-vehicle-icon">${vehicleSvgIcon()}</span>${escapeHtml(vehicle.plate)}</span></td>
        <td>${escapeHtml(vehicle.driver || "Chưa phân công")}</td>
        <td>${escapeHtml(trip.origin || "Chưa rõ")}</td>
        <td>${escapeHtml(trip.destination || "Chưa rõ")}</td>
        <td>${distance}</td>
        <td>${escapeHtml(time)}</td>
        <td><span class="trip-status${trip.status === "Hoàn thành" ? " complete" : ""}">${escapeHtml(trip.status || "Không rõ")}</span></td>
      </tr>
    `;
  }).join("");
  if (elements.tripCount) elements.tripCount.textContent = `${trips.length} chuyến gần đây`;
}

async function loadTrips(vehicle, { silent = false } = {}) {
  if (!elements.tripList) return;
  if (!vehicle) {
    elements.tripList.innerHTML = '<tr><td class="empty-table" colspan="8">Chưa có phương tiện được chọn.</td></tr>';
    if (elements.tripsSubtitle) elements.tripsSubtitle.textContent = "Chọn một phương tiện để xem hoạt động";
    if (elements.tripCount) elements.tripCount.textContent = "Chưa có dữ liệu";
    state.tripRoutes.clear();
    state.selectedTripRoute = null;
    renderMap();
    return;
  }

  const version = ++state.requestVersion;
  if (elements.tripsSubtitle) {
    elements.tripsSubtitle.textContent = `${vehicle.plate} · ${vehicle.name || vehicle.id}`;
  }
  elements.tripList.innerHTML = '<tr><td class="empty-table" colspan="8">Đang tải chuyến…</td></tr>';
  try {
    const response = await fetch(`/api/vehicles/${encodeURIComponent(vehicle.id)}/trips`);
    if (!response.ok) throw new Error(`Máy chủ trả về lỗi ${response.status}.`);
    const result = await response.json();
    if (!Array.isArray(result.data)) throw new Error("Dữ liệu chuyến không hợp lệ.");
    if (version !== state.requestVersion || vehicle.id !== state.selectedId) return;

    state.tripRoutes = new Map(result.data.map((trip) => [trip.id, trip]));
    state.selectedTripRoute = state.selectedTripRoute?.vehicleId === vehicle.id
      ? state.tripRoutes.get(state.selectedTripRoute.id) || null
      : null;
    if (state.selectedTripRoute) state.selectedTripRoute.vehicleId = vehicle.id;
    renderTrips(result.data, vehicle);
    renderMap();
  } catch (error) {
    if (version !== state.requestVersion) return;
    elements.tripList.innerHTML = '<tr><td class="empty-table" colspan="8">Không thể tải chuyến. Vui lòng thử làm mới.</td></tr>';
    if (elements.tripCount) elements.tripCount.textContent = "Lỗi tải dữ liệu";
    if (!silent) showToast(`Không thể tải lịch sử chuyến: ${error.message}`);
  }
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
function focusVehicleLocation(vehicle, { trackRoute = false } = {}) {
  if (!state.map || !vehicle) return;
  if (trackRoute && vehicle.routeStatus === "ready" && vehicle.route.length > 1) {
    const points = vehicle.route.map((point) => [point.latitude, point.longitude]);
    state.map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 14 });
  } else if (vehicle.location) {
    state.map.panTo([vehicle.location.latitude, vehicle.location.longitude], {
      animate: true,
      duration: 0.5,
    });
  }
}

function selectVehicle(vehicleId, { trackRoute = false } = {}) {
  if (!state.vehicles.some((vehicle) => vehicle.id === vehicleId)) return;
  state.selectedId = vehicleId;
  state.trackingVehicleId = trackRoute ? vehicleId : null;
  state.selectedTripRoute = null;
  const vehicle = getSelectedVehicle();

  renderVehicleList();
  renderVehicleDetails(vehicle);
  renderMap();

  if (vehicle) {
    focusVehicleLocation(vehicle, { trackRoute });
    // Gọi API lấy thông tin chi tiết xe (/api/vehicles/:id)
    fetchVehicleDetail(vehicleId);
    // Gọi API lấy riêng vị trí mới nhất (/api/vehicles/:id/location/latest)
    fetchLatestLocation(vehicleId);
    loadTrips(vehicle);
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
    if (!state.vehicles.some((vehicle) => vehicle.id === state.trackingVehicleId)) {
      state.trackingVehicleId = null;
    }

    renderStats();
    renderVehicleList();
    renderVehicleDetails(getSelectedVehicle());
    renderMap();
    updateStatusTimestamps(result.generatedAt);
    await loadTrips(getSelectedVehicle(), { silent });

    if (showSuccess) showToast("Đã đồng bộ dữ liệu vị trí mới nhất.", true);
  } catch (error) {
    if (elements.footerUpdate) elements.footerUpdate.textContent = "Không thể kết nối máy chủ";
    if (!silent) showToast(`Không thể tải dữ liệu: ${error.message}`);
  } finally {
    if (elements.refreshBtn && !silent) elements.refreshBtn.disabled = false;
  }
}

function selectTripRoute(row) {
  const trip = state.tripRoutes.get(row.dataset.tripId);
  const vehicle = getSelectedVehicle();
  if (!trip || !vehicle) return;

  state.trackingVehicleId = null;
  state.selectedTripRoute = { ...trip, vehicleId: vehicle.id };
  renderVehicleList();
  renderMap();

  if (state.map && trip.routeStatus === "ready" && trip.route.length > 1) {
    const points = trip.route.map((point) => [point.latitude, point.longitude]);
    state.map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 14 });
  }
  elements.tripList.querySelectorAll(".trip-row").forEach((tripRow) => {
    const selected = tripRow === row;
    tripRow.classList.toggle("selected", selected);
    tripRow.setAttribute("aria-selected", String(selected));
  });
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

if (elements.tripList) {
  elements.tripList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-trip-id]");
    if (row) selectTripRoute(row);
  });

  elements.tripList.addEventListener("keydown", (event) => {
    const row = event.target.closest("[data-trip-id]");
    if (row && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      selectTripRoute(row);
    }
  });
}

if (elements.viewAllTrips) {
  elements.viewAllTrips.addEventListener("click", () => {
    document.querySelector("#trips")?.scrollIntoView({ behavior: "smooth", block: "start" });
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