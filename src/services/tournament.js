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
  createRace: (data) => api.post("/organizer/races", data),
  updateRace: (raceId, data) => api.put(`/organizer/races/${raceId}`, data),
  deleteRace: (raceId) => api.delete(`/organizer/races/${raceId}`),

  // ── Referee assignment ───────────────────────────────────
  getAllReferees: () => api.get("/organizer/referees"),
  assignReferee: (raceId, refereeId, role) =>
    api.post(`/organizer/races/${raceId}/referees`, { refereeId, role }),
  removeReferee: (raceId, refereeId) =>
    api.delete(`/organizer/races/${raceId}/referees/${refereeId}`),

  // ── Public tournament endpoints (GET /api/tournaments) ───
  getPublicTournaments: () => api.get("/tournaments"),
  getPublicTournamentById: (id) => api.get(`/tournaments/${id}`),
};
