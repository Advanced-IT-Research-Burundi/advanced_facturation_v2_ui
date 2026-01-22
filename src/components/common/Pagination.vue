<script setup>
import { computed } from 'vue';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  lastPage: {
    type: Number,
    default: 1
  },
  total: {
    type: Number,
    default: 0
  },
  perPage: {
    type: Number,
    default: 15
  },
  from: {
    type: Number,
    default: 0
  },
  to: {
    type: Number,
    default: 0
  },
  showInfo: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['page-change']);

const hasPrev = computed(() => props.currentPage > 1);
const hasNext = computed(() => props.currentPage < props.lastPage);

// Calcul des pages à afficher (max 5 pages visibles)
const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(props.lastPage, start + maxVisible - 1);
  
  // Ajuster le début si on est proche de la fin
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

const changePage = (page) => {
  if (page >= 1 && page <= props.lastPage && page !== props.currentPage) {
    emit('page-change', page);
  }
};

const fromDisplay = computed(() => props.from || ((props.currentPage - 1) * props.perPage + 1));
const toDisplay = computed(() => props.to || Math.min(props.currentPage * props.perPage, props.total));
</script>

<template>
  <div v-if="lastPage > 1 || total > 0" class="d-flex flex-wrap justify-content-between align-items-center gap-3 py-2">
    <!-- Info -->
    <div v-if="showInfo" class="small text-muted">
      Affichage de <strong>{{ fromDisplay }}</strong> à <strong>{{ toDisplay }}</strong> sur <strong>{{ total }}</strong> résultats
    </div>
    
    <!-- Pagination -->
    <nav v-if="lastPage > 1">
      <ul class="pagination pagination-sm mb-0">
        <!-- Première page -->
        <li class="page-item" :class="{ disabled: !hasPrev }">
          <button class="page-link" @click="changePage(1)" title="Première page" :disabled="!hasPrev">
            <ChevronsLeft :size="14" />
          </button>
        </li>
        
        <!-- Page précédente -->
        <li class="page-item" :class="{ disabled: !hasPrev }">
          <button class="page-link" @click="changePage(currentPage - 1)" title="Précédent" :disabled="!hasPrev">
            <ChevronLeft :size="14" />
          </button>
        </li>
        
        <!-- Pages numérotées -->
        <li 
          v-for="page in visiblePages" 
          :key="page" 
          class="page-item" 
          :class="{ active: page === currentPage }"
        >
          <button class="page-link" @click="changePage(page)">
            {{ page }}
          </button>
        </li>
        
        <!-- Page suivante -->
        <li class="page-item" :class="{ disabled: !hasNext }">
          <button class="page-link" @click="changePage(currentPage + 1)" title="Suivant" :disabled="!hasNext">
            <ChevronRight :size="14" />
          </button>
        </li>
        
        <!-- Dernière page -->
        <li class="page-item" :class="{ disabled: !hasNext }">
          <button class="page-link" @click="changePage(lastPage)" title="Dernière page" :disabled="!hasNext">
            <ChevronsRight :size="14" />
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.pagination .page-link {
  padding: 0.375rem 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
}

.pagination .page-item.active .page-link {
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
}

.pagination .page-link:focus {
  box-shadow: none;
}
</style>
