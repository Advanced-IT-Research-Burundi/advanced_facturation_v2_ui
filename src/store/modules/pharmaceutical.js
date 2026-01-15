import api from "@/services/api";

export default {
  namespaced: true,

  state: {
    // Lots
    lots: [],
    lotsLoading: false,
    lotsPagination: {
      total: 0,
      current_page: 1,
      per_page: 15,
    },

    // Prescriptions
    prescriptions: [],
    prescriptionsLoading: false,
    prescriptionsPagination: {
      total: 0,
      current_page: 1,
      per_page: 15,
    },

    // Patient Histories
    patientHistories: [],
    patientHistoriesLoading: false,

    // Expiration Alerts
    alerts: [],
    alertsLoading: false,
    alertStats: {
      active: 0,
      critical: 0,
      warning: 0,
    },

    // Dashboard Stats
    dashboardStats: null,
    dashboardLoading: false,

    // Expiring Soon
    expiringSoon: [],

    error: null,
  },

  mutations: {
    // Lots
    SET_LOTS(state, lots) {
      state.lots = lots;
    },
    SET_LOTS_LOADING(state, status) {
      state.lotsLoading = status;
    },
    SET_LOTS_PAGINATION(state, pagination) {
      state.lotsPagination = {
        total: pagination.total || 0,
        current_page: pagination.current_page || 1,
        per_page: pagination.per_page || 15,
      };
    },

    // Prescriptions
    SET_PRESCRIPTIONS(state, prescriptions) {
      state.prescriptions = prescriptions;
    },
    SET_PRESCRIPTIONS_LOADING(state, status) {
      state.prescriptionsLoading = status;
    },
    SET_PRESCRIPTIONS_PAGINATION(state, pagination) {
      state.prescriptionsPagination = {
        total: pagination.total || 0,
        current_page: pagination.current_page || 1,
        per_page: pagination.per_page || 15,
      };
    },

    // Patient Histories
    SET_PATIENT_HISTORIES(state, histories) {
      state.patientHistories = histories;
    },
    SET_PATIENT_HISTORIES_LOADING(state, status) {
      state.patientHistoriesLoading = status;
    },

    // Alerts
    SET_ALERTS(state, alerts) {
      state.alerts = alerts;
    },
    SET_ALERTS_LOADING(state, status) {
      state.alertsLoading = status;
    },
    SET_ALERT_STATS(state, stats) {
      state.alertStats = stats;
    },

    // Dashboard
    SET_DASHBOARD_STATS(state, stats) {
      state.dashboardStats = stats;
    },
    SET_DASHBOARD_LOADING(state, status) {
      state.dashboardLoading = status;
    },

    // Expiring Soon
    SET_EXPIRING_SOON(state, lots) {
      state.expiringSoon = lots;
    },

    // Error
    SET_ERROR(state, error) {
      state.error = error;
    },
  },

  actions: {
    // =====================
    // LOTS ACTIONS
    // =====================
    async fetchLots({ commit }, { page = 1, search = "", status = "", warehouseId = "", productId = "" } = {}) {
      commit("SET_LOTS_LOADING", true);
      try {
        const params = new URLSearchParams();
        params.append("page", page);
        if (search) params.append("search", search);
        if (status) params.append("status", status);
        if (warehouseId) params.append("warehouse_id", warehouseId);
        if (productId) params.append("product_id", productId);

        const response = await api.get(`/product-lots?${params.toString()}`);
        if (response.data.success) {
          commit("SET_LOTS", response.data.data.data);
          commit("SET_LOTS_PAGINATION", response.data.data);
        }
      } catch (error) {
        commit("SET_ERROR", error.message);
        console.error("Error fetching lots:", error);
      } finally {
        commit("SET_LOTS_LOADING", false);
      }
    },

    async createLot({ dispatch }, lotData) {
      try {
        const response = await api.post("/product-lots", lotData);
        if (response.data.success) {
          await dispatch("fetchLots");
          return { success: true, data: response.data.data };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    async updateLot({ dispatch }, { id, data }) {
      try {
        const response = await api.put(`/product-lots/${id}`, data);
        if (response.data.success) {
          await dispatch("fetchLots");
          return { success: true, data: response.data.data };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    async deleteLot({ dispatch }, id) {
      try {
        const response = await api.delete(`/product-lots/${id}`);
        if (response.data.success) {
          await dispatch("fetchLots");
          return { success: true };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    async adjustLotQuantity({ dispatch }, { lotId, adjustment, reason }) {
      try {
        const response = await api.post(`/product-lots/${lotId}/adjust`, { adjustment, reason });
        if (response.data.success) {
          await dispatch("fetchLots");
          return { success: true, data: response.data.data };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    async fetchLotsByProduct({ commit }, productId) {
      try {
        const response = await api.get(`/products/${productId}/lots`);
        if (response.data.success) {
          return { success: true, data: response.data.data };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    // =====================
    // PRESCRIPTIONS ACTIONS
    // =====================
    async fetchPrescriptions({ commit }, { page = 1, search = "", status = "", customerId = "" } = {}) {
      commit("SET_PRESCRIPTIONS_LOADING", true);
      try {
        const params = new URLSearchParams();
        params.append("page", page);
        if (search) params.append("search", search);
        if (status) params.append("status", status);
        if (customerId) params.append("customer_id", customerId);

        const response = await api.get(`/prescriptions?${params.toString()}`);
        if (response.data.success) {
          commit("SET_PRESCRIPTIONS", response.data.data.data);
          commit("SET_PRESCRIPTIONS_PAGINATION", response.data.data);
        }
      } catch (error) {
        commit("SET_ERROR", error.message);
        console.error("Error fetching prescriptions:", error);
      } finally {
        commit("SET_PRESCRIPTIONS_LOADING", false);
      }
    },

    async createPrescription({ dispatch }, prescriptionData) {
      try {
        const response = await api.post("/prescriptions", prescriptionData);
        if (response.data.success) {
          await dispatch("fetchPrescriptions");
          return { success: true, data: response.data.data };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    async updatePrescription({ dispatch }, { id, data }) {
      try {
        const response = await api.put(`/prescriptions/${id}`, data);
        if (response.data.success) {
          await dispatch("fetchPrescriptions");
          return { success: true, data: response.data.data };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    async deletePrescription({ dispatch }, id) {
      try {
        const response = await api.delete(`/prescriptions/${id}`);
        if (response.data.success) {
          await dispatch("fetchPrescriptions");
          return { success: true };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    async dispensePrescription({ dispatch }, { prescriptionId, warehouseId, items, invoiceId = null }) {
      try {
        const response = await api.post(`/prescriptions/${prescriptionId}/dispense`, {
          warehouse_id: warehouseId,
          items,
          invoice_id: invoiceId,
        });
        if (response.data.success) {
          await dispatch("fetchPrescriptions");
          return { success: true, data: response.data.data };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    // =====================
    // PATIENT HISTORY ACTIONS
    // =====================
    async fetchPatientHistories({ commit }, { page = 1, customerId = "", productId = "" } = {}) {
      commit("SET_PATIENT_HISTORIES_LOADING", true);
      try {
        const params = new URLSearchParams();
        params.append("page", page);
        if (customerId) params.append("customer_id", customerId);
        if (productId) params.append("product_id", productId);

        const response = await api.get(`/patient-histories?${params.toString()}`);
        if (response.data.success) {
          commit("SET_PATIENT_HISTORIES", response.data.data.data);
        }
      } catch (error) {
        commit("SET_ERROR", error.message);
        console.error("Error fetching patient histories:", error);
      } finally {
        commit("SET_PATIENT_HISTORIES_LOADING", false);
      }
    },

    async fetchCustomerHistory({ commit }, customerId) {
      try {
        const response = await api.get(`/customers/${customerId}/history`);
        if (response.data.success) {
          return { success: true, data: response.data.data };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    // =====================
    // ALERTS ACTIONS
    // =====================
    async fetchAlerts({ commit }, { status = "active", alertLevel = "", warehouseId = "" } = {}) {
      commit("SET_ALERTS_LOADING", true);
      try {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        if (alertLevel) params.append("alert_level", alertLevel);
        if (warehouseId) params.append("warehouse_id", warehouseId);

        const response = await api.get(`/expiration-alerts?${params.toString()}`);
        if (response.data.success) {
          commit("SET_ALERTS", response.data.data.data);
        }
      } catch (error) {
        commit("SET_ERROR", error.message);
        console.error("Error fetching alerts:", error);
      } finally {
        commit("SET_ALERTS_LOADING", false);
      }
    },

    async fetchAlertStats({ commit }) {
      try {
        const response = await api.get("/expiration-alerts/stats");
        if (response.data.success) {
          commit("SET_ALERT_STATS", response.data.data);
          return { success: true, data: response.data.data };
        }
        return { success: false };
      } catch (error) {
        console.error("Error fetching alert stats:", error);
        return { success: false, error: error.message };
      }
    },

    async acknowledgeAlert({ dispatch }, { alertId, actionTaken = null }) {
      try {
        const response = await api.post(`/expiration-alerts/${alertId}/acknowledge`, {
          action_taken: actionTaken,
        });
        if (response.data.success) {
          await dispatch("fetchAlerts");
          await dispatch("fetchAlertStats");
          return { success: true };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    async generateAlerts({ dispatch }) {
      try {
        const response = await api.post("/expiration-alerts/generate");
        if (response.data.success) {
          await dispatch("fetchAlerts");
          await dispatch("fetchAlertStats");
          return { success: true, data: response.data.data };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    // =====================
    // DASHBOARD ACTIONS
    // =====================
    async fetchDashboardStats({ commit }) {
      commit("SET_DASHBOARD_LOADING", true);
      try {
        const response = await api.get("/pharmaceutical/dashboard");
        if (response.data.success) {
          commit("SET_DASHBOARD_STATS", response.data.data);
          return { success: true, data: response.data.data };
        }
        return { success: false };
      } catch (error) {
        commit("SET_ERROR", error.message);
        console.error("Error fetching dashboard stats:", error);
        return { success: false, error: error.message };
      } finally {
        commit("SET_DASHBOARD_LOADING", false);
      }
    },

    async fetchExpiringSoon({ commit }, { days = 90, limit = 50 } = {}) {
      try {
        const response = await api.get(`/pharmaceutical/expiring-soon?days=${days}&limit=${limit}`);
        if (response.data.success) {
          commit("SET_EXPIRING_SOON", response.data.data);
          return { success: true, data: response.data.data };
        }
        return { success: false };
      } catch (error) {
        console.error("Error fetching expiring soon:", error);
        return { success: false, error: error.message };
      }
    },

    async fetchPharmaceuticalProducts({ commit }, { page = 1, search = "" } = {}) {
      try {
        const params = new URLSearchParams();
        params.append("page", page);
        if (search) params.append("search", search);

        const response = await api.get(`/products/pharmaceutical?${params.toString()}`);
        if (response.data.success) {
          return { success: true, data: response.data.data };
        }
        return { success: false };
      } catch (error) {
        console.error("Error fetching pharmaceutical products:", error);
        return { success: false, error: error.message };
      }
    },
  },

  getters: {
    // Lots
    allLots: (state) => state.lots,
    lotsLoading: (state) => state.lotsLoading,
    lotsPagination: (state) => state.lotsPagination,
    activeLots: (state) => state.lots.filter((lot) => lot.status === "active"),
    expiredLots: (state) => state.lots.filter((lot) => lot.status === "expired"),

    // Prescriptions
    allPrescriptions: (state) => state.prescriptions,
    prescriptionsLoading: (state) => state.prescriptionsLoading,
    prescriptionsPagination: (state) => state.prescriptionsPagination,
    pendingPrescriptions: (state) => state.prescriptions.filter((p) => p.status === "pending"),

    // Patient Histories
    allPatientHistories: (state) => state.patientHistories,
    patientHistoriesLoading: (state) => state.patientHistoriesLoading,

    // Alerts
    allAlerts: (state) => state.alerts,
    alertsLoading: (state) => state.alertsLoading,
    alertStats: (state) => state.alertStats,
    criticalAlerts: (state) => state.alerts.filter((a) => a.alert_level === "critical" || a.alert_level === "expired"),
    warningAlerts: (state) => state.alerts.filter((a) => a.alert_level === "warning"),

    // Dashboard
    dashboardStats: (state) => state.dashboardStats,
    dashboardLoading: (state) => state.dashboardLoading,

    // Expiring Soon
    expiringSoonLots: (state) => state.expiringSoon,

    // Error
    error: (state) => state.error,
  },
};
