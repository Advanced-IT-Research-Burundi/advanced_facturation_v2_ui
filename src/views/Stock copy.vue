<script setup>
import { Search, Plus, Package, AlertTriangle } from 'lucide-vue-next';

const stockItems = [
  { id: 1, name: 'Souris Sans Fil M100', sku: 'WM-100', category: 'Accessoires', stock: 124, warning: false },
  { id: 2, name: 'Clavier Mécanique K95', sku: 'MK-95', category: 'Périphériques', stock: 12, warning: true },
  { id: 3, name: 'Moniteur HD 24"', sku: 'MON-24', category: 'Affichage', stock: 8, warning: true },
  { id: 4, name: 'Câble USB-C 2m', sku: 'CAB-C2', category: 'Câbles', stock: 500, warning: false },
  { id: 5, name: 'SSD Externe 1TB', sku: 'SSD-1T', category: 'Stockage', stock: 45, warning: false },
  { id: 6, name: 'Chaise Ergonomique', sku: 'CH-ERG', category: 'Mobilier', stock: 0, warning: true },
];
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Inventaire de Stock</h1>
      <button class="btn btn-primary d-flex align-items-center gap-2">
        <Plus :size="18" />
        Ajouter Article
      </button>
    </div>

    <!-- Inventory Grid -->
    <div class="row g-4">
      <div v-for="item in stockItems" :key="item.id" class="col-12 col-md-6 col-lg-4 col-xl-3">
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
                <h5 class="card-title mb-0 text-truncate" style="max-width: 15ch;">{{ item.name }}</h5>
                <small class="text-muted text-uppercase fw-semibold">{{ item.sku }}</small>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-end mt-2">
              <div>
                <span class="d-block text-muted small mb-1">Niveau de Stock</span>
                <span class="fs-4 fw-bold" :class="{'text-warning': item.stock < 20 && item.stock > 0, 'text-danger': item.stock === 0, 'text-dark': item.stock >= 20}">
                  {{ item.stock }}
                </span>
              </div>
              <span class="badge bg-light text-dark border">{{ item.category }}</span>
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
