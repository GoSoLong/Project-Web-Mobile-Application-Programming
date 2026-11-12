export function addHistoryShare(
  state,
  ownerId,
  viewerId,
  journeyIds,
  durationMinutes,
  now,
  grantId,
  notificationId,
) {
  const owner = state.users.find((u) => u.id === ownerId);
  if (
    !owner ||
    !state.users.some((u) => u.id === viewerId) ||
    ownerId === viewerId
  )
    throw new Error("Hãy chọn người nhận khác bạn.");
  if (![15, 60, 1440, 10080].includes(durationMinutes))
    throw new Error("Thời hạn chia sẻ không hợp lệ.");
  let ids;
  if (journeyIds !== null) {
    if (!Array.isArray(journeyIds) || !journeyIds.length)
      throw new Error("Chọn ít nhất một hành trình để chia sẻ.");
    ids = [...new Set(journeyIds)];
    if (
      ids.some(
        (id) =>
          !state.journeys.some(
            (j) =>
              j.id === id && j.ownerId === ownerId && j.status === "completed",
          ),
      )
    )
      throw new Error(
        "Bạn chỉ được chia sẻ hành trình đã hoàn thành của chính mình.",
      );
  }
  const sameScope = (g) =>
    ids
      ? g.journeyIds?.length === ids.length &&
        ids.every((id) => g.journeyIds.includes(id))
      : !g.journeyIds;
  if (
    state.grants.some(
      (g) =>
        g.kind === "history" &&
        g.ownerId === ownerId &&
        g.viewerId === viewerId &&
        g.status !== "revoked" &&
        g.expiresAt > now &&
        sameScope(g),
    )
  )
    throw new Error(
      "Đã có lời mời hoặc quyền chia sẻ cho phạm vi này. Bạn có thể thu hồi ở Vòng kết nối.",
    );
  const grant = {
    id: grantId,
    kind: "history",
    ownerId,
    viewerId,
    live: false,
    history: true,
    ...(ids ? { journeyIds: ids } : {}),
    status: "pending",
    expiresAt: now + durationMinutes * 60000,
  };
  const notification = {
    id: notificationId,
    recipientId: viewerId,
    ownerId,
    type: "sharing",
    title: `${owner.name} chia sẻ lịch sử hành trình`,
    body: `${ids ? `${ids.length} hành trình đã chọn` : "Toàn bộ lịch sử"}. Mở Vòng kết nối để chấp nhận hoặc từ chối.`,
    createdAt: now,
    read: false,
    resolved: false,
  };
  return {
    ...state,
    grants: [...state.grants, grant],
    notifications: [notification, ...state.notifications],
  };
}
