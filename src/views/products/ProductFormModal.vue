<script setup>
import { ref, reactive, watch } from "vue";

const props = defineProps({
  show: Boolean,
  isEditing: Boolean,
  categories: Array,
  productUnits: Array,
  initialData: Object,
});

const emit = defineEmits(["close", "save"]);

const activeTab = ref("general");
const form = ref({});

const defaultForm = {
  item_code: "",
  item_designation: "",
  item_measurement_unit: "",
  barcode: "",
  vat_rate: 0,
  product_unit_id: null,
  product_category_id: null,
  code_product: "",
  marque: "",
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
  image: "",
  type: "",
  description: "",
};

watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      form.value = { ...defaultForm, ...JSON.parse(JSON.stringify(newVal)) };
    } else {
      form.value = { ...defaultForm };
    }
  },
  { immediate: true }
);

const handleClose = () => {
  activeTab.value = "general";
  emit("close");
};

const handleSave = () => {
  emit("save", form.value);
};

const handleFileChange = (e) => {
  form.value.image = e.target.files[0];
};
</script>

<template>
  <div
    v-if="show"
    class="modal d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            {{ isEditing ? "Modifier le Produit" : "Nouveau Produit" }}
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="handleClose"
          ></button>
        </div>
        <div class="modal-body p-4">
          <!-- Tabs Navigation -->
          <ul class="nav nav-pills mb-4">
            <li class="nav-item">
              <button
                class="nav-link px-4"
                :class="{ active: activeTab === 'general' }"
                @click="activeTab = 'general'"
                type="button"
              >
                Général
              </button>
            </li>
            <li class="nav-item">
              <button
                class="nav-link px-4"
                :class="{ active: activeTab === 'prices' }"
                @click="activeTab = 'prices'"
                type="button"
              >
                Prix & Taxes
              </button>
            </li>
            <li class="nav-item">
              <button
                class="nav-link px-4"
                :class="{ active: activeTab === 'details' }"
                @click="activeTab = 'details'"
                type="button"
              >
                Détails
              </button>
            </li>
          </ul>

          <!-- Tabs Content -->
          <form @submit.prevent="handleSave">
            <div class="tab-content">
              <!-- Tab 1: General -->
              <div
                class="tab-pane fade"
                :class="{ 'show active text-start': activeTab === 'general' }"
                v-show="activeTab === 'general'"
              >
                <div class="row g-3">
                  <div class="col-md-6">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Code Article <span class="text-danger">*</span></label
                    >
                    <input
                      type="text"
                      class="form-control bg-light"
                      v-model="form.item_code"
                      required
                      maxlength="255"
                    />
                  </div>
                  <div class="col-md-6">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Désignation <span class="text-danger">*</span></label
                    >
                    <input
                      type="text"
                      class="form-control bg-light"
                      v-model="form.item_designation"
                      required
                      maxlength="255"
                    />
                  </div>
                  <div class="col-md-6">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Unité de Mesure <span class="text-danger">*</span></label
                    >
                    <select
                      class="form-select bg-light"
                      v-model="form.item_measurement_unit"
                    >
                      <option :value="null">Sélectionner une unité</option>
                      <option
                        v-for="unit in productUnits"
                        :key="unit.name"
                        :value="unit.id"
                      >
                        {{ unit.name }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Code Barre</label
                    >
                    <input
                      type="text"
                      class="form-control bg-light"
                      v-model="form.barcode"
                      maxlength="255"
                    />
                  </div>
                  <div class="col-md-6">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Catégorie</label
                    >
                    <select
                      class="form-select bg-light"
                      v-model="form.product_category_id"
                    >
                      <option :value="null">Sélectionner une catégorie</option>
                      <option
                        v-for="cat in categories"
                        :key="cat.id"
                        :value="cat.id"
                      >
                        {{ cat.name }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Marque</label
                    >
                    <input
                      type="text"
                      class="form-control bg-light"
                      v-model="form.marque"
                      maxlength="255"
                    />
                  </div>
                </div>
              </div>

              <!-- Tab 2: Pricing & Tax -->
              <div
                class="tab-pane fade"
                :class="{ 'show active text-start': activeTab === 'prices' }"
                v-show="activeTab === 'prices'"
              >
                <div class="row g-3">
                  <div class="col-md-4">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Prix (HT)</label
                    >
                    <input
                      type="number"
                      class="form-control bg-light"
                      v-model.number="form.price"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div class="col-md-4">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Taux TVA (%) <span class="text-danger">*</span></label
                    >
                    <input
                      type="number"
                      class="form-control bg-light"
                      v-model.number="form.vat_rate"
                      required
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                  <div class="col-md-4">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Prix TTC</label
                    >
                    <input
                      type="number"
                      class="form-control bg-light"
                      v-model.number="form.price_ttc"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <!-- Tab 3: Details -->
              <div
                class="tab-pane fade"
                :class="{ 'show active text-start': activeTab === 'details' }"
                v-show="activeTab === 'details'"
              >
                <div class="row g-3">
                  <div class="col-md-6">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Quantité</label
                    >
                    <input
                      type="number"
                      class="form-control bg-light"
                      v-model.number="form.quantite"
                      min="0"
                    />
                  </div>
                  <div class="col-md-6">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Quantité Alerte</label
                    >
                    <input
                      type="number"
                      class="form-control bg-light"
                      v-model.number="form.quantite_alert"
                      min="0"
                    />
                  </div>
                  <div class="col-12">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Image</label
                    >
                    <input
                      type="file"
                      class="form-control bg-light mb-2"
                      @change="handleFileChange"
                    />
                  </div>
                  <div class="col-12">
                    <label
                      class="form-label small text-muted text-uppercase fw-bold"
                      >Description</label
                    >
                    <textarea
                      class="form-control bg-light"
                      v-model="form.description"
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer mt-4 px-0 pb-0 border-0">
              <button
                type="button"
                class="btn btn-secondary px-4"
                @click="handleClose"
              >
                Annuler
              </button>
              <button type="submit" class="btn btn-primary px-4">
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
