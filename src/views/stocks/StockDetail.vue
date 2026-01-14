<template>
  <div class="container-fluid py-4">
    <!-- Header with Breadcrumbs/Back button -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center">
        <button class="btn btn-outline-secondary me-3 shadow-sm" @click="$router.back()">
          <i class="bi bi-arrow-left"></i> Retour
        </button>
        <h3 class="mb-0 fw-bold text-dark">Détail du Stock</h3>
      </div>
      <div>
        <RouterLink :to="`/stock/${route.params.id}/products`" class="btn btn-success shadow-sm">
          <i class="bi bi-box-seam me-2"></i>Gérer les produits
        </RouterLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="text-muted mt-3">Récupération des informations du stock...</p>
    </div>

    <!-- Stock Data -->
    <div v-else-if="stock" class="row">
      <!-- Centered Warehouse Info -->
      <div class="col-lg-6 mx-auto">
        <div class="card shadow-sm border-0 rounded-4">
          <div class="card-header bg-primary text-white py-3 px-4">
            <h5 class="card-title mb-0"><i class="bi bi-building me-2"></i>Informations Entrepôt</h5>
          </div>
          <div class="card-body p-4 p-md-5">
            <div class="mb-4 text-center">
               <label class="text-muted small text-uppercase fw-bold d-block mb-1">Nom du Site</label>
               <h2 class="fw-bold text-dark mb-0">{{ stock.name }}</h2>
            </div>
            
            <div class="row g-4 mt-2">
              <div class="col-12">
                <label class="text-muted small text-uppercase fw-bold d-block mb-1 text-center">Localisation</label>
                <div class="p-3 bg-light rounded-3 text-center fs-5">
                  <i class="bi bi-geo-alt-fill text-danger me-2"></i>
                  {{ stock.location || 'Localisation non spécifiée' }}
                </div>
              </div>
              
              <div class="col-md-6 border-top pt-3">
                <label class="text-muted small text-uppercase fw-bold d-block mb-1">ID Interne</label>
                <span class="badge bg-secondary px-3 py-2 fs-6">#{{ stock.id }}</span>
              </div>
              
              <div class="col-md-6 border-top pt-3 text-md-end">
                 <label class="text-muted small text-uppercase fw-bold d-block mb-1">Créé le</label>
                 <span class="text-dark fw-semibold">{{ formatDate(stock.created_at) }}</span>
              </div>
            </div>
          </div>
          <div class="card-footer bg-light border-0 py-3 text-center">
             <small class="text-muted italic">Dernière mise à jour : {{ formatDate(stock.updated_at) }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Error/No Data State -->
    <div v-else class="col-md-6 mx-auto">
      <div class="alert alert-warning d-flex align-items-center p-4 rounded-4 shadow-sm" role="alert">
        <i class="bi bi-exclamation-triangle-fill fs-3 me-3"></i>
        <div>
          <h5 class="alert-heading mb-1">Stock introuvable</h5>
          <p class="mb-0">Désolé, nous n'avons pas pu charger les informations. L'ID est peut-être incorrect.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import api from '@/services/api';

const route = useRoute();
const store = useStore();
const stock = ref(null);
const loading = ref(true);

const fetchStock = async (id) => {
  loading.value = true;
  try {
    const response = await api.get(`/stocks/${id}`);
    
    if (response.data.success) {
      const data = response.data.data;
      // The API returns an object with a company object inside it
      stock.value = Array.isArray(data) ? data[0] : data;

      console.log("Stock Loaded:", stock.value);
      
      // Update global store logic
      if (store.state.data) {
        if (!store.state.data.stockItems) store.state.data.stockItems = [];
        const index = store.state.data.stockItems.findIndex(item => item.id == id);
        if (index !== -1) {
          store.state.data.stockItems[index] = stock.value;
        } else {
          store.state.data.stockItems.push(stock.value);
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du stock:", error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

onMounted(() => {
  if (route.params.id) {
    fetchStock(route.params.id);
  } else {
    loading.value = false;
  }
});
</script>

<style scoped>
.rounded-4 {
  border-radius: 1.25rem !important;
}

.bg-light {
  background-color: #f8f9fa !important;
}

.card {
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 0.5rem 1.5rem rgba(0,0,0,0.1) !important;
}
</style>