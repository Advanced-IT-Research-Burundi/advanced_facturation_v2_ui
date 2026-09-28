<script setup>
import { ref, watch } from "vue";
import { Loader2 } from "lucide-vue-next";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  invoice: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "cancelled"]);

const toast = useToast();
const cancelMotif = ref("");
const cancelRestoreStock = ref(true);
const cancelError = ref("");
const isSubmitting = ref(false);

watch(
  () => props.show,
  (isShown) => {
    if (isShown) {
      cancelMotif.value = "";
      cancelRestoreStock.value = true;
      cancelError.value = "";
      isSubmitting.value = false;
    }
  }
);

const handleClose = () => {
  if (isSubmitting.value) return;
  emit("close");
};

const confirmCancel = async () => {
  if (!cancelMotif.value?.trim()) {
    cancelError.value = "Le motif d'annulation est requis.";
    return;
  }

  if (!props.invoice?.id) {
    cancelError.value = "Facture invalide.";
    return;
  }

  cancelError.value = "";
  isSubmitting.value = true;

  try {
    const response = await api.post(`/invoices/${props.invoice.id}/cancel`, {
      motif: cancelMotif.value.trim(),
      restore_stock: cancelRestoreStock.value,
    });

    if (response.data?.success !== false) {
      toast.success("Facture annulée avec succès.");
      emit("cancelled", props.invoice);
      emit("close");
    } else {
      cancelError.value = response.data?.message || "Erreur lors de l'annulation.";
    }
  } catch (err) {
    cancelError.value =
      err.response?.data?.message || "Erreur lors de l'annulation de la facture.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div
    v-if="show"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5)"
    @click.self="handleClose"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content shadow">
        <div class="modal-header border-bottom">
          <h5 class="modal-title fs-5 fw-semibold text-danger">
            Annuler la facture {{ invoice?.invoice_number || '' }}
          </h5>
          <button
            type="button"
            class="btn-close"
            :disabled="isSubmitting"
            @click="handleClose"
          ></button>
        </div>

        <div class="modal-body p-4">
          <div v-if="cancelError" class="alert alert-danger py-2 mb-3">
            {{ cancelError }}
          </div>

          <div class="mb-3">
            <label class="form-label fw-medium text-secondary">
              Motif d'annulation <span class="text-danger">*</span>
            </label>
            <textarea
              v-model="cancelMotif"
              class="form-control"
              rows="3"
              placeholder="Saisissez la raison de l'annulation..."
              :disabled="isSubmitting"
            ></textarea>
          </div>

          <div class="form-check form-switch mt-3">
            <input
              id="restoreStockCheck"
              v-model="cancelRestoreStock"
              class="form-check-input cursor-pointer"
              type="checkbox"
              :disabled="isSubmitting"
            />
            <label
              class="form-check-label user-select-none cursor-pointer"
              for="restoreStockCheck"
            >
              Restaurer le stock après annulation
            </label>
          </div>
        </div>

        <div class="modal-footer bg-light border-top">
          <button
            type="button"
            class="btn btn-outline-secondary"
            :disabled="isSubmitting"
            @click="handleClose"
          >
            Fermer
          </button>
          <button
            type="button"
            class="btn btn-danger d-flex align-items-center gap-2"
            :disabled="isSubmitting"
            @click="confirmCancel"
          >
            <Loader2 v-if="isSubmitting" class="animate-spin" :size="16" />
            <span>{{ isSubmitting ? 'Annulation...' : "Confirmer l'annulation" }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
