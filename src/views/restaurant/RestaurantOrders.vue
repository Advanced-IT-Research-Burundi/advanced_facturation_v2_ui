<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-0">Commandes Restaurant</h4>
        <small v-if="currentTable" class="text-muted">Table: {{ currentTable.table_number }}</small>
      </div>
      <div class="d-flex gap-2">
        <router-link :to="{ name: 'restaurant.tables' }" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i> Tables
        </router-link>
        <button class="btn btn-primary" @click="openNewOrder" v-if="currentTable">
          <i class="bi bi-plus-lg me-1"></i> Nouvelle Commande
        </button>
      </div>
    </div>

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
              <select v-model="invoiceWarehouseId" class="form-select" :class="{ 'is-invalid': !invoiceWarehouseId && invoiceAttempted }">
                <option :value="null" disabled>Sélectionner un dépôt...</option>
                <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                  {{ wh.name }}
                </option>
              </select>
              <div class="invalid-feedback">Le dépôt est obligatoire</div>
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

    <div class="row">
      <!-- Left: Products -->
      <div class="col-lg-5">
        <div class="card">
          <div class="card-header">
            <!-- Warehouse Selection -->
            <div class="mb-2">
              <select v-model="selectedWarehouseId" class="form-select form-select-sm" @change="loadWarehouseProducts">
                <option :value="null" disabled>Sélectionner un dépôt...</option>
                <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                  <i class="bi bi-box"></i> {{ wh.name }} ({{ wh.warehouse_products_count || 0 }} produits)
                </option>
              </select>
            </div>
            <input v-model="searchProduct" type="text" class="form-control form-control-sm" placeholder="Rechercher un produit...">
          </div>
          <div class="card-body" style="max-height: 70vh; overflow-y: auto;">
            <div v-if="!selectedWarehouseId" class="text-center text-muted py-5">
              <i class="bi bi-box-seam fs-1"></i>
              <p>Sélectionnez un dépôt pour voir les produits</p>
            </div>
            <div v-else-if="loading" class="text-center py-4">
              <div class="spinner-border"></div>
            </div>
            <div v-else-if="products.length === 0" class="text-center text-muted py-5">
              <i class="bi bi-inbox fs-1"></i>
              <p>Aucun produit en stock dans ce dépôt</p>
            </div>
            <div v-else class="row g-2">
              <div
                v-for="product in filteredProducts"
                :key="product.id"
                class="col-6"
              >
                <div
                  class="card h-100 product-card"
                  :class="{ 'border-danger': product.stock_quantity <= 0 }"
                  @click="addToOrder(product)"
                  style="cursor: pointer"
                >
                  <div class="card-body p-2 text-center">
                    <h6 class="card-title small mb-1">{{ product.name || product.item_designation }}</h6>
                    <p class="card-text text-primary fw-bold mb-0">{{ formatCurrency(product.selling_price) }}</p>
                    <small class="badge" :class="product.stock_quantity > 5 ? 'bg-success' : (product.stock_quantity > 0 ? 'bg-warning' : 'bg-danger')">
                      Stock: {{ product.stock_quantity }}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Current Order -->
      <div class="col-lg-7">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>
              <strong>{{ currentOrder?.order_number || 'Nouvelle Commande' }}</strong>
              <span v-if="currentOrder" class="badge ms-2" :class="getOrderStatusBadge(currentOrder.status)">
                {{ currentOrder.status }}
              </span>
            </span>
            <select v-model="selectedServerId" class="form-select form-select-sm w-auto">
              <option :value="null">Serveur...</option>
              <option v-for="server in servers" :key="server.id" :value="server.id">
                {{ server.name }}
              </option>
            </select>
          </div>
          <div class="card-body" style="max-height: 50vh; overflow-y: auto;">
            <table class="table table-sm" v-if="orderItems.length > 0">
              <thead>
                <tr>
                  <th>Article</th>
                  <th class="text-center">Qté</th>
                  <th class="text-end">Prix</th>
                  <th class="text-end">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in orderItems" :key="index" :class="{ 'table-danger': item.status === 'cancelled' }">
                  <td>{{ item.product?.name || item.product?.item_designation || item.name }}</td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-secondary" @click="changeQuantity(index, -1)">-</button>
                      <span class="btn btn-outline-secondary disabled">{{ item.quantity }}</span>
                      <button class="btn btn-outline-secondary" @click="changeQuantity(index, 1)">+</button>
                    </div>
                  </td>
                  <td class="text-end">{{ formatCurrency(item.unit_price) }}</td>
                  <td class="text-end">{{ formatCurrency(item.total_price) }}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-danger" @click="removeItem(index)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="text-center text-muted py-5">
              <i class="bi bi-cart fs-1"></i>
              <p>Sélectionnez des produits</p>
            </div>
          </div>
          <div class="card-footer">
            <div class="d-flex justify-content-between mb-3">
              <span class="fs-5">Total:</span>
              <span class="fs-4 fw-bold text-primary">{{ formatCurrency(orderTotal) }}</span>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary flex-fill" @click="clearOrder" :disabled="orderItems.length === 0">
                Annuler
              </button>
              <button class="btn btn-success flex-fill" @click="saveOrder" :disabled="orderItems.length === 0 || saving">
                {{ saving ? 'Enregistrement...' : (currentOrder ? 'Ajouter' : 'Enregistrer') }}
              </button>
              <button
                v-if="currentOrder && currentOrder.status !== 'invoiced'"
                class="btn btn-warning flex-fill"
                @click="goToInvoice"
              >
                <i class="bi bi-receipt me-1"></i> Facturer
              </button>
            </div>
          </div>
        </div>

        <!-- Active Orders for Table -->
        <div class="card mt-3" v-if="tableOrders.length > 0">
          <div class="card-header">Commandes de la table</div>
          <div class="list-group list-group-flush">
            <a
              v-for="order in tableOrders"
              :key="order.id"
              href="#"
              class="list-group-item list-group-item-action d-flex justify-content-between"
              :class="{ active: currentOrder?.id === order.id }"
              @click.prevent="selectOrder(order)"
            >
              <div>
                <strong>{{ order.order_number }}</strong>
                <small class="d-block text-muted">{{ order.items?.length || 0 }} articles</small>
              </div>
              <div class="text-end">
                <span class="badge" :class="getOrderStatusBadge(order.status)">{{ order.status }}</span>
                <div class="fw-bold">{{ formatCurrency(order.total_amount) }}</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import ClientFormModal from '@/views/sales/ClientFormModal.vue';

