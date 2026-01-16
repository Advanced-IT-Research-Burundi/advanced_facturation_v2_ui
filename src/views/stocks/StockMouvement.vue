<template>
  <!-- Ligne 1: Conteneur principal -->
  <div class="container-fluid p-0">
    <!-- Ligne 2: En-tête avec navigation -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <!-- Ligne 3: Bouton retour et titre -->
      <div class="d-flex align-items-center">
        <button class="btn btn-outline-secondary me-3" @click="$router.back()">
          <i class="bi bi-arrow-left"></i> Retour
        </button>
        <h1 class="h3 mb-0">
          <i class="bi bi-box-seam me-2"></i>
          Mouvements de Stock
          <span v-if="warehouse" class="text-primary">- {{ warehouse.name }}</span>
        </h1>
      </div>
      <!-- Ligne 4: Boutons d'action -->
      <div>
        <button class="btn btn-outline-info me-2" @click="handleShowPendingTransfers">
          <i class="bi bi-hourglass-split"></i>
          Transferts en attente
          <span v-if="pendingCount > 0" class="badge bg-danger ms-1">{{ pendingCount }}</span>
        </button>
        <button class="btn btn-outline-success me-2" @click="modals.openTransferModal()">
          <i class="bi bi-arrow-left-right"></i> Créer Transfert
        </button>
        <button class="btn btn-outline-primary" @click="handleShowHistory">
          <i class="bi bi-clock-history"></i> Historique
        </button>
      </div>
    </div>

    <!-- Ligne 5: Alertes -->
    <div v-if="error" class="alert alert-danger alert-dismissible fade show">
      {{ error }}
      <button type="button" class="btn-close" @click="error = null"></button>
    </div>
    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
      <i class="bi bi-check-circle me-2"></i>{{ successMessage }}
      <button class="btn-close" @click="successMessage = null"></button>
    </div>
    <div v-if="error" class="alert alert-danger alert-dismissible fade show">
      <i class="bi bi-exclamation-circle me-2"></i>{{ error }}
      <button class="btn-close" @click="error = null"></button>
    </div>

    <!-- Ligne 6: Tableau des produits -->
    <StockProductsTable
      :stock-products="stockProducts"
      :loading="loadingProducts"
      :search-query="searchQuery"
      :pagination="pagination"
      :visible-pages="visiblePages"
      :selected-product="selectedProduct"
      @search="handleSearch"
      @clear-search="clearSearch"
      @quick-entry="handleQuickEntry"
      @quick-exit="handleQuickExit"
      @go-to-page="goToPage"
    />

    <!-- Ligne 7: Modal d'entrée -->
    <EntryModal
      :show="modals.showEntryModal.value"
      :form="modals.entryForm"
      :stock-products="stockProducts"
      :submitting="submitting"
      @close="modals.closeEntryModal()"
      @submit="handleSubmitEntry"
      @add-item="modals.addEntryItem()"
      @remove-item="modals.removeEntryItem"
    />

    <!-- Ligne 8: Modal de sortie -->
    <ExitModal
      :show="modals.showExitModal.value"
      :form="modals.exitForm"
      :warehouse-stocks="warehouseStocks"
      :submitting="submitting"
      @close="modals.closeExitModal()"
      @submit="handleSubmitExit"
      @add-item="modals.addExitItem()"
      @remove-item="modals.removeExitItem"
      @update-stock="(item) => modals.updateExitStock(item, warehouseStocks)"
    />

    <!-- Ligne 9: Modal de transfert -->
    <TransferModal
      :show="modals.showTransferModal.value"
      :form="modals.transferForm"
      :warehouses="warehouses"
      :source-stocks="sourceStocks"
      :submitting="submitting"
      @close="modals.closeTransferModal()"
      @submit="handleSubmitTransfer"
      @add-item="modals.addTransferItem()"
      @remove-item="modals.removeTransferItem"
      @update-stock="(item) => modals.updateTransferStock(item, sourceStocks)"
      @load-source-stock="handleLoadSourceStock"
    />

    <!-- Ligne 10: Modal d'historique -->
    <HistoryModal
      :show="modals.showHistoryModal.value"
      :movements="movementsHistory"
      :filters="modals.historyFilters"
      :loading="loadingHistory"
      :warehouse-name="currentWarehouseName"
      @close="modals.closeHistoryModal()"
      @filter-change="handleFetchHistory"
    />

    <!-- Ligne 11: Modal des transferts en attente -->
    <PendingTransfersModal
      :show="modals.showPendingModal.value"
      :transfers="pendingTransfers"
      :loading="loadingPending"
      @close="modals.closePendingModal()"
      @approve="handleApproveTransfer"
      @reject="modals.openRejectModal"
    />

    <!-- Ligne 12: Modal de rejet -->
    <RejectModal
      :show="modals.showRejectModal.value"
      :transfer="modals.selectedTransfer.value"
      :reason="modals.rejectReason.value"
      :submitting="submitting"
      @close="modals.closeRejectModal()"
      @submit="handleSubmitReject"
      @update:reason="modals.rejectReason.value = $event"
    />
  </div>
