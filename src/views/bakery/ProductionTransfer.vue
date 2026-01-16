<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3">
        <i class="bi bi-arrow-right-circle me-2"></i>Transférer vers Vente
      </h1>
      <router-link to="/bakery/production" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left"></i> Retour
      </router-link>
    </div>

    <div v-if="error" class="alert alert-danger alert-dismissible">
      {{ error }}
      <button class="btn-close" @click="error = null"></button>
    </div>

    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">Formulaire de Transfert</h5>
      </div>
      <form @submit.prevent="submitTransfer">
        <div class="card-body">
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <label class="form-label">Entrepôt de destination *</label>
              <select class="form-select" v-model="form.destination_warehouse_id" required>
                <option value="">Sélectionner...</option>
                <option v-for="wh in salesWarehouses" :key="wh.id" :value="wh.id">
                  {{ wh.name }} - {{ wh.location }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Date de transfert *</label>
              <input type="datetime-local" class="form-control" v-model="form.transfer_date" required>
            </div>
            <div class="col-md-4">
              <label class="form-label">Notes</label>
              <input type="text" class="form-control" v-model="form.notes">
            </div>
          </div>

          <div class="d-flex justify-content-between mb-3">
            <h6>Produits à Transférer</h6>
            <button type="button" class="btn btn-sm btn-outline-primary" @click="addItem">
              <i class="bi bi-plus-circle"></i> Ajouter
            </button>
          </div>

          <div v-for="(item, index) in form.items" :key="index" class="card mb-3 border">
            <div class="card-body">
              <div class="row g-2 align-items-end">
                <div class="col-md-7">
                  <label class="form-label small">Produit Fini *</label>
                  <Select
                    v-model="item.product_id"
                    :options="availableFinishedStock(index)"
                    optionValue="product_id"
                    filter
                    placeholder="Sélectionner un produit"
                    class="w-100"
                    required
                  >
                    <template #value="slotProps">
                      <div v-if="slotProps.value">
                        {{ getStockLabel(slotProps.value) }}
                      </div>
                    </template>
                    <template #option="slotProps">
                      <div>
                        <div class="fw-bold">{{ slotProps.option.product?.item_designation }}</div>
                        <small class="text-muted">
                          Stock: {{ slotProps.option.quantity }} {{ slotProps.option.product?.item_measurement_unit }}
                        </small>
                      </div>
                    </template>
                  </Select>
                </div>
                <div class="col-md-4">
                  <label class="form-label small">Quantité *</label>
                  <input type="number" step="0.01" class="form-control" 
                         v-model="item.quantity" required min="0.01"
                         :max="getMaxQuantity(item.product_id)">
                  <small class="text-muted">Max: {{ getMaxQuantity(item.product_id) }}</small>
                </div>
                <div class="col-md-1">
                  <button type="button" class="btn btn-sm btn-outline-danger w-100" 
                          @click="removeItem(index)"
                          :disabled="form.items.length === 1">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
            <i class="bi bi-arrow-right-circle me-1"></i>
            Transférer
          </button>
          <router-link to="/bakery/production" class="btn btn-secondary ms-2">
            Annuler
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Select from 'primevue/select';
import api from '@/services/api';

const router = useRouter();
const route = useRoute();
const submitting = ref(false);
const error = ref(null);
const salesWarehouses = ref([]);
const finishedStock = ref([]);

const form = reactive({
  destination_warehouse_id: '',
  transfer_date: new Date().toISOString().slice(0, 16),
  notes: '',
  items: [{ product_id: '', quantity: '' }]
});

onMounted(async () => {
  try {
    const resp = await api.get('bakery/production/transfer-data');
    if (resp.data.success) {
      salesWarehouses.value = resp.data.data.sales_warehouses;
      finishedStock.value = resp.data.data.finished_stock;

      // Pre-fill si query params
      if (route.query.product_id) {
        form.items[0].product_id = parseInt(route.query.product_id);
        form.items[0].quantity = route.query.quantity || '';
      }
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement';
  }
});

const availableFinishedStock = (currentIndex) => {
  const selectedIds = form.items
    .map((item, idx) => idx !== currentIndex ? item.product_id : null)
    .filter(id => id);
  return finishedStock.value.filter(s => !selectedIds.includes(s.product_id));
};

const getMaxQuantity = (productId) => {
  const stock = finishedStock.value.find(s => s.product_id == productId);
  return stock ? stock.quantity : 0;
};

const getStockLabel = (productId) => {
  const stock = finishedStock.value.find(s => s.product_id == productId);
  return stock?.product?.item_designation || '';
};

const addItem = () => {
  const lastItem = form.items[form.items.length - 1];
  if (!lastItem.product_id || !lastItem.quantity) {
    error.value = 'Veuillez remplir la ligne actuelle';
    return;
  }
  error.value = null;
  form.items.push({ product_id: '', quantity: '' });
};

const removeItem = (index) => {
  form.items.splice(index, 1);
};

const submitTransfer = async () => {
  submitting.value = true;
  try {
    const resp = await api.post('bakery/production/transfer', form);
    if (resp.data.success) {
      router.push({ 
        name: 'BakeryProduction', 
        query: { success: 'Transfert effectué avec succès' }
      });
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur';
  } finally {
    submitting.value = false;
  }
};
</script>