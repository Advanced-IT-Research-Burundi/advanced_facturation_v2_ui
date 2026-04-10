<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { 
  FileText, Plus, Search, Filter, Eye, Edit, Trash2, 
  CheckCircle, Clock, XCircle, Package, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, Send, Download
} from 'lucide-vue-next';
import api from '@/services/api';
import StockHeader from '../stocks/StockHeader.vue';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

// State
const purchaseOrders = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const searchTimeout = ref(null);
const statusFilter = ref('all');
const showModal = ref(false);
const showDetailsModal = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const selectedOrder = ref(null);

// Data pour les selects
const fournisseurs = ref([]);
const warehouses = ref([]);
const products = ref([]);

// Pagination
const pagination = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
  from: 0,
  to: 0
});

// Stats
const stats = ref({
  total: 0,
  draft: 0,
  pending: 0,
  approved: 0,
  received: 0,
  cancelled: 0
});

// Formulaire
const form = reactive({
  id: null,
  fourinsseur_id: '',
  warehouse_id: '',
  expected_delivery_date: '',
  currency: 'BIF',
  notes: '',
  items: []
});

// Computed
const filteredOrders = computed(() => purchaseOrders.value);

// Fetch data
const fetchPurchaseOrders = async (page = 1) => {
  loading.value = true;
  error.value = null;
  try {
    const params = { page };
    if (searchQuery.value) params.search = searchQuery.value;
    if (statusFilter.value !== 'all') params.status = statusFilter.value;

    const response = await api.get('/purchase-orders', { params });
    if (response.data.success) {
      const data = response.data.data;
      purchaseOrders.value = data.data || [];
      pagination.value = {
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        total: data.total || 0,
        from: data.from || 0,
        to: data.to || 0
      };
    }
  } catch (err) {
    console.error('Error fetching purchase orders:', err);
    error.value = 'Erreur lors du chargement des bons de commande';
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const response = await api.get('/purchase-orders/stats');
    if (response.data.success) {
      stats.value = response.data.data;
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
};

const fetchFournisseurs = async () => {
  try {
    const response = await api.get('/fournisseurs');
    if (response.data.success) {
      fournisseurs.value = response.data.data.data || response.data.data || [];
    }
  } catch (err) {
    console.error('Error fetching fournisseurs:', err);
  }
};

const fetchWarehouses = async () => {
  try {
    const response = await api.get('/warehouses');
    if (response.data.success) {
      warehouses.value = response.data.data.data || response.data.data || [];
    }
  } catch (err) {
    console.error('Error fetching warehouses:', err);
  }
};

const fetchProducts = async () => {
  try {
    const response = await api.get('/products', { params: { per_page: 100 } });
    if (response.data.success) {
      products.value = response.data.data.data || response.data.data || [];
    }
  } catch (err) {
    console.error('Error fetching products:', err);
  }
};

// Handlers
const handleSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    fetchPurchaseOrders(1);
  }, 400);
};

const handleFilterChange = () => {
  fetchPurchaseOrders(1);
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.last_page) {
    fetchPurchaseOrders(page);
  }
};

// Modal handlers
const openCreateModal = () => {
  isEditing.value = false;
  resetForm();
  addItem();
  showModal.value = true;
};

const openEditModal = (order) => {
  isEditing.value = true;
  form.id = order.id;
  form.fourinsseur_id = order.fourinsseur_id;
  form.warehouse_id = order.warehouse_id;
  form.expected_delivery_date = order.expected_delivery_date?.split('T')[0] || '';
  form.currency = order.currency;
  form.notes = order.notes || '';
  form.items = order.items?.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price
  })) || [];
  if (form.items.length === 0) addItem();
  showModal.value = true;
};

const openDetailsModal = (order) => {
  selectedOrder.value = order;
  showDetailsModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedOrder.value = null;
};

const resetForm = () => {
  form.id = null;
  form.fourinsseur_id = '';
  form.warehouse_id = '';
  form.expected_delivery_date = '';
  form.currency = 'BIF';
  form.notes = '';
  form.items = [];
};

// Items management
const addItem = () => {
  form.items.push({
    product_id: '',
    quantity: 1,
    unit_price: 0
  });
};

const removeItem = (index) => {
  if (form.items.length > 1) {
    form.items.splice(index, 1);
  }
};

const updateItemPrice = (index) => {
  const item = form.items[index];
  if (item.product_id) {
    const product = products.value.find(p => p.id == item.product_id);
    if (product) {
      item.unit_price = product.price || 0;
    }
  }
};

const calculateTotal = computed(() => {
  return form.items.reduce((total, item) => {
    return total + (item.quantity * item.unit_price);
  }, 0);
});

