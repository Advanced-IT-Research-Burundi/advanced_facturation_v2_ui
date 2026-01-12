<script setup>
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User } from 'lucide-vue-next';
import { ref, computed } from 'vue';

// Mock Product Data
const products = ref([
  { id: 1, name: 'Souris Sans Fil M100', price: 25000, category: 'Accessoires', stock: 124 },
  { id: 2, name: 'Clavier Mécanique K95', price: 150000, category: 'Périphériques', stock: 12 },
  { id: 3, name: 'Moniteur HD 24"', price: 450000, category: 'Affichage', stock: 8 },
  { id: 4, name: 'Câble USB-C 2m', price: 15000, category: 'Câbles', stock: 500 },
  { id: 5, name: 'SSD Externe 1TB', price: 280000, category: 'Stockage', stock: 45 },
  { id: 6, name: 'Chaise Ergonomique', price: 350000, category: 'Mobilier', stock: 5 },
  { id: 7, name: 'Casque Audio Pro', price: 85000, category: 'Audio', stock: 20 },
  { id: 8, name: 'Webcam 1080p', price: 120000, category: 'Périphériques', stock: 15 },
]);

const cart = ref([]);
const searchQuery = ref('');
const selectedCategory = ref('Tous');

const categories = computed(() => {
  const cats = new Set(products.value.map(p => p.category));
  return ['Tous', ...cats];
});

const filteredProducts = computed(() => {
  return products.value.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory = selectedCategory.value === 'Tous' || product.category === selectedCategory.value;
    return matchesSearch && matchesCategory;
  });
});

const addToCart = (product) => {
  const existingItem = cart.value.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.value.push({ ...product, quantity: 1 });
  }
};

const removeFromCart = (id) => {
  cart.value = cart.value.filter(item => item.id !== id);
};

const updateQuantity = (id, delta) => {
  const item = cart.value.find(item => item.id === id);
  if (item) {
    const newQty = item.quantity + delta;
    if (newQty > 0) item.quantity = newQty;
  }
};

const cartTotal = computed(() => {
  return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0);
});

const formatPrice = (price) => {
  return price.toLocaleString() + ' FBU';
};

const activeTab = ref('POS');
const invoiceTypes = [
  { id: 'POS', label: 'POS / Vente Directe' },
  { id: 'Service', label: 'Facture Service' },
  { id: 'Caution', label: 'Remboursement Caution' },
  { id: 'Avoir', label: 'Facture d\'Avoir' }
];
</script>

