import api from "@/services/api";
import { getCachedModuleState } from "@/store/cache";

const defaultState = () => ({
  transfers: [],
  // { [transferId]: status } au dernier chargement, pour détecter les changements
  knownStatuses: null,
  // Utilisateur pour lequel les statuts ont été mémorisés
  userId: null,
  lastUpdatedAt: null,
});

export default {
  namespaced: true,

  state: () => getCachedModuleState("cashTransfers", defaultState()),

  getters: {
    transfers: (state) => state.transfers,
  },

  mutations: {
    SET_TRANSFERS(state, { transfers, userId }) {
      state.transfers = transfers;
      state.knownStatuses = Object.fromEntries(
        transfers.map((transfer) => [transfer.id, transfer.status]),
      );
      state.userId = userId;
      state.lastUpdatedAt = Date.now();
    },
  },

  actions: {
    // Retourne les statuts connus avant ce chargement (null au tout premier),
    // ou false si la requête a échoué
    async fetchTransfers({ commit, state }, { userId } = {}) {
      try {
        const response = await api.get("/cash-transfers");
        if (!response.data.success) return false;

        const previousStatuses =
          state.knownStatuses && String(state.userId) === String(userId)
            ? state.knownStatuses
            : null;

        commit("SET_TRANSFERS", {
          transfers: response.data.data.transfers || [],
          userId,
        });

        return { previousStatuses };
      } catch (error) {
        console.error("Error fetching transfer notifications:", error);
        return false;
      }
    },
  },
};
