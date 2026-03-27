import axios from "axios";

let isRedirecting = false;

const apiClient = axios.create({
baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Intercepteur pour injecter le token de sécurité
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      if (!isRedirecting && !window.location.pathname.includes('/login')) {
        isRedirecting = true;
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
