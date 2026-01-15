<script setup>
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  User,
  Eye,
  Printer,
  Pencil,
  Trash,
  Loader2,
} from "lucide-vue-next";
import { ref, computed, reactive, watch, onMounted } from "vue";
import api from "@/services/api";

// --- LOADING & ERROR STATES ---
const isLoadingProducts = ref(false);
const isSubmittingInvoice = ref(false);

// --- DATA POS (Dynamic) ---
const products = ref([]);
const fetchProducts = async (search = "") => {
  isLoadingProducts.value = true;
  try {
    const response = await api.get("/products", { params: { search } });
    if (response.data.success) {
      products.value = response.data.data.data.map((p) => ({
        id: p.id,
        name: p.item_designation,
        price: p.price_ttc || p.price || 0,
        category: p.category_product?.name || "Général",
        stock: p.quantite || 0,
        vat_rate: p.vat_rate || 18,
        item_code: p.item_code,
      }));
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
  } finally {
    isLoadingProducts.value = false;
  }
};

onMounted(() => {
  fetchProducts();
  fetchCustomers();
});

const cart = ref([]);

// --- PERSISTENCE : Sauvegarde automatique ---
watch(
  cart,
  (newCart) => {
    localStorage.setItem("pos_cart", JSON.stringify(newCart));
  },
  { deep: true }
);

const searchQuery = ref("");
const selectedCategory = ref("Tous");

watch(searchQuery, (newVal) => {
  fetchProducts(newVal);
});

const categories = computed(() => {
  const cats = new Set(products.value.map((p) => p.category));
  return ["Tous", ...cats];
});

const filteredProducts = computed(() => {
  return products.value.filter((product) => {
    const matchesCategory =
      selectedCategory.value === "Tous" ||
      product.category === selectedCategory.value;
    return matchesCategory;
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
  return typeof price === "number" ? price.toLocaleString() : "0";
};

// --- CLIENT LOGIC ---
const customers = ref([]);
const selectedClient = ref(null);
const clientSearchText = ref("");

const fetchCustomers = async () => {
  try {
    const response = await api.get("/customers");
    if (response.data.success) {
      customers.value = response.data.data.data;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des clients:", error);
  }
};

const filteredCustomers = computed(() => {
  if (!clientSearchText.value) return [];
  return customers.value.filter(
    (c) =>
      c.customer_name
        .toLowerCase()
        .includes(clientSearchText.value.toLowerCase()) ||
      c.customer_TIN?.includes(clientSearchText.value)
  );
});

const selectCustomer = (customer) => {
  selectedClient.value = customer;
  clientSearchText.value = customer.customer_name;
};

// --- INVOICE SUBMISSION ---
const submitInvoice = async () => {
  if (cart.value.length === 0) return;
  if (!selectedClient.value) {
    alert("Veuillez sélectionner un client.");
    return;
  }

  isSubmittingInvoice.value = true;
  try {
    const payload = {
      invoice_type: "FN",
      invoice_action: "POS",
      invoice_currency: "BIF",
      customer_id: selectedClient.value.id,
      items: cart.value.map((item) => ({
        product_id: item.id,
        item_designation: item.name,
        item_quantity: item.quantity,
        item_price: item.price,
        vat: item.vat_rate,
        item_ct: 0,
        item_tl: 0,
      })),
    };

    const response = await api.post("/invoices", payload);
    if (response.data.success) {
      alert("Facture créée avec succès !");
      cart.value = [];
      selectedClient.value = null;
      clientSearchText.value = "";
      fetchProducts(); // Refresh stock
    } else {
      alert("Erreur: " + response.data.message);
    }
  } catch (error) {
    console.error("Erreur lors de la validation de la facture:", error);
    const msg =
      error.response?.data?.message ||
      "Une erreur est survenue lors de la création de la facture.";
    alert(msg);
  } finally {
    isSubmittingInvoice.value = false;
  }
};

// --- NAVIGATION TABS ---
const activeTab = ref("POS");
const invoiceTypes = [
  { id: "POS", label: "POS / Vente Directe" },
  { id: "Service", label: "Facture Service" },
  { id: "Caution", label: "Remboursement Caution" },
  { id: "Avoir", label: "Facture d'Avoir" },
  { id: "Proforma", label: "Proforma Service" },
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

// --- LOGIQUE PROFORMA SERVICE ---
const proformas = ref([]);
const showProformaForm = ref(false);
const showProformaDetails = ref(false);
const selectedProforma = ref(null);
const searchProforma = ref("");

const fetchProformas = async () => {
  try {
    const response = await api.get("/invoices");
    if (response.data.success) {
      proformas.value = response.data.data.data
        .filter((i) => i.invoice_type === "FP")
        .map((i) => ({
          id: i.invoice_number,
          date: i.invoice_date,
          client_number: i.customer?.customer_TIN || "N/A",
          client_name: i.customer_name,
          currency: i.invoice_currency,
          totals: {
            total_ht: i.invoice_amount_nvat,
            total_tva: i.invoice_vat_amount,
            total_ttc: i.invoice_total_amount,
          },
          status: "En attente",
          items: i.invoice_items.map((item) => ({
            description: item.item_designation,
            quantity: item.item_quantity,
            unit_price_ht: item.item_price,
            tva_rate: item.vat,
            total_ttc: item.item_total_amount,
          })),
        }));
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des proformas:", error);
  }
};

onMounted(() => {
  fetchProducts();
  fetchCustomers();
  fetchProformas();
});

const proformaForm = reactive({
  client_number: "",
  client_name: "",
  currency: "BIF",
  payment_method: "",
  items: [{ description: "", quantity: 1, unit_price_ht: 0, tva_rate: 18 }],
});

const filteredProformas = computed(() => {
  return proformas.value.filter((p) => {
    const search = searchProforma.value.toLowerCase();
    return (
      p.id.toLowerCase().includes(search) ||
      p.client_name.toLowerCase().includes(search) ||
      p.client_number.toLowerCase().includes(search)
    );
  });
});

const addProformaItem = () => {
  proformaForm.items.push({
    description: "",
    quantity: 1,
    unit_price_ht: 0,
    tva_rate: 18,
  });
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

  proformaForm.items.forEach((item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price_ht) || 0;
    const rate = parseFloat(item.tva_rate) || 0;

    const ht = qty * price;
    const tva = ht * (rate / 100);

    total_ht += ht;
    total_tva += tva;
    total_ttc += ht + tva;
  });

  return { total_ht, total_tva, total_ttc };
});

const openProformaForm = () => {
  isEditingProforma.value = false;
  editingProformaId.value = null;

  proformaForm.client_number = "";
  proformaForm.client_name = "";
  proformaForm.currency = "BIF";
  proformaForm.payment_method = "";
  proformaForm.items = [
    { description: "", quantity: 1, unit_price_ht: 0, tva_rate: 18 },
  ];

  showProformaForm.value = true;
};

const closeProformaForm = () => {
  showProformaForm.value = false;
};

const saveProforma = async () => {
  if (proformaForm.items.length === 0) return;
  if (!proformaForm.client_number) {
    alert("Veuillez saisir un numéro de client.");
    return;
  }

  isSubmittingInvoice.value = true;
  try {
    // Search for customer ID if possible, or assume it's a TIN and use active lookup
    // For now, let's look up if the proformaForm.client_number matches an existing customer
    let customerId = 1; // Fallback
    const existingCustomer = customers.value.find(
      (c) =>
        c.customer_TIN === proformaForm.client_number ||
        c.id == proformaForm.client_number
    );
    if (existingCustomer) customerId = existingCustomer.id;

    const payload = {
      invoice_type: "FP", // Facture Proforma
      invoice_action: "SERVICE",
      invoice_currency: proformaForm.currency,
      customer_id: customerId,
      items: proformaForm.items.map((item) => ({
        item_designation: item.description,
        item_quantity: parseFloat(item.quantity),
        item_price: parseFloat(item.unit_price_ht),
        vat: parseFloat(item.tva_rate),
        item_ct: 0,
        item_tl: 0,
      })),
    };

    const response = await api.post("/invoices", payload);
    if (response.data.success) {
      alert("Proforma enregistrée avec succès !");
      showProformaForm.value = false;
      fetchProformas();
    } else {
      alert("Erreur: " + response.data.message);
    }
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du proforma:", error);
    alert("Une erreur est survenue lors de l'enregistrement.");
  } finally {
    isSubmittingInvoice.value = false;
  }
};

const submitServiceInvoice = async () => {
  if (serviceItems.value.length === 0 || !serviceItems.value[0].description)
    return;
  if (!serviceForm.client) {
    alert("Veuillez sélectionner un client.");
    return;
  }

  isSubmittingInvoice.value = true;
  try {
    let customerId = 1;
    const existingCustomer = customers.value.find(
      (c) =>
        c.customer_TIN === serviceForm.client ||
        c.id == serviceForm.client ||
        c.customer_name === serviceForm.client
    );
    if (existingCustomer) customerId = existingCustomer.id;

    const payload = {
      invoice_type: "FN",
      invoice_action: "SERVICE",
      invoice_currency: serviceForm.currency,
      customer_id: customerId,
      items: serviceItems.value.map((item) => ({
        item_designation: item.description,
        item_quantity: parseFloat(item.quantity),
        item_price: parseFloat(item.price),
        vat: parseFloat(item.tvaRate),
        item_ct: 0,
        item_tl: 0,
      })),
    };

    const response = await api.post("/invoices", payload);
    if (response.data.success) {
      alert("Facture de service créée avec succès !");
      // Reset service form
      serviceItems.value = [
        { description: "", quantity: 1, price: 0, tvaRate: 18 },
      ];
      serviceForm.client = "";
    } else {
      alert("Erreur: " + response.data.message);
    }
  } catch (error) {
    console.error("Erreur lors de la validation de la facture service:", error);
    alert("Une erreur est survenue.");
  } finally {
    isSubmittingInvoice.value = false;
  }
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
  const printContent = document.getElementById("proforma-printable");
  const originalContent = document.body.innerHTML;

  document.body.innerHTML = printContent.innerHTML;
  window.print();
  document.body.innerHTML = originalContent;
  window.location.reload();
};

const voirProforma = () => {
  const tempProforma = {
    id: "APERÇU",
    date: new Date().toISOString().split("T")[0],
    client_number: proformaForm.client_number,
    client_name: proformaForm.client_name,
    currency: proformaForm.currency,
    payment_method: proformaForm.payment_method,
    items: proformaForm.items.map((item) => ({
      ...item,
      unit_price_ht: parseFloat(item.unit_price_ht) || 0,
      quantity: parseFloat(item.quantity) || 0,
      tva_rate: parseFloat(item.tva_rate) || 0,
      total_ttc:
        (parseFloat(item.quantity) || 0) *
        (parseFloat(item.unit_price_ht) || 0) *
        (1 + (parseFloat(item.tva_rate) || 0) / 100),
    })),
    totals: proformaTotals.value,
    status: "Aperçu",
  };

  selectedProforma.value = tempProforma;
  showProformaDetails.value = true;
};

const isEditingProforma = ref(false);
const editingProformaId = ref(null);

const EditProforma = (proforma) => {
  isEditingProforma.value = true;
  editingProformaId.value = proforma.id;

  proformaForm.client_number = proforma.client_number;
  proformaForm.client_name = proforma.client_name;
  proformaForm.currency = proforma.currency;
  proformaForm.payment_method = proforma.payment_method;

  proformaForm.items = proforma.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price_ht: item.unit_price_ht,
    tva_rate: item.tva_rate,
  }));

  showProformaForm.value = true;
};
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
                  <span
                    v-if="isLoadingProducts"
                    class="input-group-text bg-light border-start-0"
                  >
                    <Loader2 :size="18" class="animate-spin" />
                  </span>
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

        <!-- SERVICE TAB -->
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
                  @click="submitServiceInvoice"
                  class="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2"
                  :disabled="isSubmittingInvoice || !serviceForm.client"
                >
                  <Loader2
                    v-if="isSubmittingInvoice"
                    :size="18"
                    class="animate-spin"
                  />
                  <CreditCard v-else :size="18" />
                  {{ isSubmittingInvoice ? "En cours..." : "Valider" }}
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
              <button
                @click="openProformaForm"
                class="btn btn-primary d-flex align-items-center gap-2"
              >
                <Plus :size="18" /> Nouveau Proforma
              </button>
            </div>

            <div class="mb-3">
              <div class="input-group">
                <span class="input-group-text bg-light"
                  ><Search :size="18"
                /></span>
                <input
                  v-model="searchProforma"
                  type="text"
                  class="form-control"
                  placeholder="Rechercher par N°, client..."
                />
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
                      <small class="text-muted">{{
                        proforma.client_number
                      }}</small>
                    </td>
                    <td>{{ formatPrice(proforma.totals.total_ht) }}</td>
                    <td>{{ formatPrice(proforma.totals.total_tva) }}</td>
                    <td class="fw-bold">
                      {{ formatPrice(proforma.totals.total_ttc) }}
                    </td>
                    <td>{{ proforma.currency }}</td>
                    <td>
                      <span class="badge bg-warning">{{
                        proforma.status
                      }}</span>
                    </td>
                    <td>
                      <button
                        @click="viewProforma(proforma)"
                        class="btn btn-sm btn-info text-white me-1"
                      >
                        <Eye :size="16" />
                      </button>
                      <button
                        @click="EditProforma(proforma)"
                        class="btn btn-sm btn-primary text-white me-1"
                      >
                        <Pencil :size="16" />
                      </button>
                      <button
                        @click="deleteProforma(proforma)"
                        class="btn btn-sm btn-danger text-white me-1"
                      >
                        <Trash :size="16" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- AUTRES TABS -->
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

          <!-- SEARCH RESULTS FOR CLIENTS -->
          <div
            v-if="
              clientSearchText && !selectedClient && filteredCustomers.length
            "
            class="position-absolute bg-white border rounded shadow-sm w-100 mt-1 z-3 overflow-auto"
            style="max-height: 200px; left: 0"
          >
            <div
              v-for="customer in filteredCustomers"
              :key="customer.id"
              @click="selectCustomer(customer)"
              class="p-2 cursor-pointer hover-bg-light border-bottom"
            >
              <div class="fw-bold">{{ customer.customer_name }}</div>
              <small class="text-muted"
                >TIN: {{ customer.customer_TIN || "N/A" }}</small
              >
            </div>
          </div>

          <div
            v-if="selectedClient"
            class="mt-1 px-1 d-flex justify-content-between align-items-center"
          >
            <small class="text-success fw-bold"
              >Identifié: {{ selectedClient.customer_name }}</small
            >
            <button
              @click="
                selectedClient = null;
                clientSearchText = '';
              "
              class="btn btn-sm text-danger p-0"
            >
              <Trash2 :size="14" />
            </button>
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
              <div class="d-flex flex-column gap-2 mt-1">
                <div class="d-flex align-items-center justify-content-between">
                  <!-- Quantité -->
                  <div class="d-flex align-items-center gap-1">
                    <button
                      @click="updateQuantity(item.id, -1)"
                      class="btn btn-sm btn-light border p-1"
                    >
                      <Minus :size="14" />
                    </button>
                    <input
                      type="number"
                      v-model.number="item.quantity"
                      class="form-control form-control-sm text-center p-0 fw-bold"
                      style="width: 45px; height: 32px"
                      min="1"
                    />
                    <button
                      @click="updateQuantity(item.id, 1)"
                      class="btn btn-sm btn-light border p-1"
                    >
                      <Plus :size="14" />
                    </button>
                  </div>

                  <!-- Prix Unitaire -->
                  <div class="input-group input-group-sm" style="width: 140px">
                    <input
                      type="number"
                      v-model.number="item.price"
                      class="form-control text-end pe-1 fw-bold text-primary"
                      placeholder="Prix"
                    />
                    <span class="input-group-text px-1 small">FBU</span>
                  </div>
                </div>

                <div
                  class="d-flex justify-content-between align-items-center border-top pt-1 mt-1"
                >
                  <span class="text-muted small">Total ligne</span>
                  <span class="fw-bold text-dark">
                    {{ formatPrice(item.price * item.quantity) }} FBU
                  </span>
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

            <button
              @click="submitInvoice"
              class="btn btn-sm fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow-sm"
              :disabled="
                cart.length === 0 || isSubmittingInvoice || !selectedClient
              "
              style="background-color: #4b5563; color: white"
            >
              <Loader2
                v-if="isSubmittingInvoice"
                :size="20"
                class="animate-spin"
              />
              <CreditCard v-else :size="24" />
              {{ isSubmittingInvoice ? "Traitement..." : "Valider la facture" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL FORMULAIRE PROFORMA -->
    <div
      v-if="showProformaForm"
      class="modal d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              {{
                isEditingProforma
                  ? "Modifier Proforma Service"
                  : "Nouveau Proforma Service"
              }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="closeProformaForm"
            ></button>
          </div>
          <div class="modal-body">
            <div class="row g-3 mb-4">
              <div class="col-md-3">
                <label class="form-label">Numéro Client *</label>
                <input
                  type="text"
                  v-model="proformaForm.client_number"
                  class="form-control"
                  placeholder="CUST-001"
                />
              </div>
              <div class="col-md-3">
                <label class="form-label">Nom Client *</label>
                <input
                  type="text"
                  v-model="proformaForm.client_name"
                  class="form-control"
                  placeholder="Nom du client"
                />
              </div>
              <div class="col-md-3">
                <label class="form-label">Devise *</label>
                <select v-model="proformaForm.currency" class="form-select">
                  <option value="BIF">BIF</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Date *</label>
                <input
                  type="date"
                  v-model="proformaForm.date"
                  class="form-control"
                />
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
                    <td>
                      <input v-model="item.description" class="form-control" />
                    </td>
                    <td>
                      <input
                        type="number"
                        v-model="item.quantity"
                        class="form-control"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        v-model="item.unit_price_ht"
                        class="form-control"
                      />
                    </td>
                    <td>
                      <select v-model="item.tva_rate" class="form-select">
                        <option :value="18">18%</option>
                        <option :value="0">0%</option>
                      </select>
                    </td>
                    <td class="fw-bold">
                      {{
                        (
                          item.quantity *
                          item.unit_price_ht *
                          (1 + item.tva_rate / 100)
                        ).toLocaleString()
                      }}
                    </td>
                    <td>
                      <button
                        @click="removeProformaRow(index)"
                        class="btn btn-danger btn-sm"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="fw-bold bg-light">
                  <tr>
                    <td colspan="5" class="text-end">TOTAL</td>
                    <td class="fw-bold">
                      {{ proformaTotals.total_ttc.toLocaleString() }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <button @click="addProformaItem" class="btn btn-primary mb-4">
              <Plus :size="16" /> Ajouter ligne
            </button>

            <!-- FOOTER -->
            <div class="row g-3 border-top pt-4">
              <div class="col-md-4">
                <label class="form-label">Client</label>
                <input
                  v-model="proformaForm.client_number"
                  class="form-control"
                />
              </div>

              <div class="col-md-4">
                <label class="form-label">Devise</label>
                <select v-model="proformaForm.currency" class="form-select">
                  <option>BIF</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>

              <!-- Actions -->
              <div
                class="col-md-4 d-flex align-items-end justify-content-end gap-2"
              >
                <button
                  class="btn btn-secondary px-3"
                  @click="closeProformaForm"
                >
                  Annuler
                </button>
                <button class="btn btn-outline-info px-3" @click="voirProforma">
                  👁 Aperçu
                </button>
                <button
                  class="btn btn-primary px-3 d-flex align-items-center gap-2"
                  @click="saveProforma"
                  :disabled="isSubmittingInvoice"
                >
                  <Loader2
                    v-if="isSubmittingInvoice"
                    :size="18"
                    class="animate-spin"
                  />
                  {{ isEditingProforma ? "Modifier" : "Enregistrer" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DÉTAILS/APERÇU PROFORMA -->
    <div
      v-if="showProformaDetails && selectedProforma"
      class="modal d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Proforma - {{ selectedProforma.id }}</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeProformaDetails"
            ></button>
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
                <p>
                  <strong>Paiement:</strong>
                  {{ selectedProforma.payment_method }}
                </p>
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
                  <td>
                    {{ formatPrice(selectedProforma.totals.total_ttc) }}
                    {{ selectedProforma.currency }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeProformaDetails">
              Fermer
            </button>
            <button class="btn btn-primary" @click="printProforma">
              <Printer :size="16" /> Imprimer
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
