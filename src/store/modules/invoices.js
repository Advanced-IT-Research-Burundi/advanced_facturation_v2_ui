const invoicesModule = {
  namespaced: true,
  state: {
    invoices: [],
  },
  mutations: {
    setInvoices(state, invoices) {
      state.invoices = invoices;
    },
  },
  actions: {
    fetchInvoices({ commit }) {
      // Simulate an API call
      const invoices = [
        { id: 1, amount: 100 },
        { id: 2, amount: 200 },
      ];
      commit("setInvoices", invoices);
    },
  },
  getters: {
    allInvoices: (state) => state.invoices,
  },
};

export default invoicesModule;
