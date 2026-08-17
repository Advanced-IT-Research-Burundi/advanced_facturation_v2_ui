import api from "@/services/api";
import { getCachedModuleState } from "@/store/cache";

const getProductErrorMessage = (error, fallback = "Erreur lors de l'enregistrement du produit") => {
  const responseData = error?.response?.data || {};
  const validationErrors = responseData.errors || responseData.error || {};

  if (validationErrors?.item_code?.length) {
    return validationErrors.item_code[0];
  }

  if (typeof responseData.message === "string" && responseData.message.trim()) {
    return responseData.message;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const defaultState = () => ({
  items: [],
  pagination: {
    total: 0,
    current_page: 1,
    next_page_url: null,
    prev_page_url: null,
  },
  categories: [],
  productUnits: [],
  lastQuery: {
    page: 1,
    search: "",
  },
  lastUpdatedAt: null,
  loading: false,
  error: null,
});

export default {
  namespaced: true,

  state: () => getCachedModuleState("products", defaultState()),

  getters: {
    allProducts: (state) => state.items,
    isLoading: (state) => state.loading,
    categories: (state) => state.categories,
    productUnits: (state) => state.productUnits,
    hasProducts: (state) => state.items.length > 0,
    lastQuery: (state) => state.lastQuery,
  },

  mutations: {
    SET_PRODUCTS(state, products) {
      state.items = products;
    },
    SET_CATEGORIES(state, categories) {
      state.categories = categories;
    },
    SET_PRODUCT_UNITS(state, units) {
      state.productUnits = units;
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
      };
    },
    SET_UPDATED_AT(state) {
      state.lastUpdatedAt = Date.now();
    },
    SET_ERROR(state, error) {
      state.error = error;
    }
  },

  actions: {
    async fetchProducts({ commit }, { page = 1, search = '' } = {}) {
      commit("SET_LOADING", true);
      commit("SET_LAST_QUERY", { page, search });
      try {
        const response = await api.get(`/products?page=${page}&search=${search}`);
     
          commit("SET_PRODUCTS", response.data.data.data);
          commit("SET_PAGINATION", response.data.data);
          commit("SET_UPDATED_AT");
        
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
        commit("SET_CATEGORIES", response.data.data);
        commit("SET_UPDATED_AT");
      } catch (error) {
        console.error("Erreur chargement categories:", error);
      }
    },

    async fetchProductLookups({ commit, state }, { force = false } = {}) {
      if (!force && state.categories.length && state.productUnits.length) {
        return;
      }

      try {
        const [catResp, unitResp] = await Promise.all([
          api.get("/category-products"),
          api.get("/product-units"),
        ]);
        commit("SET_CATEGORIES", catResp.data?.data?.data || catResp.data?.data || []);
        commit("SET_PRODUCT_UNITS", unitResp.data?.data?.data || unitResp.data?.data || []);
        commit("SET_UPDATED_AT");
      } catch (error) {
        console.error("Erreur chargement donnees produit:", error);
        commit("SET_ERROR", error);
      }
    },

    async createProduct({ dispatch, state }, productData) {
      try {
        await api.post('/products', productData);
        
        // Rafraîchir la liste des produits après la création
        await dispatch('fetchProducts', { 
          page: state.pagination.current_page, 
          search: '' 
        });
        
        return { success: true };
      } catch (error) {
        console.error("Erreur creation produit:", error);
        return {
          success: false,
          message: getProductErrorMessage(error),
          errors: error?.response?.data?.errors || error?.response?.data?.error || null,
        };
      }
    },

    async updateProduct({ dispatch, state }, { id, data }) {
      try {
        // Handle file uploads or regular updates
        await api.put(`/products/${id}`, data); 
        // Note: if sending FormData involves files with PUT, sometimes POST with _method=PUT is needed in Laravel/PHP
        // But assuming standard REST PUT for now unless user specified otherwise.
        
        // Rafraîchir la liste des produits après la mise à jour
        await dispatch('fetchProducts', { 
          page: state.pagination.current_page, 
          search: '' 
        });
        
        return { success: true };
      } catch (error) {
         console.error("Erreur mise a jour produit:", error);
         return {
           success: false,
           message: getProductErrorMessage(error, "Erreur lors de la mise à jour du produit"),
           errors: error?.response?.data?.errors || error?.response?.data?.error || null,
         };
      }
    },

    async deleteProduct({ dispatch, state }, id) {
      try {
        await api.delete(`/products/${id}`);
        
        // Rafraîchir la liste des produits après la suppression
        await dispatch('fetchProducts', { 
          page: state.pagination.current_page, 
          search: '' 
        });
        
        return { success: true };
      } catch (error) {
        console.error("Erreur suppression produit:", error);
        return {
          success: false,
          message: getProductErrorMessage(error, "Erreur lors de la suppression du produit"),
          errors: error?.response?.data?.errors || error?.response?.data?.error || null,
        };
      }
    }
  },
};
