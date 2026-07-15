const BASE_URL = "http://localhost:8080/api";

const getToken = () =>
  localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

// Token hỏng/hết hạn → dọn phiên + đưa về login
const clearSession = () => {
  ["accessToken", "refreshToken", "user"].forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  // Body có thể không phải JSON (vd 500 trả HTML) → parse an toàn
  let json;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      // Hết phiên / đăng xuất → về trang chủ (có popup đăng nhập), không nhảy /login
      const p = window.location.pathname;
      if (p !== "/" && !p.startsWith("/login")) {
        window.location.href = "/";
      }
    }
    const error = new Error(json?.message || `Lỗi ${response.status}`);
    error.status = response.status;
    error.data = json;
    throw error;
  }

  return json;
};

export const api = {
  get:    (endpoint)       => request(endpoint, { method: "GET" }),
  post:   (endpoint, body) => request(endpoint, { method: "POST",   body: JSON.stringify(body) }),
  put:    (endpoint, body) => request(endpoint, { method: "PUT",    body: JSON.stringify(body) }),
  patch:  (endpoint, body) => request(endpoint, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: (endpoint)       => request(endpoint, { method: "DELETE" }),
};
