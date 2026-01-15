<script setup>
import { reactive, computed, watch } from "vue";
import { Plus, Trash2, Loader2 } from "lucide-vue-next";

const props = defineProps({
  show: Boolean,
  isEditing: Boolean,
  isSubmitting: Boolean,
  initialData: Object,
  customers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "save", "preview"]);

const form = reactive({
  customer_id: "",
  currency: "BIF",
  date: new Date().toISOString().split("T")[0],
  items: [{ item_designation: "", item_quantity: 1, item_price: 0, vat: 18 }],
});

// Sync if editing
watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      // If editing, map the incoming data to the form structure
      // Note: we might not have customer_id if it wasn't returned or if we are mapping from a view model.
      // We'll rely on what's passed.
      form.customer_id = newVal.customer_id || ""; // Handle mapping in parent if needed
      form.currency = newVal.currency || "BIF";
      form.date = newVal.date ? newVal.date.split("T")[0] : new Date().toISOString().split("T")[0];
      
      const itemsSource = newVal.items || newVal.invoice_items;
      if (itemsSource && itemsSource.length) {
         form.items = itemsSource.map(i => ({
             item_designation: i.description || i.item_designation,
             item_quantity: i.quantity || i.item_quantity,
             item_price: i.unit_price_ht || i.item_price,
             vat: i.tva_rate || i.vat
         }));
      }
    }
  },
  { immediate: true }
);

const addItem = () =>
  form.items.push({
    item_designation: "",
    item_quantity: 1,
    item_price: 0,
    vat: 18,
  });
const removeItem = (idx) => form.items.length > 1 && form.items.splice(idx, 1);

const totals = computed(() => {
  let total_ht = 0,
    total_tva = 0;
  form.items.forEach((item) => {
    const ht = (item.item_quantity || 0) * (item.item_price || 0);
    total_ht += ht;
    total_tva += ht * (item.vat / 100);
  });
  return { total_ht, total_tva, total_ttc: total_ht + total_tva };
});

const save = () => {
  if (!form.customer_id) {
    alert("Veuillez sélectionner un client.");
    return;
  }
  
  // Construct payload for API
  const payload = {
      invoice_type: 'FP',
      invoice_action: 'SERVICE',
      invoice_currency: form.currency,
      customer_id: form.customer_id,
      items: form.items
  };
  
  if (props.isEditing && props.initialData?.id) {
      // pass ID for update
      emit("save", { id: props.initialData.id, data: payload });
  } else {
      emit("save", payload);
  }
};
</script>

<template>
  <div
    v-if="show"
    class="modal d-block"
    style="background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            {{ isEditing ? "Modifier Proforma" : "Nouvelle Proforma" }}
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="modal-body p-4">
          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <label class="form-label small text-muted text-uppercase"
                >Client</label
              >
              <select v-model="form.customer_id" class="form-select">
                  <option value="" disabled>Sélectionner un client</option>
                  <option v-for="c in customers" :key="c.id" :value="c.id">
                      {{ c.customer_name }} ({{ c.customer_TIN }})
                  </option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label small text-muted text-uppercase"
                >Date</label
              >
              <input v-model="form.date" type="date" class="form-control" disabled />
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-bordered align-middle">
              <thead class="bg-light">
                <tr>
                  <th>Description</th>
                  <th style="width: 100px">Qté</th>
                  <th style="width: 150px">Prix HT</th>
                  <th style="width: 120px">TVA</th>
                  <th style="width: 150px">Total TTC</th>
                  <th style="width: 50px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in form.items" :key="idx">
                  <td>
                    <input
                      v-model="item.item_designation"
                      type="text"
                      class="form-control form-control-sm"
                      placeholder="Service ou Produit"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="item.item_quantity"
                      type="number"
                      step="0.01"
                      class="form-control form-control-sm"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="item.item_price"
                      type="number"
                      class="form-control form-control-sm"
                    />
                  </td>
                  <td>
                    <select
                      v-model="item.vat"
                      class="form-select form-select-sm"
                    >
                      <option :value="18">18%</option>
                      <option :value="0">0%</option>
                    </select>
                  </td>
                  <td class="fw-bold">
                    {{
                      (
                        item.item_quantity *
                        item.item_price *
                        (1 + item.vat / 100)
                      ).toLocaleString()
                    }}
                  </td>
                  <td>
                    <button
                      @click="removeItem(idx)"
                      class="btn btn-sm btn-outline-danger border-0"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button @click="addItem" class="btn btn-sm btn-outline-primary mt-2">
            <Plus :size="14" /> Ajouter ligne
          </button>
        </div>
        <div class="modal-footer bg-light border-top">
          <div class="me-auto d-flex gap-4">
            <div class="text-muted small">
              TOTAL HT:
              <span class="text-dark fw-bold"
                >{{ totals.total_ht.toLocaleString() }} BIF</span
              >
            </div>
            <div class="text-muted small">
              TOTAL TTC:
              <span class="text-primary fw-bold"
                >{{ totals.total_ttc.toLocaleString() }} BIF</span
              >
            </div>
          </div>
          <button @click="$emit('close')" class="btn btn-secondary px-4">
            Annuler
          </button>
          <button
            @click="save"
            class="btn btn-primary px-4"
            :disabled="isSubmitting"
          >
            <Loader2 v-if="isSubmitting" :size="18" class="animate-spin me-2" />
            {{ isEditing ? "Modifier" : "Enregistrer" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
