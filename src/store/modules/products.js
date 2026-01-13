import api from "@/services/api";

export default {
  namespaced: true,

  state: () => ({
    items: [],
    pagination: {
      total: 0,
      current_page: 1,
      next_page_url: null,
      prev_page_url: null,
    },
    categories: [{ id: "pieces", name: "Pièces" }],
    loading: false,
    error: null,
  }),

  getters: {
    allProducts: (state) => state.items,
    isLoading: (state) => state.loading,
    categories: (state) => state.categories,
  },

  mutations: {
    SET_PRODUCTS(state, products) {
      state.items = products;
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
    async fetchProducts({ commit }, page = 1) {
      commit("SET_LOADING", true);
      try {
        const response = await api.get(`/products?page=${page}`);
        if (response.data.success) {
          commit("SET_PRODUCTS", response.data.data.data);
          commit("SET_PAGINATION", response.data.data);
        }
      } catch (error) {
        console.error("Erreur chargement produits:", error);
      } finally {
        commit("SET_LOADING", false);
      }
    },
  },
};
