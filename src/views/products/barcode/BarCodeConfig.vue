<script setup>
import { Package, QrCode } from "lucide-vue-next";

defineProps({
  codeType: String,
  labelCount: Number,
});

defineEmits(["update:codeType", "update:labelCount", "print"]);
</script>

<template>
  <div class="row align-items-end g-3">
    <div class="col-md-5">
      <label class="form-label fw-semibold text-muted small text-uppercase ls-1"
        >2. Type de code</label
      >
      <div class="d-flex gap-2">
        <button
          @click="$emit('update:codeType', 'barcode')"
          class="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
          :class="codeType === 'barcode' ? 'btn-dark' : 'btn-outline-secondary'"
        >
          <Package :size="16" /> Barcode
        </button>
        <button
          @click="$emit('update:codeType', 'qrcode')"
          class="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
          :class="codeType === 'qrcode' ? 'btn-dark' : 'btn-outline-secondary'"
        >
          <QrCode :size="16" /> QR Code
        </button>
      </div>
    </div>

    <div class="col-md-4">
      <label class="form-label fw-semibold text-muted small text-uppercase ls-1"
        >3. Quantité p.p</label
      >
      <input
        type="number"
        :value="labelCount"
        @input="$emit('update:labelCount', parseInt($event.target.value))"
        min="1"
        max="1000"
        class="form-control bg-light"
      />
    </div>

    <div class="col-md-3 text-end">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<style scoped>
.ls-1 {
  letter-spacing: 1px;
}
</style>
