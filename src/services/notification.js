import { api } from "./api";

export const notificationService = {
  getUserNotifications: (userId) => api.get(`/users/${userId}/notifications`),
  getUnreadCount: (userId) => api.get(`/users/${userId}/notifications/unread-count`),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => api.put(`/users/${userId}/notifications/read-all`),
};
