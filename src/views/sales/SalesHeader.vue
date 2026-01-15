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
];
</script>

<template>
  <div class="bg-white border-bottom px-3 pt-2">
    <ul class="nav nav-tabs border-bottom-0">
      <li class="nav-item" v-for="type in invoiceTypes" :key="type.id">
        <a
          class="nav-link text-dark cursor-pointer"
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
.cursor-pointer {
  cursor: pointer;
}
.nav-link.active {
  font-weight: 600;
  border-bottom: 2px solid var(--bs-primary) !important;
}
</style>