</template>

<script setup>
// Ligne 13: Imports Vue
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

// Ligne 14: Import des composables
import { useStockMovement } from './composables/useStockMovement';
import { useStockModals } from './composables/useStockModals';

// Ligne 15: Import des composants
import StockProductsTable from './components/StockProductsTable.vue';
import EntryModal from './components/EntryModal.vue';
import ExitModal from './components/ExitModal.vue';
import TransferModal from './components/TransferModal.vue';
import HistoryModal from './components/HistoryModal.vue';
import PendingTransfersModal from './components/PendingTransfersModal.vue';
import RejectModal from './components/RejectModal.vue';

// Ligne 16: Récupération de l'ID de l'entrepôt
const route = useRoute();
const warehouseId = route.params.id;

// Ligne 17: Utilisation du composable principal
const {
  // États
  loadingProducts,
  loadingPending,
  loadingHistory,
  submitting,
  error,
  successMessage,
  // Données
  warehouse,
  warehouses,
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
  // Méthodes
  fetchWarehouse,
  fetchWarehouses,
  fetchProducts,
  fetchStockProducts,
  loadSourceStock,
  fetchPendingCount,
  fetchPendingTransfers,
  fetchMovementsHistory,
  submitEntry,
  submitExit,
  submitTransfer,
  approveTransfer,
  rejectTransfer,
  debouncedSearch,
  clearSearch,
  goToPage
} = useStockMovement(warehouseId);

// Ligne 18: Utilisation du composable des modales
const modals = useStockModals();

// Ligne 19: Nom de l'entrepôt courant pour l'historique
const currentWarehouseName = computed(() => {
  const id = modals.historyFilters.warehouse_id;
  return warehouses.value.find(w => w.id == id)?.name || '';
});

// Ligne 20: Gestionnaires d'événements
const handleSearch = (value) => {
  searchQuery.value = value;
  debouncedSearch();
};

const handleQuickEntry = (stock) => {
  modals.quickEntry(stock, warehouseId);
};

const handleQuickExit = (stock) => {
  modals.quickExit(stock, warehouseId);
};

const handleSubmitEntry = async () => {
  const success = await submitEntry(modals.entryForm);
  if (success) {
    modals.closeEntryModal();
    fetchStockProducts(pagination.current_page);
  }
};

const handleSubmitExit = async () => {
  const success = await submitExit(modals.exitForm);
  if (success) {
    modals.closeExitModal();
    fetchStockProducts(pagination.current_page);
  }
};

const handleLoadSourceStock = () => {
  loadSourceStock(modals.transferForm.source_warehouse_id);
};

const handleSubmitTransfer = async () => {
  const success = await submitTransfer(modals.transferForm);
  if (success) {
    modals.closeTransferModal();
    fetchPendingCount();
  }
};

const handleShowPendingTransfers = async () => {
  modals.openPendingModal();
  await fetchPendingTransfers();
};

const handleApproveTransfer = async (transferId) => {
  if (!confirm('Approuver ce transfert ?')) return;
  const success = await approveTransfer(transferId);
  if (success) {
    await fetchPendingTransfers();
    fetchPendingCount();
    if (warehouseId) fetchStockProducts(pagination.current_page);
  }
};

const handleSubmitReject = async () => {
  const success = await rejectTransfer(
    modals.selectedTransfer.value.id,
    modals.rejectReason.value
  );
  if (success) {
    modals.closeRejectModal();
    await fetchPendingTransfers();
    fetchPendingCount();
  }
};

const handleShowHistory = () => {
  modals.openHistoryModal(warehouseId);
  handleFetchHistory();
};

const handleFetchHistory = () => {
  fetchMovementsHistory(modals.historyFilters);
};

// Ligne 21: Initialisation au montage
onMounted(() => {
  fetchWarehouses();
  fetchProducts();
  fetchPendingCount();

  if (warehouseId) {
    fetchWarehouse();
    fetchStockProducts();
  }
});
</script>

<style scoped>
/* Ligne 22: Styles */
.card {
  border: none;
  border-radius: 12px;
}
.modal {
  overflow-y: auto;
}
</style>
