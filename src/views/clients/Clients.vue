<template>
  <div class="container-fluid bg-light min-vh-100 p-4">
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
        
        <h4 class="m-0 fw-normal text-dark">Liste des clients</h4>
        
        <div class="search-box" style="width: 300px;">
          <input v-model="search" type="text" class="form-control border-danger-subtle" placeholder="Rechercher ici" />
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
            <tr v-if="loading && filteredClients.length === 0"><td colspan="8" class="text-center py-5 text-danger">Chargement...</td></tr>
            <tr v-else-if="filteredClients.length === 0"><td colspan="8" class="text-center py-5">Aucun client trouvé</td></tr>
            <tr v-for="(client, index) in filteredClients" :key="client.id">
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
                <button class="btn btn-outline-danger btn-sm px-3" @click="handleDelete(client.id)">
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-between align-items-center p-3 border-top">
        <div class="small text-muted">
          Page <strong>{{ pagination.current_page }}</strong> sur <strong>{{ lastPage }}</strong>
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: !pagination.prev_page_url }">
              <button class="page-link text-danger" @click="changePage(pagination.current_page - 1)">Précédent</button>
            </li>
            
            <li class="page-item active">
              <button class="page-link bg-danger border-danger text-white">{{ pagination.current_page }}</button>
            </li>

            <li class="page-item" :class="{ disabled: !pagination.next_page_url }">
              <button class="page-link text-danger" @click="changePage(pagination.current_page + 1)">Suivant</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <ClientsAdd v-if="showAddModal" @close="showAddModal = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import ClientsAdd from './ClientsAdd.vue';

const store = useStore();
const search = ref('');
const showAddModal = ref(false);

const clients = computed(() => store.getters['clients/allClients']);
const totalClients = computed(() => store.getters['clients/totalClients']);
const loading = computed(() => store.getters['clients/isLoading']);
const pagination = computed(() => store.state.clients.pagination);

const lastPage = computed(() => Math.ceil(totalClients.value / 15) || 1);

const fetchClients = (page = 1) => store.dispatch('clients/fetchClients', page);

const changePage = (page) => {
  if (page > 0 && page <= lastPage.value) {
    fetchClients(page);
  }
};

const calculateIndex = (index) => {
  return (pagination.value.current_page - 1) * 15 + (index + 1);
};

const filteredClients = computed(() => {
  if (!search.value) return clients.value;
  return clients.value.filter(c => 
    c.customer_name.toLowerCase().includes(search.value.toLowerCase())
  );
});

const handleDelete = (id) => {
  if (confirm("Supprimer ce client ?")) {
    store.dispatch('clients/deleteClient', id);
  }
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return {
    date: d.toISOString().split('T')[0],
    time: d.toTimeString().split(' ')[0]
  };
};

onMounted(() => fetchClients(1));
</script>

<style scoped>
/* Style personnalisé pour le bouton Rouge */
.btn-red {
  background-color: #c51818;
  border-color: #c51818;
  transition: opacity 0.2s;
}

.btn-red:hover {
  background-color: #9b0e0e;
  color: white;
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