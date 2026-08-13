import api from "@/services/api";
import { getCachedModuleState } from "@/store/cache";

const defaultState = () => ({
  stats: null,
  salesChart: null,
  topProducts: [],
  topCustomers: [],
  lowStockAlerts: [],
  recentInvoices: [],
  salesPeriod: "month",
  loading: false,
  error: "",
  lastUpdatedAt: null,
});

export default {
  namespaced: true,

  state: () => getCachedModuleState("dashboard", defaultState()),

  getters: {
    stats: (state) => state.stats,
    salesChart: (state) => state.salesChart,
    topProducts: (state) => state.topProducts,
    topCustomers: (state) => state.topCustomers,
    lowStockAlerts: (state) => state.lowStockAlerts,
    recentInvoices: (state) => state.recentInvoices,
    salesPeriod: (state) => state.salesPeriod,
    isLoading: (state) => state.loading,
    error: (state) => state.error,
    hasData: (state) =>
      Boolean(
        state.stats ||
          state.salesChart ||
          state.topProducts.length ||
          state.topCustomers.length ||
          state.lowStockAlerts.length ||
          state.recentInvoices.length
      ),
  },

  mutations: {
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error || "";
    },
    SET_STATS(state, stats) {
      state.stats = stats;
    },
    SET_SALES_CHART(state, chart) {
      state.salesChart = chart;
    },
    SET_TOP_PRODUCTS(state, products) {
      state.topProducts = products;
    },
    SET_TOP_CUSTOMERS(state, customers) {
      state.topCustomers = customers;
    },
    SET_LOW_STOCK_ALERTS(state, alerts) {
      state.lowStockAlerts = alerts;
    },
    SET_RECENT_INVOICES(state, invoices) {
      state.recentInvoices = invoices;
    },
    SET_SALES_PERIOD(state, period) {
      state.salesPeriod = period || "month";
    },
    SET_UPDATED_AT(state) {
      state.lastUpdatedAt = Date.now();
    },
  },

  actions: {
    async fetchDashboardData({ commit, state }) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", "");

      try {
        const results = await Promise.allSettled([
          api.get("/analytics/dashboard-stats"),
          api.get("/analytics/sales-chart", { params: { period: state.salesPeriod } }),
          api.get("/analytics/top-products", { params: { limit: 5 } }),
          api.get("/analytics/top-customers", { params: { limit: 5 } }),
          api.get("/analytics/low-stock", { params: { threshold: 10 } }),
          api.get("/dashboard"),
        ]);

        const [statsRes, salesRes, productsRes, customersRes, stockRes, invoicesRes] = results;

        if (statsRes.status === "fulfilled" && statsRes.value?.data?.success) {
          commit("SET_STATS", statsRes.value.data.data);
        } else {
          console.error("Stats request failed:", statsRes.reason || statsRes.value?.data);
        }

        if (salesRes.status === "fulfilled" && salesRes.value?.data?.success) {
          commit("SET_SALES_CHART", salesRes.value.data.data);
        }

        if (productsRes.status === "fulfilled" && productsRes.value?.data?.success) {
          commit("SET_TOP_PRODUCTS", productsRes.value.data?.data?.products || []);
        }

        if (customersRes.status === "fulfilled" && customersRes.value?.data?.success) {
          commit("SET_TOP_CUSTOMERS", customersRes.value.data?.data?.customers || []);
        }

        if (stockRes.status === "fulfilled" && stockRes.value?.data?.success) {
          commit("SET_LOW_STOCK_ALERTS", (stockRes.value.data?.data?.alerts || []).slice(0, 5));
        }

        if (invoicesRes.status === "fulfilled" && invoicesRes.value?.data?.success) {
          commit("SET_RECENT_INVOICES", invoicesRes.value.data?.data?.recent_invoices || []);
        }

        commit("SET_UPDATED_AT");
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        commit("SET_ERROR", "Erreur lors du chargement des donnees du tableau de bord.");
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchSalesChart({ commit, state }) {
      commit("SET_LOADING", true);
      try {
        const response = await api.get("/analytics/sales-chart", {
          params: { period: state.salesPeriod },
        });
        if (response.data.success) {
          commit("SET_SALES_CHART", response.data.data);
          commit("SET_UPDATED_AT");
        }
      } catch (error) {
        console.error("Error updating sales chart:", error);
      } finally {
        commit("SET_LOADING", false);
      }
    },
  },
};
