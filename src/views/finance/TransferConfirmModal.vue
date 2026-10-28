<script setup>
import { computed } from 'vue';
import { ArrowLeftRight, Check, X, Ban } from 'lucide-vue-next';

const props = defineProps({
  transfer: { type: Object, default: null },
  // accept | reject | cancel
  action: { type: String, default: 'accept' },
  loading: { type: Boolean, default: false },
});
const emit = defineEmits(['confirm', 'close']);

const config = computed(() => ({
  accept: {
    title: 'Confirmer la réception',
    question: 'Vous confirmez avoir reçu ce montant dans votre caisse ?',
    button: 'Oui, j\'ai reçu',
    buttonClass: 'btn-success',
    headerClass: 'bg-success text-white',
    icon: Check,
  },
  reject: {
    title: 'Refuser le transfert',
    question: 'Le montant restera dans la caisse de l\'expéditeur.',
    button: 'Refuser',
    buttonClass: 'btn-danger',
    headerClass: 'bg-danger text-white',
    icon: X,
  },
  cancel: {
    title: 'Annuler le transfert',
    question: 'Le destinataire ne pourra plus valider ce transfert.',
    button: 'Annuler le transfert',
    buttonClass: 'btn-outline-danger',
    headerClass: 'bg-light',
    icon: Ban,
  },
}[props.action] || {}));

const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FBU';

const close = () => {
  if (!props.loading) emit('close');
};
</script>

<template>
  <div v-if="transfer" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)" @click.self="close">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content shadow">
        <div class="modal-header py-2" :class="config.headerClass">
          <h6 class="modal-title d-flex align-items-center gap-2 mb-0">
            <component :is="config.icon" :size="18" /> {{ config.title }}
          </h6>
          <button
            type="button"
            class="btn-close"
            :class="{ 'btn-close-white': action !== 'cancel' }"
            :disabled="loading"
            @click="close"
          ></button>
        </div>
        <div class="modal-body text-center">
          <div class="fs-3 fw-bold mb-2">{{ formatCurrency(transfer.amount) }}</div>
          <!-- <div class="d-flex align-items-center justify-content-center gap-2 mb-3">
            <span class="badge bg-light text-dark border">{{ transfer.from_user?.name || '-' }}</span>
            <ArrowLeftRight :size="16" :stroke-width="2.5" class="text-warning" />
            <span class="badge bg-light text-dark border">{{ transfer.to_user?.name || '-' }}</span>
          </div> -->
          <div v-if="transfer.note" class="small text-muted fst-italic mb-2">« {{ transfer.note }} »</div>
          <p class="mb-0 small">{{ config.question }}</p>
        </div>
        <div class="modal-footer py-2">
          <button type="button" class="btn btn-sm btn-secondary" :disabled="loading" @click="close">Retour</button>
          <button type="button" class="btn btn-sm" :class="config.buttonClass" :disabled="loading" @click="emit('confirm')">
            <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
            {{ config.button }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
