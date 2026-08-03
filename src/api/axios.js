import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // If the caller passed { silent: true }, suppress ALL error UI silently.
    if (error.config?.silent) {
      return Promise.reject(error);
    }

    // Ignore explicitly canceled requests (e.g. AbortController)
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // AUTH EXPIRED / INVALID — keep as blocking Swal so user is forced to re-login
    if (status === 401) {
      // Already logged out (e.g. stray in-flight request resolving after
      // logout cleared storage) — don't fire a second "session expired" flow.
      if (!localStorage.getItem("token")) {
        return Promise.reject(error);
      }

      localStorage.removeItem("token");
      localStorage.removeItem("role");

      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please login again",
      }).then(() => {
        window.location.href = "/login";
      });

      return Promise.reject(error);
    }

    // SILENT ENDPOINTS — background checks that should never alert the user
    const silentUrls = [
      "/can-review",
      "/public/city-states",
      "/public/owners/count",
      "/contact",
      "/dashboard/stats",
      "/dashboard/owner-subscription-status",
      "/wallet/me",
    ];
    if (silentUrls.some((u) => url.includes(u))) {
      return Promise.reject(error);
    }

    // ACCESS DENIED & NOT FOUND — silently reject and let the component handle it if needed
    if (status === 403 || status === 404) {
      return Promise.reject(error);
    }

    // NETWORK ERROR (no response at all)
    if (!error.response) {
      toast.error("Network error. Please check your connection and try again.", {
        duration: 4000,
        id: "network-error",
      });
      return Promise.reject(error);
    }

    // SERVER ERRORS (500+) — generic user-friendly message
    if (status >= 500) {
      toast.error("Something went wrong on our end. Please try again shortly.", {
        duration: 4000,
        id: "server-error",
      });
      return Promise.reject(error);
    }

    // OTHER CLIENT ERRORS (400, 409, etc.) — show backend message if available
    const message = error.response?.data?.message || error.response?.data || null;
    if (message && typeof message === "string" && status !== 401 && status !== 403 && status !== 404) {
      toast.error(message, { duration: 4000 });
    }

    return Promise.reject(error);
  },
);

export default api;