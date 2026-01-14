<script setup>
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User, Eye, Printer, Edit } from 'lucide-vue-next';
import { ref, computed, reactive } from 'vue';

// --- DATA POS (Existante) ---
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
  return price.toLocaleString(); 
};

// --- NAVIGATION TABS ---
const activeTab = ref('POS');
const invoiceTypes = [
  { id: 'POS', label: 'POS / Vente Directe' },
  { id: 'Service', label: 'Facture Service' },
  { id: 'Proforma', label: 'Proforma Service' },
  { id: 'Caution', label: 'Remboursement Caution' },
  { id: 'Avoir', label: 'Facture d\'Avoir' }
];

// --- LOGIQUE FACTURE SERVICE ---
const serviceItems = ref([
    { description: '', quantity: 1, price: 0, tvaRate: 18 }
]);

const serviceForm = reactive({
    client: '',
    paymentType: '',
    currency: 'BIF'
});

const addServiceRow = () => {
    serviceItems.value.push({ description: '', quantity: 1, price: 0, tvaRate: 18 });
};

const removeServiceRow = (index) => {
    if (serviceItems.value.length > 1) {
        serviceItems.value.splice(index, 1);
    } else {
        serviceItems.value[0] = { description: '', quantity: 1, price: 0, tvaRate: 18 };
    }
};

const serviceTotals = computed(() => {
    let totalTva = 0;
    let totalHt = 0;
    let totalTtc = 0;

    serviceItems.value.forEach(item => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        const rate = parseFloat(item.tvaRate) || 0;

        const rowHt = qty * price;
        const rowTva = rowHt * (rate / 100);
        
        totalHt += rowHt;
        totalTva += rowTva;
        totalTtc += (rowHt + rowTva);
    });

    return { totalTva, totalHt, totalTtc };
});

// --- LOGIQUE PROFORMA SERVICE ---
const proformas = ref([
  // Exemples de proformas (sera remplacé par vos données API)
  {
    id: 'PRO-2025-001',
    date: '2025-01-14',
    client_number: 'CUST-001',
    client_name: 'Entreprise ABC',
    currency: 'BIF',
    payment_method: 'banque',
    items: [
      {
        description: 'Maintenance informatique trimestrielle',
        quantity: 1,
        unit_price_ht: 100000,
        tva_rate: 18,
        tva_amount: 18000,
        total_ttc: 118000
      }
    ],
    totals: {
      total_ht: 100000,
      total_tva: 18000,
      total_ttc: 118000
    },
    status: 'En attente'
  },
  {
    id: 'PRO-2025-002',
    date: '2025-01-14',
    client_number: 'CUST-002',
    client_name: 'Entreprise DEF',
    currency: 'BIF',
    payment_method: 'banque',
    items: [
      {
        description: 'Maintenance informatique trimestrielle',
        quantity: 1,
        unit_price_ht: 100000,
        tva_rate: 18,
        tva_amount: 18000,
        total_ttc: 118000
      }
    ],
    totals: {
      total_ht: 100000,
      total_tva: 18000,
      total_ttc: 118000
    },
    status: 'En attente'
  }
]);

const showProformaForm = ref(false);
const showProformaDetails = ref(false);
const selectedProforma = ref(null);
const searchProforma = ref('');

const proformaForm = reactive({
  client_number: '',
  client_name: '',
  currency: 'BIF',
  payment_method: '',
  items: [{ description: '', quantity: 1, unit_price_ht: 0, tva_rate: 18 }]
});

const filteredProformas = computed(() => {
  return proformas.value.filter(p => {
    const search = searchProforma.value.toLowerCase();
    return p.id.toLowerCase().includes(search) || 
           p.client_name.toLowerCase().includes(search) ||
           p.client_number.toLowerCase().includes(search);
  });
});

const addProformaItem = () => {
  proformaForm.items.push({ description: '', quantity: 1, unit_price_ht: 0, tva_rate: 18 });
};

const removeProformaRow = (index) => {
  if (proformaForm.items.length > 1) {
    proformaForm.items.splice(index, 1);
  }
};

