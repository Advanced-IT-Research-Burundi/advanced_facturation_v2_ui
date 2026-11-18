import { useStore } from "vuex";

// Durée de cache courte pour les écrans partagés entre plusieurs postes
// (cuisine, caisse, chambres…) où un autre utilisateur modifie souvent les données
export const LIVE_TTL_MS = 30 * 1000;

// Remplace api.get() par une version mise en cache dans le store (module apiCache).
// La réponse a la même forme qu'axios ({ data: corps JSON }), donc
// `resp.data.success` / `resp.data.data` restent inchangés dans les pages.
// Le cache est vidé automatiquement après chaque POST/PUT/PATCH/DELETE réussi.
export function useCachedApi({ ttl: defaultTtl } = {}) {
  const store = useStore();

  const cachedGet = (url, { params, ttl = defaultTtl, force } = {}) =>
    store.dispatch("apiCache/get", { url, params, ttl, force });

  // Pour les boutons « Actualiser » : vide le cache puis recharge
  const refresh = (load) => {
    store.commit("apiCache/CLEAR_ENTRIES");
    return load();
  };

  return { cachedGet, refresh };
}
