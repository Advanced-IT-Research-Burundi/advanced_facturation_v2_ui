import api from "@/services/api";

export default {
  namespaced: true,
  state: {
    // On recharge l'état depuis le stockage local au rafraîchissement de la page
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
    isAuthenticated: !!localStorage.getItem("token"),
    loading: false,
  },
  mutations: {
    SET_AUTH(state, { user, token }) {
      state.user = user;
      state.token = token;
      state.isAuthenticated = !!token;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
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
