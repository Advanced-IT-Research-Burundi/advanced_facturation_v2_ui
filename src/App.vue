<script setup>
import { RouterView } from 'vue-router'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import Toast from 'primevue/toast'
</script>

<template>
  <RouterView />
  <Toast position="top-right" />
  <ConfirmModal />
</template>

<style>
/* Global styles are in assets/base.css */
</style>
