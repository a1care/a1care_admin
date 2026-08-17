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
  
  // Robustly extract the path if it contains /uploads/ to prevent hardcoded absolute URLs from breaking
  const uploadIndex = url.indexOf("/uploads/");
  if (uploadIndex !== -1) {
    const path = url.substring(uploadIndex); // e.g. "/uploads/..."
    return `${ASSET_ORIGIN}${path}`;
  }

  if (/^https?:\/\//.test(url)) {
    return url;
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
      if (!window.location.pathname.includes("/login")) {
        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
        msg.textContent = 'Session expired. Redirecting to login…';
        document.body.appendChild(msg);
        setTimeout(() => { window.location.href = "/login"; }, 1500);
      }
    }
    return Promise.reject(error);
  }
);

