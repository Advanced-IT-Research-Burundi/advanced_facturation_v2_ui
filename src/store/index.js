import { createStore } from "vuex";
import auth from "./modules/auth";
import companies from "./modules/companies";
import invoices from "./modules/invoices";

import clients from "./modules/clients"; 
import users from "./modules/users";





import products from "./modules/products";
import stock from "./modules/stock";
import expenses from "./modules/expenses";
import api from "@/services/api";



const store = createStore({
  state: {
    data: {
      product_units : [],
      warehouses: [],
      stockItems: [],
      categories: [],
      categoriesProducts: [],
      product_units: [],
    } ,
    configs: [],
    pagination: {},
    loading: false,
    error: null,
  },
  mutations: {
    SET_CONFIGS(state, { data, meta }) {
      state.configs = data;
      state.pagination = meta;
    },
    UPDATE_CONFIG(state, updatedConfig) {
      const index = state.configs.findIndex((c) => c.id === updatedConfig.id);
      if (index !== -1) {
        state.configs.splice(index, 1, updatedConfig);
      }
    },
    ADD_CONFIG(state, newConfig) {
      state.configs.unshift(newConfig);
    },
    DELETE_CONFIG(state, configId) {
      state.configs = state.configs.filter((c) => c.id !== configId);
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
  },
  actions: {
    async fetchConfigs({ commit }, page = 1) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const response = await api.get("/app-configs", {
          params: { page },
        });
        const { data, ...meta } = response.data.data;
        commit("SET_CONFIGS", { data, meta });
      } catch (error) {
        console.error("Error fetching configs:", error);
        commit(
          "SET_ERROR",
          error.response?.data?.message ||
            "Erreur lors du chargement des configurations"
        );
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async updateConfig({ commit }, { id, value }) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const response = await api.put(`/app-configs/${id}`, { value });
        if (response.data.success) {
          commit("UPDATE_CONFIG", response.data.data);
          return { success: true };
        }
        return {
          success: false,
          message: response.data.message || "Unknown error",
        };
      } catch (error) {
        console.error("Error updating config:", error);
        const message =
          error.response?.data?.message || "Erreur lors de la mise à jour";
        commit("SET_ERROR", message);
        return { success: false, message };
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async createConfig({ commit }, payload) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const response = await api.post("/app-configs", payload);
        if (response.data.success) {
          commit("ADD_CONFIG", response.data.data);
          return { success: true };
        }
        return {
          success: false,
          message: response.data.message || "Unknown error",
        };
      } catch (error) {
        const message =
          error.response?.data?.message || "Erreur lors de la création";
        commit("SET_ERROR", message);
        return { success: false, message };
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async deleteConfig({ commit }, id) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        await api.delete(`/app-configs/${id}`);
        commit("DELETE_CONFIG", id);
        return { success: true };
      } catch (error) {
        const message =
          error.response?.data?.message || "Erreur lors de la suppression";
        commit("SET_ERROR", message);
        return { success: false, message };
      } finally {
        commit("SET_LOADING", false);
      }
    },
  },
  modules: {
    auth,
    companies,
    invoices,
    clients,

    products,


    users,

    products,
    stock,
    expenses,
    users,
  },
});

export default store;
