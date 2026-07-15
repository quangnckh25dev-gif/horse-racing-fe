import { api } from "./api";

export const organizerService = {
  // ── Races CRUD ────────────────────────────────────────────
  getRaces: () => api.get("/races"),
  getRaceById: (raceId) => api.get(`/races/${raceId}`),
  createRace: (data) => api.post("/organizer/races", data),
  updateRace: (raceId, data) => api.put(`/organizer/races/${raceId}`, data),
  deleteRace: (raceId) => api.delete(`/organizer/races/${raceId}`),

  // ── Race status ───────────────────────────────────────────
  // Trọng tài mới là người đổi trạng thái đua → BE đặt ở /races/{id}/status
  changeRaceStatus: (raceId, status) =>
    api.patch(`/races/${raceId}/status`, { status }),

  // ── Referees ──────────────────────────────────────────────
  getAllReferees: () => api.get("/organizer/referees"),
  assignReferee: (raceId, refereeId, role) =>
    api.post(`/organizer/races/${raceId}/referees`, { refereeId, role }),
  removeReferee: (raceId, refereeId) =>
    api.delete(`/organizer/races/${raceId}/referees/${refereeId}`),
  getRaceReferees: (raceId) => api.get(`/organizer/races/${raceId}/referees`),

  // ── Entries management ────────────────────────────────────
  getRaceEntries: (raceId) => api.get(`/races/${raceId}/entries`),
  approveEntry: (raceId, entryId, data) =>
    api.patch(`/races/${raceId}/entries/${entryId}/approve`, data),

  // ── Results ───────────────────────────────────────────────
  approveResults: (raceId) =>
    api.put(`/organizer/races/${raceId}/results/approve`, {}),
  rejectResults: (raceId, reason) =>
    api.put(`/organizer/races/${raceId}/results/reject`, { reason }),
  // Chạy sp_PublishRaceResult: xếp hạng → chốt cược → trao thưởng
  publishResults: (raceId) =>
    api.post(`/organizer/races/${raceId}/results/publish`, {}),

  // ── Gửi biên bản cho toàn bộ Owner ────────────────────────
  sendMinutesToOwners: (raceId) =>
    api.post(`/races/${raceId}/minutes/send`, {}),

  // ── Tournaments của tôi (Organizer) ───────────────────────
  getTournaments: () => api.get("/organizer/tournaments"),
};
