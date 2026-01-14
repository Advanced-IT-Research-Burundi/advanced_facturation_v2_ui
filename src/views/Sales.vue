<script setup>
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  User,
} from "lucide-vue-next";
import { ref, computed, reactive, onMounted } from "vue";
import { useStore } from "vuex";
import ClientsAdd from "./clients/ClientsAdd.vue";

const store = useStore();

// --- LOGIQUE CLIENTS ---
const showAddClientModal = ref(false);
const clientSearchText = ref("");

const clients = computed(() => store.getters["clients/allClients"]);

onMounted(() => {
  if (clients.value.length === 0) {
    store.dispatch("clients/fetchClients");
  }
});

// Identifie le client si le nom est tapé exactement (optionnel)
const selectedClient = computed(() => {
  return (
    clients.value.find((c) => c.customer_name === clientSearchText.value) ||
    null
  );
});

const handleClientAdded = () => {
  showAddClientModal.value = false;
};

// --- DATA POS (Existante) ---
const products = ref([
  {
    id: 1,
    name: "Souris Sans Fil M100",
    price: 25000,
    category: "Accessoires",
    stock: 124,
  },
  {
    id: 2,
    name: "Clavier Mécanique K95",
    price: 150000,
    category: "Périphériques",
    stock: 12,
  },
  {
    id: 3,
    name: 'Moniteur HD 24"',
    price: 450000,
    category: "Affichage",
    stock: 8,
  },
  {
    id: 4,
    name: "Câble USB-C 2m",
    price: 15000,
    category: "Câbles",
    stock: 500,
  },
  {
    id: 5,
    name: "SSD Externe 1TB",
    price: 280000,
    category: "Stockage",
    stock: 45,
  },
  {
    id: 6,
    name: "Chaise Ergonomique",
    price: 350000,
    category: "Mobilier",
    stock: 5,
  },
  {
    id: 7,
    name: "Casque Audio Pro",
    price: 85000,
    category: "Audio",
    stock: 20,
  },
  {
    id: 8,
    name: "Webcam 1080p",
    price: 120000,
    category: "Périphériques",
    stock: 15,
  },
]);

const cart = ref([]);
const searchQuery = ref("");
const selectedCategory = ref("Tous");

const categories = computed(() => {
  const cats = new Set(products.value.map((p) => p.category));
  return ["Tous", ...cats];
});

const filteredProducts = computed(() => {
  return products.value.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());
    const matchesCategory =
      selectedCategory.value === "Tous" ||
      product.category === selectedCategory.value;
    return matchesSearch && matchesCategory;
  });
});

const addToCart = (product) => {
  const existingItem = cart.value.find((item) => item.id === product.id);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.value.push({ ...product, quantity: 1 });
  }
};

const removeFromCart = (id) => {
  cart.value = cart.value.filter((item) => item.id !== id);
};

const updateQuantity = (id, delta) => {
  const item = cart.value.find((item) => item.id === id);
  if (item) {
    const newQty = parseInt(item.quantity) + delta;
    if (newQty > 0) item.quantity = newQty;
  }
};

const cartTotal = computed(() => {
  return cart.value.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
});

const formatPrice = (price) => {
  return price.toLocaleString();
};

// --- NAVIGATION TABS ---
const activeTab = ref("POS");
const invoiceTypes = [
  { id: "POS", label: "POS / Vente Directe" },
  { id: "Service", label: "Facture Service" },
  { id: "Caution", label: "Remboursement Caution" },
  { id: "Avoir", label: "Facture d'Avoir" },
];

// --- LOGIQUE FACTURE SERVICE ---
const serviceItems = ref([
  { description: "", quantity: 1, price: 0, tvaRate: 18 },
]);
const serviceForm = reactive({ client: "", paymentType: "", currency: "BIF" });

const addServiceRow = () =>
  serviceItems.value.push({
    description: "",
    quantity: 1,
    price: 0,
    tvaRate: 18,
  });
const removeServiceRow = (index) => {
  if (serviceItems.value.length > 1) serviceItems.value.splice(index, 1);
  else
    serviceItems.value[0] = {
      description: "",
      quantity: 1,
      price: 0,
      tvaRate: 18,
    };
};

const serviceTotals = computed(() => {
  let totalTva = 0;
  let totalHt = 0;
  let totalTtc = 0;
  serviceItems.value.forEach((item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    const rate = parseFloat(item.tvaRate) || 0;
    const rowHt = qty * price;
    const rowTva = rowHt * (rate / 100);
    totalHt += rowHt;
    totalTva += rowTva;
    totalTtc += rowHt + rowTva;
  });
  return { totalTva, totalHt, totalTtc };
});
</script>

