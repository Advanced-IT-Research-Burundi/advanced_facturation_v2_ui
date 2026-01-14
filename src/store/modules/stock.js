import api from "@/services/api";

export default {
  namespaced: true,

  state: () => ({
    stockItems: [],
    pagination: {
      total: 0,
      current_page: 1,
      next_page_url: null,
      prev_page_url: null,
    },
    loading: false,
  }),

  getters: {
    allStock: (state) => state.stockItems,
    isLoading: (state) => state.loading,
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
  },

  actions: {
    async fetchStock({ commit }, { page = 1, search = "", filter = "TOUT" }) {
      commit("SET_LOADING", true);
      try {
        const response = await api.get(`/warehouse-products`, {
          params: { page, search, filter },
        });
        if (response.data.success) {
          commit("SET_STOCK", response.data.data.data);
          commit("SET_PAGINATION", response.data.data);
        }
      } catch (error) {
        console.error("Erreur stock:", error);
      } finally {
        commit("SET_LOADING", false);
      }
    },
  },
};
