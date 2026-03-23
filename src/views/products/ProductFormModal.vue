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
  is_production: false,
  // Champs pharmaceutiques
  is_pharmaceutical: false,
  dci: "",
  dosage: "",
  forme_galenique: "",
  laboratoire: "",
  numero_amm: "",
  requires_prescription: false,
  classe_therapeutique: "",
  contre_indications: "",
  posologie_standard: "",
  delai_alerte_expiration: 90,
  is_controlled_substance: false,
  storage_conditions: "",
};

// Options pour les formes galeniques
const formesGaleniques = [
  "Comprime",
  "Gelule",
  "Sirop",
  "Solution injectable",
  "Pommade",
  "Creme",
  "Gel",
  "Suppositoire",
  "Collyre",
  "Spray nasal",
  "Patch",
  "Poudre",
  "Suspension",
  "Autre",
];

// Options pour les classes therapeutiques
const classesTherapeutiques = [
  "Antibiotiques",
  "Antiviraux",
  "Antifongiques",
  "Analgesiques",
  "Anti-inflammatoires",
  "Antihistaminiques",
  "Antihypertenseurs",
  "Antidiabetiques",
  "Antidepresseurs",
  "Anxiolytiques",
  "Anticoagulants",
  "Diuretiques",
  "Vitamines",
  "Supplements",
  "Autre",
];

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

const handleUnitChange = (e) => {
  const unitId = e.target.value;
  const unit = props.productUnits.find(u => u.id == unitId);
  if (unit) {
    form.value.item_measurement_unit = unit.name;
    form.value.product_unit_id = unit.id;
  } else {
    form.value.item_measurement_unit = "";
    form.value.product_unit_id = null;
  }
};

const isCalculating = ref(false);

watch(
  () => form.value.price,
  (newVal) => {
    if (isCalculating.value) return;
    isCalculating.value = true;
    const price = parseFloat(newVal) || 0;
    const vat = parseFloat(form.value.vat_rate) || 0;
    form.value.price_ttc = parseFloat((price * (1 + vat / 100)).toFixed(2));
    isCalculating.value = false;
  }
);

watch(
  () => form.value.vat_rate,
  (newVal) => {
    if (isCalculating.value) return;
    isCalculating.value = true;
    const price = parseFloat(form.value.price) || 0;
    const vat = parseFloat(newVal) || 0;
    form.value.price_ttc = parseFloat((price * (1 + vat / 100)).toFixed(2));
    isCalculating.value = false;
  }
);

