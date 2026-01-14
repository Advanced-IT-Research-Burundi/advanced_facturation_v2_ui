<template>
  <div class="container-fluid">
    <StockHeader />
    
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div v-else-if="product" class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="bi bi-box-seam me-2"></i> {{ product.item_designation }}
        </h2>
        <router-link to="/products" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-2"></i>Retour
        </router-link>
      </div>

      <div class="row g-4">
        <!-- Left Column: Image and Key Info -->
        <div class="col-md-4">
          <div class="card shadow-sm border-0 mb-4">
            <div class="card-body text-center p-4">
                <div v-if="product.image" class="mb-3">
                    <img :src="getImageUrl(product.image)" alt="Product Image" class="img-fluid rounded shadow-sm" style="max-height: 300px; object-fit: contain;">
                </div>
                <div v-else class="mb-3 bg-light d-flex align-items-center justify-content-center rounded" style="height: 250px;">
                    <i class="bi bi-image text-muted display-1"></i>
                    <p class="text-muted ms-2 mb-0">Pas d'image</p>
                </div>
                
                <h4 class="card-title">{{ product.item_designation }}</h4>
                <p class="text-muted">{{ product.item_code }}</p>
                
                <div class="d-grid gap-2 mt-3">
                     <div class="p-2 bg-light rounded d-flex justify-content-between">
                        <strong>Prix:</strong>
                        <span class="fw-bold text-primary">{{ formatPrice(product.price) }}</span>
                     </div>
                     <div class="p-2 bg-light rounded d-flex justify-content-between">
                        <strong>Quantité:</strong>
                        <span :class="{'text-danger': (product.quantite <= product.quantite_alert), 'text-success': (product.quantite > product.quantite_alert)}">
                            {{ product.quantite || 0 }} {{ product.item_measurement_unit }}
                        </span>
                     </div>
                </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Detailed Info -->
        <div class="col-md-8">
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white border-bottom-0 pt-4 px-4">
                    <ul class="nav nav-tabs card-header-tabs" role="tablist">
                        <li class="nav-item">
                            <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#info" type="button">Informations Générales</button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#finance" type="button">Prix & Taxes</button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#stock" type="button">Stock & Détails</button>
                        </li>
                    </ul>
                </div>
                <div class="card-body p-4">
                    <div class="tab-content">
                        <!-- General Info -->
                        <div class="tab-pane fade show active" id="info">
                            <dl class="row">
                                <dt class="col-sm-4">Code Article</dt>
                                <dd class="col-sm-8">{{ product.item_code }}</dd>

                                <dt class="col-sm-4">Désignation</dt>
                                <dd class="col-sm-8">{{ product.item_designation }}</dd>

                                <dt class="col-sm-4">Code Barre</dt>
                                <dd class="col-sm-8">{{ product.barcode || '-' }}</dd>

                                <dt class="col-sm-4">Marque</dt>
                                <dd class="col-sm-8">{{ product.marque || '-' }}</dd>

                                <dt class="col-sm-4">Type/Modèle</dt>
                                <dd class="col-sm-8">{{ product.type || '-' }}</dd>

                                <dt class="col-sm-4">Catégorie</dt>
                                <dd class="col-sm-8">{{ getCategoryName(product.product_category_id) }}</dd>
                                
                                <dt class="col-sm-4">Description</dt>
                                <dd class="col-sm-8">{{ product.description || '-' }}</dd>
                            </dl>
                        </div>

                        <!-- Finance -->
                        <div class="tab-pane fade" id="finance">
                             <dl class="row">
                                <dt class="col-sm-4">Prix HT</dt>
                                <dd class="col-sm-8">{{ formatPrice(product.price) }}</dd>

                                <dt class="col-sm-4">Taux TVA</dt>
                                <dd class="col-sm-8">{{ product.vat_rate }} %</dd>

                                <dt class="col-sm-4">Prix TTC</dt>
                                <dd class="col-sm-8">{{ formatPrice(product.price_ttc) }}</dd>
                                
                                <dt class="col-sm-4">Prix TVAC</dt>
                                <dd class="col-sm-8">{{ formatPrice(product.price_tvac) }}</dd>
                                
                                <h6 class="mt-3 mb-3 text-muted border-bottom pb-2">Limites de Prix</h6>
                                
                                <dt class="col-sm-4">Prix Min</dt>
                                <dd class="col-sm-8">{{ formatPrice(product.price_min) }}</dd>

                                <dt class="col-sm-4">Prix Max</dt>
                                <dd class="col-sm-8">{{ formatPrice(product.price_max) }}</dd>

                                <h6 class="mt-3 mb-3 text-muted border-bottom pb-2">Taxes Additionnelles</h6>
                                
                                <dt class="col-sm-4">Taxe OTT</dt>
                                <dd class="col-sm-8">{{ formatPrice(product.item_ott_tax) }}</dd>

                                <dt class="col-sm-4">Taxe TSCE</dt>
                                <dd class="col-sm-8">{{ formatPrice(product.item_tsce_tax) }}</dd>
                            </dl>
                        </div>

                        <!-- Stock -->
                        <div class="tab-pane fade" id="stock">
                            <dl class="row">
                                <dt class="col-sm-4">Quantité Actuelle</dt>
                                <dd class="col-sm-8 fw-bold">{{ product.quantite || 0 }} {{ product.item_measurement_unit }}</dd>

                                <dt class="col-sm-4">Quantité Alerte</dt>
                                <dd class="col-sm-8 text-danger">{{ product.quantite_alert || 0 }} {{ product.item_measurement_unit }}</dd>

                                <dt class="col-sm-4">Unité de mesure</dt>
                                <dd class="col-sm-8">{{ product.item_measurement_unit }}</dd>

                                <dt class="col-sm-4">Date Expiration</dt>
                                <dd class="col-sm-8">{{ formatDate(product.date_expiration) }}</dd>

                                <dt class="col-sm-4">Compagnie ID</dt>
                                <dd class="col-sm-8">{{ product.company_id }}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center py-5">
        <p class="text-muted">Produit introuvable</p>
        <router-link to="/products" class="btn btn-primary">Retour aux produits</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import StockHeader from '../stocks/StockHeader.vue';
