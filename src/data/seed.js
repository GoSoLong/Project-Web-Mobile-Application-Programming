import { dateKey } from "../domain.js";
import { routes, buildJourneyGeometry } from "./journeyGeometry.js";

export function createSeed(now = Date.now()) {
  const today = Date.parse(dateKey(now) + "T07:30:00+07:00");
  const users = [
    {
      id: "truong",
      name: "Minh Trường",
      initials: "MT",
      color: "#117864",
      circle: "family",
      email: "truong@example.test",
      pauseLive: false,
    },
    {
      id: "linh",
      name: "Ngọc Linh",
      initials: "NL",
      color: "#d38a3d",
      circle: "family",
      email: "linh@example.test",
      pauseLive: false,
    },
    {
      id: "nam",
      name: "Hoàng Nam",
      initials: "HN",
      color: "#597fbb",
      circle: "friends",
      email: "nam@example.test",
      pauseLive: false,
    },
    {
      id: "ha",
      name: "Thu Hà",
      initials: "TH",
      color: "#aa6e9e",
      circle: "family",
      email: "ha@example.test",
      pauseLive: false,
    },
  ];
  const journeys = [];
  for (let d = 0; d < 18; d++) {
    users.forEach((u, i) => {
      if ((d * 2 + i) % 4 === 2) return;
      const route = routes[(d + i) % routes.length];
      const start = today - d * 86400000 + i * 3600000;
      const duration = (16 + ((d + i) % 14)) * 60000;
      journeys.push({
        id: `trip-${d}-${i}`,
        ownerId: u.id,
        title: d % 2 ? "Một vòng thành phố" : "Hành trình buổi sáng",
        from: route.from,
        to: route.to,
        startedAt: start,
        endedAt: start + duration,
        status: "completed",
        source: "sample",
        ...buildJourneyGeometry(route.id, start, duration),
      });
    });
  }
  users.slice(1).forEach((u, i) => {
    const route = routes[i];
    const start = now - 20 * 60000;
    journeys.unshift({
      id: `live-${u.id}`,
      ownerId: u.id,
      title: ["Về nhà cùng nhau", "Chiều dạo phố", "Đường về thân quen"][i],
      ...{ from: route.from, to: route.to },
      startedAt: start,
      status: ["moving", "stopped", "stale"][i],
      source: "simulated",
      ...buildJourneyGeometry(route.id, start, 40 * 60000, false),
    });
  });
  const grants = [];
  users.slice(1).forEach((u, i) => {
    grants.push({
      id: `in-${i}`,
      ownerId: u.id,
      viewerId: "truong",
      live: true,
      history: i !== 2,
      status: "accepted",
      expiresAt: now + 24 * 3600000,
    });
    grants.push({
      id: `out-${i}`,
      ownerId: "truong",
      viewerId: u.id,
      live: true,
      history: i === 0,
      status: "accepted",
      expiresAt: now + 24 * 3600000,
    });
  });
  return {
    version: 1,
    users,
    journeys,
    grants,
    circles: [
      {
        id: "family",
        name: "Gia đình",
        description: "Những người luôn chờ bạn về",
      },
      {
        id: "friends",
        name: "Bạn bè",
        description: "Đồng hành qua từng cung đường",
      },
    ],
    notifications: [
      {
        id: "notice-1",
        recipientId: "truong",
        ownerId: "linh",
        type: "journey",
        title: "Linh đang trên đường về",
        body: "Một hành trình mới đã được chia sẻ với bạn.",
        createdAt: now - 8 * 60000,
        read: false,
        resolved: false,
      },
      {
        id: "notice-2",
        recipientId: "truong",
        ownerId: "nam",
        type: "arrival",
        title: "Nam đã đến điểm dừng",
        body: "Cập nhật mẫu từ hành trình Chiều dạo phố.",
        createdAt: now - 15 * 60000,
        read: false,
        resolved: false,
      },
      {
        id: "notice-3",
        recipientId: "truong",
        ownerId: "ha",
        type: "stale",
        title: "Hà chưa có cập nhật mới",
        body: "Vị trí mô phỏng đã ngừng cập nhật hơn 5 phút. Hãy liên hệ để kiểm tra.",
        createdAt: now - 9 * 60000,
        read: false,
        resolved: false,
      },
    ],
    activeUserId: "truong",
    seededAt: now,
  };
}
