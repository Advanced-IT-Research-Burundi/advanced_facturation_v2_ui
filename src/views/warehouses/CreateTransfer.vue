<template>
  <div class="container-fluid py-4">
    <!-- En-tête -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3">
          <i class="bi bi-arrow-left-right me-2 text-info"></i>
          Créer un Transfert
        </h2>
        <small class="text-muted">{{ warehouse?.name }} - {{ warehouse?.location }}</small>
      </div>
      <router-link :to="`/stock/${warehouseId}/movements`" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left"></i> Retour
      </router-link>
    </div>

    <!-- Messages -->
    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
      <i class="bi bi-check-circle me-2"></i>{{ successMessage }}
      <button class="btn-close" @click="successMessage = null"></button>
    </div>
    <div v-if="error" class="alert alert-danger alert-dismissible fade show">
      <i class="bi bi-exclamation-circle me-2"></i>{{ error }}
      <button class="btn-close" @click="error = null"></button>
    </div>

    <!-- Formulaire -->
    <div class="card shadow-sm">
      <div class="card-header bg-info text-white">
        <h5 class="mb-0">
          <i class="bi bi-box-arrow-right me-2"></i>Formulaire de Transfert
        </h5>
      </div>
      <div class="card-body">
        <!-- Entrepôts Source et Destination -->
        <div class="row g-3 mb-4">
          <div class="col-md-5">
            <label class="form-label fw-bold">Entrepôt Source</label>
            <input type="text" class="form-control" :value="`${warehouse?.name} - ${warehouse?.location}`" readonly>
          </div>
          <div class="col-md-2 text-center pt-4">
            <i class="bi bi-arrow-right fs-1 text-info"></i>
          </div>
          <div class="col-md-5">
            <label class="form-label fw-bold">Entrepôt Destination *</label>
            <select class="form-select" v-model="form.destination_warehouse_id">
              <option value="">Sélectionner...</option>
              <option v-for="wh in availableWarehouses" :key="wh.id" :value="wh.id">
                {{ wh.name }} - {{ wh.location }}
              </option>
            </select>
          </div>
        </div>

        <!-- Notes -->
        <div class="mb-4">
          <label class="form-label fw-bold">Notes / Référence</label>
          <textarea class="form-control" v-model="form.notes" rows="3"
                    placeholder="Notes ou référence du transfert..."></textarea>
        </div>

        <!-- Liste des produits -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0 fw-bold">Produits à transférer</h6>
          <button type="button" class="btn btn-sm btn-outline-info" @click="addItem">
            <i class="bi bi-plus-circle"></i> Ajouter un produit
          </button>
        </div>

        <div v-for="(item, index) in form.items" :key="index" class="card mb-3 border">
          <div class="card-body">
            <div class="row g-3 align-items-end">
              <div class="col-md-7">
                <label class="form-label small fw-bold">Produit *</label>
                <Select
                  v-model="item.product_id"
                  :options="index === form.items.length - 1 ? availableStocksFiltered : stocks"
                  optionValue="product_id"
                  filter
                  filterPlaceholder="Rechercher un produit..."
                  placeholder="Sélectionner un produit"
                  class="w-100"
                  showClear
                  :pt="{ panel: { class: 'select-panel-high' } }"
                >
                  <template #value="slotProps">
                    <div v-if="slotProps.value">
                      {{ stocks.find(s => s.product_id === slotProps.value)?.product?.item_designation }}
                    </div>
                    <div v-else class="text-muted">Sélectionner un produit</div>
                  </template>
                  <template #option="slotProps">
                    <div>
                      <div class="fw-bold">{{ slotProps.option.product?.item_designation }}</div>
                      <small class="text-muted">Stock: {{ slotProps.option.quantity }} {{ slotProps.option.product?.item_measurement_unit }}</small>
                    </div>
                  </template>
                </Select>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Quantité *</label>
                <input type="number" step="0.01" class="form-control" 
                       v-model="item.quantity" min="0.01"
                       :max="getStockQuantity(item.product_id)"
                       placeholder="0.00">
                <small class="text-muted">Disponible: {{ getStockQuantity(item.product_id) }}</small>
              </div>
              <div class="col-md-1 text-end">
                <button type="button" class="btn btn-sm btn-outline-danger" 
                        @click="removeItem(index)"
                        :disabled="form.items.length === 1">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-footer bg-light">
        <div class="d-flex justify-content-end gap-2">
          <router-link :to="`/stock/${warehouseId}/movements`" class="btn btn-secondary">
            Annuler
          </router-link>
          <button @click="submitTransfer" class="btn btn-info" :disabled="submitting">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-send me-2"></i>
            Créer le Transfert
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Select from 'primevue/select';
import api from '@/services/api';

const route = useRoute();
const router = useRouter();
const warehouseId = route.params.id;

const loading = ref(false);
const submitting = ref(false);
const error = ref(null);
const successMessage = ref(null);

const warehouse = ref(null);
const stocks = ref([]);
const availableWarehouses = ref([]);

const form = ref({
  destination_warehouse_id: '',
  notes: '',
  items: [{ product_id: '', quantity: '' }]
});

const availableStocksFiltered = computed(() => {
  const selectedIds = form.value.items.map(item => item.product_id).filter(id => id);
  return stocks.value.filter(s => !selectedIds.includes(s.product_id));
});

onMounted(async () => {
  loading.value = true;
  try {
    const [dashboardResp, warehousesResp] = await Promise.all([
      api.get(`warehouses/${warehouseId}/dashboard`),
      api.get(`warehouses/${warehouseId}/available`)
    ]);

    if (dashboardResp.data.success) {
      warehouse.value = dashboardResp.data.data.warehouse;
      stocks.value = dashboardResp.data.data.stocks;
    }

    if (warehousesResp.data.success) {
      availableWarehouses.value = warehousesResp.data.data;
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement des données';
  } finally {
    loading.value = false;
  }
});

const getStockQuantity = (productId) => {
  const stock = stocks.value.find(s => s.product_id == productId);
  return stock ? stock.quantity : 0;
};

const addItem = () => {
  const lastItem = form.value.items[form.value.items.length - 1];
  if (!lastItem.product_id || !lastItem.quantity) {
    error.value = 'Veuillez remplir la ligne actuelle avant d\'en ajouter une nouvelle';
    setTimeout(() => error.value = null, 3000);
    return;
  }
  form.value.items.push({ product_id: '', quantity: '' });
};

const removeItem = (index) => {
  form.value.items.splice(index, 1);
};

const submitTransfer = async () => {
  // Validation
  if (!form.value.destination_warehouse_id) {
    error.value = 'Veuillez sélectionner un entrepôt de destination';
    window.scrollTo(0, 0);
    return;
  }

  for (const item of form.value.items) {
    if (!item.product_id || !item.quantity) {
      error.value = 'Veuillez remplir tous les champs obligatoires';
      window.scrollTo(0, 0);
      return;
    }
    
    if (parseFloat(item.quantity) > getStockQuantity(item.product_id)) {
      error.value = 'Quantité supérieure au stock disponible';
      window.scrollTo(0, 0);
      return;
    }
  }

  submitting.value = true;
  try {
    const resp = await api.post(`warehouses/${warehouseId}/transfers`, form.value);
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      setTimeout(() => {
        router.push(`/stock/${warehouseId}/movements`);
      }, 2000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de la création du transfert';
    window.scrollTo(0, 0);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.card {
  border-radius: 12px;
}

:deep(.p-select-overlay) {
  z-index: 1060 !important;
}

:deep(.p-select) {
  width: 100%;
}

.select-panel-high {
  max-height: 300px;
}
</style>