// Submit
const submitForm = async () => {
  if (!form.fourinsseur_id || !form.warehouse_id || form.items.length === 0) {
    error.value = 'Veuillez remplir tous les champs obligatoires';
    return;
  }

  // Valider les items
  const validItems = form.items.filter(item => item.product_id && item.quantity > 0);
  if (validItems.length === 0) {
    error.value = 'Ajoutez au moins un produit valide';
    return;
  }

  submitting.value = true;
  error.value = null;

  try {
    const payload = {
      fourinsseur_id: form.fourinsseur_id,
      warehouse_id: form.warehouse_id,
      expected_delivery_date: form.expected_delivery_date || null,
      currency: form.currency,
      notes: form.notes,
      items: validItems
    };

    let response;
    if (isEditing.value) {
      response = await api.put(`/purchase-orders/${form.id}`, payload);
    } else {
      response = await api.post('/purchase-orders', payload);
    }

    if (response.data.success) {
      closeModal();
      fetchPurchaseOrders(pagination.value.current_page);
      fetchStats();
    } else {
      error.value = response.data.message || 'Erreur lors de l\'enregistrement';
    }
  } catch (err) {
    console.error('Error submitting form:', err);
    error.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    submitting.value = false;
  }
};

// Status update
const updateStatus = async (order, newStatus) => {
  try {
    const response = await api.patch(`/purchase-orders/${order.id}/status`, { status: newStatus });
    if (response.data.success) {
      fetchPurchaseOrders(pagination.value.current_page);
      fetchStats();
      if (selectedOrder.value?.id === order.id) {
        selectedOrder.value = response.data.data;
      }
    }
  } catch (err) {
    console.error('Error updating status:', err);
    toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
  }
};

// Delete
const deleteOrder = async (order) => {
  if (!(await confirmDialog(`Supprimer le bon de commande ${order.ref_code} ?`))) return;

  try {
    await api.delete(`/purchase-orders/${order.id}`);
    fetchPurchaseOrders(pagination.value.current_page);
    fetchStats();
  } catch (err) {
    console.error('Error deleting order:', err);
    toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
  }
};

// Helpers
const getStatusBadgeClass = (status) => {
  const classes = {
    draft: 'bg-secondary',
    pending: 'bg-warning text-dark',
    approved: 'bg-info',
    received: 'bg-success',
    cancelled: 'bg-danger'
  };
  return classes[status] || 'bg-secondary';
};

const getStatusLabel = (status) => {
  const labels = {
    draft: 'Brouillon',
    pending: 'En attente',
    approved: 'Approuvé',
    received: 'Reçu',
    cancelled: 'Annulé'
  };
  return labels[status] || status;
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

const formatCurrency = (amount, currency = 'BIF') => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + currency;
};

// Init
onMounted(() => {
  fetchPurchaseOrders();
  fetchStats();
  fetchFournisseurs();
  fetchWarehouses();
  fetchProducts();
});
</script>

