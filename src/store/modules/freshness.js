import { getCachedModuleState } from "@/store/cache";
import { DEFAULT_TTL_MS } from "@/store/modules/apiCache";

// Fraîcheur des listes gardées dans les modules du store (clients, stock…).
// Pour chaque jeu de données, on retient la dernière requête chargée et quand :
// une page qui redemande la même requête dans le délai n'appelle pas l'API.
// Vidé après chaque écriture réussie (voir onApiWrite dans src/store/index.js).

const defaultState = () => ({
  datasets: {}, // { [dataset]: { query, at } }
});

export const queryKey = (query = {}) =>
  JSON.stringify(
    Object.keys(query)
      .sort()
      .map((key) => [key, query[key] ?? ""]),
  );

export default {
  namespaced: true,

  state: () => getCachedModuleState("freshness", defaultState()),

  getters: {
    isFresh: (state) => (dataset, query, ttl = DEFAULT_TTL_MS) => {
      const entry = state.datasets[dataset];
      return Boolean(
        entry && entry.query === queryKey(query) && Date.now() - entry.at < ttl,
      );
    },
  },

  mutations: {
    MARK_FETCHED(state, { dataset, query }) {
      state.datasets = {
        ...state.datasets,
        [dataset]: { query: queryKey(query), at: Date.now() },
      };
    },
    CLEAR(state) {
      state.datasets = {};
    },
  },
};
