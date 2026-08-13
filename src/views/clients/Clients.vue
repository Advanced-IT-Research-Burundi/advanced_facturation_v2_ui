<template>
  <div class="container-fluid bg-light">
    <div class="mb-4">
      <h2 class="fw-normal">
        Le Nombre total des clients : <span class="fw-bold text-danger">{{ totalClients }}</span>
      </h2>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 py-2">
        <button class="btn btn-red px-4 text-white" @click="showAddModal = true">
          <i class="bi bi-plus-lg me-1"></i> Ajouter
        </button>
        
        <div class="d-flex align-items-center gap-2">
          <h4 class="m-0 fw-normal text-dark">Liste des clients</h4>
        </div>
        
        <div class="search-box" style="width: 300px;">
          <input v-model="search" @input="handleSearch" type="text" class="form-control border-danger-subtle" placeholder="Rechercher ici" />
        </div>
      </div>
    </div>

    <div class="bg-white border rounded shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light text-uppercase small fw-bold">
            <tr>
              <th class="py-3 ps-3">#</th>
              <th class="py-3">NUMERO</th>
              <th class="py-3">NOM</th>
              <th class="py-3">TELEPHONE</th>
              <th class="py-3">NIF</th>
              <th class="py-3">Adresse</th>
              <th class="py-3">Date</th>
              <th class="py-3 text-end pe-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && clients.length === 0"><td colspan="8" class="text-center py-5">Aucun client trouvé</td></tr>
            <tr v-for="(client, index) in clients" :key="client.id">
              <td class="ps-3 fw-bold">{{ calculateIndex(index) }}</td>
              <td>{{ client.id }}</td>
              <td class="fw-medium">{{ client.customer_name }}</td>
              <td>{{ client.customer_phone || '' }}</td>
              <td>{{ client.customer_TIN || '' }}</td>
              <td>{{ client.customer_address || '' }}</td>
              <td>
                <div class="d-flex flex-column small">
                  <span>{{ formatDate(client.created_at).date }}</span>
                  <span class="text-muted">{{ formatDate(client.created_at).time }}</span>
                </div>
              </td>
              <td class="text-end pe-3">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-outline-primary btn-sm px-3" @click="openEditModal(client)">
                    <i class="bi bi-pencil me-1"></i>Modifier
                  </button>
                  <button class="btn btn-outline-danger btn-sm px-3" @click="handleDelete(client.id)">
                    <i class="bi bi-trash me-1"></i>Supprimer
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-between align-items-center p-3 border-top">
        <div class="small text-muted">
          Page <strong>{{ pagination?.current_page || 1 }}</strong> sur <strong>{{ lastPage }}</strong>
        </div>
        <nav v-if="lastPage > 1">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: !pagination?.prev_page_url }">
              <button class="page-link text-danger" @click="changePage((pagination?.current_page || 1) - 1)">Précédent</button>
            </li>
            
            <li class="page-item active">
              <button class="page-link bg-danger border-danger text-white">{{ pagination?.current_page || 1 }}</button>
            </li>

            <li class="page-item" :class="{ disabled: !pagination?.next_page_url }">
              <button class="page-link text-danger" @click="changePage((pagination?.current_page || 1) + 1)">Suivant</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <ClientsAdd v-if="showAddModal" @close="handleModalClose" />

    <!-- Modal Modifier Client -->
    <div v-if="editClient" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="editClient = null">
      <div class="modal-card bg-white p-4 rounded shadow-lg" style="width: 90%; max-width: 1100px;">
        <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
          <h4 class="fw-normal">Modifier le client</h4>
          <button class="btn-close" @click="editClient = null"></button>
        </div>

        <form @submit.prevent="saveEdit">
          <div class="row g-4 mb-4">
            <div class="col-md-4">
              <label class="form-label text-muted small fw-bold text-uppercase">
                Type de Client <span class="text-danger">*</span>
              </label>
              <select v-model="editForm.type" class="form-select mb-3" required>
                <option value="">--- SELECT ---</option>
                <option value="PERSONNE PHYSIQUE">PERSONNE PHYSIQUE OU SOCIETE ETRANGERE</option>
                <option value="PERSONNE MORAL">PERSONNE MORAL</option>
              </select>

              <label class="form-label text-muted small fw-bold text-uppercase">
                Nif du client <span v-if="editForm.type === 'PERSONNE MORAL'" class="text-danger">*</span>
              </label>
              <input
                v-model="editForm.customer_TIN"
                type="text"
                :required="editForm.type === 'PERSONNE MORAL'"
                class="form-control border-success-subtle"
              />
            </div>

            <div class="col-md-4">
              <label class="form-label text-muted small fw-bold text-uppercase">
                Client assujeti a la TVA ou non <span class="text-danger">*</span>
              </label>
              <select v-model="editForm.vat_customer_payer" class="form-select mb-3" required>
                <option value="Non assujetti">Non assujetti</option>
                <option value="assujetti à la TVA">assujetti à la TVA</option>
              </select>

              <label class="form-label text-muted small fw-bold text-uppercase">Telephone</label>
              <input v-model="editForm.customer_phone" type="text" class="form-control border-success-subtle" />
            </div>

            <div class="col-md-4">
              <label class="form-label text-muted small fw-bold text-uppercase">
                Nom <span class="text-danger">*</span>
              </label>
              <input v-model="editForm.customer_name" type="text" class="form-control border-success-subtle mb-3" required />

              <label class="form-label text-muted small fw-bold text-uppercase">Adresse</label>
              <input v-model="editForm.customer_address" type="text" class="form-control border-success-subtle" />
            </div>
          </div>

          <div v-if="editError" class="alert alert-danger py-2 small text-center mb-3">{{ editError }}</div>

          <div class="d-flex justify-content-center gap-3">
            <button type="button" class="btn btn-secondary px-4 py-2" @click="editClient = null">Annuler</button>
            <button type="submit" class="btn btn-red px-5 py-2 text-white fw-bold" :disabled="isSavingEdit">
              {{ isSavingEdit ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import ClientsAdd from './ClientsAdd.vue';
import { useConfirm } from '@/composables/useConfirm';

const store = useStore();
const search = ref('');
const showAddModal = ref(false);
const searchTimeout = ref(null);
const perPage = 15;
const { confirm: confirmDialog } = useConfirm();

const editClient = ref(null);
const isSavingEdit = ref(false);
const editError = ref('');
const editForm = reactive({
  customer_name: '',
  customer_TIN: '',
  customer_phone: '',
  customer_address: '',
  vat_customer_payer: 'Non assujetti',
  type: '',
});

const clients = computed(() => store.getters['clients/allClients']);
const totalClients = computed(() => store.getters['clients/totalClients']);
const loading = computed(() => store.getters['clients/isLoading']);
const pagination = computed(() => store.state.clients.pagination);

const lastPage = computed(() => pagination.value?.last_page || 1);

// Recherche côté serveur avec debounce
const fetchClients = (page = 1, searchTerm = search.value) => {
  store.dispatch('clients/fetchClients', { page, search: searchTerm });
};

// Debounce sur la recherche
const handleSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    fetchClients(1, search.value);
  }, 400);
};