<template>
  <div class="container-fluid py-4">
    <StockHeader />
    
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">Bons de Commande</h1>
        <p class="text-muted mb-0">Gérez vos commandes fournisseurs</p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <Plus :size="18" class="me-2" />
        Nouveau Bon
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center py-3">
            <div class="fs-4 fw-bold text-primary">{{ stats.total }}</div>
            <small class="text-muted">Total</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center py-3">
            <div class="fs-4 fw-bold text-secondary">{{ stats.draft }}</div>
            <small class="text-muted">Brouillons</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center py-3">
            <div class="fs-4 fw-bold text-warning">{{ stats.pending }}</div>
            <small class="text-muted">En attente</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center py-3">
            <div class="fs-4 fw-bold text-info">{{ stats.approved }}</div>
            <small class="text-muted">Approuvés</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center py-3">
            <div class="fs-4 fw-bold text-success">{{ stats.received }}</div>
            <small class="text-muted">Reçus</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center py-3">
            <div class="fs-4 fw-bold text-danger">{{ stats.cancelled }}</div>
            <small class="text-muted">Annulés</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="row g-3 align-items-center">
          <div class="col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-white">
                <Search :size="16" />
              </span>
              <input 
                v-model="searchQuery"
                @input="handleSearch"
                type="text" 
                class="form-control" 
                placeholder="Rechercher par référence ou fournisseur..."
              >
            </div>
          </div>
          <div class="col-md-3">
            <select v-model="statusFilter" @change="handleFilterChange" class="form-select">
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="received">Reçu</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
          <div class="col-md-4 text-end">
            <button class="btn btn-outline-secondary" @click="fetchPurchaseOrders(1)">
              <RefreshCw :size="16" class="me-1" />
              Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-danger alert-dismissible mb-4">
      {{ error }}
      <button type="button" class="btn-close" @click="error = null"></button>
    </div>

    <!-- Table -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div v-if="loading" class="text-center py-5">
          <Loader2 :size="32" class="animate-spin text-primary" />
          <p class="text-muted mt-2">Chargement...</p>
        </div>

        <div v-else-if="purchaseOrders.length === 0" class="text-center py-5 text-muted">
          <FileText :size="48" class="opacity-25 mb-3" />
          <p class="mb-0">Aucun bon de commande trouvé</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4">Référence</th>
                <th>Fournisseur</th>
                <th>Entrepôt</th>
                <th>Date</th>
                <th class="text-end">Montant</th>
                <th class="text-center">Statut</th>
                <th class="text-center pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in purchaseOrders" :key="order.id">
                <td class="ps-4 fw-bold text-primary">{{ order.ref_code }}</td>
                <td>{{ order.fourinsseur?.name || '-' }}</td>
                <td>{{ order.warehouse?.name || '-' }}</td>
                <td>{{ formatDate(order.order_date) }}</td>
                <td class="text-end fw-bold">{{ formatCurrency(order.total_amount, order.currency) }}</td>
                <td class="text-center">
                  <span class="badge" :class="getStatusBadgeClass(order.status)">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </td>
                <td class="text-center pe-4">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" @click="openDetailsModal(order)" title="Voir">
                      <Eye :size="14" />
                    </button>
                    <button 
                      v-if="['draft', 'pending'].includes(order.status)"
                      class="btn btn-outline-secondary" 
                      @click="openEditModal(order)" 
                      title="Modifier"
                    >
                      <Edit :size="14" />
                    </button>
                    <button 
                      v-if="order.status === 'draft'"
                      class="btn btn-outline-danger" 
                      @click="deleteOrder(order)" 
                      title="Supprimer"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.last_page > 1 || pagination.total > 0" class="d-flex justify-content-between align-items-center p-3 border-top">
          <small class="text-muted">
            Affichage {{ pagination.from }} à {{ pagination.to }} sur {{ pagination.total }}
          </small>
          <nav v-if="pagination.last_page > 1">
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                <button class="page-link" @click="changePage(pagination.current_page - 1)">
                  <ChevronLeft :size="14" />
                </button>
              </li>
              <li class="page-item active">
                <span class="page-link">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
              </li>
              <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
                <button class="page-link" @click="changePage(pagination.current_page + 1)">
                  <ChevronRight :size="14" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              {{ isEditing ? 'Modifier le Bon de Commande' : 'Nouveau Bon de Commande' }}
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm">
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Fournisseur *</label>
                  <select v-model="form.fourinsseur_id" class="form-select" required>
                    <option value="">Sélectionner...</option>
                    <option v-for="f in fournisseurs" :key="f.id" :value="f.id">
                      {{ f.name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Entrepôt de destination *</label>
                  <select v-model="form.warehouse_id" class="form-select" required>
                    <option value="">Sélectionner...</option>
                    <option v-for="w in warehouses" :key="w.id" :value="w.id">
                      {{ w.name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Date livraison prévue</label>
                  <input type="date" v-model="form.expected_delivery_date" class="form-control">
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Devise</label>
                  <select v-model="form.currency" class="form-select">
                    <option value="BIF">BIF</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Total estimé</label>
                  <div class="form-control bg-light fw-bold text-end">
                    {{ formatCurrency(calculateTotal, form.currency) }}
                  </div>
                </div>
              </div>

              <!-- Items -->
              <div class="border rounded p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="mb-0 fw-bold">Articles</h6>
                  <button type="button" class="btn btn-sm btn-outline-primary" @click="addItem">
                    <Plus :size="14" class="me-1" /> Ajouter
                  </button>
                </div>

                <div class="table-responsive">
                  <table class="table table-sm mb-0">
                    <thead class="table-light">
                      <tr>
                        <th style="min-width: 200px;">Produit</th>
                        <th style="width: 100px;">Quantité</th>
                        <th style="width: 120px;">Prix unitaire</th>
                        <th style="width: 120px;" class="text-end">Total</th>
                        <th style="width: 50px;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in form.items" :key="index">
                        <td>
                          <select 
                            v-model="item.product_id" 
                            @change="updateItemPrice(index)"
                            class="form-select form-select-sm"
                          >
                            <option value="">Sélectionner...</option>
                            <option v-for="p in products" :key="p.id" :value="p.id">
                              {{ p.item_designation }}
                            </option>
                          </select>
                        </td>
                        <td>
                          <input type="number" v-model.number="item.quantity" class="form-control form-control-sm" min="1">
                        </td>
                        <td>
                          <input type="number" v-model.number="item.unit_price" class="form-control form-control-sm" min="0" step="0.01">
                        </td>
                        <td class="text-end fw-bold">
                          {{ formatCurrency(item.quantity * item.unit_price, form.currency) }}
                        </td>
                        <td>
                          <button 
                            type="button" 
                            class="btn btn-sm btn-outline-danger" 
                            @click="removeItem(index)"
                            :disabled="form.items.length <= 1"
                          >
                            <Trash2 :size="14" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Notes</label>
                <textarea v-model="form.notes" class="form-control" rows="2" placeholder="Notes ou instructions..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="submitting">
              Annuler
            </button>
            <button type="button" class="btn btn-primary" @click="submitForm" :disabled="submitting">
              <Loader2 v-if="submitting" :size="16" class="animate-spin me-2" />
              {{ submitting ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal && selectedOrder" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <FileText :size="20" class="me-2" />
              {{ selectedOrder.ref_code }}
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDetailsModal"></button>
          </div>
          <div class="modal-body">
            <!-- Info Header -->
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <div class="p-3 bg-light rounded">
                  <small class="text-muted d-block">Fournisseur</small>
                  <strong>{{ selectedOrder.fourinsseur?.name || '-' }}</strong>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-3 bg-light rounded">
                  <small class="text-muted d-block">Entrepôt</small>
                  <strong>{{ selectedOrder.warehouse?.name || '-' }}</strong>
                </div>
              </div>
              <div class="col-md-4">
                <div class="p-3 bg-light rounded">
                  <small class="text-muted d-block">Date de commande</small>
                  <strong>{{ formatDate(selectedOrder.order_date) }}</strong>
                </div>
              </div>
              <div class="col-md-4">
                <div class="p-3 bg-light rounded">
                  <small class="text-muted d-block">Livraison prévue</small>
                  <strong>{{ formatDate(selectedOrder.expected_delivery_date) || '-' }}</strong>
                </div>
              </div>
              <div class="col-md-4">
                <div class="p-3 bg-light rounded">
                  <small class="text-muted d-block">Statut</small>
                  <span class="badge" :class="getStatusBadgeClass(selectedOrder.status)">
                    {{ getStatusLabel(selectedOrder.status) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <h6 class="fw-bold mb-3">Articles commandés</h6>
            <div class="table-responsive mb-4">
              <table class="table table-sm table-bordered mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Produit</th>
                    <th class="text-center">Quantité</th>
                    <th class="text-end">Prix unitaire</th>
                    <th class="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in selectedOrder.items" :key="item.id">
                    <td>{{ item.product?.item_designation || '-' }}</td>
                    <td class="text-center">{{ item.quantity }}</td>
                    <td class="text-end">{{ formatCurrency(item.unit_price, selectedOrder.currency) }}</td>
                    <td class="text-end fw-bold">{{ formatCurrency(item.total_price, selectedOrder.currency) }}</td>
                  </tr>
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <th colspan="3" class="text-end">Total</th>
                    <th class="text-end">{{ formatCurrency(selectedOrder.total_amount, selectedOrder.currency) }}</th>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Notes -->
            <div v-if="selectedOrder.notes" class="mb-4">
              <h6 class="fw-bold mb-2">Notes</h6>
              <p class="text-muted mb-0">{{ selectedOrder.notes }}</p>
            </div>

            <!-- Actions -->
            <div class="border-top pt-3">
              <h6 class="fw-bold mb-3">Actions</h6>
              <div class="d-flex flex-wrap gap-2">
                <button 
                  v-if="selectedOrder.status === 'draft'"
                  class="btn btn-warning"
                  @click="updateStatus(selectedOrder, 'pending')"
                >
                  <Send :size="16" class="me-2" />
                  Envoyer pour approbation
                </button>
                <button 
                  v-if="selectedOrder.status === 'pending'"
                  class="btn btn-info"
                  @click="updateStatus(selectedOrder, 'approved')"
                >
                  <CheckCircle :size="16" class="me-2" />
                  Approuver
                </button>
                <button 
                  v-if="selectedOrder.status === 'approved'"
                  class="btn btn-success"
                  @click="updateStatus(selectedOrder, 'received')"
                >
                  <Package :size="16" class="me-2" />
                  Marquer comme reçu
                </button>
                <button 
                  v-if="['draft', 'pending', 'approved'].includes(selectedOrder.status)"
                  class="btn btn-outline-danger"
                  @click="updateStatus(selectedOrder, 'cancelled')"
                >
                  <XCircle :size="16" class="me-2" />
                  Annuler
                </button>
                <button 
                  v-if="selectedOrder.status === 'cancelled'"
                  class="btn btn-outline-secondary"
                  @click="updateStatus(selectedOrder, 'draft')"
                >
                  <RefreshCw :size="16" class="me-2" />
                  Remettre en brouillon
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-secondary" @click="closeDetailsModal">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.table th {
  font-weight: 600;
  font-size: 0.85rem;
}

.card {
  transition: all 0.2s ease;
}
</style>
