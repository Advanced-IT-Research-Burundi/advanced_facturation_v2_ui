<script setup>
import { Eye, Pencil, Trash, Search } from "lucide-vue-next";

const props = defineProps({
  proformas: {
    type: Array,
    required: true,
  },
  isLoading: Boolean,
  searchText: String,
});

const emit = defineEmits([
  "update:searchText",
  "view",
  "edit",
  "delete",
  "create",
]);

const formatPrice = (price) => {
  return typeof price === "number" ? price.toLocaleString() : "0";
};
</script>

<template>
  <div class="d-flex flex-column h-100 bg-white p-4 overflow-auto">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">Gestion des Proformas Service</h4>
      <button
        @click="$emit('create')"
        class="btn btn-primary d-flex align-items-center gap-2"
      >
        Nouveau Proforma
      </button>
    </div>

    <div class="mb-3">
      <div class="input-group">
        <span class="input-group-text bg-light"><Search :size="18" /></span>
        <input
          :value="searchText"
          @input="$emit('update:searchText', $event.target.value)"
          type="text"
          class="form-control"
          placeholder="Rechercher par N°, client..."
        />
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <div v-else class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="bg-light">
          <tr>
            <th>N° Proforma</th>
            <th>Date</th>
            <th>Client</th>
            <th>Montant HT</th>
            <th>Total TTC</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="proforma in proformas" :key="proforma.id">
            <td class="fw-bold">{{ proforma.id }}</td>
            <td>{{ new Date(proforma.date).toLocaleDateString() }}</td>
            <td>
              <div>{{ proforma.client_name }}</div>
              <small class="text-muted">{{ proforma.client_number }}</small>
            </td>
            <td>{{ formatPrice(proforma.totals.total_ht) }}</td>
            <td class="fw-bold">
              {{ formatPrice(proforma.totals.total_ttc) }}
              {{ proforma.currency }}
            </td>
            <td>
              <span class="badge bg-warning text-dark">{{
                proforma.status
              }}</span>
            </td>
            <td>
              <button
                @click="$emit('view', proforma)"
                class="btn btn-sm btn-info text-white me-1"
              >
                <Eye :size="16" />
              </button>
              <button
                @click="$emit('edit', proforma)"
                class="btn btn-sm btn-primary text-white me-1"
              >
                <Pencil :size="16" />
              </button>
              <button
                @click="$emit('delete', proforma)"
                class="btn btn-sm btn-danger text-white"
              >
                <Trash :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
