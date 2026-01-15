<script setup>
import { ref } from "vue";
import { Search, Loader2, X, Package } from "lucide-vue-next";

const props = defineProps({
  modelValue: String,
  loading: Boolean,
  products: Array,
  showDropdown: Boolean,
});

const emit = defineEmits([
  "update:modelValue",
  "select-product",
  "search-input",
  "clear",
  "enter",
]);

const handleInput = (e) => {
  emit("update:modelValue", e.target.value);
  emit("search-input");
};
</script>

<template>
  <div class="position-relative drop-parent">
    <label class="form-label fw-semibold text-muted small text-uppercase ls-1"
      >1. Sélectionner un produit</label
    >
    <div class="input-group">
      <span class="input-group-text bg-light border-end-0">
        <Search v-if="!loading" :size="18" class="text-muted" />
        <Loader2 v-else :size="18" class="text-primary spin" />
      </span>
      <input
        :value="modelValue"
        @input="handleInput"
        @keyup.enter="$emit('enter')"
        type="text"
        class="form-control bg-light border-start-0 ps-0"
        placeholder="Rechercher..."
      />
      <button
        v-if="modelValue"
        @click="$emit('clear')"
        class="btn btn-light border"
        type="button"
      >
        <X :size="16" />
      </button>
    </div>

    <!-- Dropdown Results -->
    <div
      v-if="showDropdown"
      class="dropdown-results shadow-lg border rounded-2 mt-1 position-absolute w-100 bg-white"
      style="z-index: 1050; max-height: 300px; overflow-y: auto"
    >
      <div
        v-for="product in products"
        :key="product.id"
        @click="$emit('select-product', product)"
        class="dropdown-item p-3 border-bottom d-flex align-items-center gap-3 cursor-pointer"
      >
        <Package :size="18" class="text-primary opacity-75" />
        <div>
          <div class="fw-bold text-dark mb-0 fs-6">
            {{ product.item_designation }}
          </div>
          <small class="text-muted font-monospace">{{
            product.item_code
          }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.dropdown-item {
  transition: background 0.2s;
}
.dropdown-item:hover {
  background-color: #f8fafc;
}
.ls-1 {
  letter-spacing: 1px;
}
.spin {
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
