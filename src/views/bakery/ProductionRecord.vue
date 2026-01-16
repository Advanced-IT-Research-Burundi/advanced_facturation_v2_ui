<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3">
        <i class="bi bi-plus-circle me-2"></i>Enregistrer Production
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
      <div class="card-header bg-success text-white">
        <h5 class="mb-0">Formulaire de Production</h5>
      </div>
      <form @submit.prevent="submitProduction">
        <div class="card-body">
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <label class="form-label">Date de production *</label>
              <input type="datetime-local" class="form-control" v-model="form.production_date" required>
            </div>
            <div class="col-md-4">
              <label class="form-label">Numéro de lot</label>
              <input type="text" class="form-control" v-model="form.batch_number"
                     placeholder="Auto-généré si vide">
            </div>
            <div class="col-md-4">
              <label class="form-label">Notes</label>
              <input type="text" class="form-control" v-model="form.notes">
            </div>
          </div>

          <div class="d-flex justify-content-between mb-3">
            <h6>Produits Finis Fabriqués</h6>
            <button type="button" class="btn btn-sm btn-outline-primary" @click="addItem">
              <i class="bi bi-plus-circle"></i> Ajouter
            </button>
          </div>

          <div v-for="(item, index) in form.items" :key="index" class="card mb-3 border">
            <div class="card-body">
              <div class="row g-2 align-items-end">
                <div class="col-md-4">
                  <label class="form-label small">Produit Fini *</label>
                  <Select
                    v-model="item.product_id"
                    :options="availableFinishedProducts(index)"
                    optionLabel="item_designation"
                    optionValue="id"
                    filter
                    placeholder="Sélectionner un produit"
                    class="w-100"
                    required
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
                  <label class="form-label small">Quantité *</label>
                  <input type="number" step="0.01" class="form-control" 
                         v-model="item.quantity" required min="0.01">
                </div>
                <div class="col-md-2">
                  <label class="form-label small">Prix unitaire *</label>
                  <input type="number" step="0.01" class="form-control" 
                         v-model="item.unit_price" required min="0">
                </div>
                <div class="col-md-3">
                  <label class="form-label small">Devise *</label>
                  <select class="form-select" v-model="item.currency" required>
                    <option value="BIF">BIF</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
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
          <button type="submit" class="btn btn-success" :disabled="submitting">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
            <i class="bi bi-check-circle me-1"></i>
            Enregistrer Production
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
import { useRouter } from 'vue-router';
import Select from 'primevue/select';
import api from '@/services/api';

const router = useRouter();
const loading = ref(false);
const submitting = ref(false);
const error = ref(null);
const finishedProducts = ref([]);

const form = reactive({
  production_date: new Date().toISOString().slice(0, 16),
  batch_number: '',
  notes: '',
  items: [{ product_id: '', quantity: '', unit_price: '', currency: 'BIF' }]
});

onMounted(async () => {
  try {
    const resp = await api.get('bakery/production/finished-products');
    if (resp.data.success) {
      finishedProducts.value = resp.data.data;
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement des produits';
  }
});

const availableFinishedProducts = (currentIndex) => {
  const selectedIds = form.items
    .map((item, idx) => idx !== currentIndex ? item.product_id : null)
    .filter(id => id);
  return finishedProducts.value.filter(p => !selectedIds.includes(p.id));
};

const addItem = () => {
  const lastItem = form.items[form.items.length - 1];
  if (!lastItem.product_id || !lastItem.quantity || !lastItem.unit_price) {
    error.value = 'Veuillez remplir la ligne actuelle avant d\'ajouter une nouvelle';
    return;
  }
  error.value = null;
  form.items.push({ product_id: '', quantity: '', unit_price: '', currency: 'BIF' });
};

const removeItem = (index) => {
  form.items.splice(index, 1);
};

const submitProduction = async () => {
  submitting.value = true;
  try {
    const resp = await api.post('bakery/production/record', form);
    if (resp.data.success) {
      router.push({ 
        name: 'BakeryProduction', 
        query: { success: 'Production enregistrée avec succès' }
      });
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    submitting.value = false;
  }
};
</script>