<template>
  <div class="d-flex flex-column overflow-hidden" style="margin: -1.5rem;">
    <!-- Tabs Header -->
    <div class="bg-white border-bottom px-3 pt-2">
      <ul class="nav nav-tabs border-bottom-0">
        <li class="nav-item" v-for="type in invoiceTypes" :key="type.id">
          <a class="nav-link text-dark cursor-pointer" :class="{ active: activeTab === type.id }" @click="activeTab = type.id">
            {{ type.label }}
          </a>
        </li>
      </ul>
    </div>

    <div class="row flex-grow-1 g-0 overflow-hidden">
      
      <!-- Left Side: Content Area -->
      <div class="d-flex flex-column bg-light border-end" :class="activeTab === 'POS' ? 'col-12 col-lg-8' : 'col-12'">
        
        <!-- POS View -->
        <template v-if="activeTab === 'POS'">
          <!-- Search & Filter Header -->
          <div class="p-3 bg-white border-bottom shadow-sm z-1">
            <div class="row g-2">
              <div class="col-md-6">
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 text-muted"><Search :size="18"/></span>
                  <input v-model="searchQuery" type="text" class="form-control bg-light border-start-0" placeholder="Rechercher un produit...">
                </div>
              </div>
              <div class="col-md-6">
                <div class="d-flex gap-2 overflow-auto pb-1" style="scrollbar-width: none;">
                  <button 
                    v-for="cat in categories" 
                    :key="cat"
                    @click="selectedCategory = cat"
                    class="btn btn-sm text-nowrap"
                    :class="selectedCategory === cat ? 'btn-primary' : 'btn-outline-secondary'"
                  >
                    {{ cat }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Scrollable Products Area -->
          <div class="flex-grow-1 overflow-auto p-3">
            <div class="row g-3">
              <div v-for="product in filteredProducts" :key="product.id" class="col-6 col-md-4 col-xl-3">
                <div 
                  class="card h-100 border-0 shadow-sm product-card cursor-pointer group-hover-effect"
                  @click="addToCart(product)"
                >
                  <div class="card-body p-3 d-flex flex-column h-100">
                    <div class="fw-bold text-dark mb-1 text-truncate" :title="product.name">{{ product.name }}</div>
                    <div class="small text-muted mb-2">{{ product.category }}</div>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                      <span class="fw-bold text-primary">{{ formatPrice(product.price) }}</span>
                      <span class="badge bg-light text-secondary border">{{ product.stock }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Other Views Placeholders -->
        <div v-else class="d-flex flex-column align-items-center justify-content-center text-muted">
          <div class="text-center p-5">
            <h3 class="fw-light mb-3" v-if="activeTab === 'Service'">Facturation de Services</h3>
            <h3 class="fw-light mb-3" v-if="activeTab === 'Caution'">Remboursement de Caution</h3>
            <h3 class="fw-light mb-3" v-if="activeTab === 'Avoir'">Note de Crédit / Avoir</h3>
            <p>Module en cours de développement...</p>
          </div>
        </div>

      </div>

      <!-- Right Side: Cart / POS Panel -->
      <div v-if="activeTab === 'POS'" class="col-12 col-lg-4 d-flex flex-column bg-white shadow-lg z-2 h-100">
        <!-- Cart Header -->
        <div class="p-3 border-bottom d-flex justify-content-between align-items-center bg-primary text-white">
          <div class="d-flex align-items-center gap-2">
            <ShoppingCart :size="20" />
            <h5 class="mb-0 fw-bold">Panier Actuel</h5>
          </div>
          <span class="badge bg-white text-primary fw-bold fs-6">{{ cart.length }} Articles</span>
        </div>

        <!-- Client Selection -->
         <div class="p-3 border-bottom bg-light">
           <div class="input-group">
             <span class="input-group-text bg-white border-end-0 text-muted"><User :size="18"/></span>
             <input list="clientsList" class="form-control border-start-0 ps-0" placeholder="Rechercher du client..." />
             <datalist id="clientsList">
               <option value="Client de Passage"></option>
               <option value="Client Fidèle A"></option>
               <option value="Entreprise B"></option>
               <option value="Nouveau Client X"></option>
             </datalist>
             <button class="btn btn-outline-primary"><Plus :size="18"/></button>
           </div>
         </div>

        <!-- Cart Items Scroll Area -->
        <div class="flex-grow-1 overflow-auto p-3">
          <div v-if="cart.length === 0" class="text-center text-muted mt-5">
            <ShoppingCart :size="48" class="mb-3 opacity-25" />
            <p>Le panier est vide</p>
            <small>Cliquez sur des produits pour les ajouter</small>
          </div>
          
          <div v-else class="d-flex flex-column gap-2">
            <div v-for="item in cart" :key="item.id" class="cart-item p-2 border rounded-3 d-flex align-items-center gap-3 bg-white">
              <div class="flex-grow-1 overflow-hidden">
                <div class="fw-bold text-truncate">{{ item.name }}</div>
                <div class="small text-muted">{{ formatPrice(item.price) }} x {{ item.quantity }}</div>
              </div>
              <div class="d-flex align-items-center gap-2">
                 <button @click="updateQuantity(item.id, -1)" class="btn btn-sm btn-light border px-2 py-1"><Minus :size="14"/></button>
                 <span class="fw-bold" style="min-width: 20px; text-align: center;">{{ item.quantity }}</span>
                 <button @click="updateQuantity(item.id, 1)" class="btn btn-sm btn-light border px-2 py-1"><Plus :size="14"/></button>
              </div>
              <div class="fw-bold text-end" style="min-width: 80px;">
                {{ formatPrice(item.price * item.quantity) }}
              </div>
              <button @click="removeFromCart(item.id)" class="btn btn-sm btn-link text-danger p-1"><Trash2 :size="16"/></button>
            </div>
          </div>
        </div>

        <!-- Cart Totals & Actions -->
        <div class="p-3 border-top bg-light mt-auto">
          <div class="d-flex justify-content-between mb-1 text-muted small">
            <span>Sous-total</span>
            <span>{{ formatPrice(cartTotal) }}</span>
          </div>
          <div class="d-flex justify-content-between mb-3">
            <span class="fs-6 fw-bold text-dark">Total à Payer</span>
            <span class="fs-6 fw-bold text-primary">{{ formatPrice(cartTotal) }}</span>
          </div>
          
           <div class="d-grid gap-2">
             <div class="row g-2 mb-2">
               <div class="col-6 d-flex align-items-center">
                 <label class="form-label small text-muted">Devise</label>
                 <select class="form-select form-select-sm">
                   <option value="FBU">FBU</option>
                   <option value="USD">USD</option>
                   <option value="EUR">EUR</option>
                 </select>
               </div>
               <div class="col-6 d-flex align-items-end gap-2">
                 <label class="form-label small text-muted">Paiement</label>
                 <select class="form-select form-select-sm">
                   <option value="cash">Espèces</option>
                   <option value="card">Carte Bancaire</option>
                   <option value="mobile">Mobile Money</option>
                   <option value="check">Chèque</option>
                 </select>
               </div>
             </div>

              <button class="btn btn-sm fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow-sm" :disabled="cart.length === 0" style="background-color:#4B5563; color:white;">
                <CreditCard :size="24" />
                Valider la facture
              </button>
           </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.product-card {
  transition: all 0.2s ease;
  user-select: none;
}
.product-card:active {
  transform: scale(0.98);
}
.product-card:hover {
  transform: translateY(-2px);
  border-color: var(--bs-primary) !important;
}

.cursor-pointer {
  cursor: pointer;
}

/* Custom scrollbar for product grid */
.overflow-auto::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.2);
  border-radius: 4px;
}
</style>
