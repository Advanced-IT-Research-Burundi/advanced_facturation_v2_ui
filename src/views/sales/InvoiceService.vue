<script setup>
import { ref, reactive, computed } from "vue";
import { Plus, Trash2, CreditCard, Loader2 } from "lucide-vue-next";

const props = defineProps({
  isSubmitting: Boolean,
});

const emit = defineEmits(["submit"]);

const serviceItems = ref([
  { description: "", quantity: 1, price: 0, tvaRate: 18 },
]);

const serviceForm = reactive({
  client: "",
  paymentType: "",
  currency: "BIF",
});

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
  if (serviceItems.value.length === 0 || !serviceItems.value[0].description)
    return;
  if (!serviceForm.client) {
    alert("Veuillez sélectionner un client.");
    return;
  }

  const payload = {
    invoice_type: "FN",
    invoice_action: "SERVICE",
    invoice_currency: serviceForm.currency,
    items: serviceItems.value.map((item) => ({
      item_designation: item.description,
      item_quantity: parseFloat(item.quantity),
      item_price: parseFloat(item.price),
      vat: parseFloat(item.tvaRate),
      item_ct: 0,
      item_tl: 0,
    })),
    client_identifier: serviceForm.client,
  };

  emit("submit", payload);
};

const reset = () => {
  serviceItems.value = [
    { description: "", quantity: 1, price: 0, tvaRate: 18 },
  ];
  serviceForm.client = "";
};

defineExpose({ reset });
</script>

<template>
  <div class="d-flex flex-column h-100 bg-white p-4 overflow-auto">
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
        <div class="flex-grow-1">
          <label class="form-label small text-muted">Client (Nom ou TIN)</label>
          <input
            v-model="serviceForm.client"
            type="text"
            class="form-control"
            placeholder="Recherche client..."
          />
        </div>
        <div style="width: 180px">
          <label class="form-label small text-muted">Paiement</label>
          <select v-model="serviceForm.paymentType" class="form-select">
            <option value="cash">Espèces</option>
            <option value="banque">Banque</option>
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
          :disabled="isSubmitting"
        >
          <Loader2 v-if="isSubmitting" :size="18" class="animate-spin me-2" />
          <CreditCard v-else :size="18" class="me-2" />
          Valider
        </button>
      </div>
    </div>
  </div>
</template>
