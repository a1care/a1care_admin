import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "https://api.a1carehospital.in/api";

export const api = axios.create({
  baseURL,
  timeout: 20000
});

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

