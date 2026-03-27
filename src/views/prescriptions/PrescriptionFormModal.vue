<script setup>
import { ref, watch, computed } from "vue";
import { useToast } from '@/composables/useToast';

const toast = useToast();

const props = defineProps({
  show: Boolean,
  initialData: Object,
  customers: Array,
  products: Array,
});

const emit = defineEmits(["close", "save"]);

const isViewMode = computed(() => !!props.initialData);

const form = ref({});
const items = ref([]);

const defaultForm = {
  customer_id: null,
  patient_name: "",
  patient_birthdate: null,
  patient_phone: "",
  prescriber_name: "",
  prescriber_registration: "",
  prescriber_phone: "",
  prescriber_address: "",
  prescription_date: new Date().toISOString().split("T")[0],
  validity_date: null,
  diagnosis: "",
  notes: "",
};

watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      form.value = { ...defaultForm, ...JSON.parse(JSON.stringify(newVal)) };
      items.value = newVal.items ? [...newVal.items] : [];
    } else {
      form.value = { ...defaultForm };
      items.value = [];
    }
  },
  { immediate: true }
);

const handleClose = () => {
  emit("close");
};

const addItem = () => {
  items.value.push({
    product_id: null,
    prescribed_quantity: 1,
    dosage_instructions: "",
    treatment_duration: null,
    notes: "",
  });
};

const removeItem = (index) => {
  items.value.splice(index, 1);
};

const handleSave = () => {
  // Validation
  if (!form.value.customer_id) {
    toast.warning("Veuillez selectionner un client");
    return;
  }
  if (!form.value.patient_name) {
    toast.warning("Veuillez saisir le nom du patient");
    return;
  }
  if (!form.value.prescriber_name) {
    toast.warning("Veuillez saisir le nom du medecin");
    return;
  }
  if (items.value.length === 0) {
    toast.warning("Veuillez ajouter au moins un produit");
    return;
  }
  for (const item of items.value) {
    if (!item.product_id) {
      toast.warning("Veuillez selectionner un produit pour chaque ligne");
      return;
    }
    if (item.prescribed_quantity <= 0) {
      toast.warning("La quantite doit etre superieure a 0");
      return;
    }
  }

  emit("save", {
    ...form.value,
    items: items.value,
  });
};

const getProductName = (productId) => {
  const product = props.products.find((p) => p.id === productId);
  return product ? product.item_designation : "-";
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
};

const getStatusLabel = (status) => {
  switch (status) {
    case "pending":
      return "En attente";
    case "partially_dispensed":
      return "Partiellement delivree";
    case "fully_dispensed":
      return "Delivree";
    default:
      return status;
  }
};
</script>