watch(
  () => form.value.price_ttc,
  (newVal) => {
    if (isCalculating.value) return;
    isCalculating.value = true;
    const ttc = parseFloat(newVal) || 0;
    const vat = parseFloat(form.value.vat_rate) || 0;
    const divisor = 1 + vat / 100;
    if (divisor !== 0) {
      form.value.price = parseFloat((ttc / divisor).toFixed(2));
    }
    isCalculating.value = false;
  }
);
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
            <li class="nav-item">
              <button
                class="nav-link px-4"
                :class="{ active: activeTab === 'pharma', 'bg-success text-white': form.is_pharmaceutical && activeTab !== 'pharma' }"
                @click="activeTab = 'pharma'"
                type="button"
              >
                Pharmaceutique
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
                      v-model="form.product_unit_id"
                      @change="handleUnitChange"
                    >
                      <option :value="null">Sélectionner une unité</option>
                      <option
                        v-for="unit in productUnits"
                        :key="unit.id"
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
                  <div class="col-12">
                    <div class="form-check form-switch mt-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="is_production"
                        v-model="form.is_production"
                      />
                      <label class="form-check-label fw-bold" for="is_production">
                        Produit de Production (Boulangerie / Pâtisserie)
                      </label>
                      <div class="form-text">
                        Activez si ce produit est fabriqué en boulangerie. Il apparaîtra dans le module Production.
                      </div>
                    </div>
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

              <!-- Tab 4: Pharmaceutical -->
              <div
                class="tab-pane fade"
                :class="{ 'show active text-start': activeTab === 'pharma' }"
                v-show="activeTab === 'pharma'"
              >
                <div class="row g-3">
                  <!-- Toggle Produit Pharmaceutique -->
                  <div class="col-12">
                    <div class="form-check form-switch">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="is_pharmaceutical"
                        v-model="form.is_pharmaceutical"
                      />
                      <label class="form-check-label fw-bold" for="is_pharmaceutical">
                        Produit Pharmaceutique
                      </label>
                    </div>
                  </div>

                  <!-- Champs pharmaceutiques (visibles si is_pharmaceutical) -->
                  <template v-if="form.is_pharmaceutical">
                    <div class="col-md-6">
                      <label class="form-label small text-muted text-uppercase fw-bold">
                        DCI (Denomination Commune Internationale)
                      </label>
                      <input
                        type="text"
                        class="form-control bg-light"
                        v-model="form.dci"
                        placeholder="Ex: Paracetamol"
                      />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small text-muted text-uppercase fw-bold">
                        Dosage
                      </label>
                      <input
                        type="text"
                        class="form-control bg-light"
                        v-model="form.dosage"
                        placeholder="Ex: 500mg, 10mg/ml"
                      />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small text-muted text-uppercase fw-bold">
                        Forme Galenique
                      </label>
                      <select class="form-select bg-light" v-model="form.forme_galenique">
                        <option value="">Selectionner une forme</option>
                        <option v-for="forme in formesGaleniques" :key="forme" :value="forme">
                          {{ forme }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small text-muted text-uppercase fw-bold">
                        Laboratoire / Fabricant
                      </label>
                      <input
                        type="text"
                        class="form-control bg-light"
                        v-model="form.laboratoire"
                        placeholder="Nom du fabricant"
                      />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small text-muted text-uppercase fw-bold">
                        Numero AMM
                      </label>
                      <input
                        type="text"
                        class="form-control bg-light"
                        v-model="form.numero_amm"
                        placeholder="Autorisation de mise sur le marche"
                      />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small text-muted text-uppercase fw-bold">
                        Classe Therapeutique
                      </label>
                      <select class="form-select bg-light" v-model="form.classe_therapeutique">
                        <option value="">Selectionner une classe</option>
                        <option v-for="classe in classesTherapeutiques" :key="classe" :value="classe">
                          {{ classe }}
                        </option>
                      </select>
                    </div>

                    <!-- Options de controle -->
                    <div class="col-md-6">
                      <div class="form-check form-switch mt-3">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="requires_prescription"
                          v-model="form.requires_prescription"
                        />
                        <label class="form-check-label" for="requires_prescription">
                          Necessite une ordonnance
                        </label>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-check form-switch mt-3">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="is_controlled_substance"
                          v-model="form.is_controlled_substance"
                        />
                        <label class="form-check-label text-danger" for="is_controlled_substance">
                          Substance controlee (Stupefiant)
                        </label>
                      </div>
                    </div>

                    <div class="col-md-6">
                      <label class="form-label small text-muted text-uppercase fw-bold">
                        Delai Alerte Expiration (jours)
                      </label>
                      <input
                        type="number"
                        class="form-control bg-light"
                        v-model.number="form.delai_alerte_expiration"
                        min="1"
                        max="365"
                      />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small text-muted text-uppercase fw-bold">
                        Conditions de Stockage
                      </label>
                      <input
                        type="text"
                        class="form-control bg-light"
                        v-model="form.storage_conditions"
                        placeholder="Ex: Conserver au frais (2-8C)"
                      />
                    </div>
                    <div class="col-12">
                      <label class="form-label small text-muted text-uppercase fw-bold">
                        Posologie Standard
                      </label>
                      <textarea
                        class="form-control bg-light"
                        v-model="form.posologie_standard"
                        rows="2"
                        placeholder="Ex: Adultes: 1 comprime 3 fois par jour"
                      ></textarea>
                    </div>
                    <div class="col-12">
                      <label class="form-label small text-muted text-uppercase fw-bold">
                        Contre-indications
                      </label>
                      <textarea
                        class="form-control bg-light"
                        v-model="form.contre_indications"
                        rows="2"
                        placeholder="Liste des contre-indications"
                      ></textarea>
                    </div>
                  </template>

                  <!-- Message si non pharmaceutique -->
                  <div v-else class="col-12">
                    <div class="alert alert-info">
                      Activez l'option "Produit Pharmaceutique" pour acceder aux champs specifiques.
                    </div>
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
