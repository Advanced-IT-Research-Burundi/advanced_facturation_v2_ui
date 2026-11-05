import api from "@/services/api";
import { getCachedModuleState } from "@/store/cache";

const defaultState = () => ({
  expenses: [],
  categories: [],
  pagination: {
    expenses: {},
    categories: {}
  },
  lastQuery: {
    page: 1,
    search: "",
    start_date: "",
    end_date: "",
    category_id: "",
    status: "",
  },
  lastUpdatedAt: null,
  loading: false,
  error: null,
  expenseTotals: 0
});

const expensesModule = {
  namespaced: true,
  state: () => getCachedModuleState("expenses", defaultState()),
  mutations: {
    SET_EXPENSES(state, { data, meta }) {
      state.expenses = data;
      state.pagination.expenses = meta;
    },
    SET_CATEGORIES(state, { data, meta }) {
      state.categories = data;
      state.pagination.categories = meta;
    },
    SET_ALL_CATEGORIES(state, data) {
         // For dropdowns, we might need all categories or a specific list
         // If pagination is involved, we might handle it differently.
         // For now, let's assume we use the same list or a separate one if needed.
         // Often for selects we want all. Let's see if the API supports per_page=-1 or similar.
    },
    ADD_EXPENSE(state, item) {
      state.expenses.unshift(item);
    },
    UPDATE_EXPENSE(state, updatedItem) {
      const index = state.expenses.findIndex(i => i.id === updatedItem.id);
      if (index !== -1) state.expenses.splice(index, 1, updatedItem);
    },
    DELETE_EXPENSE(state, id) {
      state.expenses = state.expenses.filter(i => i.id !== id);
    },
    ADD_CATEGORY(state, item) {
      state.categories.unshift(item);
    },
    UPDATE_CATEGORY(state, updatedItem) {
      const index = state.categories.findIndex(i => i.id === updatedItem.id);
      if (index !== -1) state.categories.splice(index, 1, updatedItem);
    },
    DELETE_CATEGORY(state, id) {
      state.categories = state.categories.filter(i => i.id !== id);
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_LAST_QUERY(state, query) {
      state.lastQuery = {
        page: query.page || 1,
        search: query.search || "",
        start_date: query.start_date || "",
        end_date: query.end_date || "",
        category_id: query.category_id || "",
        status: query.status || "",
      };
    },
    SET_EXPENSE_TOTALS(state, total) {
      state.expenseTotals = total;
    },
    SET_UPDATED_AT(state) {
      state.lastUpdatedAt = Date.now();
    },
    SET_ERROR(state, error) {
      state.error = error;
    }
  },
  actions: {
    // --- Expenses ---
    async fetchExpenses({ commit }, { page = 1, search = '', start_date = '', end_date = '', category_id = '', status = '' } = {}) {
      commit("SET_LOADING", true);
      commit("SET_LAST_QUERY", { page, search, start_date, end_date, category_id, status });
      commit("SET_ERROR", null);
      try {
        const params = { page, search, start_date, end_date, category_id, status };
        const response = await api.get('/depenses', { params });
        const { data, ...meta } = response.data.data;
        commit("SET_EXPENSES", { data, meta });
        commit("SET_EXPENSE_TOTALS", response.data.total_approved);
        commit("SET_UPDATED_AT");
        return response.data;
      } catch (error) {
        commit("SET_ERROR", error.response?.data?.message || "Erreur chargement dépenses");
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async createExpense({ commit }, payload) {
      commit("SET_LOADING", true);
      try {
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
            if (payload[key] !== null) formData.append(key, payload[key]);
        });
        
        const response = await api.post('/depenses', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success) {
            commit("ADD_EXPENSE", response.data.data);
            return { success: true };
        }
        return { success: false, message: response.data.message };
      } catch (error) {
         return { success: false, message: error.response?.data?.message || "Erreur création" };
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async updateExpense({ commit }, { id, data }) {
      commit("SET_LOADING", true);
      try {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
             if (data[key] !== null && data[key] !== undefined) {
                 formData.append(key, data[key]);
             }
        });
        formData.append('_method', 'PUT'); // Laravel trick for FormData PUT

        const response = await api.post(`/depenses/${id}`, formData, {
             headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
            commit("UPDATE_EXPENSE", response.data.data);
            return { success: true };
        }
        return { success: false, message: response.data.message };
      } catch (error) {
        return { success: false, message: error.response?.data?.message || "Erreur maj" };
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async approveExpense({ commit }, id) {
       try {
           const response = await api.post(`/depenses/${id}/approve`);
           commit("UPDATE_EXPENSE", response.data.data);
           return { success: true, message: response.data.message };
       } catch (error) {
           return { success: false, message: error.response?.data?.message || "Erreur lors de la validation" };
       }
    },
    async rejectExpense({ commit }, { id, rejection_reason }) {
       try {
           const response = await api.post(`/depenses/${id}/reject`, { rejection_reason });
           commit("UPDATE_EXPENSE", response.data.data);
           return { success: true, message: response.data.message };
       } catch (error) {
           return { success: false, message: error.response?.data?.message || "Erreur lors du refus" };
       }
    },
    async deleteExpense({ commit }, id) {
       try {
           await api.delete(`/depenses/${id}`);
           commit("DELETE_EXPENSE", id);
           return { success: true };
       } catch (error) {
           return { success: false, message: error.response?.data?.message };
       }
    },
    
    // --- Categories ---
    async fetchCategories({ commit }, { page = 1, search = '' } = {}) {
      // If page is -1, maybe we fetch all for dropdown
      commit("SET_LOADING", true);
      try {
        const params = { page, search };
        if (page === -1) delete params.page; // Assuming API handles 'all' or no page param means all
        
        const response = await api.get('/depense-categories', { params });
        const { data, ...meta } = response.data.data;
        commit("SET_CATEGORIES", { data, meta });
        commit("SET_UPDATED_AT");
        return data; 
      } catch (error) {
         console.error(error);
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async createCategory({ commit }, payload) {
        commit("SET_LOADING", true);
        try {
            const response = await api.post('/depense-categories', payload);
            if (response.data.success) {
                commit("ADD_CATEGORY", response.data.data);
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message };
        } finally {
            commit("SET_LOADING", false);
        }
    },
    async updateCategory({ commit }, { id, data }) {
         commit("SET_LOADING", true);
        try {
            const response = await api.put(`/depense-categories/${id}`, data);
            if (response.data.success) {
                commit("UPDATE_CATEGORY", response.data.data);
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message };
        } finally {
            commit("SET_LOADING", false);
        }
    },
    async deleteCategory({ commit }, id) {
        try {
            await api.delete(`/depense-categories/${id}`);
            commit("DELETE_CATEGORY", id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message };
        }
    },

    // --- Exports ---
    async exportExpenses({ state }, { start_date, end_date, format }) {
        try {
            const response = await api.get('/depenses/export', {
                params: { start_date, end_date, format },
                responseType: 'blob'
            });
            
            // Trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const ext = format === 'excel' ? 'xlsx' : 'pdf';
            link.setAttribute('download', `depenses_${start_date}_${end_date}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            return { success: true };
        } catch (error) {
            return { success: false, message: "Erreur lors de l'export" };
        }
    }
  },
  getters: {
    allExpenses: state => state.expenses,
    allCategories: state => state.categories,
    isLoading: state => state.loading,
    paginationExpenses: state => state.pagination.expenses,
    paginationCategories: state => state.pagination.categories,
    totalExpensesVal: state => state.expenseTotals
  }
};

export default expensesModule;
