<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useToast } from "@/composables/useToast";
import ProformaService from "./ProformaService.vue";
import ProformaFormModal from "./ProformaFormModal.vue";
import ProformaDetailsModal from "./ProformaDetailsModal.vue";

const props = defineProps({
  customers: {
    type: Array,
    default: () => [],
  },
});

const store = useStore();
const toast = useToast();

const isSubmitting = ref(false);
const searchProforma = ref("");
const showProformaForm = ref(false);
const isEditingProforma = ref(false);
const editingProformaData = ref(null);

const showProformaDetails = ref(false);
const selectedProforma = ref(null);

const proformas = computed(() => store.getters["proformats/allProformats"]);
const isLoadingProformas = computed(
  () => store.getters["proformats/isLoading"],
);

const fetchProformas = () => {
  store.dispatch("proformats/fetchProformas");
};

onMounted(() => {
  fetchProformas();
});

const openNewProforma = () => {
  isEditingProforma.value = false;
  editingProformaData.value = null;
  showProformaForm.value = true;
};

const handleEditProforma = (data) => {
  isEditingProforma.value = true;
  editingProformaData.value = data;
  showProformaForm.value = true;
};

const handleViewProforma = (proforma) => {
  selectedProforma.value = proforma;
  showProformaDetails.value = true;
};

const closeProformaDetails = () => {
  showProformaDetails.value = false;
  selectedProforma.value = null;
};

const handleProformaSave = async (payload) => {
  isSubmitting.value = true;
  try {
    let result;
    if (payload.id && payload.data) {
      result = await store.dispatch("proformats/updateProforma", {
        id: payload.id,
        data: payload.data,
      });
    } else {
      result = await store.dispatch("proformats/createProforma", payload);
    }

    if (result?.success) {
      showProformaForm.value = false;
      isEditingProforma.value = false;
      editingProformaData.value = null;
    } else {
      toast.error(
        result?.message || "Erreur lors de l'enregistrement de la proforma",
      );
    }
  } catch (e) {
    console.error("Proforma save error:", e);
    toast.error(
      "Erreur lors de l'enregistrement: " + (e.message || "Erreur inconnue"),
    );
  } finally {
    isSubmitting.value = false;
  }
};

const handleProformaDelete = async (proforma) => {
  const result = await store.dispatch(
    "proformats/deleteProforma",
    proforma.id || proforma.invoice_number,
  );
  if (!result?.success) {
    toast.error("Erreur lors de la suppression de la proforma");
  }
};
</script>

<template>
  <div class="proforma-tab-wrapper">
    <ProformaService
      :proformas="proformas"
      :is-loading="isLoadingProformas"
      v-model:search-text="searchProforma"
      @create="openNewProforma"
      @edit="handleEditProforma"
      @delete="handleProformaDelete"
      @view="handleViewProforma"
    />

    <!-- MODAL FORMULAIRE PROFORMA (CRÉATION / ÉDITION) -->
    <ProformaFormModal
      v-if="showProformaForm"
      :show="showProformaForm"
      :is-editing="isEditingProforma"
      :is-submitting="isSubmitting"
      :initial-data="editingProformaData"
      :customers="customers"
      @close="showProformaForm = false"
      @save="handleProformaSave"
    />

    <!-- MODAL DÉTAILS / APERÇU PROFORMA -->
    <ProformaDetailsModal
      :show="showProformaDetails"
      :proforma="selectedProforma"
      @close="closeProformaDetails"
    />
  </div>
</template>
