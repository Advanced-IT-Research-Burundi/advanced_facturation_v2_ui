import axios from "axios";

const state = {
  clients: [],
  pagination: {},
  loading: false,
  error: null,
};

const getters = {
  allClients: (state) => state.clients,
  totalClients: (state) => state.pagination.total || 0,
  isLoading: (state) => state.loading,
};

const actions = {
  // Récupère la liste paginée (index du CustomerController)
  async fetchClients({ commit }, page = 1) {
    commit("setLoading", true);
    try {
      const response = await axios.get(`/api/customers?page=${page}`);
      if (response.data.success) {
        commit("setClients", response.data.data.data);
        commit("setPagination", {
          total: response.data.data.total,
          current_page: response.data.data.current_page,
          next_page_url: response.data.data.next_page_url,
          prev_page_url: response.data.data.prev_page_url,
        });
      }
    } catch (error) {
      commit("setError", error.message);
    } finally {
      commit("setLoading", false);
    }
  },

  // Ajoute un client (store du CustomerController)
  async addClient({ dispatch }, clientData) {
    try {
      const response = await axios.post("/api/customers", clientData);
      if (response.data.success) {
        await dispatch("fetchClients"); // Rafraîchir la liste
        return response.data;
      }
    } catch (error) {
      throw error.response.data;
    }
  },

  // Supprime un client (destroy du CustomerController)
  async deleteClient({ dispatch }, id) {
    try {
      await axios.delete(`/api/customers/${id}`);
      await dispatch("fetchClients");
    } catch (error) {
      console.error(error);
    }
  },
};

const mutations = {
  setClients: (state, clients) => (state.clients = clients),
  setPagination: (state, pagination) => (state.pagination = pagination),
  setLoading: (state, status) => (state.loading = status),
  setError: (state, error) => (state.error = error),
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
