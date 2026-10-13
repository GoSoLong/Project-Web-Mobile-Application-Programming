const STATUS_LABELS = {
  in_trip: "Đang có chuyến",
  idle: "Đang dừng",
  no_signal: "Chưa có dữ liệu vị trí mới",
};

const state = {
  vehicles: [],
  selectedVehicleId: null,
  search: "",
  requestVersion: 0,
};

const vehicleList = document.querySelector("#vehicle-list");
const tripList = document.querySelector("#trip-list");
const details = document.querySelector("#vehicle-details");
const searchInput = document.querySelector("#vehicle-search");
const refreshButton = document.querySelector("#refresh-button");
const connectionStatus = document.querySelector("#connection-status");
const lastUpdated = document.querySelector("#last-updated");
const distanceFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function formatDate(value) {
  if (!value) return "Đang diễn ra";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDistance(distanceMeters) {
  return Number.isFinite(distanceMeters)
    ? `${distanceFormat.format(distanceMeters / 1000)} km`
    : "Đang cập nhật";
}

function getSelectedVehicle() {
  return state.vehicles.find((vehicle) => vehicle.id === state.selectedVehicleId) || null;
}

function renderVehicles() {
  const query = state.search.trim().toLocaleLowerCase("vi");
  const visibleVehicles = state.vehicles.filter((vehicle) => (
    `${vehicle.id} ${vehicle.plate}`.toLocaleLowerCase("vi").includes(query)
  ));
  document.querySelector("#vehicle-count").textContent = `${visibleVehicles.length} / ${state.vehicles.length} xe`;
  vehicleList.innerHTML = visibleVehicles.length
    ? visibleVehicles.map((vehicle) => `
      <button class="vehicle${vehicle.id === state.selectedVehicleId ? " selected" : ""}" type="button" data-vehicle-id="${escapeHtml(vehicle.id)}">
        <span><strong>${escapeHtml(vehicle.plate)}</strong><small>${escapeHtml(vehicle.id)} · ${escapeHtml(vehicle.name)}</small></span>
        <span class="status ${escapeHtml(vehicle.status)}">${escapeHtml(STATUS_LABELS[vehicle.status] || vehicle.status)}</span>
      </button>
    `).join("")
    : '<p class="empty">Không tìm thấy xe.</p>';
}

function renderDetails(vehicle) {
  if (!vehicle) {
    details.textContent = "Chọn một phương tiện để xem thông tin.";
    tripList.innerHTML = '<tr><td class="empty" colspan="5">Chưa có chuyến.</td></tr>';
    return;
  }

  const locationText = vehicle.location
    ? `${vehicle.location.latitude.toFixed(5)}, ${vehicle.location.longitude.toFixed(5)}`
    : "Chưa có dữ liệu vị trí";
  details.innerHTML = `
    <dl>
      <dt>Mã xe / biển số</dt><dd>${escapeHtml(vehicle.id)} · ${escapeHtml(vehicle.plate)}</dd>
      <dt>Trạng thái</dt><dd>${escapeHtml(STATUS_LABELS[vehicle.status] || vehicle.status)}</dd>
      <dt>Tài xế</dt><dd>${escapeHtml(vehicle.driver || "Chưa phân công")}</dd>
      <dt>Vị trí gần nhất</dt><dd>${escapeHtml(locationText)}</dd>
      <dt>Cập nhật vị trí</dt><dd>${escapeHtml(vehicle.location ? formatDate(vehicle.location.updatedAt) : "Chưa có dữ liệu")}</dd>
    </dl>
  `;
  tripList.innerHTML = '<tr><td class="empty" colspan="5">Đang tải chuyến…</td></tr>';
}

async function loadTrips(vehicle) {
  const version = ++state.requestVersion;
  if (!vehicle) {
    renderDetails(null);
    return;
  }

  renderDetails(vehicle);
  try {
    const response = await fetch(`/api/vehicles/${encodeURIComponent(vehicle.id)}/trips`);
    if (!response.ok) throw new Error(`Server trả về lỗi ${response.status}.`);
    const result = await response.json();
    if (version !== state.requestVersion) return;
    const trips = result.data;
    tripList.innerHTML = trips.length
      ? trips.map((trip) => `
        <tr>
          <td>${escapeHtml(trip.id)}</td>
          <td>${escapeHtml(trip.origin)} → ${escapeHtml(trip.destination)}</td>
          <td>${escapeHtml(formatDate(trip.startedAt))}${trip.endedAt ? `<br>${escapeHtml(formatDate(trip.endedAt))}` : ""}</td>
          <td>${escapeHtml(formatDistance(trip.distanceMeters))}</td>
          <td>${escapeHtml(trip.status)}</td>
        </tr>
      `).join("")
      : '<tr><td class="empty" colspan="5">Xe chưa có chuyến gần đây.</td></tr>';
  } catch (error) {
    if (version !== state.requestVersion) return;
    tripList.innerHTML = '<tr><td class="empty error" colspan="5">Không tải được chuyến. Thử làm mới dữ liệu.</td></tr>';
    throw error;
  }
}

async function loadDashboard() {
  refreshButton.disabled = true;
  connectionStatus.textContent = "Đang tải dữ liệu…";
  try {
    const response = await fetch("/api/vehicles");
    if (!response.ok) throw new Error(`Server trả về lỗi ${response.status}.`);
    const result = await response.json();
    if (!Array.isArray(result.data)) throw new Error("Dữ liệu phương tiện không hợp lệ.");

    state.vehicles = result.data;
    if (!state.vehicles.some((vehicle) => vehicle.id === state.selectedVehicleId)) {
      state.selectedVehicleId = state.vehicles[0]?.id || null;
    }
    renderVehicles();
    await loadTrips(getSelectedVehicle());
    connectionStatus.textContent = "Đã kết nối server · dữ liệu mẫu";
    lastUpdated.textContent = `Cập nhật lần cuối: ${formatDate(result.generatedAt)}`;
  } catch (error) {
    connectionStatus.textContent = `Không thể tải dữ liệu: ${error.message}`;
    connectionStatus.classList.add("error");
  } finally {
    refreshButton.disabled = false;
  }
}

vehicleList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-vehicle-id]");
  if (!button) return;
  state.selectedVehicleId = button.dataset.vehicleId;
  renderVehicles();
  loadTrips(getSelectedVehicle()).catch((error) => {
    connectionStatus.textContent = `Không thể tải chuyến: ${error.message}`;
    connectionStatus.classList.add("error");
  });
});

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  renderVehicles();
});

refreshButton.addEventListener("click", () => {
  connectionStatus.classList.remove("error");
  loadDashboard();
});

loadDashboard();
