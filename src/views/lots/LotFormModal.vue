<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  show: Boolean,
  isEditing: Boolean,
  initialData: Object,
  products: Array,
  warehouses: Array,
  fournisseurs: Array,
});

const emit = defineEmits(["close", "save"]);

const form = ref({});

const defaultForm = {
  product_id: null,
  warehouse_id: null,
  lot_number: "",
  manufacturing_date: null,
  expiration_date: null,
  initial_quantity: 0,
  purchase_price: 0,
  supplier_reference: "",
  fournisseur_id: null,
  notes: "",
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
  emit("close");
};

const handleSave = () => {
  // Validation basique
  if (!form.value.product_id) {
    alert("Veuillez selectionner un produit");
    return;
  }
  if (!form.value.warehouse_id) {
    alert("Veuillez selectionner un entrepot");
    return;
  }
  if (!form.value.lot_number) {
    alert("Veuillez saisir un numero de lot");
    return;
  }
  if (!form.value.expiration_date) {
    alert("Veuillez saisir une date d'expiration");
    return;
  }
  if (form.value.initial_quantity <= 0 && !props.isEditing) {
    alert("La quantite doit etre superieure a 0");
    return;
  }

  emit("save", form.value);
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
        <div class="modal-header bg-success text-white">
          <h5 class="modal-title">
            {{ isEditing ? "Modifier le Lot" : "Nouveau Lot" }}
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="handleClose"
          ></button>
        </div>
        <div class="modal-body p-4">
          <form @submit.prevent="handleSave">
            <div class="row g-3">
              <!-- Produit -->
              <div class="col-md-6">
                <label class="form-label small text-muted text-uppercase fw-bold">
                  Produit <span class="text-danger">*</span>
                </label>
                <select
                  class="form-select bg-light"
                  v-model="form.product_id"
                  :disabled="isEditing"
                  required
                >
                  <option :value="null">Selectionner un produit</option>
                  <option v-for="product in products" :key="product.id" :value="product.id">
                    {{ product.item_designation }} ({{ product.item_code }})
                  </option>
                </select>
              </div>

              <!-- Entrepot -->
              <div class="col-md-6">
                <label class="form-label small text-muted text-uppercase fw-bold">
                  Entrepot <span class="text-danger">*</span>
                </label>
                <select
                  class="form-select bg-light"
                  v-model="form.warehouse_id"
                  :disabled="isEditing"
                  required
                >
                  <option :value="null">Selectionner un entrepot</option>
                  <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                    {{ warehouse.name }}
                  </option>
                </select>
              </div>

              <!-- Numero de lot -->
              <div class="col-md-6">
                <label class="form-label small text-muted text-uppercase fw-bold">
                  Numero de Lot <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control bg-light"
                  v-model="form.lot_number"
                  placeholder="Ex: LOT-2026-001"
                  required
                />
              </div>

              <!-- Fournisseur -->
              <div class="col-md-6">
                <label class="form-label small text-muted text-uppercase fw-bold">
                  Fournisseur
                </label>
                <select class="form-select bg-light" v-model="form.fournisseur_id">
                  <option :value="null">Selectionner un fournisseur</option>
                  <option v-for="fournisseur in fournisseurs" :key="fournisseur.id" :value="fournisseur.id">
                    {{ fournisseur.name }}
                  </option>
                </select>
              </div>

              <!-- Date de fabrication -->
              <div class="col-md-6">
                <label class="form-label small text-muted text-uppercase fw-bold">
                  Date de Fabrication
                </label>
                <input
                  type="date"
                  class="form-control bg-light"
                  v-model="form.manufacturing_date"
                />
              </div>

              <!-- Date d'expiration -->
              <div class="col-md-6">
                <label class="form-label small text-muted text-uppercase fw-bold">
                  Date d'Expiration <span class="text-danger">*</span>
                </label>
                <input
                  type="date"
                  class="form-control bg-light"
                  v-model="form.expiration_date"
                  required
                />
              </div>

              <!-- Quantite initiale -->
              <div class="col-md-6">
                <label class="form-label small text-muted text-uppercase fw-bold">
                  Quantite Initiale <span class="text-danger" v-if="!isEditing">*</span>
                </label>
                <input
                  type="number"
                  class="form-control bg-light"
                  v-model.number="form.initial_quantity"
                  min="0"
                  step="0.01"
                  :disabled="isEditing"
                />
              </div>

              <!-- Prix d'achat -->
              <div class="col-md-6">
                <label class="form-label small text-muted text-uppercase fw-bold">
                  Prix d'Achat Unitaire
                </label>
                <input
                  type="number"
                  class="form-control bg-light"
                  v-model.number="form.purchase_price"
                  min="0"
                  step="0.01"
                />
              </div>

              <!-- Reference fournisseur -->
              <div class="col-md-6">
                <label class="form-label small text-muted text-uppercase fw-bold">
                  Reference Fournisseur
                </label>
                <input
                  type="text"
                  class="form-control bg-light"
                  v-model="form.supplier_reference"
                  placeholder="Numero de commande fournisseur"
                />
              </div>

              <!-- Statut (edition uniquement) -->
              <div class="col-md-6" v-if="isEditing">
                <label class="form-label small text-muted text-uppercase fw-bold">
                  Statut
                </label>
                <select class="form-select bg-light" v-model="form.status">
                  <option value="active">Actif</option>
                  <option value="expired">Expire</option>
                  <option value="recalled">Rappele</option>
                  <option value="depleted">Epuise</option>
                </select>
              </div>

              <!-- Notes -->
              <div class="col-12">
                <label class="form-label small text-muted text-uppercase fw-bold">
                  Notes
                </label>
                <textarea
                  class="form-control bg-light"
                  v-model="form.notes"
                  rows="2"
                  placeholder="Notes supplementaires..."
                ></textarea>
              </div>
            </div>

            <div class="modal-footer mt-4 px-0 pb-0 border-0">
              <button type="button" class="btn btn-secondary px-4" @click="handleClose">
                Annuler
              </button>
              <button type="submit" class="btn btn-success px-4">
                {{ isEditing ? "Mettre a jour" : "Creer le Lot" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
