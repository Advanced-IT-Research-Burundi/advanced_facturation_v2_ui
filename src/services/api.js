import axios from "axios";
import { reactive } from "vue";

let isRedirecting = false;
export const networkActivity = reactive({
  activeRequests: 0,
  lastStartedAt: null,
  lastFinishedAt: null,
});

const beginRequest = () => {
  networkActivity.activeRequests += 1;
  networkActivity.lastStartedAt = Date.now();
};

const endRequest = () => {
  networkActivity.activeRequests = Math.max(networkActivity.activeRequests - 1, 0);
  networkActivity.lastFinishedAt = Date.now();
};

const apiClient = axios.create({
baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Intercepteur pour injecter le token de sécurité
apiClient.interceptors.request.use((config) => {
  beginRequest();
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    endRequest();
    return response;
  },
  (error) => {
    endRequest();
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      if (!isRedirecting && !window.location.pathname.includes('/login')) {
        isRedirecting = true;
        setTimeout(() => { isRedirecting = false; }, 5000);
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default {
  apiClient,
  get(url, config = {}) {
    return apiClient.get(url, config);
  },
  post(url, data, config = {}) {
    return apiClient.post(url, data, config);
  },
  put(url, data, config = {}) {
    return apiClient.put(url, data, config);
  },
  patch(url, data, config = {}) {
    return apiClient.patch(url, data, config);
  },
  delete(url, config = {}) {
    return apiClient.delete(url, config);
  },
};
