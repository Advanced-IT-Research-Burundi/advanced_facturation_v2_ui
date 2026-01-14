<script setup>
import api from '@/services/api';
import { Search, Plus, Package, AlertTriangle } from 'lucide-vue-next';
import { onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import StockHeader from './StockHeader.vue';

const router = useRouter();
const store = useStore();
onMounted(() => {
  fetchStocks();
});

const fetchStocks = async () => {

    const response = await api.get('/stocks');
    store.state.data.stockItems = response.data?.data;
  
}

const stockItems = computed(() => store.state.data.stockItems);

const navigateToStock = (id) => {
  router.push(`/stock/${id}`);
}
</script>

<template>
  <div>
    <StockHeader />
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Inventaire de Stock</h1>
    </div>

    <!-- Inventory Grid -->
    <div class="row g-4">
      <div v-for="item in stockItems" :key="item.id" class="col-12 col-md-6 col-lg-4 col-xl-3 cursor-pointer" style="cursor: pointer;" @click="navigateToStock(item.id)">
        <div class="card glass h-100 border-0 shadow-sm position-relative overflow-hidden group-hover-effect">
          
          <div v-if="item.warning" class="position-absolute top-0 end-0 p-2 text-warning">
             <AlertTriangle :size="20" />
          </div>

          <div class="card-body">
            <div class="d-flex align-items-start mb-3">
              <div class="p-3 bg-light rounded-3 text-secondary me-3">
                <Package :size="24" />
              </div>
              <div>
                <h5 class="card-title mb-0 text-truncate" style="max-width: 30ch;">{{ item.name }}</h5>
                <small class="text-muted text-uppercase fw-semibold">{{ item.location }}</small>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-end mt-2">
              <div>
                <span class="d-block text-muted small mb-1">Niveau de Stock</span>
                <span class="fs-4 fw-bold" :class="{'text-warning': item.stock < 20 && item.stock > 0, 'text-danger': item.stock === 0, 'text-dark': item.stock >= 20}">
                  {{ item.stock }}
                </span>
              </div>
              <span class="badge bg-light text-dark border">{{ item.company }}</span>
            </div>
          </div>
          
          <!-- Hover Line -->
          <div class="card-footer p-0 bg-primary bottom-bar" :style="{height: '4px', transform: 'scaleX(0)', transition: 'transform 0.3s', transformOrigin: 'left'}"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-hover-effect:hover .bottom-bar {
  transform: scaleX(1) !important;
}
.group-hover-effect {
  transition: transform 0.2s;
}
.group-hover-effect:hover {
  transform: translateY(-5px);
}
</style>
