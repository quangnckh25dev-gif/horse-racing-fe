import { api } from "./api";

export const entryService = {
  registerForRace: (raceId, data) => api.post(`/races/${raceId}/entries`, data),
  getEntriesByRace: (raceId) => api.get(`/races/${raceId}/entries`),
  getEntryDetail: (entryId) => api.get(`/entries/${entryId}`),
  getMyEntries: () => api.get(`/entries/mine`),
  approveEntry: (raceId, entryId, data) =>
    api.patch(`/races/${raceId}/entries/${entryId}/approve`, data),
  withdrawEntry: (raceId, entryId) =>
    api.delete(`/races/${raceId}/entries/${entryId}`),
  cancelEntry: (raceId, entryId) =>
    api.delete(`/races/${raceId}/entries/${entryId}`),

  // GET /api/entries/mine/approved — only approved entries (for jockey invitation dropdown)
  getMyApprovedEntries: () => api.get("/entries/mine/approved"),

  // GET /api/jockeys — list all jockeys for owner invitation dropdown
  getJockeys: () => api.get("/jockeys"),
};
