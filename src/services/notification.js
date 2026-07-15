import { api } from "./api";

// BE lấy user từ JWT → không truyền userId trên URL nữa (/notifications/me)
export const notificationService = {
  getMyNotifications: () => api.get("/notifications/me"),
  getUnreadCount: () => api.get("/notifications/me/unread-count"),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put("/notifications/me/read-all"),

  // POST /api/notifications — tạo thông báo hệ thống (Admin)
  createNotification: (data) => api.post("/notifications", data),
};
