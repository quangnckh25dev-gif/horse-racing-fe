const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

const getToken = () =>
  localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

const normalizeUploadUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${FILE_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

export const uploadService = {
  uploadEvidence: async (file) => {
    if (!file) throw new Error("Evidence file is required.");
    const formData = new FormData();
    formData.append("file", file);

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/uploads/evidence`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(json?.message || "Evidence upload failed.");
    }

    const data = json?.data || {};
    return {
      ...data,
      url: normalizeUploadUrl(data.url || data.path),
    };
  },
  normalizeUploadUrl,
};