import api from '@/services/api';

const route = useRoute();
const store = useStore();
const product = ref(null);
const loading = ref(true);

// Assuming categories are in store or we need to fetch them
// If they are in store.state.data.categoriesProducts but not guaranteed loaded, we might see IDs only.
const categories = computed(() => store.state.data?.categoriesProducts || []);

onMounted(async () => {
    // If categories aren't loaded in store, try to load them lightly or just ignore name resolution for now
    if (categories.value.length === 0) {
         try {
             const catResp = await api.get('/category-products');
             if(store.state.data) store.state.data.categoriesProducts = catResp.data?.data?.data;
         } catch(e) {}
    }

    const id = route.params.id;
    if (id) {
        try {
            // First try to find in existing store list to be fast
            const existing = store.getters['products/allProducts']?.find(p => p.id == id);
            if (existing) {
                product.value = existing;
            }
            
            // Always fetch fresh data
            const response = await api.get(`/products/${id}`);
            if (response.data.success) {
                product.value = response.data.data;
            } else if (response.data.data) {
                // Handling different potential API structures
                 product.value = response.data.data;
            }
        } catch (error) {
            console.error("Erreur chargement produit:", error);
        } finally {
            loading.value = false;
        }
    }
});

const getCategoryName = (id) => {
  if (!id) return '-';
  const cat = categories.value.find(c => c.id === id);
  return cat ? cat.name : id;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'BIF' }).format(price || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    // Adjust base URL as needed for your backend storage
    // Assuming relative path from public or storage
    return `${imagePath}`; 
};

</script>

<style scoped>
.nav-tabs .nav-link {
    color: #495057;
    cursor: pointer;
}
.nav-tabs .nav-link.active {
    font-weight: bold;
    color: #0d6efd;
}
</style>