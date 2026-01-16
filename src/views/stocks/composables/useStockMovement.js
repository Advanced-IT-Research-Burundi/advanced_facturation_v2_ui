// Composable pour la gestion des mouvements de stock
import { ref, reactive, computed } from 'vue';
import api from '@/services/api';

export function useStockMovement(warehouseId) {
  // États de chargement
  const loading = ref(false);
  const loadingProducts = ref(false);
  const loadingPending = ref(false);
  const loadingHistory = ref(false);
  const submitting = ref(false);

  // Messages
  const error = ref(null);
  const successMessage = ref(null);

  // Données
  const warehouse = ref(null);
  const warehouses = ref([]);
  const products = ref([]);
  const selectedWarehouseId = ref(warehouseId || '');
  const warehouseStocks = ref([]);
  const stockProducts = ref([]);
  const sourceStocks = ref([]);
  const pendingTransfers = ref([]);
  const pendingCount = ref(0);
  const movementsHistory = ref([]);
  const selectedProduct = ref(null);

  // Recherche et pagination
  const searchQuery = ref('');
  const pagination = reactive({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0
  });

  // Pages visibles pour la pagination
  const visiblePages = computed(() => {
    const pages = [];
    const total = pagination.last_page;
    const current = pagination.current_page;

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  // Récupérer les infos de l'entrepôt
  const fetchWarehouse = async () => {
    if (!warehouseId) return;
    try {
      const resp = await api.get(`/stocks/${warehouseId}`);
      if (resp.data.success) {
        warehouse.value = resp.data.data;
      }
    } catch (err) {
      console.error('Erreur fetchWarehouse:', err);
    }
  };

  // Charger tous les entrepôts
  const fetchWarehouses = async () => {
    try {
      const resp = await api.get('warehouses');
      if (resp.data.success) warehouses.value = resp.data.data;
    } catch (err) {
      console.error('Erreur fetchWarehouses:', err);
    }
  };

  // Charger tous les produits
  const fetchProducts = async () => {
    try {
      const resp = await api.get('products');
      products.value = resp.data.data;
    } catch (err) {
      console.error('Erreur fetchProducts:', err);
    }
  };

  // Charger les produits du stock avec pagination et recherche
  const fetchStockProducts = async (page = 1) => {
    if (!warehouseId) return;
    loadingProducts.value = true;
    try {
      const params = {
        page,
        per_page: pagination.per_page,
        search: searchQuery.value
      };
      const resp = await api.get(`warehouse-stock/${warehouseId}`, { params });
      if (resp.data.success) {
        if (resp.data.data.data) {
          // Données paginées
          stockProducts.value = resp.data.data.data;
          pagination.current_page = resp.data.data.current_page;
          pagination.last_page = resp.data.data.last_page;
          pagination.total = resp.data.data.total;
          pagination.from = resp.data.data.from || 0;
          pagination.to = resp.data.data.to || 0;
        } else {
          // Données non paginées - filtrer côté client
          const allProducts = resp.data.data;
          const filtered = searchQuery.value
            ? allProducts.filter(p =>
                p.product?.item_designation?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                p.product?.item_code?.toLowerCase().includes(searchQuery.value.toLowerCase())
              )
            : allProducts;

          pagination.total = filtered.length;
          pagination.from = filtered.length > 0 ? 1 : 0;
          pagination.to = filtered.length;
          pagination.current_page = 1;
          pagination.last_page = 1;
          stockProducts.value = filtered;
        }
        warehouseStocks.value = stockProducts.value;
      }
    } catch (err) {
      error.value = 'Erreur lors du chargement des produits';
      console.error('Erreur fetchStockProducts:', err);
    } finally {
      loadingProducts.value = false;
    }
  };

  // Charger le stock d'un entrepôt
  const fetchWarehouseStock = async () => {
    if (!selectedWarehouseId.value) return;
    loading.value = true;
    try {
      const resp = await api.get(`warehouse-stock/${selectedWarehouseId.value}`);
      if (resp.data.success) warehouseStocks.value = resp.data.data;
    } catch (err) {
      error.value = 'Erreur lors du chargement du stock';
    } finally {
      loading.value = false;
    }
  };

  // Charger le stock source pour les transferts
  const loadSourceStock = async (sourceWarehouseId) => {
    if (!sourceWarehouseId) return;
    try {
      const resp = await api.get(`warehouse-stock/${sourceWarehouseId}`);
      if (resp.data.success) sourceStocks.value = resp.data.data;
    } catch (err) {
      console.error('Erreur loadSourceStock:', err);
    }
  };

  // Compter les transferts en attente
  const fetchPendingCount = async () => {
    try {
      const resp = await api.get('warehouse-transfers/pending');
      if (resp.data.success) pendingCount.value = resp.data.data.data.length;
    } catch (err) {
      console.error('Erreur fetchPendingCount:', err);
    }
  };

  // Charger les transferts en attente
  const fetchPendingTransfers = async () => {
    loadingPending.value = true;
    try {
      const resp = await api.get('warehouse-transfers/pending');
      if (resp.data.success) pendingTransfers.value = resp.data.data.data;
    } catch (err) {
      error.value = 'Erreur lors du chargement des transferts';
    } finally {
      loadingPending.value = false;
    }
  };

  // Charger l'historique des mouvements
  const fetchMovementsHistory = async (filters) => {
    loadingHistory.value = true;
    try {
      const resp = await api.get('stock-movements', { params: filters });
      if (resp.data.success) movementsHistory.value = resp.data.data.data;
    } catch (err) {
      error.value = 'Erreur lors du chargement de l\'historique';
    } finally {
      loadingHistory.value = false;
    }
  };

  // Soumettre une entrée de stock
  const submitEntry = async (entryForm) => {
    submitting.value = true;
    try {
      const resp = await api.post('stock-entries', entryForm);
      if (resp.data.success) {
        successMessage.value = 'Entrée de stock enregistrée avec succès';
        return true;
      }
      return false;
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement';
      return false;
    } finally {
      submitting.value = false;
    }
  };

  // Soumettre une sortie de stock
  const submitExit = async (exitForm) => {
    submitting.value = true;
    try {
      const resp = await api.post('stock-exits', exitForm);
      if (resp.data.success) {
        successMessage.value = 'Sortie de stock enregistrée avec succès';
        return true;
      }
      return false;
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement';
      return false;
    } finally {
      submitting.value = false;
    }
  };

  // Soumettre un transfert
  const submitTransfer = async (transferForm) => {
    submitting.value = true;
    try {
      const resp = await api.post('warehouse-transfers', transferForm);
      if (resp.data.success) {
        successMessage.value = 'Transfert créé avec succès. En attente d\'approbation.';
        return true;
      }
      return false;
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la création du transfert';
      return false;
    } finally {
      submitting.value = false;
    }
  };

  // Approuver un transfert
  const approveTransfer = async (transferId) => {
    try {
      const resp = await api.post(`warehouse-transfers/${transferId}/approve`);
      if (resp.data.success) {
        successMessage.value = 'Transfert approuvé avec succès';
        return true;
      }
      return false;
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'approbation';
      return false;
    }
  };

  // Rejeter un transfert
  const rejectTransfer = async (transferId, reason) => {
    submitting.value = true;
    try {
      const resp = await api.post(`warehouse-transfers/${transferId}/reject`, {
        rejection_reason: reason
      });
      if (resp.data.success) {
        successMessage.value = 'Transfert rejeté';
        return true;
      }
      return false;
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du rejet';
      return false;
    } finally {
      submitting.value = false;
    }
  };

  // Debounce pour la recherche
  let debounceTimer = null;
  const debouncedSearch = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      fetchStockProducts(1);
    }, 300);
  };

  const clearSearch = () => {
    searchQuery.value = '';
    fetchStockProducts(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      fetchStockProducts(page);
    }
  };

  // Fonctions utilitaires
  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR');
  };

  const getMovementBadgeClass = (type) => {
    return type.startsWith('E') ? 'bg-success' : 'bg-danger';
  };

  const getObrStatusClass = (status) => {
    const classes = {
      'PENDING': 'bg-warning',
      'SENT': 'bg-info',
      'ACCEPTED': 'bg-success',
      'REJECTED': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  };

  return {
    // États
    loading,
    loadingProducts,
    loadingPending,
    loadingHistory,
    submitting,
    error,
    successMessage,

    // Données
    warehouse,
    warehouses,
    products,
    selectedWarehouseId,
    warehouseStocks,
    stockProducts,
    sourceStocks,
    pendingTransfers,
    pendingCount,
    movementsHistory,
    selectedProduct,

    // Pagination
    searchQuery,
    pagination,
    visiblePages,

    // Méthodes de chargement
    fetchWarehouse,
    fetchWarehouses,
    fetchProducts,
    fetchStockProducts,
    fetchWarehouseStock,
    loadSourceStock,
    fetchPendingCount,
    fetchPendingTransfers,
    fetchMovementsHistory,

    // Méthodes de soumission
    submitEntry,
    submitExit,
    submitTransfer,
    approveTransfer,
    rejectTransfer,

    // Utilitaires
    debouncedSearch,
    clearSearch,
    goToPage,
    formatNumber,
    formatDate,
    getMovementBadgeClass,
    getObrStatusClass
  };
}
