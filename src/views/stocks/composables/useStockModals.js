// Composable pour la gestion des modales de stock
import { ref, reactive } from 'vue';

export function useStockModals() {
  // États des modales
  const showEntryModal = ref(false);
  const showExitModal = ref(false);
  const showTransferModal = ref(false);
  const showPendingModal = ref(false);
  const showRejectModal = ref(false);
  const showHistoryModal = ref(false);

  // Données des modales
  const selectedTransfer = ref(null);
  const rejectReason = ref('');

  // Formulaire d'entrée
  const entryForm = reactive({
    warehouse_id: '',
    movement_type: 'EN',
    movement_date: new Date().toISOString().slice(0, 16),
    invoice_ref: '',
    description: '',
    items: [{ product_id: '', quantity: '', unit_price: '', currency: 'BIF' }]
  });

  // Formulaire de sortie
  const exitForm = reactive({
    warehouse_id: '',
    movement_type: 'SN',
    movement_date: new Date().toISOString().slice(0, 16),
    invoice_ref: '',
    description: '',
    items: [{ product_id: '', quantity: '', available_stock: 0, unit_price: '' }]
  });

  // Formulaire de transfert
  const transferForm = reactive({
    source_warehouse_id: '',
    destination_warehouse_id: '',
    notes: '',
    items: [{ product_id: '', quantity: '', available_stock: 0 }]
  });

  // Filtres de l'historique
  const historyFilters = reactive({
    warehouse_id: '',
    movement_type: '',
    date_from: '',
    date_to: ''
  });

  // === Méthodes pour le modal d'entrée ===
  const openEntryModal = (warehouseId) => {
    entryForm.warehouse_id = warehouseId;
    entryForm.movement_date = new Date().toISOString().slice(0, 16);
    showEntryModal.value = true;
  };

  const closeEntryModal = () => {
    showEntryModal.value = false;
    resetEntryForm();
  };

  const resetEntryForm = () => {
    entryForm.movement_type = 'EN';
    entryForm.movement_date = new Date().toISOString().slice(0, 16);
    entryForm.invoice_ref = '';
    entryForm.description = '';
    entryForm.items = [{ product_id: '', quantity: '', unit_price: '', currency: 'BIF' }];
  };

  const addEntryItem = () => {
    entryForm.items.push({ product_id: '', quantity: '', unit_price: '', currency: 'BIF' });
  };

  const removeEntryItem = (index) => {
    entryForm.items.splice(index, 1);
  };

  const quickEntry = (stock, warehouseId) => {
    entryForm.warehouse_id = warehouseId;
    entryForm.movement_date = new Date().toISOString().slice(0, 16);
    entryForm.items = [{
      product_id: stock.product_id,
      quantity: '',
      unit_price: stock.unit_price,
      currency: stock.currency
    }];
    showEntryModal.value = true;
  };

  // === Méthodes pour le modal de sortie ===
  const openExitModal = (warehouseId) => {
    exitForm.warehouse_id = warehouseId;
    exitForm.movement_date = new Date().toISOString().slice(0, 16);
    showExitModal.value = true;
  };

  const closeExitModal = () => {
    showExitModal.value = false;
    resetExitForm();
  };

  const resetExitForm = () => {
    exitForm.movement_type = 'SN';
    exitForm.movement_date = new Date().toISOString().slice(0, 16);
    exitForm.invoice_ref = '';
    exitForm.description = '';
    exitForm.items = [{ product_id: '', quantity: '', available_stock: 0, unit_price: '' }];
  };

  const addExitItem = () => {
    exitForm.items.push({ product_id: '', quantity: '', available_stock: 0, unit_price: '' });
  };

  const removeExitItem = (index) => {
    exitForm.items.splice(index, 1);
  };

  const updateExitStock = (item, warehouseStocks) => {
    const stock = warehouseStocks.find(s => s.product_id == item.product_id);
    if (stock) {
      item.available_stock = stock.quantity;
      item.unit_price = stock.unit_price + ' ' + stock.currency;
    }
  };

  const quickExit = (stock, warehouseId) => {
    exitForm.warehouse_id = warehouseId;
    exitForm.movement_date = new Date().toISOString().slice(0, 16);
    exitForm.items = [{
      product_id: stock.product_id,
      quantity: '',
      available_stock: stock.quantity,
      unit_price: stock.unit_price + ' ' + stock.currency
    }];
    showExitModal.value = true;
  };

  // === Méthodes pour le modal de transfert ===
  const openTransferModal = () => {
    showTransferModal.value = true;
  };

  const closeTransferModal = () => {
    showTransferModal.value = false;
    resetTransferForm();
  };

  const resetTransferForm = () => {
    transferForm.source_warehouse_id = '';
    transferForm.destination_warehouse_id = '';
    transferForm.notes = '';
    transferForm.items = [{ product_id: '', quantity: '', available_stock: 0 }];
  };

  const addTransferItem = () => {
    transferForm.items.push({ product_id: '', quantity: '', available_stock: 0 });
  };

  const removeTransferItem = (index) => {
    transferForm.items.splice(index, 1);
  };

  const updateTransferStock = (item, sourceStocks) => {
    const stock = sourceStocks.find(s => s.product_id == item.product_id);
    if (stock) item.available_stock = stock.quantity;
  };

  // === Méthodes pour le modal des transferts en attente ===
  const openPendingModal = () => {
    showPendingModal.value = true;
  };

  const closePendingModal = () => {
    showPendingModal.value = false;
  };

  // === Méthodes pour le modal de rejet ===
  const openRejectModal = (transfer) => {
    selectedTransfer.value = transfer;
    showRejectModal.value = true;
  };

  const closeRejectModal = () => {
    showRejectModal.value = false;
    selectedTransfer.value = null;
    rejectReason.value = '';
  };

  // === Méthodes pour le modal d'historique ===
  const openHistoryModal = (warehouseId) => {
    historyFilters.warehouse_id = warehouseId;
    showHistoryModal.value = true;
  };

  const closeHistoryModal = () => {
    showHistoryModal.value = false;
  };

  return {
    // États des modales
    showEntryModal,
    showExitModal,
    showTransferModal,
    showPendingModal,
    showRejectModal,
    showHistoryModal,

    // Données
    selectedTransfer,
    rejectReason,

    // Formulaires
    entryForm,
    exitForm,
    transferForm,
    historyFilters,

    // Méthodes d'entrée
    openEntryModal,
    closeEntryModal,
    addEntryItem,
    removeEntryItem,
    quickEntry,

    // Méthodes de sortie
    openExitModal,
    closeExitModal,
    addExitItem,
    removeExitItem,
    updateExitStock,
    quickExit,

    // Méthodes de transfert
    openTransferModal,
    closeTransferModal,
    addTransferItem,
    removeTransferItem,
    updateTransferStock,

    // Méthodes transferts en attente
    openPendingModal,
    closePendingModal,

    // Méthodes de rejet
    openRejectModal,
    closeRejectModal,

    // Méthodes d'historique
    openHistoryModal,
    closeHistoryModal
  };
}
