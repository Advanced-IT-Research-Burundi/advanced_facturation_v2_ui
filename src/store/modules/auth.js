import api from "@/services/api";

let sessionTimer = null;

const startSessionTimer = (commit) => {
  if (sessionTimer) clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    commit("CLEAR_AUTH");
    window.location.href = "/login";
  }, 8 * 60 * 60 * 1000);
};

// Migrate old localStorage tokens to sessionStorage (one-time)
if (!sessionStorage.getItem("token") && localStorage.getItem("token")) {
  sessionStorage.setItem("token", localStorage.getItem("token"));
  sessionStorage.setItem("user", localStorage.getItem("user"));
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export default {
  namespaced: true,
  state: {
    user: JSON.parse(sessionStorage.getItem("user")) || null,
    token: sessionStorage.getItem("token") || null,
    isAuthenticated: !!sessionStorage.getItem("token"),
    loading: false,
  },
  mutations: {
    SET_AUTH(state, { user, token }) {
      state.user = user;
      state.token = token;
      state.isAuthenticated = !!token;

      if (token) {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
      } else {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      }
    },
    UPDATE_USER_COMPANY(state, company) {
      if (state.user) {
        state.user = { ...state.user, company };
        sessionStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    UPDATE_USER_DATA(state, userData) {
      if (state.user) {
        state.user = { ...state.user, ...userData };
        sessionStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    CLEAR_AUTH(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
  },
  actions: {
    async login({ commit }, credentials) {
      commit("SET_LOADING", true);
      try {
        const response = await api.post("/login", credentials);

        // Structure de votre AuthController Laravel : response.data.data
        const { user, access_token } = response.data.data;

        commit("SET_AUTH", { user, token: access_token });
        startSessionTimer(commit);
        return { success: true };
      } catch (error) {
        // Récupère le message d'erreur du backend (sendError)
        const message =
          error.response?.data?.message || "Identifiants invalides";
        return { success: false, error: message };
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async registerCompany({ commit }, companyData) {
      commit("SET_LOADING", true);
      try {
        const response = await api.post("/register-company", companyData);
        // Structure: response.data.data includes user and token
        const { user, token } = response.data.data;
        commit("SET_AUTH", { user, token });
        startSessionTimer(commit);
        return { success: true };
      } catch (error) {
        const message =
          error.response?.data?.message || "Erreur lors de l'enregistrement";
        const errors = error.response?.data?.error || null;
        return { success: false, error: message, validationErrors: errors };
      } finally {
        commit("SET_LOADING", false);
      }
    },

    restoreSession({ commit, state }) {
      if (state.token) {
        startSessionTimer(commit);
      }
    },

    async logout({ commit }) {
      try {
        await api.post("/logout");
      } finally {
        commit("SET_AUTH", { user: null, token: null });
      }
    },
  },
  getters: {
    isAuthenticated: (state) => state.isAuthenticated,
    currentUser: (state) => state.user,
  },
};
