import api from "@/services/api";

// Helper to check if payload has files
const hasFiles = (data) => {
  for (const key in data) {
    if (data[key] instanceof File) {
      return true;
    }
  }
  return false;
};

// Helper to create FormData
const objectToFormData = (data, method = null) => {
  const formData = new FormData();
  for (const key in data) {
    if (data[key] !== null && data[key] !== undefined) {
      if (typeof data[key] === "boolean") {
        formData.append(key, data[key] ? "1" : "0");
      } else {
        formData.append(key, data[key]);
      }
    }
  }
  if (method) {
    formData.append("_method", method);
  }
  return formData;
};

const companiesModule = {
  namespaced: true,
  state: {
    companies: [],
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    },
    loading: false,
    error: null,
  },
  mutations: {
    SET_COMPANIES(state, { data, meta }) {
      state.companies = data;
      state.pagination = meta;
    },
    ADD_COMPANY(state, company) {
      state.companies.unshift(company);
    },
    UPDATE_COMPANY(state, updatedCompany) {
      const index = state.companies.findIndex(
        (c) => c.id === updatedCompany.id,
      );
      if (index !== -1) {
        state.companies.splice(index, 1, updatedCompany);
      }
    },
    DELETE_COMPANY(state, companyId) {
      state.companies = state.companies.filter((c) => c.id !== companyId);
      state.pagination.total--;
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
  },
  actions: {
    async fetchCompanies({ commit }, { page = 1, search = "" } = {}) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const params = { page };
        if (search) params.search = search;

        const response = await api.get(`/companies`, { params });
        const { data, ...meta } = response.data.data;
        commit("SET_COMPANIES", { data, meta });
      } catch (error) {
        commit(
          "SET_ERROR",
          error.response?.data?.message ||
            "Erreur lors du chargement des entreprises",
        );
        console.error("Error fetching companies:", error);
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async createCompany({ commit }, companyData) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        let payload = companyData;
        let config = {};

        if (hasFiles(companyData)) {
          payload = objectToFormData(companyData);
          config.headers = { "Content-Type": "multipart/form-data" };
        }

        const response = await api.post("/companies", payload, config);

        if (response.data.success) {
          commit("ADD_COMPANY", response.data.data);
          return { success: true };
        }
        return { success: false, message: "Unknown error" };
      } catch (error) {
        const message =
          error.response?.data?.message || "Erreur lors de la création";
        commit("SET_ERROR", message);
        return {
          success: false,
          error: message,
          errors: error.response?.data?.errors,
        };
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async updateCompany({ commit, rootState }, { id, data }) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        let payload = data;
        let config = {};
        let url = `/companies/${id}`;
        let method = "put";

        if (hasFiles(data)) {
          payload = objectToFormData(data, "PUT");
          config.headers = { "Content-Type": "multipart/form-data" };
          method = "post";
        }

        const response = await api[method](url, payload, config);

        if (response.data.success) {
          const updatedCompany = response.data.data;
          commit("UPDATE_COMPANY", updatedCompany);

          const currentUser = rootState.auth.user;
          if (currentUser && currentUser.company_id === updatedCompany.id) {
            commit("auth/UPDATE_USER_COMPANY", updatedCompany, { root: true });
          }

          return { success: true };
        }
        return {
          success: false,
          message: response.data.message || "Unknown error",
        };
      } catch (error) {
        const message =
          error.response?.data?.message || "Erreur lors de la mise à jour";
        commit("SET_ERROR", message);
        return {
          success: false,
          error: message,
          errors: error.response?.data?.errors,
        };
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async fetchCompany({ commit }, id) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const response = await api.get(`/companies/${id}`);
        // Assuming the API returns { data: companyContent }
        return { success: true, data: response.data.data };
      } catch (error) {
        commit(
          "SET_ERROR",
          error.response?.data?.message ||
            "Erreur lors du chargement de l'entreprise",
        );
        return { success: false, error: error };
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async deleteCompany({ commit }, id) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        await api.delete(`/companies/${id}`);
        commit("DELETE_COMPANY", id);
        return { success: true };
      } catch (error) {
        commit(
          "SET_ERROR",
          error.response?.data?.message || "Erreur lors de la suppression",
        );
        return { success: false };
      } finally {
        commit("SET_LOADING", false);
      }
    },
  },
  getters: {
    allCompanies: (state) => state.companies,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getPagination: (state) => state.pagination,
  },
};

export default companiesModule;
