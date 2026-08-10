<template>
  <div class="container-fluid py-4">
    <!-- En-tête -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3">
          <i class="bi bi-box-arrow-in-down me-2 text-success"></i>
          Entrée Multiple
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
      <div class="card-header bg-success text-white">
        <h5 class="mb-0">
          <i class="bi bi-plus-circle me-2"></i>Formulaire d'Entrée 
        </h5>
      </div>
      <div class="card-body">
        <!-- Informations générales -->
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label fw-bold">Type d'entrée *</label>
            <select class="form-select" v-model="form.movement_type" required>
              <option value="EN">EN - Entrée Normale</option>
              <option value="ER">ER - Entrée par Retour</option>
              <option value="EI">EI - Entrée par Inventaire</option>
              <option value="EAJ">EAJ - Entrée par Ajustement</option>
              <option value="EAU">EAU - Entrée Autre</option>
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
          <button type="button" class="btn btn-sm btn-outline-success" @click="addItem">
            <i class="bi bi-plus-circle"></i> Ajouter un produit
          </button>
        </div>

        <div v-for="(item, index) in form.items" :key="index" class="card mb-3 border">
          <div class="card-body">
            <div class="row g-3 align-items-end">
              <div class="col-md-4">
                <label class="form-label small fw-bold">Produit *</label>
                <Select
                  v-model="item.product_id"
                  :options="getAvailableProductsForItem(index)"
                  optionLabel="item_designation"
                  optionValue="id"
                  filter
                  filterPlaceholder="Rechercher un produit..."
                  placeholder="Sélectionner un produit"
                  class="w-100"
                  showClear
                  :pt="{ panel: { class: 'select-panel-high' } }"
                >
                  <template #option="slotProps">
                    <div>
                      <div class="fw-bold">{{ slotProps.option.item_designation }}</div>
                      <small class="text-muted">{{ slotProps.option.item_code }}</small>
                    </div>
                  </template>
                </Select>
              </div>
              <div class="col-md-2">
                <label class="form-label small fw-bold">Quantité *</label>
                <input type="number" step="0.01" class="form-control" 
                       v-model="item.quantity" min="0.01"
                       placeholder="0.00">
              </div>
              <div class="col-md-2">
                <label class="form-label small fw-bold">Prix Unitaire *</label>
                <input type="number" step="0.01" class="form-control" 
                       v-model="item.unit_price" min="0"
                       placeholder="0.00">
              </div>
              <div class="col-md-1">
                <label class="form-label small fw-bold">Devise *</label>
                <select class="form-select" v-model="item.currency">
                  <option value="BIF">BIF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label small fw-bold">Date expiration</label>
                <input type="date" class="form-control" v-model="item.date_expiration">
              </div>
              <div class="col-md-1 text-end">
                <button type="button" class="btn btn-sm btn-outline-danger" 
                        @click="removeItem(index)"
                        :disabled="form.items.length === 1">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            <div v-if="item.quantity && item.unit_price" class="mt-2">
              <span class="badge bg-success fs-6">
                Montant : {{ new Intl.NumberFormat('fr-FR').format(item.quantity * item.unit_price) }} {{ item.currency }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="card-footer bg-light">
        <div class="d-flex justify-content-end gap-2">
          <router-link :to="`/stock/${warehouseId}/movements`" class="btn btn-secondary">
            Annuler
          </router-link>
          <button @click="submitBulkEntry" class="btn btn-success" :disabled="submitting">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-check-circle me-2"></i>
            Enregistrer l'Entrée
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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
const availableProducts = ref([]);

const form = ref({
  movement_type: 'EN',
  invoice_ref: '',
  items: [{ product_id: '', quantity: '', unit_price: '', currency: 'BIF', date_expiration: '' }]
});

const getAvailableProductsForItem = (index) => {
  const currentProductId = form.value.items[index]?.product_id;
  const selectedIds = form.value.items
    .filter((_, itemIndex) => itemIndex !== index)
    .map(item => item.product_id)
    .filter(id => id);

  return availableProducts.value.filter(product => (
    product.id === currentProductId || !selectedIds.includes(product.id)
  ));
};

onMounted(async () => {
  loading.value = true;
  try {
    const resp = await api.get(`warehouses/${warehouseId}/dashboard`);
    if (resp.data.success) {
      warehouse.value = resp.data.data.warehouse;
      availableProducts.value = resp.data.data.available_products;
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement des données';
  } finally {
    loading.value = false;
  }
});

const addItem = () => {
  const lastItem = form.value.items[form.value.items.length - 1];
  if (!lastItem.product_id || !lastItem.quantity || !lastItem.unit_price) {
    error.value = 'Veuillez remplir la ligne actuelle avant d\'en ajouter une nouvelle';
    setTimeout(() => error.value = null, 3000);
    return;
  }
  form.value.items.push({ 
    product_id: '', 
    quantity: '', 
    unit_price: '', 
    currency: 'BIF', 
    date_expiration: '' 
  });
};

const removeItem = (index) => {
  form.value.items.splice(index, 1);
};

const submitBulkEntry = async () => {
  // Validation
  for (const item of form.value.items) {
    if (!item.product_id || !item.quantity || !item.unit_price) {
      error.value = 'Veuillez remplir tous les champs obligatoires';
      window.scrollTo(0, 0);
      return;
    }
  }

  submitting.value = true;
  try {
    const resp = await api.post(`warehouses/${warehouseId}/bulk-entry`, form.value);
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
