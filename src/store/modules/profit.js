import api from "@/services/api";
import { getCachedModuleState } from "@/store/cache";

// Au-delà de ce délai, le rapport en cache est rafraîchi en arrière-plan
const REPORT_TTL_MS = 5 * 60 * 1000;

const emptyFilters = () => ({
  start_date: "",
  end_date: "",
  product_id: "",
  invoice_id: "",
});

const defaultState = () => ({
  report: null,
  reportFilters: null, // filtres ayant produit le rapport en cache
  filters: emptyFilters(),
  view: "product", // product | period | sale | expense
  productOptions: [],
  loading: false,
  error: "",
  lastUpdatedAt: null,
});

const toParams = (filters) => {
  const params = {};
  for (const [key, value] of Object.entries(filters || {})) {
    if (value) params[key] = value;
  }
  return params;
};

const sameFilters = (a, b) =>
  JSON.stringify(toParams(a)) === JSON.stringify(toParams(b));

export default {
  namespaced: true,

  state: () => getCachedModuleState("profit", defaultState()),

  getters: {
    report: (state) => state.report,
    filters: (state) => state.filters,
    view: (state) => state.view,
    productOptions: (state) => state.productOptions,
    isLoading: (state) => state.loading,
    error: (state) => state.error,
    lastUpdatedAt: (state) => state.lastUpdatedAt,
  },

  mutations: {
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error || "";
    },
    SET_REPORT(state, { report, filters }) {
      state.report = report;
      state.reportFilters = { ...filters };
      state.lastUpdatedAt = Date.now();
    },
    SET_FILTERS(state, filters) {
      state.filters = { ...emptyFilters(), ...filters };
    },
    RESET_FILTERS(state) {
      state.filters = emptyFilters();
    },
    SET_VIEW(state, view) {
      state.view = view || "product";
    },
    SET_PRODUCT_OPTIONS(state, products) {
      state.productOptions = products;
    },
  },

  actions: {
    async fetchReport({ commit, state }, { force = false } = {}) {
      const filters = { ...state.filters };
      const isCached = state.report && sameFilters(state.reportFilters, filters);
      const isFresh =
        state.lastUpdatedAt && Date.now() - state.lastUpdatedAt < REPORT_TTL_MS;

      if (!force && isCached && isFresh) return;

      commit("SET_LOADING", true);
      commit("SET_ERROR", "");
      try {
        const response = await api.get("/reports/profit", {
          params: toParams(filters),
        });
        if (response.data.success) {
          commit("SET_REPORT", { report: response.data.data, filters });
        }
      } catch (error) {
        console.error("Profit: error fetching report", error);
        commit("SET_ERROR", "Erreur lors du chargement du rapport de bénéfices");
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchProductOptions({ commit, state }, { force = false } = {}) {
      if (!force && state.productOptions.length) return;

      try {
        const response = await api.get("/products", { params: { per_page: 1000 } });
        if (response.data.success) {
          const data = response.data.data;
          // On ne garde que ce qu'il faut pour la liste déroulante
          const products = (data?.data || data || []).map((product) => ({
            id: product.id,
            item_designation: product.item_designation,
          }));
          commit("SET_PRODUCT_OPTIONS", products);
        }
      } catch (error) {
        console.error("Profit: error fetching products", error);
      }
    },
  },
};
