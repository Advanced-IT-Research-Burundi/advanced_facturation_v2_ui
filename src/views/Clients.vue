<template>
  <div class="container-fluid p-0">
    <h1 class="h3 mb-4">Clients</h1>
    <!-- Search bar -->
    <div class="input-group mb-3">
      <span class="input-group-text bg-white border-end-0 text-muted"><Search :size="18"/></span>
      <input v-model="search" type="text" class="form-control bg-white border-start-0" placeholder="Rechercher un client..." />
    </div>
    <!-- Modern Bootstrap table -->
    <div class="table-responsive">
      <table class="table table-hover table-striped">
        <thead class="table-dark">
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Téléphone</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in filteredClients" :key="client.id">
            <td>{{ client.name }}</td>
            <td>{{ client.email }}</td>
            <td>{{ client.phone }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Search } from 'lucide-vue-next';

const search = ref('');
const clients = ref([
  { id: 1, name: 'Entreprise A', email: 'contact@entreprisea.com', phone: '+257 123 456' },
  { id: 2, name: 'Client B', email: 'clientb@example.com', phone: '+257 987 654' },
  { id: 3, name: 'Société C', email: 'info@societec.bi', phone: '+257 555 777' },
]);

const filteredClients = computed(() => {
  if (!search.value) return clients.value;
  const term = search.value.toLowerCase();
  return clients.value.filter(c =>
    c.name.toLowerCase().includes(term) ||
    c.email.toLowerCase().includes(term) ||
    c.phone.toLowerCase().includes(term)
  );
});
</script>
