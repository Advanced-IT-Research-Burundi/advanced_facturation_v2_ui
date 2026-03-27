<template>
  <div class="container-fluid p-0">
    <!-- Header -->
    <depense-header></depense-header>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3">Catégories de Dépenses</h1>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="bi bi-plus-lg"></i> Nouvelle Catégorie
      </button>
    </div>

    <!-- Table -->
    <div class="card shadow-sm">
      <div class="card-body">
        <div v-if="loading && categories.length === 0" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 30%;">Nom</th>
                <th>Description</th>
                <th class="text-center" style="width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in categories" :key="cat.id">
                <td class="fw-bold text-primary">{{ cat.name }}</td>
                <td class="text-muted">{{ cat.description || '-' }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-primary me-1" @click="openEditModal(cat)" title="Modifier">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(cat)" title="Supprimer">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="categories.length === 0">
                <td colspan="3" class="text-center py-5 text-muted">Aucune catégorie trouvée.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit/Create Modal -->
    <div v-if="showModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Modifier' : 'Nouvelle' }} Catégorie</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm" id="catForm">
              <div class="mb-3">
                <label class="form-label">Nom *</label>
                <input type="text" class="form-control" v-model="form.name" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" v-model="form.description" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button type="submit" form="catForm" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref, reactive } from "vue";
import { useStore } from "vuex";
import DepenseHeader from "./DepenseHeader.vue";
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const store = useStore();
const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

// State
const showModal = ref(false);
const submitting = ref(false);
const isEditing = ref(false);

const form = reactive({
  id: null,
  name: "",
  description: "",
});

const categories = computed(() => store.getters["expenses/allCategories"]);
const loading = computed(() => store.getters["expenses/isLoading"]);
const pagination = computed(() => store.getters["expenses/paginationCategories"]);

onMounted(() => {
  store.dispatch("expenses/fetchCategories");
});

const openCreateModal = () => {
  isEditing.value = false;
  form.id = null;
  form.name = "";
  form.description = "";
  showModal.value = true;
};

const openEditModal = (cat) => {
  isEditing.value = true;
  form.id = cat.id;
  form.name = cat.name;
  form.description = cat.description;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const submitForm = async () => {
  submitting.value = true;
  let res;
  if (isEditing.value) {
    res = await store.dispatch("expenses/updateCategory", { id: form.id, data: { ...form } });
  } else {
    res = await store.dispatch("expenses/createCategory", { ...form });
  }
  submitting.value = false;
  if (res.success) closeModal();
  else toast.error(res.message);
};

const confirmDelete = async (cat) => {
  if (await confirmDialog(`Supprimer la catégorie "${cat.name}"?`)) {
    await store.dispatch("expenses/deleteCategory", cat.id);
  }
};
</script>

<style scoped>
.card { border: none; border-radius: 12px; }
</style>