<script setup>
import { ref, reactive, computed } from "vue";
import { Plus, Trash2, CreditCard, Loader2, User, Search } from "lucide-vue-next";
import { useToast } from '@/composables/useToast';

const props = defineProps({
  isSubmitting: Boolean,
  customers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["submit"]);

const toast = useToast();

const serviceItems = ref([
  { description: "", quantity: 1, price: 0, tvaRate: 18 },
]);

const serviceForm = reactive({
  paymentType: "cash",
  currency: "BIF",
});

// Client search state
const selectedClient = ref(null);
const clientSearchText = ref("");

const filteredCustomers = computed(() => {
  if (!clientSearchText.value) return [];
  return props.customers.filter(
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

const clearClient = () => {
  selectedClient.value = null;
  clientSearchText.value = "";
};

const addServiceRow = () => {
  serviceItems.value.push({
    description: "",
    quantity: 1,
    price: 0,
    tvaRate: 18,
  });
};

const removeServiceRow = (index) => {
  if (serviceItems.value.length > 1) {
    serviceItems.value.splice(index, 1);
  } else {
    serviceItems.value[0] = {
      description: "",
      quantity: 1,
      price: 0,
      tvaRate: 18,
    };
  }
};

const serviceTotals = computed(() => {
  let totalTva = 0,
    totalHt = 0,
    totalTtc = 0;
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

const validateAndSubmit = () => {
  if (serviceItems.value.length === 0 || !serviceItems.value[0].description) {
    toast.error("Veuillez ajouter au moins un service.");
    return;
  }
  if (!selectedClient.value) {
    toast.error("Veuillez sélectionner un client.");
    return;
  }

  const payload = {
    invoice_type: "FN",
    invoice_action: "SERVICE",
    invoice_currency: serviceForm.currency,
    payment_type: serviceForm.paymentType,
    customer_id: selectedClient.value.id,
    items: serviceItems.value.map((item) => ({
      item_designation: item.description,
      item_quantity: parseFloat(item.quantity),
      item_price: parseFloat(item.price),
      vat: parseFloat(item.tvaRate),
      item_ct: 0,
      item_tl: 0,
    })),
  };

  emit("submit", payload);
};

const reset = () => {
  serviceItems.value = [
    { description: "", quantity: 1, price: 0, tvaRate: 18 },
  ];
  selectedClient.value = null;
  clientSearchText.value = "";
};

defineExpose({ reset, clearClient });
</script>

<template>
  <div class="d-flex flex-column bg-white p-4">
    <h4 class="mb-4">Facturation des Services</h4>
    <div class="table-responsive mb-4">
      <table class="table table-bordered align-middle">
        <thead class="bg-light">
          <tr>
            <th style="width: 50px">#</th>
            <th>Description</th>
            <th style="width: 120px">Quantité</th>
            <th style="width: 150px">Prices</th>
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
                v-model="item.description"
                type="text"
                class="form-control"
                placeholder="Description du service..."
              />
            </td>
            <td>
              <input
                v-model.number="item.quantity"
                type="number"
                min="1"
                class="form-control"
              />
            </td>
            <td>
              <input
                v-model.number="item.price"
                type="number"
                min="0"
                class="form-control"
              />
            </td>
            <td>
              <select v-model="item.tvaRate" class="form-select">
                <option :value="18">18 %</option>
                <option :value="10">10 %</option>
                <option :value="4">4 %</option>
                <option :value="0">0 %</option>
              </select>
            </td>
            <!-- TVA Amount -->
            <td class="fw-bold bg-light">
              {{
                (
                  item.quantity *
                  item.price *
                  (item.tvaRate / 100)
                ).toLocaleString()
              }}
            </td>
            <!-- Prix HTVA -->
            <td class="fw-bold bg-light">
              {{ (item.quantity * item.price).toLocaleString() }}
            </td>
            <!-- Prix Total -->
            <td class="fw-bold bg-light">
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
                class="btn btn-outline-danger btn-sm"
              >
                <Trash2 :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-light fw-bold">
          <tr>
            <td colspan="5" class="text-start">TOTAL</td>
            <td>{{ serviceTotals.totalTva.toLocaleString() }}</td>
            <td>{{ serviceTotals.totalHt.toLocaleString() }}</td>
            <td>{{ serviceTotals.totalTtc.toLocaleString() }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div
      class="d-flex justify-content-between align-items-end mt-auto pt-4 border-top"
    >
      <div class="d-flex gap-3 flex-grow-1 pe-4">
        <!-- Client Search -->
        <div class="flex-grow-1 position-relative">
          <label class="form-label small text-muted">Client</label>
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0">
              <User :size="18" :class="{ 'text-success': selectedClient }" />
            </span>
            <input
              v-model="clientSearchText"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Rechercher un client..."
            />
          </div>
          <!-- Dropdown résultats -->
          <div
            v-if="clientSearchText && !selectedClient && filteredCustomers.length"
            class="position-absolute bg-white border rounded shadow-sm w-100 mt-1 z-3 overflow-auto"
            style="max-height: 200px"
          >
            <div
              v-for="customer in filteredCustomers"
              :key="customer.id"
              @click="selectCustomer(customer)"
              class="p-2 cursor-pointer hover-bg-light border-bottom"
            >
              <div class="fw-bold">{{ customer.customer_name }}</div>
              <small class="text-muted">TIN: {{ customer.customer_TIN || "N/A" }}</small>
            </div>
          </div>
          <!-- Client sélectionné -->
          <div
            v-if="selectedClient"
            class="mt-1 d-flex justify-content-between align-items-center"
          >
            <small class="text-success fw-bold">
              <User :size="14" class="me-1" />
              {{ selectedClient.customer_name }} ({{ selectedClient.customer_TIN || 'N/A' }})
            </small>
            <button @click="clearClient" class="btn btn-sm text-danger p-0">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <!-- Devise -->
        <div style="width: 120px">
          <label class="form-label small text-muted">Devise</label>
          <select v-model="serviceForm.currency" class="form-select">
            <option value="BIF">BIF</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <!-- Paiement -->
        <div style="width: 150px">
          <label class="form-label small text-muted">Paiement</label>
          <select v-model="serviceForm.paymentType" class="form-select">
            <option value="cash">Espèces</option>
            <option value="banque">Banque</option>
            <option value="mobile">Mobile Money</option>
          </select>
        </div>
      </div>
      <div>
        <button @click="addServiceRow" class="btn btn-outline-primary me-2">
          <Plus :size="18" /> Ligne
        </button>
        <button
          @click="validateAndSubmit"
          class="btn btn-primary px-4"
          :disabled="isSubmitting || !selectedClient"
        >
          <Loader2 v-if="isSubmitting" :size="18" class="animate-spin me-2" />
          <CreditCard v-else :size="18" class="me-2" />
          Valider Facture
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.z-3 {
  z-index: 1030;
}
.hover-bg-light:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
