import { api } from "./api";

export const tournamentService = {
  // ── Tournaments ──────────────────────────────────────────
  getAll: () => api.get("/admin/tournaments"),
  getById: (id) => api.get(`/admin/tournaments/${id}`),
  create: (data) => api.post("/admin/tournaments", data),
  update: (id, data) => api.put(`/admin/tournaments/${id}`, data),
  delete: (id) => api.delete(`/admin/tournaments/${id}`),
  changeStatus: (id, status) =>
    api.put(`/admin/tournaments/${id}/status`, { status }),

  // ── Rounds ───────────────────────────────────────────────
  createRound: (tournamentId, data) =>
    api.post(`/admin/tournaments/${tournamentId}/rounds`, data),
  updateRound: (roundId, data) => api.put(`/admin/rounds/${roundId}`, data),
  deleteRound: (roundId) => api.delete(`/admin/rounds/${roundId}`),

  // ── Races ────────────────────────────────────────────────
  createRace: (data) => api.post("/admin/races", data),
  updateRace: (raceId, data) => api.put(`/admin/races/${raceId}`, data),
  deleteRace: (raceId) => api.delete(`/admin/races/${raceId}`),

  // ── Referee assignment ───────────────────────────────────
  getAllReferees: () => api.get("/admin/referees"),
  assignReferee: (raceId, refereeId, role) =>
    api.post(`/admin/races/${raceId}/referees`, { refereeId, role }),
  removeReferee: (raceId, refereeId) =>
    api.delete(`/admin/races/${raceId}/referees/${refereeId}`),
};