const proformaTotals = computed(() => {
  let total_ht = 0;
  let total_tva = 0;
  let total_ttc = 0;

  proformaForm.items.forEach(item => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price_ht) || 0;
    const rate = parseFloat(item.tva_rate) || 0;

    const ht = qty * price;
    const tva = ht * (rate / 100);
    
    total_ht += ht;
    total_tva += tva;
    total_ttc += (ht + tva);
  });

  return { total_ht, total_tva, total_ttc };
});

const openProformaForm = () => {
  showProformaForm.value = true;
  // Reset form
  proformaForm.client_number = '';
  proformaForm.client_name = '';
  proformaForm.currency = 'BIF';
  proformaForm.payment_method = '';
  proformaForm.items = [{ description: '', quantity: 1, unit_price_ht: 0, tva_rate: 18 }];
};

const closeProformaForm = () => {
  showProformaForm.value = false;
};

const saveProforma = () => {
  // Préparer les données pour l'API
  const proformaData = {
    invoice_type: "PROFORMA_SERVICE",
    client_number: proformaForm.client_number,
    client_name: proformaForm.client_name,
    currency: proformaForm.currency,
    payment_method: proformaForm.payment_method,
    items: proformaForm.items.map(item => ({
      description: item.description,
      quantity: parseFloat(item.quantity) || 0,
      unit_price_ht: parseFloat(item.unit_price_ht) || 0,
      tva_rate: parseFloat(item.tva_rate) || 0,
      tva_amount: (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price_ht) || 0) * ((parseFloat(item.tva_rate) || 0) / 100),
      total_ttc: (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price_ht) || 0) * (1 + (parseFloat(item.tva_rate) || 0) / 100)
    })),
    totals: proformaTotals.value
  };

  console.log('Données à envoyer à l\'API:', proformaData);
  
  // TODO: Envoyer à votre API
  // fetch('/api/proformas', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(proformaData)
  // }).then(response => response.json())
  //   .then(data => {
  //     proformas.value.unshift(data);
  //     closeProformaForm();
  //   });

  // Pour la démo, ajouter localement
  const newProforma = {
    id: `PRO-2025-${String(proformas.value.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    ...proformaData,
    status: 'En attente'
  };
  
  proformas.value.unshift(newProforma);
  closeProformaForm();
  alert('Proforma créé avec succès!');
};

const viewProforma = (proforma) => {
  selectedProforma.value = proforma;
  showProformaDetails.value = true;
};

const closeProformaDetails = () => {
  showProformaDetails.value = false;
  selectedProforma.value = null;
};

const printProforma = () => {
  const printContent = document.getElementById('proforma-printable');
  const originalContent = document.body.innerHTML;
  
  document.body.innerHTML = printContent.innerHTML;
  window.print();
  document.body.innerHTML = originalContent;
  window.location.reload(); // Pour restaurer les événements Vue
};

const voirProforma = () => {
  // Créer un objet proforma temporaire depuis le formulaire
  const tempProforma = {
    id: 'APERÇU',
    date: new Date().toISOString().split('T')[0],
    client_number: proformaForm.client_number,
    client_name: proformaForm.client_name,
    currency: proformaForm.currency,
    payment_method: proformaForm.payment_method,
    items: proformaForm.items.map(item => ({
      ...item,
      unit_price_ht: parseFloat(item.unit_price_ht) || 0,
      quantity: parseFloat(item.quantity) || 0,
      tva_rate: parseFloat(item.tva_rate) || 0,
      total_ttc: (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price_ht) || 0) * (1 + (parseFloat(item.tva_rate) || 0) / 100)
    })),
    totals: proformaTotals.value,
    status: 'Aperçu'
  };
  
  selectedProforma.value = tempProforma;
  showProformaDetails.value = true;
};

</script>

<template>
  <div class="d-flex flex-column overflow-hidden" style="margin: -1.5rem;">
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
      
      <div class="d-flex flex-column bg-light border-end col-12" :class="activeTab === 'POS' ? 'col-lg-8' : ''">
        
        <!-- POS TAB -->
        <template v-if="activeTab === 'POS'">
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
                      <span class="fw-bold text-primary">{{ formatPrice(product.price) }} FBU</span>
                      <span class="badge bg-light text-secondary border">{{ product.stock }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- SERVICE TAB -->
        <template v-else-if="activeTab === 'Service'">
            <div class="d-flex flex-column h-100 bg-white p-4 overflow-auto">
                <h4 class="mb-4">Facturation des Services</h4>
                
                <div class="table-responsive mb-4">
                    <table class="table table-bordered align-middle">
                        <thead class="bg-light">
                            <tr>
                                <th style="width: 50px;">#</th>
                                <th>Description</th>
                                <th style="width: 120px;">Quantité</th>
                                <th style="width: 150px;">Prix HT</th>
                                <th style="width: 120px;">TVA %</th>
                                <th style="width: 120px;">TVA</th>
                                <th style="width: 150px;">Prix HTVA</th>
                                <th style="width: 150px;">Prix Total</th>
                                <th style="width: 60px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, index) in serviceItems" :key="index">
                                <td>{{ index + 1 }}</td>
                                <td>
                                    <input type="text" v-model="item.description" class="form-control" placeholder="Description du service...">
                                </td>
                                <td>
                                    <input type="number" v-model="item.quantity" min="1" class="form-control">
                                </td>
                                <td>
                                    <input type="number" v-model="item.price" min="0" class="form-control">
                                </td>
                                <td>
                                    <select v-model="item.tvaRate" class="form-select">
                                        <option :value="18">18 %</option>
                                        <option :value="10">10 %</option>
                                        <option :value="0">0 %</option>
                                    </select>
                                </td>
                                <td class="fw-bold text-muted">
                                    {{ ((item.quantity * item.price) * (item.tvaRate / 100)).toLocaleString() }}
                                </td>
                                <td class="fw-bold text-muted">
                                    {{ (item.quantity * item.price).toLocaleString() }}
                                </td>
                                <td class="fw-bold text-dark">
                                    {{ ((item.quantity * item.price) * (1 + item.tvaRate / 100)).toLocaleString() }}
                                </td>
                                <td>
                                    <button @click="removeServiceRow(index)" class="btn btn-danger btn-sm">
                                        <Trash2 :size="16" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot class="bg-light fw-bold">
                            <tr>
                                <td colspan="5" class="text-end text-uppercase">Total</td>
                                <td>{{ serviceTotals.totalTva.toLocaleString() }}</td>
                                <td>{{ serviceTotals.totalHt.toLocaleString() }}</td>
                                <td>{{ serviceTotals.totalTtc.toLocaleString() }}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="d-flex justify-content-end mb-5">
                    <button @click="addServiceRow" class="btn btn-primary d-flex align-items-center gap-2">
                        <Plus :size="18" /> Ajouter
                    </button>
                </div>

                <div class="row g-3 border-top pt-4 align-items-end">
                    <div class="col-md-3">
                        <label class="form-label text-muted small text-uppercase">Numéro de Client</label>
                        <div class="input-group">
                            <input type="text" v-model="serviceForm.client" class="form-control" placeholder="Recherche...">
                            <button class="btn btn-info text-white">Search</button>
                        </div>
                    </div>
                    
                    <div class="col-md-3">
                         <label class="form-label text-muted small text-uppercase">Type de Paiement</label>
                         <select v-model="serviceForm.paymentType" class="form-select">
                             <option value="" disabled selected>Choisissez ...</option>
                             <option value="cash">Espèces</option>
                             <option value="banque">Virement Bancaire</option>
                             <option value="mobile">Mobile Money</option>
                             <option value="cheque">Chèque</option>
                         </select>
                    </div>

                    <div class="col-md-3">
                         <label class="form-label text-muted small text-uppercase">Type de Monnaie</label>
                         <select v-model="serviceForm.currency" class="form-select">
                             <option value="BIF">BIF</option>
                             <option value="USD">USD</option>
                             <option value="EUR">EUR</option>
                         </select>
                    </div>

                    <div class="col-md-3 text-end">
                        <button class="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2">
                            <CreditCard :size="18"/> Valider
                        </button>
                    </div>
                </div>
            </div>
        </template>

        <!-- PROFORMA SERVICE TAB -->
        <template v-else-if="activeTab === 'Proforma'">
          <div class="d-flex flex-column h-100 bg-white p-4 overflow-auto">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h4 class="mb-0">Gestion des Proformas Service</h4>
              <button @click="openProformaForm" class="btn btn-primary d-flex align-items-center gap-2">
                <Plus :size="18" /> Nouveau Proforma
              </button>
            </div>

            <div class="mb-3">
              <div class="input-group">
                <span class="input-group-text bg-light"><Search :size="18"/></span>
                <input v-model="searchProforma" type="text" class="form-control" placeholder="Rechercher par N°, client...">
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead class="bg-light">
                  <tr>
                    <th>N° Proforma</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Montant HT</th>
                    <th>TVA</th>
                    <th>Total TTC</th>
                    <th>Devise</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="proforma in filteredProformas" :key="proforma.id">
                    <td class="fw-bold">{{ proforma.id }}</td>
                    <td>{{ proforma.date }}</td>
                    <td>
                      <div>{{ proforma.client_name }}</div>
                      <small class="text-muted">{{ proforma.client_number }}</small>
                    </td>
                    <td>{{ formatPrice(proforma.totals.total_ht) }}</td>
                    <td>{{ formatPrice(proforma.totals.total_tva) }}</td>
                    <td class="fw-bold">{{ formatPrice(proforma.totals.total_ttc) }}</td>
                    <td>{{ proforma.currency }}</td>
                    <td><span class="badge bg-warning">{{ proforma.status }}</span></td>
                    <td>
                      <button @click="viewProforma(proforma)" class="btn btn-sm btn-info text-white me-1">
                        <Eye :size="16" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- AUTRES TABS -->
        <div v-else class="d-flex flex-column align-items-center justify-content-center text-muted h-100">
          <div class="text-center p-5">
            <h3 class="fw-light mb-3" v-if="activeTab === 'Caution'">Remboursement de Caution</h3>
            <h3 class="fw-light mb-3" v-if="activeTab === 'Avoir'">Note de Crédit / Avoir</h3>
            <p>Module en cours de développement...</p>
          </div>
        </div>
      </div>

      <!-- PANIER POS -->
      <div v-if="activeTab === 'POS'" class="col-12 col-lg-4 d-flex flex-column bg-white shadow-lg z-2 h-100">
        <div class="p-3 border-bottom d-flex justify-content-between align-items-center bg-primary text-white">
          <div class="d-flex align-items-center gap-2">
            <ShoppingCart :size="20" />
            <h5 class="mb-0 fw-bold">Panier Actuel</h5>
          </div>
          <span class="badge bg-white text-primary fw-bold fs-6">{{ cart.length }} Articles</span>
        </div>

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

        <div class="p-3 border-top bg-light mt-auto">
          <div class="d-flex justify-content-between mb-1 text-muted small">
            <span>Sous-total</span>
            <span>{{ formatPrice(cartTotal) }} FBU</span>
          </div>
          <div class="d-flex justify-content-between mb-3">
            <span class="fs-6 fw-bold text-dark">Total à Payer</span>
            <span class="fs-6 fw-bold text-primary">{{ formatPrice(cartTotal) }} FBU</span>
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

    <!-- MODAL FORMULAIRE PROFORMA -->
    <div v-if="showProformaForm" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Nouveau Proforma Service</h5>
            <button type="button" class="btn-close btn-close-white" @click="closeProformaForm"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3 mb-4">
              <div class="col-md-3">
                <label class="form-label">Numéro Client *</label>
                <input type="text" v-model="proformaForm.client_number" class="form-control" placeholder="CUST-001">
              </div>
              <div class="col-md-3">
                <label class="form-label">Nom Client *</label>
                <input type="text" v-model="proformaForm.client_name" class="form-control" placeholder="Nom du client">
              </div>
              <div class="col-md-3">
                <label class="form-label">Devise *</label>
                <select v-model="proformaForm.currency" class="form-select">
                  <option value="BIF">BIF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Date *</label>
                <input type="date" v-model="proformaForm.date" class="form-control">
              </div>
            </div>

            <div class="table-responsive mb-4">
              <table class="table table-bordered align-middle">
                <thead class="bg-light">
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Qté</th>
                    <th>Prix HT</th>
                    <th>TVA %</th>
                    <th>Total TTC</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in proformaForm.items" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td><input v-model="item.description" class="form-control"></td>
                    <td><input type="number" v-model="item.quantity" class="form-control"></td>
                    <td><input type="number" v-model="item.unit_price_ht" class="form-control"></td>
                    <td>
                      <select v-model="item.tvaRate" class="form-select">
                        <option :value="18">18%</option>
                        <option :value="0">0%</option>
                      </select>
                    </td>
                    <td class="fw-bold">
                      {{ ((item.quantity * item.price) * (1 + item.tvaRate/100)).toLocaleString() }}
                    </td>
                    <td>
                      <button @click="removeProformaRow(index)" class="btn btn-danger btn-sm">
                        <Trash2 :size="14"/>
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="fw-bold bg-light">
                  <tr>
                    <td colspan="5" class="text-end">TOTAL</td>
                    <td>{{ proformaTotals.totalTtc.toLocaleString() }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <button @click="addProformaRow" class="btn btn-primary mb-4">
              <Plus :size="16"/> Ajouter ligne
            </button>

            <!-- FOOTER -->
            <div class="row g-3 border-top pt-4">
              <div class="col-md-4">
                <label class="form-label">Client</label>
                <input v-model="proformaForm.clientNumber" class="form-control">
              </div>

              <div class="col-md-4">
                <label class="form-label">Devise</label>
                <select v-model="proformaForm.currency" class="form-select">
                  <option>BIF</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>

              <div class="col-md-4 d-flex align-items-end justify-content-end gap-2">
                <button class="btn btn-outline-secondary" @click="voirProforma">
                  👁 Voir
                </button>
                <button class="btn btn-primary" @click="imprimerProforma">
                  🖨 Imprimer A4
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeProformaForm">Annuler</button>
            <button type="button" class="btn btn-primary" @click="saveProforma">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DÉTAILS/APERÇU PROFORMA -->
<div v-if="showProformaDetails && selectedProforma" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Aperçu Proforma - {{ selectedProforma.id }}</h5>
        <button type="button" class="btn-close" @click="closeProformaDetails"></button>
      </div>
      <div class="modal-body" id="proforma-printable">
        <!-- En-tête -->
        <div class="text-center mb-4 border-bottom pb-3">
          <h3 class="fw-bold">PROFORMA SERVICE</h3>
          <p class="mb-1">N° {{ selectedProforma.id }}</p>
          <p class="text-muted">Date: {{ selectedProforma.date }}</p>
        </div>

        <!-- Infos Client -->
        <div class="row mb-4">
          <div class="col-6">
            <h6 class="fw-bold">Client:</h6>
            <p class="mb-0">{{ selectedProforma.client_name }}</p>
            <p class="text-muted">{{ selectedProforma.client_number }}</p>
          </div>
          <div class="col-6 text-end">
            <p><strong>Devise:</strong> {{ selectedProforma.currency }}</p>
            <p><strong>Paiement:</strong> {{ selectedProforma.payment_method }}</p>
          </div>
        </div>

        <!-- Tableau des articles -->
        <table class="table table-bordered">
          <thead class="bg-light">
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Qté</th>
              <th>PU HT</th>
              <th>TVA</th>
              <th>Total TTC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in selectedProforma.items" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ item.description }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ formatPrice(item.unit_price_ht) }}</td>
              <td>{{ item.tva_rate }}%</td>
              <td>{{ formatPrice(item.total_ttc) }}</td>
            </tr>
          </tbody>
          <tfoot class="fw-bold">
            <tr>
              <td colspan="5" class="text-end">Total HT</td>
              <td>{{ formatPrice(selectedProforma.totals.total_ht) }}</td>
            </tr>
            <tr>
              <td colspan="5" class="text-end">TVA</td>
              <td>{{ formatPrice(selectedProforma.totals.total_tva) }}</td>
            </tr>
            <tr class="table-primary">
              <td colspan="5" class="text-end">TOTAL TTC</td>
              <td>{{ formatPrice(selectedProforma.totals.total_ttc) }} {{ selectedProforma.currency }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeProformaDetails">Fermer</button>
        <button class="btn btn-primary" @click="printProforma">
          <Printer :size="16"/> Imprimer
        </button>
      </div>
    </div>
  </div>
</div>
</div>
</template>