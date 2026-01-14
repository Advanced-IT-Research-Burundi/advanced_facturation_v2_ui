<template>
  <div class="container-fluid">
    <StockHeader />

    <div class="row mb-4 mt-3">
      <div class="col-md-6">
        <h1>Produits</h1>
      </div>
      <div class="col-md-6 text-end">
        <button class="btn btn-primary" @click="openModal()">
          <i class="bi bi-plus-circle me-2"></i>Nouveau Produit
        </button>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Rechercher (Code, Designation...)" 
              v-model="searchQuery"
              @input="handleSearch"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
        </div>
        
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Code</th>
                <th>Désignation</th>
                <th>Catégorie</th>
                <th>Marque</th>
                <th>Prix</th>
                <th>Quantité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td>{{ product.item_code }}</td>
                <td>{{ product.item_designation }}</td>
                <td>{{ getCategoryName(product.product_category_id) }}</td>
                <td>{{ product.marque || '-' }}</td>
                <td>{{ formatPrice(product.price) }}</td>
                <td>
                  <span :class="{'text-danger fw-bold': isLowStock(product)}">
                    {{ product.quantite || 0 }} {{ product.item_measurement_unit }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openModal(product)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(product)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="products && products.length === 0">
                <td colspan="7" class="text-center py-4">Aucun produit trouvé</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <nav v-if="pagination.total > 0" class="mt-3">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: !pagination.prev_page_url }">
              <button class="page-link" @click="changePage(pagination.current_page - 1)">Précédent</button>
            </li>
            <li class="page-item disabled">
              <span class="page-link">Page {{ pagination.current_page }} sur {{ Math.ceil(pagination.total / 15) }}</span>
            </li> <!-- Assuming default per page is 15 or similar, just showing current page is safer -->
            <li class="page-item" :class="{ disabled: !pagination.next_page_url }">
              <button class="page-link" @click="changePage(pagination.current_page + 1)">Suivant</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal fade" id="productModal" tabindex="-1" aria-hidden="true" ref="modalRef">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Modifier le Produit' : 'Nouveau Produit' }}</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            
            <!-- Tabs Navigation -->
            <ul class="nav nav-tabs mb-3">
              <li class="nav-item">
                <button class="nav-link" :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'" type="button">Général</button>
              </li>
              <li class="nav-item">
                <button class="nav-link" :class="{ active: activeTab === 'prices' }" @click="activeTab = 'prices'" type="button">Prix & Taxes</button>
              </li>
              <li class="nav-item">
                <button class="nav-link" :class="{ active: activeTab === 'details' }" @click="activeTab = 'details'" type="button">Détails</button>
              </li>
            </ul>

            <!-- Tabs Content -->
            <form @submit.prevent="saveProduct">
              <div class="tab-content">
                
                <!-- Tab 1: General -->
                <div class="tab-pane fade" :class="{ 'show active': activeTab === 'general' }" v-show="activeTab === 'general'">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Code Article <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" v-model="form.item_code" required maxlength="255">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Désignation <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" v-model="form.item_designation" required maxlength="255">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Unité de Mesure <span class="text-danger">*</span></label>
                
                      <select class="form-select" v-model="form.item_measurement_unit">
                        <option :value="null">Sélectionner une unité</option>
                        <option v-for="unit in product_units" :key="unit.name" :value="unit.id">
                          {{ unit.name }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Code Barre</label>
                      <input type="text" class="form-control" v-model="form.barcode" maxlength="255">
                    </div>
                    <div class="col-md-6">
                       
                      <label class="form-label">Catégorie</label>
                      <select class="form-select" v-model="form.product_category_id">
                        <option :value="null">Sélectionner une catégorie</option>
                        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                      </select>
                    </div>
                 
                    <div class="col-md-6">
                       <label class="form-label">Marque</label>
                       <input type="text" class="form-control" v-model="form.marque" maxlength="255">
                    </div>
                     <div class="col-md-6">
                       <label class="form-label">Type / Model</label>
                       <input type="text" class="form-control" v-model="form.type" maxlength="255">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Code Produit (Interne)</label>
                      <input type="text" class="form-control" v-model="form.code_product" maxlength="255">
                    </div>
                  </div>
                </div>

                <!-- Tab 2: Pricing & Tax -->
                <div class="tab-pane fade" :class="{ 'show active': activeTab === 'prices' }" v-show="activeTab === 'prices'">
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label">Prix <span class="text-muted">(HT)</span></label>
                      <input type="number" class="form-control" v-model.number="form.price" min="0" step="0.01">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Taux TVA (%) <span class="text-danger">*</span></label>
                      <input type="number" class="form-control" v-model.number="form.vat_rate" required min="0" max="100" step="0.01">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Prix TTC</label>
                      <input type="number" class="form-control" v-model.number="form.price_ttc" min="0" step="0.01">
                    </div>
                     <div class="col-md-4">
                      <label class="form-label">Prix Min</label>
                      <input type="number" class="form-control" v-model.number="form.price_min" min="0" step="0.01">
                    </div>
                     <div class="col-md-4">
                      <label class="form-label">Prix Max</label>
                      <input type="number" class="form-control" v-model.number="form.price_max" min="0" step="0.01">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Prix TVAC</label>
                      <input type="number" class="form-control" v-model.number="form.price_tvac" min="0" step="0.01">
                    </div>
                     <div class="col-md-6">
                      <label class="form-label">Taxe OTT</label>
                      <input type="number" class="form-control" v-model.number="form.item_ott_tax" min="0" step="0.01">
                    </div>
                     <div class="col-md-6">
                      <label class="form-label">Taxe TSCE</label>
                      <input type="number" class="form-control" v-model.number="form.item_tsce_tax" min="0" step="0.01">
                    </div>
                  </div>
                </div>

                <!-- Tab 3: Details -->
                <div class="tab-pane fade" :class="{ 'show active': activeTab === 'details' }" v-show="activeTab === 'details'">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Quantité</label>
                      <input type="number" class="form-control" v-model.number="form.quantite" min="0">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Quantité Alerte</label>
                      <input type="number" class="form-control" v-model.number="form.quantite_alert" min="0">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Date Expiration</label>
                      <input type="datetime-local" class="form-control" v-model="form.date_expiration">
                    </div>
                     <div class="col-md-6">
                      <label class="form-label">Unité Produit (ID)</label>
                      <select class="form-select" v-model="form.product_unit_id">
                        <option :value="null">Sélectionner une unité</option>
                        <option v-for="unit in product_units" :key="unit.id" :value="unit.id">
                          {{ unit.name }}
                        </option>
                      </select>
                    </div>
                     <div class="col-12">
                      <label class="form-label">Image URL/Fichier</label>
                      <input type="file" class="form-control mb-2" @change="form.image = $event.target.files[0]" placeholder="URL ou Chemin de l'image">
                    </div>
                    <div class="col-12">
                      <label class="form-label">Description</label>
                      <textarea class="form-control" v-model="form.description" rows="3"></textarea>
                    </div>
                  </div>
                </div>

              </div>

              <div class="modal-footer mt-4">
                <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer</button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { Modal } from 'bootstrap';
import StockHeader from '../stocks/StockHeader.vue';
import api from '@/services/api';

const store = useStore();
const searchQuery = ref('');
const modalRef = ref(null);
const activeTab = ref('general');
let modalInstance = null;

onMounted(async () => {
    const resp = await api.get('/category-products');
  const resp2 = await api.get('/product-units');
  const resp3 = await api.get('/products');
  store.state.data.categoriesProducts = resp.data?.data?.data;
  store.state.data.product_units = resp2.data?.data?.data;
});

// State
const products = computed(() => store.getters['products/allProducts']);
const loading = computed(() => store.getters['products/isLoading']);
const pagination = computed(() => store.state.products.pagination);
const categories = computed(() => store.state.data.categoriesProducts);
const product_units = computed(() => store.state.data.product_units);

const isEditing = ref(false);
const editId = ref(null);

const defaultForm = {
  item_code: '',
  item_designation: '',
  item_measurement_unit: '',
  barcode: '',
  vat_rate: 0,
  //company_id: 1, // Defaulting to 1 as it is required
  product_unit_id: null,
  product_category_id: null,
  code_product: '',
  marque: '',
  quantite: 0,
  quantite_alert: 0,
  price: 0,
  price_ttc: 0,
  price_max: 0,
  price_min: 0,
  price_tvac: 0,
  item_ott_tax: 0,
  item_tsce_tax: 0,
  date_expiration: null,
  image: '',
  type: '',
  description: ''
};

const form = ref({ ...defaultForm });

onMounted(() => {
  store.dispatch('products/fetchProducts', { page: 1, search: '' });
  store.dispatch('products/fetchCategories');
  
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value);
  }
});

