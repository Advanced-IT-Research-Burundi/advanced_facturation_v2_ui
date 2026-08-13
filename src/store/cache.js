const STORE_CACHE_KEY = "advanced_ui_store_cache_v1";

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

const writeCache = (cache) => {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(STORE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Store cache non sauvegarde:", error);
  }
};

export const getCachedModuleState = (moduleName, defaults) => ({
  ...defaults,
  ...(readCache()[moduleName] || {}),
});

export const createStoreCachePlugin = () => {
  let saveTimer = null;

  return (store) => {
    store.subscribe((mutation, state) => {
      const moduleName = mutation.type.includes("/") ? mutation.type.split("/")[0] : "root";
      if (!persistedModules[moduleName]) return;

      if (saveTimer) {
        globalThis.clearTimeout(saveTimer);
      }

      saveTimer = globalThis.setTimeout(() => {
        const currentCache = readCache();
        const nextCache = { ...currentCache };

        Object.entries(persistedModules).forEach(([name, pickState]) => {
          if (state[name]) {
            nextCache[name] = pickState(state);
          }
        });

        writeCache(nextCache);
      }, 120);
    });
  };
};
