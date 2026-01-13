<template>
  <div class="container-fluid bg-light min-vh-100 p-4">
    <div class="mb-4">
      <h2 class="fw-normal">
        Le Nombre total des clients : <span class="fw-bold">{{ pagination.total || 0 }}</span>
      </h2>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 py-2">
        <button class="btn btn-primary px-4" @click="showAddModal = true">
          Ajouter
        </button>

        <h4 class="m-0 fw-normal text-dark">Liste des clients</h4>

        <div class="search-box" style="width: 300px;">
          <input 
            v-model="search" 
            type="text" 
            class="form-control" 
            placeholder="Rechercher ici" 
          />
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
            <tr v-if="loading">
              <td colspan="8" class="text-center py-5">Chargement...</td>
            </tr>
            <tr v-for="(client, index) in filteredClients" :key="client.id">
              <td class="ps-3 fw-bold">{{ index + 1 }}</td>
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
                <button class="btn btn-outline-danger btn-sm px-3" @click="deleteClient(client.id)">
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ClientsAdd 
      v-if="showAddModal" 
      @close="showAddModal = false" 
      @refresh="fetchClients" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import ClientsAdd from './ClientsAdd.vue';

const clients = ref([]);
const loading = ref(false);
const search = ref('');
const showAddModal = ref(false);
const pagination = ref({ total: 0 });

const fetchClients = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/customers'); //
    if (response.data.success) {
      clients.value = response.data.data.data; //
      pagination.value.total = response.data.data.total; //
    }
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
};

const filteredClients = computed(() => {
  if (!search.value) return clients.value;
  return clients.value.filter(c => c.customer_name.toLowerCase().includes(search.value.toLowerCase()));
});

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return {
    date: d.toISOString().split('T')[0],
    time: d.toTimeString().split(' ')[0]
  };
};

const deleteClient = async (id) => {
  if (confirm("Supprimer ce client ?")) {
    await axios.delete(`/api/customers/${id}`); //
    fetchClients();
  }
};

onMounted(fetchClients);
</script>
<style scoped>
/* Ajustements visuels pour correspondre à l'image */
.table th {
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #212529;
}

.table td {
  font-size: 0.9rem;
  color: #495057;
}

.btn-primary {
  background-color: #9b0e0e; /* Bleu standard Bootstrap */
  border-color: #c51818;
}

/* Bouton supprimer style 'outline' rouge */
.btn-outline-danger {
  border-radius: 4px;
}
</style>