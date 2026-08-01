import { api } from "./api";

export const invitationService = {
  sendInvitation: (entryId, data) =>
    api.post(`/entries/${entryId}/invitations`, data),

  getSentInvitations: () => api.get("/invitations/sent"),

  getReceivedInvitations: () => api.get("/invitations/received"),

  respondToInvitation: (id, data) =>
    api.patch(`/invitations/${id}/respond`, typeof data === "string" ? { status: data } : data),

  cancelInvitation: (id) => api.delete(`/invitations/${id}`),
};
