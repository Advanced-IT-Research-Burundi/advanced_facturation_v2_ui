<script setup>
import { onMounted, ref } from 'vue';
import { Boxes, RefreshCw } from 'lucide-vue-next';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';
import FinanceHeader from './FinanceHeader.vue';

const toast = useToast();
const loading = ref(true);
const stocks = ref([]);

const formatCurrency = (amount, currency = 'FBU') =>
  `${new Intl.NumberFormat('fr-FR').format(Number(amount) || 0)} ${currency || 'FBU'}`;

const fetchStockValue = async () => {
  loading.value = true;
  try {
    const response = await api.get('/reports/stock-sheet', {
      params: { per_page: 1 },
    });
    stocks.value = response.data?.data?.summary?.value_by_warehouse || [];
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors du chargement de la valeur du stock');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchStockValue);
</script>

<template>
  <div class="container-fluid p-0">
    <FinanceHeader />

    <div class="d-flex justify-content-between align-items-center gap-3 mb-4">
      <h1 class="h3 mb-0">Valeur du stock</h1>
      <button class="btn btn-outline-secondary" :disabled="loading" @click="fetchStockValue">
        <RefreshCw :size="18" :class="{ 'spin': loading }" />
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else-if="stocks.length" class="row g-4">
      <div
        v-for="stock in stocks"
        :key="stock.warehouse_id"
        class="col-12 col-md-6 col-xl-4"
      >
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="stock-icon d-flex align-items-center justify-content-center">
              <Boxes :size="28" />
            </div>
            <div class="min-w-0">
              <p class="text-muted mb-1">{{ stock.warehouse_name }}</p>
              <h3 class="stock-value mb-0">{{ formatCurrency(stock.total_value) }}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-muted py-5">
      Aucun stock disponible.
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 8px;
}

.stock-icon {
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 8px;
  color: var(--bs-primary);
  background: rgba(var(--bs-primary-rgb), 0.1);
}

.min-w-0 {
  min-width: 0;
}

.stock-value {
  font-size: 1.35rem;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
