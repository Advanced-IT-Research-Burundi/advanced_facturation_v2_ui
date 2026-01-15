import proformaService from '@/services/proformaService';

const state = {
  proformats: [], // List of proformas items
  pagination: {
    total: 0,
    current_page: 1,
    per_page: 15,
    last_page: 1,
    from: 0,
    to: 0
  },
  loading: false,
  error: null
};

const getters = {
  allProformats: (state) => state.proformats,
  // If backend returns ALL invoices, we might need to filter manually here:
  // but ideally backend handles it. We'll assume the list in state is what we want to show.
  serviceProformas: (state) => state.proformats.filter(p => p.invoice_type === 'FP'), 
  
  isLoading: (state) => state.loading,
  getError: (state) => state.error,
  getPagination: (state) => state.pagination
};

const mutations = {
  SET_PROFORMATS(state, data) {
    state.proformats = data;
  },
  SET_PAGINATION(state, meta) {
    state.pagination = {
      total: meta.total,
      current_page: meta.current_page,
      per_page: meta.per_page,
      last_page: meta.last_page,
      from: meta.from,
      to: meta.to
    };
  },
  ADD_PROFORMAT(state, proformat) {
    state.proformats.unshift(proformat);
  },
  UPDATE_PROFORMAT(state, updatedProformat) {
    const index = state.proformats.findIndex(p => p.id === updatedProformat.id);
    if (index !== -1) {
      state.proformats.splice(index, 1, updatedProformat);
    }
  },
  DELETE_PROFORMAT(state, id) {
    state.proformats = state.proformats.filter(p => p.id !== id);
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  async fetchProformas({ commit }, page = 1) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    try {
      const response = await proformaService.getProformas(page);
      if (response.data.success) {
        const { data, ...meta } = response.data.data;
        commit('SET_PROFORMATS', data);
        commit('SET_PAGINATION', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching proformas:', error);
      commit('SET_ERROR', error.response?.data?.message || error.message);
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async createProforma({ commit }, proformaData) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    try {
      const response = await proformaService.createProforma(proformaData);
      if (response.data.success) {
        const newInvoice = response.data.data.invoice;
        commit('ADD_PROFORMAT', newInvoice);
        return { success: true, data: newInvoice };
      }
      return { success: false, message: 'Unknown error' };
    } catch (error) {
       console.error('Error creating proforma:', error);
       const msg = error.response?.data?.message || 'Erreur lors de la création';
       commit('SET_ERROR', msg);
       return { success: false, message: msg };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateProforma({ commit }, { id, data }) {
    commit('SET_LOADING', true);
    try {
      const response = await proformaService.updateProforma(id, data);
      if (response.data.success) {
        commit('UPDATE_PROFORMAT', response.data.data);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Error updating proforma:', error);
      const msg = error.response?.data?.message || 'Erreur lors de la modification';
      commit('SET_ERROR', msg);
      return { success: false, message: msg, error };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async deleteProforma({ commit }, id) {
    commit('SET_LOADING', true);
    try {
      const response = await proformaService.deleteProforma(id);
      if (response.data.success) {
        commit('DELETE_PROFORMAT', id);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      commit('SET_ERROR', error.message);
      return { success: false, error };
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
