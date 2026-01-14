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
    categories: [],
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
    SET_CATEGORIES(state, categories) {
      state.categories = categories;
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
    SET_ERROR(state, error) {
      state.error = error;
    }
  },

  actions: {
    async fetchProducts({ commit }, { page = 1, search = '' } = {}) {
      commit("SET_LOADING", true);
      try {
        const response = await api.get(`/products?page=${page}&search=${search}`);
        if (response.data.success) {
          commit("SET_PRODUCTS", response.data.data.data);
          commit("SET_PAGINATION", response.data.data);
        }
      } catch (error) {
        console.error("Erreur chargement produits:", error);
        commit("SET_ERROR", error);
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchCategories({ commit }) {
      try {
        const response = await api.get('/category-products');
        if (response.data.success) {
           // Assuming the API returns a list of categories in a standard format
           commit("SET_CATEGORIES", response.data.data);
        } else if (Array.isArray(response.data)) {
           commit("SET_CATEGORIES", response.data);
        }
      } catch (error) {
        console.error("Erreur chargement categories:", error);
      }
    },

    async createProduct({ dispatch }, productData) {
      try {
        const response = await api.post('/products', productData);
        if (response.data.success) {
          await dispatch('fetchProducts');
          return { success: true };
        }
        return { success: false, errors: response.data.errors };
      } catch (error) {
        console.error("Erreur creation produit:", error);
        return { success: false, error };
      }
    },

    async updateProduct({ dispatch }, { id, data }) {
      try {
        // Handle file uploads or regular updates
        const response = await api.put(`/products/${id}`, data); 
        // Note: if sending FormData involves files with PUT, sometimes POST with _method=PUT is needed in Laravel/PHP
        // But assuming standard REST PUT for now unless user specified otherwise.
        
        if (response.data.success) {
          await dispatch('fetchProducts');
          return { success: true };
        }
        return { success: false, errors: response.data.errors };
      } catch (error) {
         console.error("Erreur mise a jour produit:", error);
         return { success: false, error };
      }
    },

    async deleteProduct({ dispatch }, id) {
      try {
        const response = await api.delete(`/products/${id}`);
        if (response.data.success) {
          await dispatch('fetchProducts');
          return { success: true };
        }
        return { success: false };
      } catch (error) {
        console.error("Erreur suppression produit:", error);
        return { success: false, error };
      }
    }
  },
};
