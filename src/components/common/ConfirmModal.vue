<script setup>
import { useConfirm } from '@/composables/useConfirm';
const { state, handleConfirm, handleCancel } = useConfirm();
</script>

<template>
  <Teleport to="body">
    <div v-if="state.visible" class="modal-backdrop fade show" style="z-index: 1094;"></div>
    <div v-if="state.visible" class="modal fade show d-block" tabindex="-1" style="z-index: 1095;" @click.self="handleCancel">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content shadow">
          <div class="modal-header py-2">
            <h6 class="modal-title">{{ state.title }}</h6>
            <button type="button" class="btn-close btn-close-sm" @click="handleCancel"></button>
          </div>
          <div class="modal-body py-3">
            <p class="mb-0">{{ state.message }}</p>
          </div>
          <div class="modal-footer py-2">
            <button type="button" class="btn btn-sm btn-secondary" @click="handleCancel">{{ state.cancelText }}</button>
            <button type="button" class="btn btn-sm" :class="state.confirmClass" @click="handleConfirm">{{ state.confirmText }}</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
