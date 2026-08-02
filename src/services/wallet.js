import { api } from "./api";

const qs = (params = {}) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== "All")
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return query ? `?${query}` : "";
};

export const walletService = {
  getMyWallet: () => api.get("/wallets/me"),
  createDepositRequest: ({ amount, paymentMethod }) =>
    api.post("/wallets/deposit-requests", { amount, paymentMethod }),
  deposit: (amount) => api.post("/wallets/deposit-requests", { amount, paymentMethod: "BANK" }),
  getMyDepositRequests: () => api.get("/wallets/deposit-requests/mine"),
  getTransactions: (params) => api.get(`/wallets/transactions${qs(params)}`),
  getAdminDepositRequests: (params) => api.get(`/admin/deposit-requests${qs(params)}`),
  approveDepositRequest: (id) => api.put(`/admin/deposit-requests/${id}/approve`),
  rejectDepositRequest: (id, adminNote) =>
    api.put(`/admin/deposit-requests/${id}/reject`, { adminNote }),

  // ── Rút tiền (Withdrawal) ──────────────────────────────
  createWithdrawalRequest: (payload) => api.post("/wallets/withdrawal-requests", payload),
  getMyWithdrawalRequests: () => api.get("/wallets/withdrawal-requests/mine"),
  getAdminWithdrawalRequests: () => api.get("/admin/withdrawal-requests"),
  approveWithdrawalRequest: (id) => api.put(`/admin/withdrawal-requests/${id}/approve`),
  rejectWithdrawalRequest: (id, adminNote) =>
    api.put(`/admin/withdrawal-requests/${id}/reject`, { adminNote }),
};
