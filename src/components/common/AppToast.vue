<script setup>
import { useToast } from '@/composables/useToast';
const { toasts } = useToast();
</script>

<template>
  <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1090;">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast show mb-2 border-0 shadow"
        :class="`border-start border-4 border-${toast.type}`"
        role="alert"
      >
        <div class="toast-body d-flex align-items-center gap-2 py-2 px-3">
          <span v-if="toast.type === 'success'" class="text-success fw-bold">✓</span>
          <span v-else-if="toast.type === 'danger'" class="text-danger fw-bold">✗</span>
          <span v-else-if="toast.type === 'warning'" class="text-warning fw-bold">⚠</span>
          <span v-else class="text-info fw-bold">ℹ</span>
          <span class="flex-grow-1">{{ toast.message }}</span>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast {
  min-width: 280px;
  max-width: 420px;
  background: white;
}
.toast-enter-active { animation: slideIn 0.3s ease; }
.toast-leave-active { animation: slideOut 0.3s ease; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
</style>