const route = useRoute();
const router = useRouter();

const products = ref([]);
const servers = ref([]);
const currentTable = ref(null);
const currentOrder = ref(null);
const tableOrders = ref([]);
const orderItems = ref([]);
const searchProduct = ref('');
const selectedServerId = ref(null);
const loading = ref(false);
const saving = ref(false);

// Warehouse management
const warehouses = ref([]);
const selectedWarehouseId = ref(null);

// Client selection for invoice
const customers = ref([]);
const filteredCustomers = ref([]);
const customerSearch = ref('');
const selectedCustomer = ref(null);
const showInvoiceModal = ref(false);
const showNewClientModal = ref(false);
const generatingInvoice = ref(false);
const invoiceWarehouseId = ref(null);
const invoiceAttempted = ref(false);

const filteredProducts = computed(() => {
  if (!searchProduct.value) return products.value;
  const search = searchProduct.value.toLowerCase();
  return products.value.filter(p =>
    (p.name || p.item_designation || '').toLowerCase().includes(search)
  );
});

const orderTotal = computed(() => {
  return orderItems.value
    .filter(i => i.status !== 'cancelled')
    .reduce((sum, item) => sum + (item.total_price || 0), 0);
});

onMounted(async () => {
  await loadWarehouses();
  await loadServers();
  await loadCustomers();

  const tableId = route.query.table;
  if (tableId) {
    await loadTable(tableId);
    await loadTableOrders(tableId);
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  selectedServerId.value = user.id;
});

watch(() => route.query.table, async (tableId) => {
  if (tableId) {
    await loadTable(tableId);
    await loadTableOrders(tableId);
  }
});

async function loadWarehouses() {
  try {
    const { data } = await api.get('/restaurant/warehouses');
    warehouses.value = data.data || [];
    // Auto-select first warehouse if available
    if (warehouses.value.length > 0) {
      selectedWarehouseId.value = warehouses.value[0].id;
      invoiceWarehouseId.value = warehouses.value[0].id;
      await loadWarehouseProducts();
    }
  } catch (error) {
    console.error('Erreur chargement dépôts:', error);
    warehouses.value = [];
  }
}

async function loadWarehouseProducts() {
  if (!selectedWarehouseId.value) {
    products.value = [];
    return;
  }

  loading.value = true;
  try {
    const { data } = await api.get(`/restaurant/warehouses/${selectedWarehouseId.value}/products`);
    products.value = data.data || [];
  } catch (error) {
    console.error('Erreur chargement produits:', error);
    products.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadServers() {
  try {
    const { data } = await api.get('/restaurant/servers');
    servers.value = data.data;
  } catch (error) {
    // Fallback: use current user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    servers.value = [user];
  }
}

async function loadTable(tableId) {
  try {
    const { data } = await api.get(`/restaurant/tables/${tableId}`);
    currentTable.value = data.data;
  } catch (error) {
    console.error('Erreur chargement table:', error);
  }
}

async function loadTableOrders(tableId) {
  try {
    const { data } = await api.get(`/restaurant/tables/${tableId}/orders`);
    tableOrders.value = data.data;
  } catch (error) {
    console.error('Erreur chargement commandes:', error);
  }
}

function addToOrder(product) {
  // Check stock availability
  if (product.stock_quantity <= 0) {
    alert(`Stock insuffisant pour ${product.name || product.item_designation}`);
    return;
  }

  const existing = orderItems.value.find(i => i.product_id === product.id && i.status !== 'cancelled');
  if (existing) {
    // Check if we can add more
    if (existing.quantity >= product.stock_quantity) {
      alert(`Stock insuffisant. Disponible: ${product.stock_quantity}`);
      return;
    }
    existing.quantity += 1;
    existing.total_price = existing.quantity * existing.unit_price;
  } else {
    orderItems.value.push({
      product_id: product.id,
      product: product,
      name: product.name || product.item_designation,
      quantity: 1,
      unit_price: product.selling_price || 0,
      total_price: product.selling_price || 0,
      status: 'pending',
      stock_available: product.stock_quantity,
    });
  }
}

function changeQuantity(index, delta) {
  const item = orderItems.value[index];
  item.quantity = Math.max(1, item.quantity + delta);
  item.total_price = item.quantity * item.unit_price;
}

function removeItem(index) {
  orderItems.value.splice(index, 1);
}

function clearOrder() {
  orderItems.value = [];
  currentOrder.value = null;
}

async function openNewOrder() {
  currentOrder.value = null;
  orderItems.value = [];
}

function selectOrder(order) {
  currentOrder.value = order;
  orderItems.value = (order.items || []).map(item => ({
    ...item,
    name: item.product?.name || item.product?.item_designation,
  }));
}

async function saveOrder() {
  if (!currentTable.value) {
    alert('Veuillez sélectionner une table');
    return;
  }

  saving.value = true;
  try {
    const items = orderItems.value
      .filter(i => i.status !== 'cancelled' && !i.id)
      .map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      }));

    if (currentOrder.value) {
      // Add items to existing order
      if (items.length > 0) {
        await api.post(`/restaurant/orders/${currentOrder.value.id}/items`, { items });
      }
    } else {
      // Create new order
      const { data } = await api.post('/restaurant/orders', {
        table_id: currentTable.value.id,
        server_id: selectedServerId.value,
      });
      currentOrder.value = data.data;

      if (items.length > 0) {
        await api.post(`/restaurant/orders/${currentOrder.value.id}/items`, { items });
      }
    }

    await loadTableOrders(currentTable.value.id);
    orderItems.value = [];

    // Reload current order
    if (currentOrder.value) {
      const { data } = await api.get(`/restaurant/orders/${currentOrder.value.id}`);
      currentOrder.value = data.data;
      orderItems.value = (data.data.items || []).map(item => ({
        ...item,
        name: item.product?.name || item.product?.item_designation,
      }));
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
  } finally {
    saving.value = false;
  }
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

function openInvoiceModal() {
  selectedCustomer.value = null;
  customerSearch.value = '';
  invoiceAttempted.value = false;
  // Pre-select the current warehouse
  invoiceWarehouseId.value = selectedWarehouseId.value || (warehouses.value.length > 0 ? warehouses.value[0].id : null);
  const list = Array.isArray(customers.value) ? customers.value : [];
  filteredCustomers.value = list.slice(0, 10);
  showInvoiceModal.value = true;
}

async function confirmInvoice() {
  invoiceAttempted.value = true;

  if (!currentTable.value || !selectedCustomer.value || !invoiceWarehouseId.value) {
    if (!invoiceWarehouseId.value) {
      alert('Veuillez sélectionner un dépôt');
    }
    return;
  }

  generatingInvoice.value = true;
  try {
    const { data } = await api.post('/restaurant/invoices/generate', {
      table_id: currentTable.value.id,
      customer_id: selectedCustomer.value.id,
      warehouse_id: invoiceWarehouseId.value,
    });
    showInvoiceModal.value = false;
    router.push({ name: 'restaurant.invoice', params: { id: data.data.id } });
  } catch (error) {
    alert(error.response?.data?.message || 'Erreur lors de la génération de la facture');
  } finally {
    generatingInvoice.value = false;
  }
}

function goToInvoice() {
  if (!currentTable.value) return;
  openInvoiceModal();
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
.product-card {
  transition: transform 0.15s, box-shadow 0.15s;
}
.product-card:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
