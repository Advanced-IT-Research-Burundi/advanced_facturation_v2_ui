import api from "/src/services/api";

const state = {
  clients: [],
  pagination: {
    total: 0,
    current_page: 1,
    next_page_url: null,
    prev_page_url: null,
  },
  loading: false,
};

const getters = {
  allClients: (state) => state.clients,
  totalClients: (state) => state.pagination.total,
  isLoading: (state) => state.loading,
};

const actions = {
  async fetchClients({ commit }, page = 1) {
    commit("SET_LOADING", true);
    try {
      const response = await api.get(`/customers?page=${page}`);
      if (response.data.success) {
        commit("SET_CLIENTS", response.data.data.data);
        commit("SET_PAGINATION", response.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async addClient({ dispatch }, clientData) {
    try {
      const response = await api.post("/customers", clientData);
      if (response.data.success) {
        await dispatch("fetchClients");
        return response.data;
      }
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  async deleteClient({ dispatch }, id) {
    try {
      const response = await api.delete(`/customers/${id}`);
      if (response.data.success) {
        await dispatch("fetchClients");
      }
    } catch (error) {
      console.error(error);
    }
  },
};

const mutations = {
  SET_CLIENTS(state, clients) {
    state.clients = clients;
  },
  SET_PAGINATION(state, data) {
    state.pagination = {
      total: data.total,
      current_page: data.current_page,
      next_page_url: data.next_page_url,
      prev_page_url: data.prev_page_url,
    };
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
