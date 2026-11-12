import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Expand, LocateFixed, RefreshCw } from "lucide-react";
import { timeLabel } from "../domain.js";
export default function JourneyMap({
  people = [],
  route = [],
  stops = [],
  replayPoint,
  selectedId,
  onSelect,
  fitKey = "all",
  className = "",
}) {
  const host = useRef(null),
    mapRef = useRef(null),
    markerRef = useRef(new Map()),
    routeRef = useRef(null),
    tileRef = useRef(null),
    selection = useRef(onSelect);
  const [tileError, setTileError] = useState(false),
    [ready, setReady] = useState(false);
  selection.current = onSelect;
  useEffect(() => {
    const map = L.map(host.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([21.029, 105.844], 14);
    mapRef.current = map;
    tileRef.current = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    ).addTo(map);
    tileRef.current.on("tileerror", () => setTileError(true));
    L.control.zoom({ position: "bottomright" }).addTo(map);
    routeRef.current = L.layerGroup().addTo(map);
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(host.current);
    setReady(true);
    return () => {
      observer.disconnect();
      markerRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current,
      markers = markerRef.current;
    const visible = new Set(people.map((p) => p.user.id));
    markers.forEach((marker, id) => {
      if (!visible.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    });
    people.forEach((p) => {
      const id = p.user.id;
      let marker = markers.get(id);
      const text = document.createElement("div");
      text.className = "map-avatar" + (id === selectedId ? " selected" : "");
      text.style.backgroundColor = /^#[0-9a-f]{6}$/i.test(p.user.color)
        ? p.user.color
        : "#117864";
      text.textContent = p.user.initials;
      const icon = L.divIcon({
        html: text,
        className: "person-marker",
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });
      if (!marker) {
        marker = L.marker([p.point.lat, p.point.lng], {
          icon,
          title: p.user.name,
          keyboard: true,
        }).addTo(map);
        marker.on("click", () => selection.current?.(id));
        markers.set(id, marker);
      } else {
        marker.setLatLng([p.point.lat, p.point.lng]);
        marker.setIcon(icon);
      }
      marker
        .getElement()
        ?.setAttribute("aria-label", `Vị trí của ${p.user.name}`);
      const content = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = p.user.name;
      const detail = document.createElement("p");
      detail.textContent = `Vị trí mô phỏng · ${timeLabel(p.updatedAt)}`;
      content.append(title, detail);
      if (marker.getPopup()) marker.setPopupContent(content);
      else marker.bindPopup(content);
      marker.setZIndexOffset(id === selectedId ? 1000 : 0);
    });
  }, [people, selectedId, ready]);
  useEffect(() => {
    if (!ready || !routeRef.current) return;
    const layer = routeRef.current;
    layer.clearLayers();
    if (route.length) {
      const coords = route.map((p) => [p.lat, p.lng]);
      L.polyline(coords, {
        color: "#fff",
        weight: 9,
        opacity: 0.9,
        smoothFactor: 0,
      }).addTo(layer);
      L.polyline(coords, {
        color: "#117864",
        weight: 4,
        opacity: 0.95,
        lineJoin: "round",
        smoothFactor: 0,
      }).addTo(layer);
      const start = L.circleMarker(coords[0], {
        radius: 6,
        color: "#fff",
        weight: 3,
        fillColor: "#117864",
        fillOpacity: 1,
      }).addTo(layer);
      start.bindTooltip("Điểm bắt đầu");
      const end = L.circleMarker(coords.at(-1), {
        radius: 6,
        color: "#fff",
        weight: 3,
        fillColor: "#d18b3d",
        fillOpacity: 1,
      }).addTo(layer);
      end.bindTooltip("Điểm cuối tuyến hiển thị");
      stops.forEach((s) => {
        const p = route[s.pointIndex];
        if (p)
          L.circleMarker([p.lat, p.lng], {
            radius: 7,
            color: "#fff",
            weight: 2,
            fillColor: "#9970b4",
            fillOpacity: 1,
          })
            .addTo(layer)
            .bindTooltip(s.label);
      });
    }
    if (replayPoint)
      L.circleMarker([replayPoint.lat, replayPoint.lng], {
        radius: 10,
        weight: 4,
        color: "#fff",
        fillColor: "#117864",
        fillOpacity: 1,
      })
        .addTo(layer)
        .bindTooltip(`Phát lại · ${timeLabel(replayPoint.timestamp)}`);
  }, [route, stops, replayPoint, ready]);
  const fit = () => {
    const coords = [
      ...route.map((p) => [p.lat, p.lng]),
      ...people.map((p) => [p.point.lat, p.point.lng]),
    ];
    if (coords.length && mapRef.current)
      mapRef.current.fitBounds(L.latLngBounds(coords), {
        paddingTopLeft: [45, 65],
        paddingBottomRight: [45, people.length ? 195 : 55],
        maxZoom: 15,
        animate: false,
      });
  };
  // Deliberately fit only on selection/navigation; live updates must not reset a user's pan/zoom.
  useEffect(() => {
    if (ready) fit();
  }, [fitKey, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`map-wrap ${className}`}>
      <div
        ref={host}
        className="journey-map"
        aria-label="Bản đồ hành trình tương tác"
      />
      <div className="map-badge">
        <span className="pulse" /> Bản đồ Hà Nội <span>· GPS mô phỏng</span>
      </div>
      <div className="map-actions">
        <button
          onClick={fit}
          aria-label={
            route.length ? "Hiển thị toàn bộ tuyến" : "Hiển thị các vị trí"
          }
          title={
            route.length ? "Hiển thị toàn bộ tuyến" : "Hiển thị các vị trí"
          }
        >
          <Expand size={18} />
        </button>
        <button
          aria-label="Về vị trí được chọn"
          title="Về vị trí được chọn"
          onClick={() => {
            const p =
              people.find((p) => p.user.id === selectedId)?.point ||
              replayPoint ||
              route[0];
            if (p) mapRef.current?.setView([p.lat, p.lng], 16);
            else fit();
          }}
        >
          <LocateFixed size={18} />
        </button>
      </div>
      {tileError && (
        <div className="map-error" role="status">
          Không tải được một số ô bản đồ. Kiểm tra kết nối Internet.
          <button
            onClick={() => {
              setTileError(false);
              tileRef.current?.redraw();
            }}
          >
            <RefreshCw size={14} />
            Thử lại
          </button>
        </div>
      )}
      {route.length > 0 && (
        <div className="map-legend">
          <span>
            <i className="green" />
            Tuyến đường
          </span>
          <span>
            <i className="amber" />
            Điểm cuối
          </span>
          <span>
            <i className="purple" />
            Điểm dừng
          </span>
        </div>
      )}
    </div>
  );
}
