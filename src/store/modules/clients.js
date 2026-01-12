const clientsModule = {
  namespaced: true,
  state: {
    clients: [],
  },
  mutations: {
    setClients(state, clients) {
      state.clients = clients;
    },
  },
  actions: {
    fetchClients({ commit }) {
      // Simulate an API call
      const clients = [
        { id: 1, name: "Client A" },
        { id: 2, name: "Client B" },
      ];
      commit("setClients", clients);
    },
  },
  getters: {
    allClients: (state) => state.clients,
  },
};

export default clientsModule;
