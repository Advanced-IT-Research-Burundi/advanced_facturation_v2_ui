<template>
  <div class="container-fluid p-0">
    <SettingsHeader />

    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">Méthodes de paiement</h1>
        <p class="text-muted mb-0">Gérez les moyens de paiement proposés à votre entreprise.</p>
      </div>
      <div>
        <button class="btn btn-outline-primary me-2" @click="fetchMethods" :disabled="loading">
          <i class="bi bi-arrow-clockwise"></i> Actualiser
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="bi bi-plus-lg"></i> Ajouter
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger alert-dismissible fade show">
      {{ error }}
      <button class="btn-close" @click="error = ''"></button>
    </div>

    <div class="card shadow-sm">
      <div class="card-body p-0">
        <div v-if="loading" class="text-center py-5">
          <span class="spinner-border text-primary"></span>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Compte associé</th>
                <th class="text-center">Statut</th>
                <th class="text-center" style="width: 120px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="method in methods" :key="method.id">
                <td class="fw-semibold">{{ method.name }}</td>
                <td>{{ methodTypeLabel(method.method_type) }}</td>
                <td>
                  <div>{{ method.account_number || '-' }}</div>
                  <small v-if="method.account_name" class="text-muted">{{ method.account_name }}</small>
                </td>
                <td class="text-center">
                  <span class="badge" :class="method.is_active ? 'bg-success' : 'bg-secondary'">
                    {{ method.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-primary me-1" title="Modifier" @click="openEditModal(method)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" title="Supprimer" @click="deleteMethod(method)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="methods.length === 0">
                <td colspan="5" class="text-center py-5 text-muted">
                  <i class="bi bi-credit-card fs-1 d-block mb-2"></i>
                  Aucune méthode de paiement trouvée.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal fade show d-block" style="background: rgba(0, 0, 0, 0.5)" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingMethod ? 'Modifier la méthode' : 'Nouvelle méthode de paiement' }}</h5>
            <button class="btn-close" @click="closeModal" :disabled="submitting"></button>
          </div>
          <form @submit.prevent="submitForm">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Nom *</label>
                <input v-model.trim="form.name" class="form-control" required maxlength="255" placeholder="Ex. Mobile Money" />
              </div>
              <div class="mb-3">
                <label class="form-label">Type de méthode *</label>
                <select v-model="form.method_type" class="form-select" required>
                  <option value="bank">Banque</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Numéro de compte</label>
                  <input v-model.trim="form.account_number" class="form-control" maxlength="255" placeholder="N° compte ou téléphone" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Nom du compte</label>
                  <input v-model.trim="form.account_name" class="form-control" maxlength="255" placeholder="Titulaire ou opérateur" />
                </div>
              </div>
              <div class="form-check form-switch">
                <input id="payment-method-active" v-model="form.is_active" class="form-check-input" type="checkbox" />
                <label class="form-check-label" for="payment-method-active">Méthode active</label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="submitting">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '@/services/api';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import SettingsHeader from './SettingsHeader.vue';

const methods = ref([]);
const loading = ref(false);
const submitting = ref(false);
const error = ref('');
const showModal = ref(false);
const editingMethod = ref(null);
const { confirm: confirmDialog } = useConfirm();
const toast = useToast();

const form = reactive({
  name: '',
  account_number: '',
  account_name: '',
  method_type: 'bank',
  is_active: true,
});

const resetForm = () => {
  form.name = '';
  form.account_number = '';
  form.account_name = '';
  form.method_type = 'bank';
  form.is_active = true;
};

const fetchMethods = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get('payment-methods');
    methods.value = data.data || [];
  } catch (err) {
    error.value = err.response?.data?.message || 'Impossible de charger les méthodes de paiement.';
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  editingMethod.value = null;
  resetForm();
  showModal.value = true;
};

const openEditModal = (method) => {
  editingMethod.value = method;
  form.name = method.name;
  form.account_number = method.account_number || '';
  form.account_name = method.account_name || '';
  form.method_type = method.method_type || 'bank';
  form.is_active = Boolean(method.is_active);
  showModal.value = true;
};

const closeModal = () => {
  if (submitting.value) return;
  showModal.value = false;
  editingMethod.value = null;
  resetForm();
};

const submitForm = async () => {
  submitting.value = true;
  try {
    const payload = { ...form };
    if (editingMethod.value) {
      await api.patch(`payment-methods/${editingMethod.value.id}`, payload);
      toast.success('Méthode de paiement modifiée avec succès.');
    } else {
      await api.post('payment-methods', payload);
      toast.success('Méthode de paiement créée avec succès.');
    }
    showModal.value = false;
    await fetchMethods();
  } catch (err) {
    error.value = err.response?.data?.message || 'Impossible d’enregistrer la méthode de paiement.';
  } finally {
    submitting.value = false;
  }
};

const deleteMethod = async (method) => {
  if (!(await confirmDialog(`Supprimer la méthode de paiement « ${method.name} » ?`))) return;
  try {
    await api.delete(`payment-methods/${method.id}`);
    toast.success('Méthode de paiement supprimée avec succès.');
    await fetchMethods();
  } catch (err) {
    error.value = err.response?.data?.message || 'Impossible de supprimer la méthode de paiement.';
  }
};

const methodTypeLabel = (type) => ({
  bank: 'Banque',
  mobile_money: 'Mobile Money',
  other: 'Autre',
}[type] || type || '-');

onMounted(fetchMethods);
</script>

<style scoped>
.card { border: none; border-radius: 12px; }
</style>
