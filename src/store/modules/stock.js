import api from "@/services/api";
import { getCachedModuleState } from "@/store/cache";

const defaultState = () => ({
  stockItems: [],
  pagination: {
    total: 0,
    current_page: 1,
    next_page_url: null,
    prev_page_url: null,
  },
  lastQuery: {
    page: 1,
    search: "",
    filter: "TOUT",
  },
  lastUpdatedAt: null,
  loading: false,
});

export default {
  namespaced: true,

  state: () => getCachedModuleState("stock", defaultState()),

  getters: {
    allStock: (state) => state.stockItems,
    isLoading: (state) => state.loading,
    hasStock: (state) => state.stockItems.length > 0,
    lastQuery: (state) => state.lastQuery,
    totalStockValue: (state) => {
      return state.stockItems.reduce(
        (acc, p) => acc + p.quantity * p.unit_price,
        0
      );
    },
  },

  mutations: {
    SET_STOCK(state, items) {
      state.stockItems = items;
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
    SET_LAST_QUERY(state, query) {
      state.lastQuery = {
        page: query.page || 1,
        search: query.search || "",
        filter: query.filter || "TOUT",
      };
    },
    SET_UPDATED_AT(state) {
      state.lastUpdatedAt = Date.now();
    },
  },

  actions: {
    async fetchStock({ commit }, { page = 1, search = "", filter = "TOUT" }) {
      commit("SET_LOADING", true);
      commit("SET_LAST_QUERY", { page, search, filter });
      try {
        const response = await api.get(`/warehouse-products`, {
          params: { page, search, filter },
        });
        if (response.data.success) {
          commit("SET_STOCK", response.data.data.data);
          commit("SET_PAGINATION", response.data.data);
          commit("SET_UPDATED_AT");
        }
      } catch (error) {
        console.error("Erreur stock:", error);
      } finally {
        commit("SET_LOADING", false);
      }
    },
  },
};
