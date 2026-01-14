import apiClient from "@/services/api";

const state = {
  users: [],
  companies: [],
  pagination: {},
  loading: false,
  error: null,
};

const getters = {
  allUsers: (state) => state.users,
  totalUsers: (state) => state.pagination.total || 0,
  isLoading: (state) => state.loading,
  allCompanies: (state) => state.companies,
};

const actions = {
  async fetchUsers({ commit }, { page = 1, search = '' } = {}) {
  commit('setLoading', true);
  commit('setError', null);

  try {
    const response = await apiClient.get('/users', {
      params: { page, search }
    });

    if (response.data.success) {
      commit('setUsers', response.data.data.data);
      commit('setPagination', {
        total: response.data.data.total,
        current_page: response.data.data.current_page,
        last_page: response.data.data.last_page,
        per_page: response.data.data.per_page,
        prev_page_url: response.data.data.prev_page_url,
        next_page_url: response.data.data.next_page_url,
      });
    }
  } catch (error) {
    commit('setError', error.message);
  } finally {
    commit('setLoading', false);
  }
},


  async fetchCompanies({ commit }) {
    commit('setLoading', true);
    commit('setError', null);

    try {
      const response = await apiClient.get('/companies');

      if (response.data.success && response.data.data) {
        commit('setCompanies', response.data.data.data);
      }
    } catch (error) {
      console.error('Erreur fetchCompanies:', error);
      commit('setError', error.message);
    } finally {
      commit('setLoading', false);
    }
  },

  async addUser({ dispatch, commit }, userData) {
    commit('setLoading', true);
    commit('setError', null);
    
    try {
      const response = await apiClient.post('/users', userData);
      
     
      if (response.data.success) {
        await dispatch('fetchUsers');
        return response.data;
      }
    } catch (error) {
      console.error('Erreur addUser:', error);
      commit('setError', error.message);
      throw error.response?.data || error;
    } finally {
      commit('setLoading', false);
    }
  },

  async updateUser({ dispatch, commit }, userData) {
    commit('setLoading', true);
    commit('setError', null);
    
    try {
      const response = await apiClient.put(`/users/${userData.id}`, userData);
      
      if (response.data.success) {
        await dispatch('fetchUsers');
        return response.data;
      }
    } catch (error) {
      console.error('Erreur updateUser:', error);
      commit('setError', error.message);
      throw error.response?.data || error;
    } finally {
      commit('setLoading', false);
    }
  },

  async deleteUser({ dispatch, commit }, userId) {
    commit('setLoading', true);
    commit('setError', null);
    
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      
      // Correction: success est un boolean
      if (response.data.success) {
        await dispatch('fetchUsers');
        return response.data;
      }
    } catch (error) {
      console.error('Erreur deleteUser:', error);
      commit('setError', error.message);
      throw error.response?.data || error;
    } finally {
      commit('setLoading', false);
    }
  },
};

const mutations = {
  setUsers: (state, users) => (state.users = users),
  setPagination: (state, pagination) => (state.pagination = pagination),
  setLoading: (state, status) => (state.loading = status),
  setError: (state, error) => (state.error = error),
  setCompanies: (state, companies) => (state.companies = companies),
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};