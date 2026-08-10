<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

defineEmits(["update:modelValue"]);

const invoiceTypes = [
  { id: "POS", label: "POS / Vente Directe" },
  { id: "Service", label: "Facture Service" },
  { id: "Proforma", label: "Proforma Service" },
  { id: "Caution", label: "Remboursement Caution" },
  { id: "Avoir", label: "Facture d'Avoir" },
  { id: "Factures", label: "Historique" },
  { id: "Rapports", label: "Rapports" },
];
</script>

<template>
  <!-- Les onglets servent uniquement à la navigation et ne doivent jamais figurer sur un document imprimé. -->
  <div class="tabs-wrapper bg-white border-bottom no-print">
    <ul class="nav nav-tabs border-bottom-0 tabs-scroll">
      <li class="nav-item" v-for="type in invoiceTypes" :key="type.id">
        <a
          class="nav-link text-dark cursor-pointer tab-link"
          :class="{ active: modelValue === type.id }"
          @click="$emit('update:modelValue', type.id)"
        >
          {{ type.label }}
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tabs-wrapper {
  margin: 0;
}
.tabs-scroll {
  flex-wrap: nowrap !important;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 0 0.5rem;
}
.tabs-scroll::-webkit-scrollbar {
  display: none;
}
.tab-link {
  white-space: nowrap;
  cursor: pointer;
  font-size: clamp(0.72rem, 2vw, 0.875rem);
  padding: 0.5rem 0.55rem;
}
.nav-link.active {
  font-weight: 600;
  border-bottom: 2px solid var(--bs-primary) !important;
  color: var(--bs-primary) !important;
}

@media print {
  .tabs-wrapper {
    display: none !important;
  }
}
</style>