const handleSearch = () => {
  // Debounce could be added here
  store.dispatch('products/fetchProducts', { page: 1, search: searchQuery.value });
};

const changePage = (page) => {
  store.dispatch('products/fetchProducts', { page, search: searchQuery.value });
};

const getCategoryName = (id) => {
  if (!id) return '-';
  const cat = categories.value.find(c => c.id === id);
  return cat ? cat.name : id;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'BIF' }).format(price || 0); // Assuming BIF or local currency
};

const isLowStock = (product) => {
  return (product.quantite || 0) <= (product.quantite_alert || 0);
};

const openModal = (product = null) => {
  if (product) {
    isEditing.value = true;
    editId.value = product.id;
    // Copy product to form, ensuring nulls are handled if form requires specific types
    form.value = { ...defaultForm, ...product };
  } else {
    isEditing.value = false;
    editId.value = null;
    form.value = { ...defaultForm };
  }
  modalInstance?.show();
};

const closeModal = () => {
  modalInstance?.hide();
  form.value = { ...defaultForm };
  isEditing.value = false;
};

const saveProduct = async () => {
  // Format Payload if necessary (e.g. date formats)
  const payload = { ...form.value };
  
  let result;
  if (isEditing.value) {
    result = await store.dispatch('products/updateProduct', { id: editId.value, data: payload });
  } else {
    result = await store.dispatch('products/createProduct', payload);
  }

  if (result.success) {
    closeModal();
  } else {
    alert('Erreur lors de l\'enregistrement: ' + JSON.stringify(result.errors || result.error));
  }
};

const confirmDelete = async (product) => {
  if (confirm(`Voulez-vous vraiment supprimer le produit "${product.item_designation}" ?`)) {
    const result = await store.dispatch('products/deleteProduct', product.id);
    if (!result.success) {
      alert('Erreur lors de la suppression');
    }
  }
};

</script>

<style scoped>
/* Add any custom styles here if not using Tailwind/Bootstrap utilities */
</style>
