import api from "@/services/api";
import { getCachedModuleState } from "@/store/cache";

// Cache générique des requêtes GET, indexé par URL + paramètres.
// Les pages l'utilisent via cachedGet() (voir src/composables/useCachedApi.js)
// au lieu de rappeler l'API à chaque visite. Il est vidé après chaque
// écriture réussie (voir onApiWrite dans src/store/index.js).

export const DEFAULT_TTL_MS = 2 * 60 * 1000;
const MAX_ENTRIES = 100;

const defaultState = () => ({
  entries: {}, // { [key]: { body, at, size } }
  ownerId: null, // utilisateur à qui appartiennent les entrées
});

const normalizeUrl = (url) => String(url).replace(/^\/+/, "");

export const cacheKey = (url, params = {}) => {
  const cleanParams = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return cleanParams ? `${normalizeUrl(url)}?${cleanParams}` : normalizeUrl(url);
};

// Requêtes en cours, pour ne pas lancer deux fois le même GET en parallèle
const inflight = new Map();
// Incrémenté à chaque vidage : une réponse lancée avant une écriture
// ne doit pas être remise en cache après celle-ci
let generation = 0;

export default {
  namespaced: true,

  state: () => getCachedModuleState("apiCache", defaultState()),

  mutations: {
    SET_ENTRY(state, { key, json }) {
      state.entries = {
        ...state.entries,
        [key]: { body: JSON.parse(json), at: Date.now(), size: json.length },
      };

      const keys = Object.keys(state.entries);
      if (keys.length > MAX_ENTRIES) {
        const oldest = keys
          .sort((a, b) => state.entries[a].at - state.entries[b].at)
          .slice(0, keys.length - MAX_ENTRIES);
        const entries = { ...state.entries };
        oldest.forEach((oldKey) => delete entries[oldKey]);
        state.entries = entries;
      }
    },
    CLEAR_ENTRIES(state) {
      generation += 1;
      inflight.clear();
      state.entries = {};
    },
    RESET(state, ownerId) {
      generation += 1;
      inflight.clear();
      state.entries = {};
      state.ownerId = ownerId ?? null;
    },
  },

  actions: {
    async get({ commit, state, rootGetters }, { url, params = {}, ttl = DEFAULT_TTL_MS, force = false }) {
      const ownerId = rootGetters["auth/currentUser"]?.id ?? null;
      if (String(state.ownerId) !== String(ownerId)) {
        commit("RESET", ownerId);
      }

      const key = cacheKey(url, params);
      const entry = state.entries[key];
      if (!force && entry && Date.now() - entry.at < ttl) {
        // Copie : la page peut modifier les données sans altérer le cache
        return { data: JSON.parse(JSON.stringify(entry.body)), fromCache: true };
      }

      if (inflight.has(key)) return inflight.get(key);

      const requestGeneration = generation;
      const request = api
        .get(url, { params })
        .then((response) => {
          // Seules les réponses valides et toujours d'actualité sont mises en cache
          if (response.data?.success !== false && requestGeneration === generation) {
            commit("SET_ENTRY", { key, json: JSON.stringify(response.data) });
          }
          return { data: response.data, fromCache: false };
        })
        .finally(() => {
          if (inflight.get(key) === request) inflight.delete(key);
        });

      inflight.set(key, request);
      return request;
    },
  },
};
