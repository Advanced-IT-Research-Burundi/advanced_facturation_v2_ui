<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">Tables Restaurant</h4>
      <div class="d-flex gap-2">
        <router-link :to="{ name: 'restaurant.invoices' }" class="btn btn-outline-info">
          <i class="bi bi-receipt me-1"></i> Factures
        </router-link>
        <button class="btn btn-outline-secondary" @click="loadDashboard">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
        <button class="btn btn-primary" @click="showAddModal = true">
          <i class="bi bi-plus-lg me-1"></i> Nouvelle Table
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <h6>Tables Libres</h6>
            <h3>{{ dashboard.tables_free || 0 }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning">
          <div class="card-body">
            <h6>Tables Occupées</h6>
            <h3>{{ dashboard.tables_occupied || 0 }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <h6>Commandes Ouvertes</h6>
            <h3>{{ dashboard.open_orders || 0 }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <h6>CA Aujourd'hui</h6>
            <h3>{{ formatCurrency(dashboard.today_revenue) }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert OBR pending -->
    <div v-if="dashboard.pending_obr > 0" class="alert alert-warning d-flex align-items-center mb-4">
      <i class="bi bi-exclamation-triangle me-2"></i>
      <span>{{ dashboard.pending_obr }} facture(s) en attente d'envoi OBR</span>
      <router-link :to="{ name: 'restaurant.invoices', query: { obr_status: 'PENDING' } }" class="btn btn-sm btn-warning ms-auto">
        Voir
      </router-link>
    </div>

    <!-- Tables Grid -->
    <div class="row">
      <div
        v-for="table in tables"
        :key="table.id"
        class="col-6 col-md-4 col-lg-3 col-xl-2 mb-3"
      >
        <div
          class="card h-100 table-card"
          :class="getTableClass(table)"
          @click="selectTable(table)"
          style="cursor: pointer"
        >
          <div class="card-body text-center">
            <i class="bi bi-table fs-1 mb-2"></i>
            <h5 class="card-title">{{ table.table_number }}</h5>
            <p class="card-text small mb-1">
              <i class="bi bi-people"></i> {{ table.capacity }} places
            </p>
            <span class="badge" :class="getStatusBadge(table.status)">
              {{ getStatusLabel(table.status) }}
            </span>
            <div v-if="table.active_orders_count > 0" class="mt-2">
              <span class="badge bg-info">{{ table.active_orders_count }} cmd</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Table Modal -->
    <div class="modal fade" :class="{ show: showAddModal }" :style="{ display: showAddModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingTable ? 'Modifier' : 'Ajouter' }} une Table</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Numéro de table</label>
              <input v-model="form.table_number" type="text" class="form-control" placeholder="ex: T01">
            </div>
            <div class="mb-3">
              <label class="form-label">Capacité</label>
              <input v-model.number="form.capacity" type="number" class="form-control" min="1" max="50">
            </div>
            <div class="mb-3">
              <label class="form-label">Emplacement</label>
              <input v-model="form.location" type="text" class="form-control" placeholder="ex: Terrasse">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button type="button" class="btn btn-primary" @click="saveTable" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showAddModal" class="modal-backdrop fade show"></div>

    <!-- Table Detail Modal -->
    <div class="modal fade" :class="{ show: showDetailModal }" :style="{ display: showDetailModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Table {{ selectedTable?.table_number }}</h5>
            <button type="button" class="btn-close" @click="showDetailModal = false"></button>
          </div>
          <div class="modal-body" v-if="selectedTable">
            <div class="d-flex justify-content-between mb-3">
              <div>
                <span class="badge me-2" :class="getStatusBadge(selectedTable.status)">
                  {{ getStatusLabel(selectedTable.status) }}
                </span>
                <span class="text-muted">{{ selectedTable.capacity }} places</span>
              </div>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary" @click="editTable(selectedTable)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="deleteTable(selectedTable)" v-if="selectedTable.status === 'free'">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <div class="d-flex gap-2 mb-3">
              <button class="btn btn-success" @click="goToOrders(selectedTable)">
                <i class="bi bi-cart-plus me-1"></i> Nouvelle Commande
              </button>
              <button class="btn btn-warning" @click="generateInvoice(selectedTable)" :disabled="!hasActiveOrders">
                <i class="bi bi-receipt me-1"></i> Facturer
              </button>
            </div>

            <h6>Commandes actives</h6>
            <div v-if="tableOrders.length === 0" class="text-muted">Aucune commande</div>
            <div v-else class="list-group">
              <div v-for="order in tableOrders" :key="order.id" class="list-group-item">
                <div class="d-flex justify-content-between">
                  <strong>{{ order.order_number }}</strong>
                  <span class="badge" :class="getOrderStatusBadge(order.status)">{{ order.status }}</span>
                </div>
                <small class="text-muted">Serveur: {{ order.server?.name }}</small>
                <div class="mt-2">
                  <small v-for="item in order.items" :key="item.id" class="d-block">
                    {{ item.quantity }}x {{ item.product?.name || item.product?.item_designation }} - {{ formatCurrency(item.total_price) }}
                  </small>
                </div>
                <div class="text-end mt-2">
                  <strong>Total: {{ formatCurrency(order.total_amount) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showDetailModal" class="modal-backdrop fade show"></div>

    <!-- Modal Sélection Client et Dépôt pour Facturation -->
    <div v-if="showInvoiceModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning text-dark">
            <h5 class="modal-title"><i class="bi bi-receipt me-2"></i>Générer la Facture</h5>
            <button type="button" class="btn-close" @click="showInvoiceModal = false"></button>
          </div>
          <div class="modal-body">
            <!-- Sélection du Dépôt -->
            <div class="mb-3">
              <label class="form-label fw-semibold"><i class="bi bi-box-seam me-1"></i> Dépôt de sortie *</label>
              <select v-model="invoiceWarehouseId" class="form-select">
                <option :value="null" disabled>Sélectionner un dépôt...</option>
                <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                  {{ wh.name }}
                </option>
              </select>
            </div>

            <hr>

            <!-- Recherche Client -->
            <div class="mb-3">
              <label class="form-label fw-semibold"><i class="bi bi-person me-1"></i> Client *</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input
                  v-model="customerSearch"
                  type="text"
                  class="form-control"
                  placeholder="Rechercher par nom ou NIF..."
                  @input="searchCustomers"
                >
              </div>
            </div>

            <!-- Liste des clients trouvés -->
            <div v-if="filteredCustomers.length > 0" class="list-group mb-3" style="max-height: 150px; overflow-y: auto;">
              <a
                v-for="customer in filteredCustomers"
                :key="customer.id"
                href="#"
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                :class="{ 'active': selectedCustomer?.id === customer.id }"
                @click.prevent="selectCustomer(customer)"
              >
                <div>
                  <strong>{{ customer.customer_name }}</strong>
                  <small class="d-block text-muted">NIF: {{ customer.customer_TIN || 'N/A' }}</small>
                </div>
                <i v-if="selectedCustomer?.id === customer.id" class="bi bi-check-circle-fill text-success"></i>
              </a>
            </div>

            <!-- Client sélectionné -->
            <div v-if="selectedCustomer" class="alert alert-success py-2 mb-2">
              <i class="bi bi-person-check me-2"></i>
              Client: <strong>{{ selectedCustomer.customer_name }}</strong>
            </div>

            <!-- Bouton nouveau client -->
            <div class="text-center mb-2">
              <button class="btn btn-outline-primary btn-sm" @click="showNewClientModal = true">
                <i class="bi bi-plus-lg me-1"></i> Créer un nouveau client
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showInvoiceModal = false">Annuler</button>
            <button
              type="button"
              class="btn btn-warning"
              @click="confirmInvoice"
              :disabled="!selectedCustomer || !invoiceWarehouseId || generatingInvoice"
            >
              <span v-if="generatingInvoice" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-receipt me-1"></i>
              Générer la Facture
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Création Client -->
    <ClientFormModal
      :show="showNewClientModal"
      @close="showNewClientModal = false"
      @client-created="onClientCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import ClientFormModal from '@/views/sales/ClientFormModal.vue';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const router = useRouter();
const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

const tables = ref([]);
const dashboard = ref({});
const selectedTable = ref(null);
const tableOrders = ref([]);
const showAddModal = ref(false);
const showDetailModal = ref(false);
const editingTable = ref(null);
const saving = ref(false);

// Warehouse management
const warehouses = ref([]);
const invoiceWarehouseId = ref(null);

// Client selection for invoice
const customers = ref([]);
const filteredCustomers = ref([]);
const customerSearch = ref('');
const selectedCustomer = ref(null);
const showInvoiceModal = ref(false);
const showNewClientModal = ref(false);
const generatingInvoice = ref(false);
const tableToInvoice = ref(null);

const form = ref({
  table_number: '',
  capacity: 4,
  location: '',
});

const hasActiveOrders = computed(() => tableOrders.value.length > 0);

onMounted(() => {
  loadTables();
  loadDashboard();
  loadCustomers();
  loadWarehouses();
});

async function loadWarehouses() {
  try {
    const { data } = await api.get('/restaurant/warehouses');
    warehouses.value = data.data || [];
    if (warehouses.value.length > 0) {
      invoiceWarehouseId.value = warehouses.value[0].id;
    }
  } catch (error) {
    console.error('Erreur chargement dépôts:', error);
    warehouses.value = [];
  }
}

async function loadTables() {
  try {
    const { data } = await api.get('/restaurant/tables');
    tables.value = data.data;
  } catch (error) {
    console.error('Erreur chargement tables:', error);
  }
}

async function loadDashboard() {
  try {
    const { data } = await api.get('/restaurant/dashboard');
    dashboard.value = data.data;
    loadTables();
  } catch (error) {
    console.error('Erreur chargement dashboard:', error);
  }
}

async function selectTable(table) {
  selectedTable.value = table;
  showDetailModal.value = true;
  try {
    const { data } = await api.get(`/restaurant/tables/${table.id}/orders`);
    tableOrders.value = data.data;
  } catch (error) {
    console.error('Erreur chargement commandes:', error);
    tableOrders.value = [];
  }
}

async function saveTable() {
  saving.value = true;
  try {
    if (editingTable.value) {
      await api.put(`/restaurant/tables/${editingTable.value.id}`, form.value);
    } else {
      await api.post('/restaurant/tables', form.value);
    }
    closeModal();
    loadTables();
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
  } finally {
    saving.value = false;
  }
}

function editTable(table) {
  editingTable.value = table;
  form.value = {
    table_number: table.table_number,
    capacity: table.capacity,
    location: table.location || '',
  };
  showDetailModal.value = false;
  showAddModal.value = true;
}

async function deleteTable(table) {
  if (!(await confirmDialog('Supprimer cette table ?'))) return;
  try {
    await api.delete(`/restaurant/tables/${table.id}`);
    showDetailModal.value = false;
    loadTables();
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
  }
}

function closeModal() {
  showAddModal.value = false;
  editingTable.value = null;
  form.value = { table_number: '', capacity: 4, location: '' };
}

function goToOrders(table) {
  showDetailModal.value = false;
  router.push({ name: 'restaurant.orders', query: { table: table.id } });
}

// Customer management functions
async function loadCustomers() {
  try {
    const { data } = await api.get('/customers');
    // Handle paginated response: data.data.data or data.data (array) or data (array)
    if (Array.isArray(data.data)) {
      customers.value = data.data;
    } else if (data.data?.data && Array.isArray(data.data.data)) {
      customers.value = data.data.data;
    } else if (Array.isArray(data)) {
      customers.value = data;
    } else {
      customers.value = [];
    }
  } catch (error) {
    console.error('Erreur chargement clients:', error);
    customers.value = [];
  }
}

function searchCustomers() {
  const list = Array.isArray(customers.value) ? customers.value : [];
  if (!customerSearch.value) {
    filteredCustomers.value = list.slice(0, 10);
    return;
  }
  const search = customerSearch.value.toLowerCase();
  filteredCustomers.value = list.filter(c =>
    c.customer_name?.toLowerCase().includes(search) ||
    c.customer_TIN?.includes(search)
  ).slice(0, 10);
}

function selectCustomer(customer) {
  selectedCustomer.value = customer;
}

function onClientCreated(newCustomer) {
  customers.value.unshift(newCustomer);
  selectedCustomer.value = newCustomer;
  showNewClientModal.value = false;
  customerSearch.value = newCustomer.customer_name;
}

function generateInvoice(table) {
  tableToInvoice.value = table;
  selectedCustomer.value = null;
  customerSearch.value = '';
  // Pre-select first warehouse
  invoiceWarehouseId.value = warehouses.value.length > 0 ? warehouses.value[0].id : null;
  const list = Array.isArray(customers.value) ? customers.value : [];
  filteredCustomers.value = list.slice(0, 10);
  showDetailModal.value = false;
  showInvoiceModal.value = true;
}

async function confirmInvoice() {
  if (!tableToInvoice.value || !selectedCustomer.value || !invoiceWarehouseId.value) {
    if (!invoiceWarehouseId.value) {
      toast.error('Veuillez sélectionner un dépôt');
    }
    return;
  }

  generatingInvoice.value = true;
  try {
    const { data } = await api.post('/restaurant/invoices/generate', {
      table_id: tableToInvoice.value.id,
      customer_id: selectedCustomer.value.id,
      warehouse_id: invoiceWarehouseId.value,
    });
    showInvoiceModal.value = false;
    router.push({ name: 'restaurant.invoice', params: { id: data.data.id } });
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors de la génération de la facture');
  } finally {
    generatingInvoice.value = false;
  }
}

function getTableClass(table) {
  return {
    'border-success': table.status === 'free',
    'border-warning': table.status === 'occupied',
    'border-info': table.status === 'reserved',
  };
}

function getStatusBadge(status) {
  const badges = {
    free: 'bg-success',
    occupied: 'bg-warning text-dark',
    reserved: 'bg-info',
  };
  return badges[status] || 'bg-secondary';
}

function getStatusLabel(status) {
  const labels = { free: 'Libre', occupied: 'Occupée', reserved: 'Réservée' };
  return labels[status] || status;
}

function getOrderStatusBadge(status) {
  const badges = {
    open: 'bg-primary',
    served: 'bg-success',
    invoiced: 'bg-secondary',
    cancelled: 'bg-danger',
  };
  return badges[status] || 'bg-secondary';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-BI', { style: 'currency', currency: 'BIF' }).format(amount || 0);
}
</script>

<style scoped>
.table-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border-width: 3px;
}
.table-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}
</style>
