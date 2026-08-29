import api from "@/services/api";
import { getCachedModuleState } from "@/store/cache";

const defaultState = () => ({
  obrInvoices: [],
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
  allObrInvoices: (state) => state.obrInvoices,
  totalObrInvoices: (state) => state.pagination.total,
  isLoading: (state) => state.loading,
  hasObrInvoices: (state) => state.obrInvoices.length > 0,
  lastQuery: (state) => state.lastQuery,
  getError: (state) => state.error,
};

const actions = {
  async fetchObrInvoices({ commit }, { page = 1, search = '' } = {}) {
    commit("SET_LOADING", true);
    commit("SET_LAST_QUERY", { page, search });
    commit("SET_ERROR", null);
    try {
      const response = await api.get("/obr-invoices", {
        params: { page, search }
      });
      if (response.data.success) {
        commit("SET_OBR_INVOICES", response.data.data.data || response.data.data);
        commit("SET_PAGINATION", response.data.data);
        commit("SET_UPDATED_AT");
      }
    } catch (error) {
      console.error("Error fetching OBR invoices:", error);
      commit("SET_ERROR", error.response?.data?.message || "Erreur lors du chargement des factures OBR");
    } finally {
      commit("SET_LOADING", false);
    }
  },
};

const mutations = {
  SET_OBR_INVOICES(state, obrInvoices) {
    state.obrInvoices = obrInvoices;
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
  state: () => getCachedModuleState("obrInvoices", defaultState()),
  getters,
  actions,
  mutations,
};
