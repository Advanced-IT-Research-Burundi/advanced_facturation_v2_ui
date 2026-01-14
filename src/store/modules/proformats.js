import api from '@/services/api';

const state = {
  proformats: [
    {
      id: 1,
      amount: 1500000,
      tax: 270000,
      total_quantity: 50,
      total_sacs: 10,
      amount_tax: 1770000,
      type_paiement: 'Banque',
      type_facture: 'Proforma',
      products: 'Ciment, Fer à béton',
      client: 'Entreprise Construction ABC',
      addresse_client: 'Bujumbura, Rohero',
      date_facturation: '2024-05-10',
      is_cancelled: false,
      invoice_signature: 'SIG-2024-001'
    },
    {
      id: 2,
      amount: 500000,
      tax: 90000,
      total_quantity: 20,
      total_sacs: 0,
      amount_tax: 590000,
      type_paiement: 'Cash',
      type_facture: 'Proforma',
      products: 'Peinture Blanche',
      client: 'Client Particulier X',
      addresse_client: 'Gitega',
      date_facturation: '2024-05-12',
      is_cancelled: false,
      invoice_signature: 'SIG-2024-002'
    },
    {
      id: 3,
      amount: 0,
      tax: 0,
      total_quantity: 0,
      total_sacs: 0,
      amount_tax: 0,
      type_paiement: 'Mobile Money',
      type_facture: 'Proforma',
      products: '',
      client: 'Annulé',
      addresse_client: '-',
      date_facturation: '2024-05-14',
      is_cancelled: true,
      invoice_signature: null
    }
  ],
  loading: false,
  error: null
};

const getters = {
  allProformats: (state) => state.proformats,
  getProformatById: (state) => (id) => state.proformats.find(p => p.id === id),
  isLoading: (state) => state.loading,
  getError: (state) => state.error
};

const mutations = {
  SET_PROFORMATS(state, proformats) {
    state.proformats = proformats;
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
  // Simulate API call with mock data
  async fetchProformats({ commit }) {
    commit('SET_LOADING', true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // In real app: const response = await api.get('/proformats');
      // commit('SET_PROFORMATS', response.data.data);
      // For now, we just keep the initial state mock data or "reset" it if needed
      // But typically fetch would replace state. 
      // Let's just return what we have in state to simulate "fetching" or do nothing if we want to persist updates in memory
    } catch (error) {
      commit('SET_ERROR', error.message);
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async createProformat({ commit }, proformat) {
    commit('SET_LOADING', true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Simulate ID generation
      const newProformat = { 
        ...proformat, 
        id: Math.floor(Math.random() * 10000),
        date_facturation: new Date().toISOString().split('T')[0],
        products: 'Produits divers', // Placeholder
        is_cancelled: false
      };
      commit('ADD_PROFORMAT', newProformat);
      return { success: true };
    } catch (error) {
      commit('SET_ERROR', error.message);
      return { success: false, error };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateProformat({ commit }, proformat) {
    commit('SET_LOADING', true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      commit('UPDATE_PROFORMAT', proformat);
      return { success: true };
    } catch (error) {
      commit('SET_ERROR', error.message);
      return { success: false, error };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async deleteProformat({ commit }, id) {
    commit('SET_LOADING', true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      commit('DELETE_PROFORMAT', id);
      return { success: true };
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
