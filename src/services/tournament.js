import { api } from "./api";

export const tournamentService = {
  // ── Admin: chỉ xem + duyệt (không tạo/sửa/xoá) ────────────
  getAll: () => api.get("/admin/tournaments"),
  getById: (id) => api.get(`/admin/tournaments/${id}`),
  changeStatus: (id, status) =>
    api.put(`/admin/tournaments/${id}/status`, { status }),

  // ── Organizer: tạo / sửa / gửi duyệt ──────────────────────
  getMine: () => api.get("/organizer/tournaments"),
  getMineById: (id) => api.get(`/organizer/tournaments/${id}`),
  create: (data) => api.post("/organizer/tournaments", data),
  update: (id, data) => api.put(`/organizer/tournaments/${id}`, data),
  submitForApproval: (id) => api.put(`/organizer/tournaments/${id}/submit`, {}),

  // ── Rounds (Organizer) ────────────────────────────────────
  createRound: (tournamentId, data) =>
    api.post(`/organizer/tournaments/${tournamentId}/rounds`, data),
  updateRound: (roundId, data) => api.put(`/organizer/rounds/${roundId}`, data),
  deleteRound: (roundId) => api.delete(`/organizer/rounds/${roundId}`),

  // ── Races ────────────────────────────────────────────────
  createRace: (data) => api.post("/organizer/races", data),
  updateRace: (raceId, data) => api.put(`/organizer/races/${raceId}`, data),
  deleteRace: (raceId) => api.delete(`/organizer/races/${raceId}`),

  // ── Referee assignment ───────────────────────────────────
  getAllReferees: () => api.get("/organizer/referees"),
  assignReferee: (raceId, refereeId, role) =>
    api.post(`/organizer/races/${raceId}/referees`, { refereeId, role }),
  removeReferee: (raceId, refereeId) =>
    api.delete(`/organizer/races/${raceId}/referees/${refereeId}`),

  // ── Public ───────────────────────────────────────────────
  getPublicTournamentById: (id) => api.get(`/tournaments/${id}`),
  getPublicRounds: (id) => api.get(`/tournaments/${id}/rounds`),
};