const changePage = (page) => {
  if (page > 0 && page <= lastPage.value) {
    fetchClients(page, search.value);
  }
};

const calculateIndex = (index) => {
  const currentPage = pagination.value?.current_page || 1;
  return (currentPage - 1) * perPage + (index + 1);
};

const handleDelete = async (id) => {
  if (await confirmDialog("Supprimer ce client ?")) {
    const result = await store.dispatch('clients/deleteClient', id);
    if (result.success) {
      // Recharger la page actuelle ou la précédente si la page est vide
      const currentPage = pagination.value.current_page;
      const shouldGoBack = clients.value.length === 1 && currentPage > 1;
      fetchClients(shouldGoBack ? currentPage - 1 : currentPage, search.value);
    }
  }
};

const openEditModal = (client) => {
  editClient.value = client;
  editError.value = '';
  editForm.customer_name = client.customer_name || '';
  editForm.customer_TIN = client.customer_TIN || '';
  editForm.customer_phone = client.customer_phone || '';
  editForm.customer_address = client.customer_address || '';
  editForm.vat_customer_payer = client.vat_customer_payer || 'Non assujetti';
  editForm.type = client.type || 'PERSONNE PHYSIQUE';
};

const saveEdit = async () => {
  if (!editForm.customer_name || !editForm.type) {
    editError.value = 'Veuillez remplir les champs obligatoires.';
    return;
  }

  if (editForm.type === 'PERSONNE MORAL' && !editForm.customer_TIN?.trim()) {
    editError.value = 'Le NIF du client est obligatoire pour un client de type personne morale.';
    return;
  }

  isSavingEdit.value = true;
  editError.value = '';
  try {
    const result = await store.dispatch('clients/updateClient', {
      id: editClient.value.id,
      data: { ...editForm },
    });
    if (result.success) {
      editClient.value = null;
      fetchClients(pagination.value?.current_page || 1, search.value);
    } else {
      editError.value = result.message || 'Erreur lors de la modification';
    }
  } catch (e) {
    editError.value = e.response?.data?.message || 'Erreur lors de la modification';
  } finally {
    isSavingEdit.value = false;
  }
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return {
    date: d.toISOString().split('T')[0],
    time: d.toTimeString().split(' ')[0]
  };
};

const handleModalClose = () => {
  showAddModal.value = false;
  // Recharger les clients après ajout
  fetchClients(1, search.value);
};

onMounted(() => {
  const lastQuery = store.getters['clients/lastQuery'] || {};
  search.value = lastQuery.search || '';
  fetchClients(lastQuery.page || 1, search.value);
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 9999;
}

.modal-card {
  animation: fadeInDown 0.3s ease-out;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.btn-red {
  background-color: #c51818;
  border-color: #c51818;
  transition: opacity 0.2s;
}

.btn-red:hover {
  background-color: #9b0e0e;
  color: white;
}

.border-success-subtle {
  border-color: #a3cfbb !important;
}


/* Table styles */
.table th {
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #212529;
}

/* Pagination styles */
.page-link {
  color: #c51818;
  border-color: #dee2e6;
}

.page-link:hover {
  color: #9b0e0e;
  background-color: #fff5f5;
}

.page-item.active .page-link {
  background-color: #c51818 !important;
  border-color: #c51818 !important;
}

.border-danger-subtle {
  border-color: #f5c2c7 !important;
}
</style>
