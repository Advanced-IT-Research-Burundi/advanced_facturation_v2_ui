<template>
  <div class="import-history-page">
    <StockHeader />
      <div class="table-card">
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Reference DMC</th>
                <th>Produit</th>
                <th>Code</th>
                <th class="text-end">Quantite</th>
                <th>Unite</th>
                <th class="text-end">Prix</th>
                <th>Type</th>
                <th>Statut OBR</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="10" class="text-center py-5 text-muted">
                  Chargement de l'historique...
                </td>
              </tr>

              <tr v-else-if="movements.length === 0">
                <td colspan="10" class="text-center py-5 text-muted">
                  Aucun mouvement d'importation trouve.
                </td>
              </tr>

              <tr v-for="(movement, index) in movements" :key="movement.id">
                <td class="fw-bold text-muted">{{ rowIndex(index) }}</td>
                <td>{{ formatDate(movement.item_movement_date) }}</td>
                <td>
                  <span class="badge text-bg-light border">{{ movement.reference_dmc || '-' }}</span>
                </td>
                <td>
                  <div class="fw-semibold">{{ movement.item_designation || '-' }}</div>
                  <small class="text-muted">{{ movement.item_product_name || '-' }}</small>
                </td>
                <td>{{ movement.item_code || '-' }}</td>
                <td class="text-end fw-semibold">
                  {{ formatNumber(movement.item_quantity) }}
                </td>
                <td>{{ movement.item_measurement_unit || '-' }}</td>
                <td class="text-end">
                  {{ formatMoney(movement.item_cost_price) }} {{ movement.item_cost_price_currency || '' }}
                </td>
                <td>
                  <span class="movement-badge" :class="movementClass(movement.item_movement_type)">
                    {{ movement.item_movement_type || '-' }}
                  </span>
                </td>
                <td>
                  <span class="status-pill" :class="obrClass(movement.obr_status)">
                    {{ movement.obr_status || 'N/A' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import StockHeader from "../stocks/StockHeader.vue";
import api from "@/services/api";

const loading = ref(false);
const movements = ref([]);

const filters = ref({
  search: "",
  movement_type: "",
  date_from: "",
  date_to: "",
});

const pagination = ref({
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
});

const visiblePages = computed(() => {
  const pages = [];
  const current = pagination.value.current_page || 1;
  const last = pagination.value.last_page || 1;

  const start = Math.max(1, current - 2);
  const end = Math.min(last, current + 2);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
});

const buildParams = () => ({
  page: pagination.value.current_page,
  per_page: pagination.value.per_page,
  search: filters.value.search || undefined,
  movement_type: filters.value.movement_type || undefined,
  date_from: filters.value.date_from || undefined,
  date_to: filters.value.date_to || undefined,
});

const fetchMovements = async () => {
  loading.value = true;
  try {
    const response = await api.get("/mouvement_stock_importations", {
      params: buildParams(),
    });

    if (response.status !== 200) {
      throw new Error("Erreur lors de la récupération des mouvements d'importation.");
    }

      movements.value = response.data?.mouvementStockImportations?.data || [];
      pagination.value = {
        current_page: response.data?.mouvementStockImportations?.current_page || 1,
        per_page: response.data?.mouvementStockImportations?.per_page || 15,
        total: response.data?.mouvementStockImportations?.total || 0,
        last_page: response.data?.mouvementStockImportations?.last_page || 1,
        from: response.data?.mouvementStockImportations?.from || 0,
        to: response.data?.mouvementStockImportations?.to || 0,
      };
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  pagination.value.current_page = 1;
  fetchMovements();
};

const resetFilters = () => {
  filters.value = {
    search: "",
    movement_type: "",
    date_from: "",
    date_to: "",
  };
  pagination.value.current_page = 1;
  fetchMovements();
};

const changePage = (page) => {
  if (page < 1 || page > pagination.value.last_page) return;
  pagination.value.current_page = page;
  fetchMovements();
};

const rowIndex = (index) => {
  return (pagination.value.from || 0) + index;
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("fr-FR").format(Number(value));
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("fr-FR").format(Number(value));
};

const movementClass = (type) => {
  if (!type) return "movement-neutral";
  return String(type).startsWith("E") ? "movement-in" : "movement-out";
};

const obrClass = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "PENDING") return "status-pending";
  if (normalized === "ACCEPTED") return "status-accepted";
  if (normalized === "REJECTED") return "status-rejected";
  return "status-neutral";
};

onMounted(() => {
  fetchMovements();
});
</script>
