const STORE_CACHE_KEY = "advanced_ui_store_cache_v1";

// sessionStorage est limité (~5 Mo) : on ne sauvegarde que les réponses
// récentes et de taille raisonnable du cache générique
const API_CACHE_MAX_PERSISTED = 40;
const API_CACHE_MAX_ENTRY_SIZE = 200 * 1024;

const pickApiCacheEntries = (entries) =>
  Object.fromEntries(
    Object.entries(entries || {})
      .filter(([, entry]) => entry.size <= API_CACHE_MAX_ENTRY_SIZE)
      .sort(([, a], [, b]) => b.at - a.at)
      .slice(0, API_CACHE_MAX_PERSISTED),
  );

const persistedModules = {
  root: (state) => ({
    data: state.data,
    configs: state.configs,
    pagination: state.pagination,
  }),
  products: (state) => ({
    items: state.products.items,
    pagination: state.products.pagination,
    categories: state.products.categories,
    libelles: state.products.libelles,
    productUnits: state.products.productUnits,
    lastQuery: state.products.lastQuery,
    lastUpdatedAt: state.products.lastUpdatedAt,
  }),
  clients: (state) => ({
    clients: state.clients.clients,
    pagination: state.clients.pagination,
    lastQuery: state.clients.lastQuery,
    lastUpdatedAt: state.clients.lastUpdatedAt,
  }),
  stock: (state) => ({
    stockItems: state.stock.stockItems,
    pagination: state.stock.pagination,
    lastQuery: state.stock.lastQuery,
    lastUpdatedAt: state.stock.lastUpdatedAt,
  }),
  users: (state) => ({
    users: state.users.users,
    companies: state.users.companies,
    roles: state.users.roles,
    pagination: state.users.pagination,
    lastQuery: state.users.lastQuery,
    lastUpdatedAt: state.users.lastUpdatedAt,
  }),
  companies: (state) => ({
    companies: state.companies.companies,
    pagination: state.companies.pagination,
    lastQuery: state.companies.lastQuery,
    lastUpdatedAt: state.companies.lastUpdatedAt,
  }),
  expenses: (state) => ({
    expenses: state.expenses.expenses,
    categories: state.expenses.categories,
    pagination: state.expenses.pagination,
    lastQuery: state.expenses.lastQuery,
    lastUpdatedAt: state.expenses.lastUpdatedAt,
  }),
  obrInvoices: (state) => ({
    obrInvoices: state.obrInvoices.obrInvoices,
    pagination: state.obrInvoices.pagination,
    lastQuery: state.obrInvoices.lastQuery,
    lastUpdatedAt: state.obrInvoices.lastUpdatedAt,
  }),
  profit: (state) => ({
    report: state.profit.report,
    reportFilters: state.profit.reportFilters,
    filters: state.profit.filters,
    view: state.profit.view,
    productOptions: state.profit.productOptions,
    lastUpdatedAt: state.profit.lastUpdatedAt,
  }),
  cashTransfers: (state) => ({
    transfers: state.cashTransfers.transfers,
    knownStatuses: state.cashTransfers.knownStatuses,
    userId: state.cashTransfers.userId,
    lastUpdatedAt: state.cashTransfers.lastUpdatedAt,
  }),
  freshness: (state) => ({
    datasets: state.freshness.datasets,
  }),
  apiCache: (state) => ({
    entries: pickApiCacheEntries(state.apiCache.entries),
    ownerId: state.apiCache.ownerId,
  }),
  dashboard: (state) => ({
    stats: state.dashboard.stats,
    salesChart: state.dashboard.salesChart,
    topProducts: state.dashboard.topProducts,
    topCustomers: state.dashboard.topCustomers,
    lowStockAlerts: state.dashboard.lowStockAlerts,
    recentInvoices: state.dashboard.recentInvoices,
    salesPeriod: state.dashboard.salesPeriod,
    lastUpdatedAt: state.dashboard.lastUpdatedAt,
  }),
};

const canUseSessionStorage = () =>
  typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const readCache = () => {
  if (!canUseSessionStorage()) return {};

  try {
    return JSON.parse(window.sessionStorage.getItem(STORE_CACHE_KEY) || "{}");
  } catch (error) {
    console.warn("Store cache illisible:", error);
    return {};
  }
};

// Retire la plus grosse donnée « secondaire » (réponse du cache générique ou
// champ de state.data) ; retourne false s'il n'y a plus rien à retirer
const dropLargestEntry = (cache) => {
  const candidates = [
    ...Object.entries(cache.apiCache?.entries || {}).map(([key, value]) => ({
      size: JSON.stringify(value).length,
      drop: () => delete cache.apiCache.entries[key],
    })),
    ...Object.entries(cache.root?.data || {}).map(([key, value]) => ({
      size: JSON.stringify(value ?? null).length,
      drop: () => delete cache.root.data[key],
    })),
  ].sort((a, b) => b.size - a.size);

  if (!candidates.length) return false;
  candidates[0].drop();
  return true;
};

const writeCache = (cache) => {
  if (!canUseSessionStorage()) return;

  // Copie : les retraits ci-dessous ne doivent pas toucher le state du store
  const snapshot = JSON.parse(JSON.stringify(cache));

  // Quota dépassé : on sacrifie les plus grosses données plutôt que tout le cache
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      window.sessionStorage.setItem(STORE_CACHE_KEY, JSON.stringify(snapshot));
      return;
    } catch (error) {
      if (!dropLargestEntry(snapshot)) {
        console.warn("Store cache non sauvegarde:", error);
        return;
      }
    }
  }
  console.warn("Store cache non sauvegarde : données trop volumineuses");
};

export const getCachedModuleState = (moduleName, defaults) => ({
  ...defaults,
  ...(readCache()[moduleName] || {}),
});

let saveTimer = null;
// Bloque les sauvegardes entre la fin d'une session et le rechargement de la page,
// pour qu'une requête encore en cours ne réécrive pas les données de l'ancien utilisateur
let savingSuspended = false;

// À appeler quand la session se termine (déconnexion, expiration, 401)
export const clearStoreCache = () => {
  savingSuspended = true;
  if (saveTimer) {
    globalThis.clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(STORE_CACHE_KEY);
  } catch (error) {
    console.warn("Store cache non supprime:", error);
  }
};

// À appeler quand une nouvelle session commence (connexion)
export const resumeStoreCache = () => {
  savingSuspended = false;
};

export const createStoreCachePlugin = () => {
  return (store) => {
    store.subscribe((mutation, state) => {
      if (savingSuspended) return;

      const moduleName = mutation.type.includes("/") ? mutation.type.split("/")[0] : "root";
      if (!persistedModules[moduleName]) return;

      if (saveTimer) {
        globalThis.clearTimeout(saveTimer);
      }

      saveTimer = globalThis.setTimeout(() => {
        saveTimer = null;
        if (savingSuspended) return;

        const currentCache = readCache();
        const nextCache = { ...currentCache };

        Object.entries(persistedModules).forEach(([name, pickState]) => {
          // Le state racine (« root ») n'est pas une clé de state, il est toujours présent
          if (name === "root" || state[name]) {
            nextCache[name] = pickState(state);
          }
        });

        writeCache(nextCache);
      }, 120);
    });
  };
};
