import { api } from "./api";

export const profileService = {
  getOwnerProfile: (userId) => api.get(`/profile/owner/${userId}`),
  updateOwnerProfile: (userId, data) => api.put(`/profile/owner/${userId}`, data),

  getJockeyProfile: (userId) => api.get(`/profile/jockey/${userId}`),
  updateJockeyProfile: (userId, data) => api.put(`/profile/jockey/${userId}`, data),

  getRefereeProfile: (userId) => api.get(`/profile/referee/${userId}`),
  updateRefereeProfile: (userId, data) =>
    api.put(`/profile/referee/${userId}`, data),
};
