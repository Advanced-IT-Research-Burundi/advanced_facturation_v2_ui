<template>
  <div class="container-fluid py-4">
    <!-- En-tête -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3">
          <i class="bi bi-box-arrow-right me-2 text-danger"></i>
          Sortie Multiple
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
      <div class="card-header bg-danger text-white">
        <h5 class="mb-0">
          <i class="bi bi-dash-circle me-2"></i>Formulaire de Sortie
        </h5>
      </div>
      <div class="card-body">
        <!-- Informations générales -->
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label fw-bold">Type de sortie *</label>
            <select class="form-select" v-model="form.movement_type">
              <option value="SN">SN - Sortie Normale</option>
              <option value="SV">SV - Sortie par Vente</option>
              <option value="SP">SP - Sortie par Perte</option>
              <option value="SD">SD - Sortie par Détérioration</option>
              <option value="SC">SC - Sortie par Consommation</option>
              <option value="SAJ">SAJ - Sortie par Ajustement</option>
              <option value="SAU">SAU - Sortie Autre</option>
            </select>
          </div>
          <!-- <div class="col-md-6">
            <label class="form-label fw-bold">Référence facture</label>
            <input type="text" class="form-control" v-model="form.invoice_ref"
                   placeholder="Ex: FAC-2024-001">
          </div> -->
        </div>

        <!-- Liste des produits -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0 fw-bold">Produits</h6>
          <button type="button" class="btn btn-sm btn-outline-danger" @click="addItem">
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
                <small class="text-muted">Max: {{ getStockQuantity(item.product_id) }}</small>
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
          <button @click="submitBulkExit" class="btn btn-danger" :disabled="submitting">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-check-circle me-2"></i>
            Enregistrer la Sortie
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

const form = ref({
  movement_type: 'SN',
  invoice_ref: '',
  items: [{ product_id: '', quantity: '' }]
});

const availableStocksFiltered = computed(() => {
  const selectedIds = form.value.items.map(item => item.product_id).filter(id => id);
  return stocks.value.filter(s => !selectedIds.includes(s.product_id));
});

onMounted(async () => {
  loading.value = true;
  try {
    const resp = await api.get(`warehouses/${warehouseId}/dashboard`);
    if (resp.data.success) {
      warehouse.value = resp.data.data.warehouse;
      stocks.value = resp.data.data.stocks;
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

const submitBulkExit = async () => {
  // Validation
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
    const resp = await api.post(`warehouses/${warehouseId}/bulk-exit`, form.value);
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      setTimeout(() => {
        router.push(`/stock/${warehouseId}/movements`);
      }, 2000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement';
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