import api from "@/services/api";
import { getCachedModuleState } from "@/store/cache";

const defaultState = () => ({
  clients: [],
  pagination: {
    total: 0,
    current_page: 1,
    last_page: 1,
    per_page: 15,
    from: 0,
    to: 0,
    next_page_url: null,
    prev_page_url: null,
  },
  lastQuery: {
    page: 1,
    search: "",
  },
  lastUpdatedAt: null,
  loading: false,
  error: null,
});

const getters = {
  allClients: (state) => state.clients,
  totalClients: (state) => state.pagination.total,
  isLoading: (state) => state.loading,
  hasClients: (state) => state.clients.length > 0,
  lastQuery: (state) => state.lastQuery,
  getError: (state) => state.error,
};

const actions = {
  async fetchClients({ commit }, { page = 1, search = '' } = {}) {
    commit("SET_LOADING", true);
    commit("SET_LAST_QUERY", { page, search });
    commit("SET_ERROR", null);
    try {
      const response = await api.get("/customers", {
        params: { page, search }
      });
      if (response.data.success) {
        commit("SET_CLIENTS", response.data.data.data || response.data.data);
        commit("SET_PAGINATION", response.data.data);
        commit("SET_UPDATED_AT");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      commit("SET_ERROR", error.response?.data?.message || "Erreur lors du chargement des clients");
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async addClient({ commit, dispatch }, clientData) {
    commit("SET_LOADING", true);
    commit("SET_ERROR", null);
    try {
      const response = await api.post("/customers", clientData);
      if (response.data.success) {
        commit("ADD_CLIENT", response.data.data);
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || "Erreur inconnue" };
    } catch (error) {
      console.error("Error adding client:", error);
      const message = error.response?.data?.message || "Erreur lors de la création du client";
      commit("SET_ERROR", message);
      return { success: false, message, errors: error.response?.data?.errors };
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async updateClient({ commit }, { id, data }) {
    commit("SET_LOADING", true);
    commit("SET_ERROR", null);
    try {
      const response = await api.put(`/customers/${id}`, data);
      if (response.data.success) {
        commit("UPDATE_CLIENT", response.data.data);
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Error updating client:", error);
      const message = error.response?.data?.message || "Erreur lors de la mise à jour";
      commit("SET_ERROR", message);
      return { success: false, message };
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async deleteClient({ commit }, id) {
    commit("SET_LOADING", true);
    commit("SET_ERROR", null);
    try {
      const response = await api.delete(`/customers/${id}`);
      if (response.data.success) {
        commit("DELETE_CLIENT", id);
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Error deleting client:", error);
      const message = error.response?.data?.message || "Erreur lors de la suppression";
      commit("SET_ERROR", message);
      return { success: false, message };
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async getClient({ commit }, id) {
    commit("SET_LOADING", true);
    try {
      const response = await api.get(`/customers/${id}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false };
    } catch (error) {
      console.error("Error fetching client:", error);
      return { success: false, error };
    } finally {
      commit("SET_LOADING", false);
    }
  },
};

const mutations = {
  SET_CLIENTS(state, clients) {
    state.clients = clients;
  },
  ADD_CLIENT(state, client) {
    state.clients.unshift(client);
    state.pagination.total++;
  },
  UPDATE_CLIENT(state, updatedClient) {
    const index = state.clients.findIndex((c) => c.id === updatedClient.id);
    if (index !== -1) {
      state.clients.splice(index, 1, updatedClient);
    }
  },
  DELETE_CLIENT(state, id) {
    state.clients = state.clients.filter((c) => c.id !== id);
    state.pagination.total--;
  },
  SET_PAGINATION(state, data) {
    state.pagination = {
      total: data.total || 0,
      current_page: data.current_page || 1,
      last_page: data.last_page || 1,
      per_page: data.per_page || 15,
      from: data.from || 0,
      to: data.to || 0,
      next_page_url: data.next_page_url || null,
      prev_page_url: data.prev_page_url || null,
    };
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_LAST_QUERY(state, query) {
    state.lastQuery = {
      page: query.page || 1,
      search: query.search || "",
    };
  },
  SET_UPDATED_AT(state) {
    state.lastUpdatedAt = Date.now();
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
};

export default {
  namespaced: true,
  state: () => getCachedModuleState("clients", defaultState()),
  getters,
  actions,
  mutations,
};
