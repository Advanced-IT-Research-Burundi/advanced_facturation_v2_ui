import api from "@/services/api";

const invoicesModule = {
  namespaced: true,
  state: {
    invoices: [],
    pagination: {
      total: 0,
      current_page: 1,
      per_page: 15,
      last_page: 1,
    },
    loading: false,
    error: null,
  },
  mutations: {
    SET_INVOICES(state, invoices) {
      state.invoices = invoices;
    },
    SET_PAGINATION(state, data) {
      state.pagination = {
        total: data.total || 0,
        current_page: data.current_page || 1,
        per_page: data.per_page || 15,
        last_page: data.last_page || 1,
      };
    },
    ADD_INVOICE(state, invoice) {
      state.invoices.unshift(invoice);
    },
    UPDATE_INVOICE(state, updatedInvoice) {
      const index = state.invoices.findIndex((i) => i.id === updatedInvoice.id);
      if (index !== -1) {
        state.invoices.splice(index, 1, updatedInvoice);
      }
    },
    DELETE_INVOICE(state, id) {
      state.invoices = state.invoices.filter((i) => i.id !== id);
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
  },
  actions: {
    async fetchInvoices({ commit }, { page = 1, search = "" } = {}) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const response = await api.get("/invoices", {
          params: { page, search },
        });
        if (response.data.success) {
          commit("SET_INVOICES", response.data.data.data || response.data.data);
          commit("SET_PAGINATION", response.data.data);
        }
      } catch (error) {
        console.error("Error fetching invoices:", error);
        commit("SET_ERROR", error.response?.data?.message || "Erreur lors du chargement des factures");
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async createInvoice({ commit }, invoiceData) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const response = await api.post("/invoices", invoiceData);
        if (response.data.success) {
          const newInvoice = response.data.data.invoice || response.data.data;
          commit("ADD_INVOICE", newInvoice);
          return { success: true, data: newInvoice };
        }
        return { success: false, message: response.data.message || "Erreur inconnue" };
      } catch (error) {
        console.error("Error creating invoice:", error);
        const message = error.response?.data?.message || "Erreur lors de la création de la facture";
        commit("SET_ERROR", message);
        return { success: false, message };
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async updateInvoice({ commit }, { id, data }) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const response = await api.put(`/invoices/${id}`, data);
        if (response.data.success) {
          commit("UPDATE_INVOICE", response.data.data);
          return { success: true };
        }
        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("Error updating invoice:", error);
        const message = error.response?.data?.message || "Erreur lors de la mise à jour";
        commit("SET_ERROR", message);
        return { success: false, message };
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async deleteInvoice({ commit }, id) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const response = await api.delete(`/invoices/${id}`);
        if (response.data.success) {
          commit("DELETE_INVOICE", id);
          return { success: true };
        }
        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("Error deleting invoice:", error);
        const message = error.response?.data?.message || "Erreur lors de la suppression";
        commit("SET_ERROR", message);
        return { success: false, message };
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async getInvoice({ commit }, id) {
      commit("SET_LOADING", true);
      try {
        const response = await api.get(`/invoices/${id}`);
        if (response.data.success) {
          return { success: true, data: response.data.data };
        }
        return { success: false };
      } catch (error) {
        console.error("Error fetching invoice:", error);
        return { success: false, error };
      } finally {
        commit("SET_LOADING", false);
      }
    },
  },
  getters: {
    allInvoices: (state) => state.invoices,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getPagination: (state) => state.pagination,
  },
};

export default invoicesModule;