<template>
  <div class="d-flex flex-column overflow-hidden" style="margin: -1.5rem">
    <div class="bg-white border-bottom px-3 pt-2">
      <ul class="nav nav-tabs border-bottom-0">
        <li class="nav-item" v-for="type in invoiceTypes" :key="type.id">
          <a
            class="nav-link text-dark cursor-pointer"
            :class="{ active: activeTab === type.id }"
            @click="activeTab = type.id"
          >
            {{ type.label }}
          </a>
        </li>
      </ul>
    </div>

    <div class="row flex-grow-1 g-0 overflow-hidden">
      <div
        class="d-flex flex-column bg-light border-end col-12"
        :class="activeTab === 'POS' ? 'col-lg-8' : ''"
      >
        <template v-if="activeTab === 'POS'">
          <div class="p-3 bg-white border-bottom shadow-sm z-1">
            <div class="row g-2">
              <div class="col-md-6">
                <div class="input-group">
                  <span
                    class="input-group-text bg-light border-end-0 text-muted"
                    ><Search :size="18"
                  /></span>
                  <input
                    v-model="searchQuery"
                    type="text"
                    class="form-control bg-light border-start-0"
                    placeholder="Rechercher un produit..."
                  />
                </div>
              </div>
              <div class="col-md-6">
                <div
                  class="d-flex gap-2 overflow-auto pb-1"
                  style="scrollbar-width: none"
                >
                  <button
                    v-for="cat in categories"
                    :key="cat"
                    @click="selectedCategory = cat"
                    class="btn btn-sm text-nowrap"
                    :class="
                      selectedCategory === cat
                        ? 'btn-primary'
                        : 'btn-outline-secondary'
                    "
                  >
                    {{ cat }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex-grow-1 overflow-auto p-3">
            <div class="row g-3">
              <div
                v-for="product in filteredProducts"
                :key="product.id"
                class="col-6 col-md-4 col-xl-3"
              >
                <div
                  class="card h-100 border-0 shadow-sm product-card cursor-pointer group-hover-effect"
                  @click="addToCart(product)"
                >
                  <div class="card-body p-3 d-flex flex-column h-100">
                    <div
                      class="fw-bold text-dark mb-1 text-truncate"
                      :title="product.name"
                    >
                      {{ product.name }}
                    </div>
                    <div class="small text-muted mb-2">
                      {{ product.category }}
                    </div>
                    <div
                      class="mt-auto d-flex justify-content-between align-items-center"
                    >
                      <span class="fw-bold text-primary"
                        >{{ formatPrice(product.price) }} FBU</span
                      >
                      <span class="badge bg-light text-secondary border">{{
                        product.stock
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === 'Service'">
          <div class="d-flex flex-column h-100 bg-white p-4 overflow-auto">
            <h4 class="mb-4">Facturation des Services</h4>
            <div class="table-responsive mb-4">
              <table class="table table-bordered align-middle">
                <thead class="bg-light">
                  <tr>
                    <th style="width: 50px">#</th>
                    <th>Description</th>
                    <th style="width: 120px">Quantité</th>
                    <th style="width: 150px">Prices (HT)</th>
                    <th style="width: 120px">TVA %</th>
                    <th style="width: 120px">TVA</th>
                    <th style="width: 150px">Prix HTVA</th>
                    <th style="width: 150px">Prix Total</th>
                    <th style="width: 60px">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in serviceItems" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td>
                      <input
                        type="text"
                        v-model="item.description"
                        class="form-control"
                        placeholder="Description du service..."
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        v-model="item.quantity"
                        min="1"
                        class="form-control"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        v-model="item.price"
                        min="0"
                        class="form-control"
                      />
                    </td>
                    <td>
                      <select v-model="item.tvaRate" class="form-select">
                        <option :value="18">18 %</option>
                        <option :value="10">10 %</option>
                        <option :value="0">0 %</option>
                      </select>
                    </td>
                    <td class="fw-bold text-muted">
                      {{
                        (
                          item.quantity *
                          item.price *
                          (item.tvaRate / 100)
                        ).toLocaleString()
                      }}
                    </td>
                    <td class="fw-bold text-muted">
                      {{ (item.quantity * item.price).toLocaleString() }}
                    </td>
                    <td class="fw-bold text-dark">
                      {{
                        (
                          item.quantity *
                          item.price *
                          (1 + item.tvaRate / 100)
                        ).toLocaleString()
                      }}
                    </td>
                    <td>
                      <button
                        @click="removeServiceRow(index)"
                        class="btn btn-danger btn-sm"
                      >
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
              <button
                @click="addServiceRow"
                class="btn btn-primary d-flex align-items-center gap-2"
              >
                <Plus :size="18" /> Ajouter
              </button>
            </div>
            <div class="row g-3 border-top pt-4 align-items-end">
              <div class="col-md-3">
                <label class="form-label text-muted small text-uppercase"
                  >Numero de Client</label
                >
                <div class="input-group">
                  <input
                    type="text"
                    v-model="serviceForm.client"
                    class="form-control"
                    placeholder="Recherche..."
                  />
                  <button class="btn btn-info text-white">Search</button>
                </div>
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small text-uppercase"
                  >Type de Paiement</label
                >
                <select v-model="serviceForm.paymentType" class="form-select">
                  <option value="" disabled selected>Choisissez ...</option>
                  <option value="cash">Espèces</option>
                  <option value="banque">Virement Bancaire</option>
                  <option value="mobile">Mobile Money</option>
                  <option value="cheque">Chèque</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small text-uppercase"
                  >Type de Monnaie</label
                >
                <select v-model="serviceForm.currency" class="form-select">
                  <option value="BIF">BIF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div class="col-md-3 text-end">
                <button
                  class="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2"
                >
                  <CreditCard :size="18" /> Valider
                </button>
              </div>
            </div>
          </div>
        </template>

        <div
          v-else
          class="d-flex flex-column align-items-center justify-content-center text-muted h-100"
        >
          <div class="text-center p-5">
            <h3 class="fw-light mb-3" v-if="activeTab === 'Caution'">
              Remboursement de Caution
            </h3>
            <h3 class="fw-light mb-3" v-if="activeTab === 'Avoir'">
              Note de Crédit / Avoir
            </h3>
            <p>Module en cours de développement...</p>
          </div>
        </div>
      </div>

      <div
        v-if="activeTab === 'POS'"
        class="col-12 col-lg-4 d-flex flex-column bg-white shadow-lg z-2 h-100"
      >
        <div
          class="p-3 border-bottom d-flex justify-content-between align-items-center bg-primary text-white"
        >
          <div class="d-flex align-items-center gap-2">
            <ShoppingCart :size="20" />
            <h5 class="mb-0 fw-bold">Panier Actuel</h5>
          </div>
          <span class="badge bg-white text-primary fw-bold fs-6"
            >{{ cart.length }} Articles</span
          >
        </div>

        <div class="p-3 border-bottom bg-light">
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0 text-muted">
              <User :size="18" :class="{ 'text-success': selectedClient }" />
            </span>
            <input
              v-model="clientSearchText"
              class="form-control border-start-0 ps-0"
              placeholder="Rechercher du client..."
            />
            <button
              @click="showAddClientModal = true"
              class="btn btn-outline-primary"
            >
              <Plus :size="18" />
            </button>
          </div>
          <div v-if="selectedClient" class="mt-1 px-1">
            <small class="text-success fw-bold"
              >Identifié: {{ selectedClient.customer_name }}</small
            >
          </div>
        </div>

        <div class="flex-grow-1 overflow-auto p-3">
          <div v-if="cart.length === 0" class="text-center text-muted mt-5">
            <ShoppingCart :size="48" class="mb-3 opacity-25" />
            <p>Le panier est vide</p>
          </div>

          <div v-else class="d-flex flex-column gap-2">
            <div
              v-for="item in cart"
              :key="item.id"
              class="cart-item p-2 border rounded-3 bg-white"
            >
              <div
                class="d-flex justify-content-between align-items-start mb-2"
              >
                <div class="fw-bold text-truncate pe-2" :title="item.name">
                  {{ item.name }}
                </div>
                <button
                  @click="removeFromCart(item.id)"
                  class="btn btn-sm btn-link text-danger p-0 align-self-start"
                >
                  <Trash2 :size="16" />
                </button>
              </div>

              <div
                class="d-flex align-items-center justify-content-between gap-2"
              >
                <div style="flex: 1; min-width: 0">
                  <div class="input-group input-group-sm">
                    <input
                      type="number"
                      v-model="item.price"
                      class="form-control px-1"
                      min="0"
                    />
                    <span
                      class="input-group-text px-1 small text-muted"
                      style="font-size: 0.7rem"
                      >FBU</span
                    >
                  </div>
                </div>
                <div class="d-flex align-items-center">
                  <button
                    @click="updateQuantity(item.id, -1)"
                    class="btn btn-sm btn-light border px-1 py-1"
                  >
                    <Minus :size="12" />
                  </button>
                  <input
                    type="number"
                    v-model="item.quantity"
                    class="form-control form-control-sm text-center border-0 p-0 mx-1"
                    style="width: 35px"
                    min="1"
                  />
                  <button
                    @click="updateQuantity(item.id, 1)"
                    class="btn btn-sm btn-light border px-1 py-1"
                  >
                    <Plus :size="12" />
                  </button>
                </div>
                <div
                  class="fw-bold text-end text-primary small"
                  style="min-width: 70px"
                >
                  {{ formatPrice(item.price * item.quantity) }}
                </div>
              </div>
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
            <span class="fs-6 fw-bold text-primary"
              >{{ formatPrice(cartTotal) }} FBU</span
            >
          </div>

          <div class="d-grid gap-2">
            <div class="row g-2 mb-2">
              <div class="col-6 d-flex align-items-center">
                <label class="form-label small text-muted mb-0 me-2"
                  >Devise</label
                >
                <select class="form-select form-select-sm">
                  <option value="FBU">FBU</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div class="col-6">
                <select class="form-select form-select-sm">
                  <option value="cash">Espèces</option>
                  <option value="mobile">Mobile Money</option>
                </select>
              </div>
            </div>
            <button
              class="btn btn-sm fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow-sm"
              :disabled="cart.length === 0"
              style="background-color: #4b5563; color: white"
            >
              <CreditCard :size="24" /> Valider la facture
            </button>
          </div>
        </div>
      </div>
    </div>
    <ClientsAdd v-if="showAddClientModal" @close="handleClientAdded" />
  </div>
</template>

<style scoped>
/* Tes styles restent inchangés */
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
.overflow-auto::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.overflow-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
