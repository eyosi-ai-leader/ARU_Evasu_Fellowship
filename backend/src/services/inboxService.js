const model = require("../models/inboxModel");
const time = require("../utils/churchTime");

const PAGE_SIZE = 15;
const BELL_SIZE = 5;

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toItem = (row) => ({
  id: row.id,
  subject: row.subject,
  message: row.message,
  priority: row.priority,
  category: row.category || "",
  pinned: Boolean(row.pinned),
  actionLabel: row.action_label || "",
  actionUrl: row.action_url || "",
  expiresAt: row.expires_at,
  sender: `${row.first_name || ""} ${row.last_name || ""}`.trim(),
  senderRole: row.sender_role || "",
  createdAt: row.created_at,
  read: Boolean(row.read_at),
});

const getBell = async (user) => {
  const nowStr = time.nowInChurch();

  const [unread, latest] = await Promise.all([
    model.countUnread(user.id, nowStr),
    model.listInbox({ userId: user.id, nowStr, limit: BELL_SIZE }),
  ]);

  return { unread, latest: latest.rows.map(toItem) };
};

const listInbox = async (user, { filter, page }) => {
  const nowStr = time.nowInChurch();
  const pageNumber = Math.max(1, Number(page) || 1);
  const offset = (pageNumber - 1) * PAGE_SIZE;

  const [list, unread] = await Promise.all([
    model.listInbox({
      userId: user.id,
      nowStr,
      unreadOnly: filter === "unread",
      limit: PAGE_SIZE,
      offset,
    }),
    model.countUnread(user.id, nowStr),
  ]);

  return {
    items: list.rows.map(toItem),
    total: list.total,
    hasMore: offset + list.rows.length < list.total,
    unread,
  };
};

const getItem = async (user, id) => {
  const row = await model.getInboxItem(user.id, time.nowInChurch(), id);

  if (!row) throw httpError("Announcement not found.", 404);

  return toItem(row);
};

const markRead = async (user, id) => {
  await model.markRead(user.id, id);
};

const markAllRead = async (user) => {
  await model.markAllRead(user.id);
};

module.exports = {
  getBell,
  listInbox,
  getItem,
  markRead,
  markAllRead,
};