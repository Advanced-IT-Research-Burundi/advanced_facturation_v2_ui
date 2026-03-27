<script setup>
import { RouterView } from 'vue-router'
import AppToast from '@/components/common/AppToast.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
</script>

<template>
  <RouterView />
  <AppToast />
  <ConfirmModal />
</template>

<style>
/* Global styles are in assets/base.css */
</style>
