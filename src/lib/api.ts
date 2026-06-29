import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;
if (!baseURL) throw new Error("VITE_API_BASE_URL is required but not set. Check your .env file.");

export const api = axios.create({
  baseURL,
  timeout: 20000
});

// Origin that serves static uploads (the API host, without the trailing `/api`).
const ASSET_ORIGIN = baseURL.replace(/\/api\/?$/, "");

/**
 * Resolve a stored asset path to a loadable URL.
 * Uploads are saved as relative paths (e.g. "/uploads/x.jpg") so each client prefixes
 * its own API origin. The admin must prefix the API host, not its own (localhost) origin.
 */
export function resolveAssetUrl(url?: string | null): string {
  if (!url) return "";
  if (/^(data:|blob:)/.test(url)) return url;
  // Normalize legacy absolute URLs that incorrectly include /api before /uploads
  if (/^https?:\/\//.test(url)) {
    return url.replace(/\/api\/uploads\//, '/uploads/');
  }
  return `${ASSET_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      // Bounce to login so an expired session doesn't leave the admin on a dead page.
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

