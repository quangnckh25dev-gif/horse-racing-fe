import { api } from "./api";

export const notificationService = {
  getUserNotifications: (userId) => api.get(`/users/${userId}/notifications`),
  getUnreadCount: (userId) => api.get(`/users/${userId}/notifications/unread-count`),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => api.put(`/users/${userId}/notifications/read-all`),

  // POST /api/notifications — create a system notification (Admin)
  createNotification: (data) => api.post("/notifications", data),
};
