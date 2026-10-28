<script setup>
import { computed } from 'vue';

const props = defineProps({
  total: { type: Number, required: true },
  perPage: { type: Number, default: 15 },
});
const page = defineModel({ type: Number, default: 1 });

const lastPage = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)));
const from = computed(() => (props.total === 0 ? 0 : (page.value - 1) * props.perPage + 1));
const to = computed(() => Math.min(page.value * props.perPage, props.total));

const visiblePages = computed(() => {
  let start = Math.max(1, page.value - 2);
  let end = Math.min(lastPage.value, page.value + 2);
  if (end - start < 4) {
    if (start === 1) end = Math.min(lastPage.value, start + 4);
    else start = Math.max(1, end - 4);
  }
  const pages = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
});

const goTo = (p) => {
  if (p >= 1 && p <= lastPage.value) page.value = p;
};
</script>

<template>
  <div
    v-if="total > 0"
    class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mt-3 pt-3 border-top"
  >
    <div class="text-muted small">Affichage de {{ from }} à {{ to }} sur {{ total }}</div>
    <nav v-if="lastPage > 1">
      <ul class="pagination pagination-sm mb-0 flex-wrap">
        <li class="page-item" :class="{ disabled: page === 1 }">
          <button class="page-link" @click="goTo(1)"><i class="bi bi-chevron-double-left"></i></button>
        </li>
        <li class="page-item" :class="{ disabled: page === 1 }">
          <button class="page-link" @click="goTo(page - 1)"><i class="bi bi-chevron-left"></i></button>
        </li>
        <li v-for="p in visiblePages" :key="p" class="page-item" :class="{ active: p === page }">
          <button class="page-link" @click="goTo(p)">{{ p }}</button>
        </li>
        <li class="page-item" :class="{ disabled: page === lastPage }">
          <button class="page-link" @click="goTo(page + 1)"><i class="bi bi-chevron-right"></i></button>
        </li>
        <li class="page-item" :class="{ disabled: page === lastPage }">
          <button class="page-link" @click="goTo(lastPage)"><i class="bi bi-chevron-double-right"></i></button>
        </li>
      </ul>
    </nav>
  </div>
</template>
