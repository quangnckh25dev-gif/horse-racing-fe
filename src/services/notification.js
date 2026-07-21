import { api } from "./api";

// Backend reads the user from JWT, so /notifications/me does not need a userId.
export const notificationService = {
  getMyNotifications: () => api.get("/notifications/me"),
  getUnreadCount: () => api.get("/notifications/me/unread-count"),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put("/notifications/me/read-all"),

  // POST /api/notifications creates a system notification for admins.
  createNotification: (data) => api.post("/notifications", data),
};