<template>
  <div
    v-if="show"
    class="modal d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-info text-white">
          <h5 class="modal-title">
            {{ isViewMode ? `Ordonnance ${initialData?.prescription_number}` : "Nouvelle Ordonnance" }}
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="handleClose"
          ></button>
        </div>
        <div class="modal-body p-4">
          <!-- View Mode -->
          <template v-if="isViewMode">
            <div class="row g-4">
              <!-- Informations Patient -->
              <div class="col-md-6">
                <div class="card h-100">
                  <div class="card-header bg-light">
                    <h6 class="mb-0">Patient</h6>
                  </div>
                  <div class="card-body">
                    <p><strong>Nom:</strong> {{ form.patient_name }}</p>
                    <p><strong>Date de naissance:</strong> {{ formatDate(form.patient_birthdate) }}</p>
                    <p><strong>Telephone:</strong> {{ form.patient_phone || "-" }}</p>
                    <p><strong>Client:</strong> {{ initialData?.customer?.customer_name }}</p>
                  </div>
                </div>
              </div>

              <!-- Informations Medecin -->
              <div class="col-md-6">
                <div class="card h-100">
                  <div class="card-header bg-light">
                    <h6 class="mb-0">Medecin Prescripteur</h6>
                  </div>
                  <div class="card-body">
                    <p><strong>Nom:</strong> {{ form.prescriber_name }}</p>
                    <p><strong>N Ordre:</strong> {{ form.prescriber_registration || "-" }}</p>
                    <p><strong>Telephone:</strong> {{ form.prescriber_phone || "-" }}</p>
                    <p><strong>Adresse:</strong> {{ form.prescriber_address || "-" }}</p>
                  </div>
                </div>
              </div>

              <!-- Details Ordonnance -->
              <div class="col-12">
                <div class="card">
                  <div class="card-header bg-light">
                    <h6 class="mb-0">Details de l'Ordonnance</h6>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-3">
                        <p><strong>Date:</strong> {{ formatDate(form.prescription_date) }}</p>
                      </div>
                      <div class="col-md-3">
                        <p><strong>Validite:</strong> {{ formatDate(form.validity_date) || "Non limitee" }}</p>
                      </div>
                      <div class="col-md-3">
                        <p><strong>Diagnostic:</strong> {{ form.diagnosis || "-" }}</p>
                      </div>
                      <div class="col-md-3">
                        <p><strong>Notes:</strong> {{ form.notes || "-" }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Produits prescrits -->
              <div class="col-12">
                <div class="card">
                  <div class="card-header bg-light">
                    <h6 class="mb-0">Produits Prescrits</h6>
                  </div>
                  <div class="card-body p-0">
                    <table class="table mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>Produit</th>
                          <th>Qte Prescrite</th>
                          <th>Qte Delivree</th>
                          <th>Posologie</th>
                          <th>Duree</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="item in items" :key="item.id">
                          <td>{{ item.product?.item_designation || getProductName(item.product_id) }}</td>
                          <td>{{ item.prescribed_quantity }}</td>
                          <td>{{ item.dispensed_quantity || 0 }}</td>
                          <td>{{ item.dosage_instructions || "-" }}</td>
                          <td>{{ item.treatment_duration ? `${item.treatment_duration} jours` : "-" }}</td>
                          <td>
                            <span class="badge" :class="{
                              'bg-warning text-dark': item.status === 'pending',
                              'bg-info': item.status === 'partially_dispensed',
                              'bg-success': item.status === 'fully_dispensed'
                            }">
                              {{ getStatusLabel(item.status) }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Create Mode -->
          <template v-else>
            <form @submit.prevent="handleSave">
              <div class="row g-3">
                <!-- Client -->
                <div class="col-md-6">
                  <label class="form-label small text-muted text-uppercase fw-bold">
                    Client <span class="text-danger">*</span>
                  </label>
                  <select class="form-select bg-light" v-model="form.customer_id" required>
                    <option :value="null">Selectionner un client</option>
                    <option v-for="customer in customers" :key="customer.id" :value="customer.id">
                      {{ customer.customer_name }}
                    </option>
                  </select>
                </div>

                <!-- Patient Name -->
                <div class="col-md-6">
                  <label class="form-label small text-muted text-uppercase fw-bold">
                    Nom du Patient <span class="text-danger">*</span>
                  </label>
                  <input type="text" class="form-control bg-light" v-model="form.patient_name" required />
                </div>

                <!-- Patient Birthdate -->
                <div class="col-md-4">
                  <label class="form-label small text-muted text-uppercase fw-bold">
                    Date de Naissance
                  </label>
                  <input type="date" class="form-control bg-light" v-model="form.patient_birthdate" />
                </div>

                <!-- Patient Phone -->
                <div class="col-md-4">
                  <label class="form-label small text-muted text-uppercase fw-bold">
                    Telephone Patient
                  </label>
                  <input type="text" class="form-control bg-light" v-model="form.patient_phone" />
                </div>

                <!-- Prescription Date -->
                <div class="col-md-4">
                  <label class="form-label small text-muted text-uppercase fw-bold">
                    Date Ordonnance <span class="text-danger">*</span>
                  </label>
                  <input type="date" class="form-control bg-light" v-model="form.prescription_date" required />
                </div>

                <hr />

                <!-- Prescriber Name -->
                <div class="col-md-6">
                  <label class="form-label small text-muted text-uppercase fw-bold">
                    Nom du Medecin <span class="text-danger">*</span>
                  </label>
                  <input type="text" class="form-control bg-light" v-model="form.prescriber_name" required />
                </div>

                <!-- Prescriber Registration -->
                <div class="col-md-6">
                  <label class="form-label small text-muted text-uppercase fw-bold">
                    Numero d'Ordre
                  </label>
                  <input type="text" class="form-control bg-light" v-model="form.prescriber_registration" />
                </div>

                <!-- Diagnosis -->
                <div class="col-12">
                  <label class="form-label small text-muted text-uppercase fw-bold">
                    Diagnostic
                  </label>
                  <textarea class="form-control bg-light" v-model="form.diagnosis" rows="2"></textarea>
                </div>

                <hr />

                <!-- Items -->
                <div class="col-12">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">Produits Prescrits</h6>
                    <button type="button" class="btn btn-sm btn-success" @click="addItem">
                      <i class="bi bi-plus"></i> Ajouter
                    </button>
                  </div>

                  <div v-if="items.length === 0" class="alert alert-info">
                    Cliquez sur "Ajouter" pour ajouter des produits
                  </div>

                  <div v-for="(item, index) in items" :key="index" class="card mb-2">
                    <div class="card-body py-2">
                      <div class="row g-2 align-items-center">
                        <div class="col-md-4">
                          <select class="form-select form-select-sm" v-model="item.product_id" required>
                            <option :value="null">Produit...</option>
                            <option v-for="product in products" :key="product.id" :value="product.id">
                              {{ product.item_designation }}
                            </option>
                          </select>
                        </div>
                        <div class="col-md-2">
                          <input
                            type="number"
                            class="form-control form-control-sm"
                            v-model.number="item.prescribed_quantity"
                            placeholder="Qte"
                            min="1"
                            required
                          />
                        </div>
                        <div class="col-md-3">
                          <input
                            type="text"
                            class="form-control form-control-sm"
                            v-model="item.dosage_instructions"
                            placeholder="Posologie"
                          />
                        </div>
                        <div class="col-md-2">
                          <input
                            type="number"
                            class="form-control form-control-sm"
                            v-model.number="item.treatment_duration"
                            placeholder="Jours"
                            min="1"
                          />
                        </div>
                        <div class="col-md-1">
                          <button type="button" class="btn btn-sm btn-outline-danger" @click="removeItem(index)">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-footer mt-4 px-0 pb-0 border-0">
                <button type="button" class="btn btn-secondary px-4" @click="handleClose">
                  Fermer
                </button>
                <button type="submit" class="btn btn-info px-4">
                  Enregistrer
                </button>
              </div>
            </form>
          </template>
        </div>

        <!-- Footer for view mode -->
        <div class="modal-footer" v-if="isViewMode">
          <button type="button" class="btn btn-secondary" @click="handleClose">
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
