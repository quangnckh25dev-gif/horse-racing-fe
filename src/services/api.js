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

const messageMap = [
  [/\u0076\u0075\u0069\s+\u006c\u00f2\u006e\u0067/i, "Please check your input and try again."],
  [/\u006b\u0068\u00f4\u006e\u0067\s+\u0074\u0068\u1ec3\s+\u0074\u1ea3\u0069/i, "Unable to load data."],
  [/\u0063\u00f3\s+\u006c\u1ed7\u0069\s+\u0078\u1ea3\u0079\s+\u0072\u0061/i, "Something went wrong. Please try again."],
  [/\u006d\u1ead\u0074\s+\u006b\u0068\u1ea9\u0075/i, "Password is invalid."],
  [/\u0074\u0068\u1ea5\u0074\s+\u0062\u1ea1\u0069/i, "Action failed. Please try again."],
  [/\u006b\u0068\u00f4\u006e\u0067\s+\u0111\u00fa\u006e\u0067|\u006b\u0068\u00f4\u006e\u0067\s+\u0063\u0068\u00ed\u006e\u0068\s+\u0078\u00e1\u0063/i, "Incorrect username or password."],
  [/\u006b\u0068\u00f4\u006e\u0067\s+\u0074\u00ec\u006d\s+\u0074\u0068\u1ea5\u0079/i, "Not found."],
  [/\u0068\u1ebf\u0074\s+\u0070\u0068\u0069\u00ea\u006e|expired token/i, "Your session has expired. Please log in again."],
];

export const normalizeApiMessage = (message, fallback = "Something went wrong. Please try again.") => {
  const raw = String(message || "").trim();
  if (!raw) return fallback;
  for (const [pattern, replacement] of messageMap) {
    if (pattern.test(raw)) return replacement;
  }
  if (/[\u00c3\u00c4\u00c6]|\u0051\u0075\u00e1\u00ba|\u00e1\u00ba|\u00e1\u00bb/.test(raw)) return fallback;
  return raw;
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
    const error = new Error(normalizeApiMessage(json?.message, `Request failed with status ${response.status}.`));
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
