import { api } from "./api";

export const invitationService = {
  // ── Send invitation (HorseOwner → Jockey) ────────────────
  sendInvitation: (entryId, data) =>
    api.post(`/entries/${entryId}/invitations`, data),

  // ── HorseOwner: view sent invitations ────────────────────
  getSentInvitations: () => api.get("/invitations/sent"),

  // ── Jockey: view received invitations ────────────────────
  getReceivedInvitations: () => api.get("/invitations/received"),

  // ── Jockey: respond accept/reject ────────────────────────
  respondToInvitation: (id, status) =>
    api.patch(`/invitations/${id}/respond`, { status }),

  // ── HorseOwner: thu hồi lời mời đang Pending ──────────────
  cancelInvitation: (id) => api.delete(`/invitations/${id}`),
};
