<script setup>
import { reactive, computed } from "vue";
import { Plus, Trash2, Loader2, Eye as EyeIcon } from "lucide-vue-next";

const props = defineProps({
  show: Boolean,
  isEditing: Boolean,
  isSubmitting: Boolean,
  initialData: Object,
});

const emit = defineEmits(["close", "save", "preview"]);

const form = reactive({
  client_number: "",
  client_name: "",
  currency: "BIF",
  payment_method: "cash",
  date: new Date().toISOString().split("T")[0],
  items: [{ description: "", quantity: 1, unit_price_ht: 0, tva_rate: 18 }],
});

// Sync if editing
if (props.initialData) {
  Object.assign(form, JSON.parse(JSON.stringify(props.initialData)));
}

const addItem = () =>
  form.items.push({
    description: "",
    quantity: 1,
    unit_price_ht: 0,
    tva_rate: 18,
  });
const removeItem = (idx) => form.items.length > 1 && form.items.splice(idx, 1);

const totals = computed(() => {
  let total_ht = 0,
    total_tva = 0;
  form.items.forEach((item) => {
    const ht = (item.quantity || 0) * (item.unit_price_ht || 0);
    total_ht += ht;
    total_tva += ht * (item.tva_rate / 100);
  });
  return { total_ht, total_tva, total_ttc: total_ht + total_tva };
});

const save = () => {
  if (!form.client_number || !form.client_name) {
    alert("Veuillez remplir les informations client.");
    return;
  }
  emit("save", { ...form, totals: totals.value });
};

const preview = () => emit("preview", { ...form, totals: totals.value });
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
            <div class="col-md-3">
              <label class="form-label small text-muted text-uppercase"
                >TIN Client</label
              >
              <input
                v-model="form.client_number"
                type="text"
                class="form-control"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted text-uppercase"
                >Nom Client</label
              >
              <input
                v-model="form.client_name"
                type="text"
                class="form-control"
              />
            </div>
            <div class="col-md-3">
              <label class="form-label small text-muted text-uppercase"
                >Date</label
              >
              <input v-model="form.date" type="date" class="form-control" />
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
                      v-model="item.description"
                      type="text"
                      class="form-control form-control-sm"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      class="form-control form-control-sm"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="item.unit_price_ht"
                      type="number"
                      class="form-control form-control-sm"
                    />
                  </td>
                  <td>
                    <select
                      v-model="item.tva_rate"
                      class="form-select form-select-sm"
                    >
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
          <button @click="preview" class="btn btn-outline-info px-4">
            Aperçu
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
