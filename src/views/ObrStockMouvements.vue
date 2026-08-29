<template>
  <div class="obr-mouvements-container">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Historique des mouvements de stock OBR</h1>
        <p class="page-subtitle">Suivi des mouvements de stock envoyés à l'OBR</p>
      </div>
      <button class="btn btn-secondary" @click="fetchObrMouvements">
        Actualiser
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group filter-search">
        <label>Recherche</label>
        <input
          type="text"
          v-model="filters.search"
          placeholder="Désignation, code, facture..."
          @keyup.enter="applyFilters"
        />
      </div>

      <div class="filter-group">
        <label>Statut OBR</label>
        <select v-model="filters.status" @change="applyFilters">
          <option value="all">Tous</option>
          <option value="ACCEPTED">Accepté</option>
          <option value="REJECTED">Rejeté</option>
          <option value="PENDING">En attente</option>
        </select>
      </div>

      <button class="btn btn-primary" @click="applyFilters">Rechercher</button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="mouvements-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Facture</th>
            <th>Code</th>
            <th>Désignation</th>
            <th>Qté</th>
            <th>Prix</th>
            <th>Type</th>
            <th>Statut OBR</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mvt in mouvements" :key="mvt.id">
            <td>{{ formatDate(mvt.item_movement_date) }}</td>
            <td>
              <span class="invoice-number">{{ mvt.item_movement_invoice_ref || '-' }}</span>
            </td>
            <td>{{ mvt.item_code || '-' }}</td>
            <td>{{ mvt.item_designation || '-' }}</td>
            <td>{{ mvt.item_quantity }} {{ mvt.item_measurement_unit }}</td>
            <td>{{ formatPrice(mvt.item_purchase_or_sale_price) }} {{ mvt.item_purchase_or_sale_currency }}</td>
            <td>{{ mvt.item_movement_type }}</td>
            <td>
              <span class="status-badge" :class="(mvt.obr_submission_status || '').toLowerCase()">
                {{ getStatusLabel(mvt.obr_submission_status) }}
              </span>
            </td>
          </tr>
          <tr v-if="!loading && mouvements.length === 0">
            <td colspan="8" class="empty-cell">Aucun mouvement trouvé</td>
          </tr>
          <tr v-if="loading">
            <td colspan="8" class="empty-cell">Chargement...</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination.total > pagination.per_page">
      <button
        class="page-btn"
        :disabled="pagination.current_page === 1"
        @click="changePage(pagination.current_page - 1)"
      >
        Précédent
      </button>
      <span class="page-info">
        Page {{ pagination.current_page }} sur {{ pagination.last_page }} ({{ pagination.total }} résultats)
      </span>
      <button
        class="page-btn"
        :disabled="pagination.current_page === pagination.last_page"
        @click="changePage(pagination.current_page + 1)"
      >
        Suivant
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";

const toast = useToast();

const mouvements = ref([]);
const loading = ref(false);

const filters = ref({
  search: "",
  status: "all",
});

const pagination = ref({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
});

const fetchObrMouvements = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.current_page,
      per_page: pagination.value.per_page,
    };

    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.status !== "all") params.status = filters.value.status;

    const response = await api.get("/obr-mouvements-stock", { params });
    if (response.data.success) {
      const data = response.data.data;
      mouvements.value = data.data || [];
      pagination.value = {
        current_page: data.current_page,
        per_page: data.per_page,
        total: data.total,
        last_page: data.last_page,
      };
    }
  } catch (error) {
    console.error("Error fetching OBR mouvements:", error);
    toast.error("Erreur lors de la récupération des mouvements OBR");
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  pagination.value.current_page = 1;
  fetchObrMouvements();
};

const changePage = (page) => {
  pagination.value.current_page = page;
  fetchObrMouvements();
};

const getStatusLabel = (status) => {
  const labels = {
    ACCEPTED: "Accepté",
    REJECTED: "Rejeté",
    PENDING: "En attente",
  };
  return labels[status] || status || "-";
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-FR");
};

const formatPrice = (value) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("fr-FR").format(value);
};

onMounted(() => {
  fetchObrMouvements();
});
</script>

<style lang="scss" scoped>
.obr-mouvements-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
}

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-search {
  flex: 1;
  min-width: 220px;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}

.filter-group select,
.filter-group input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  min-width: 150px;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mouvements-table {
  width: 100%;
  border-collapse: collapse;
}

.mouvements-table th,
.mouvements-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.mouvements-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.mouvements-table tbody tr:hover {
  background: #f9fafb;
}

.invoice-number {
  font-family: monospace;
  font-size: 0.875rem;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.accepted { background: #d1fae5; color: #065f46; }
.status-badge.rejected { background: #fee2e2; color: #dc2626; }
.status-badge.pending { background: #fef3c7; color: #92400e; }

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group select,
  .filter-group input {
    width: 100%;
  }
}
</style>
