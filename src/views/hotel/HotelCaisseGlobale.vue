<template>
  <div class="hotel-page">
    <HotelHeader modelValue="CaisseGlobale" />

    <div class="px-3 pb-4 mt-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 fw-bold">
          <i class="bi bi-bank me-2 text-primary"></i>Caisse Globale Hôtel
        </h5>
        <button class="btn btn-outline-secondary btn-sm" @click="loadData">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      <!-- Date filters -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-2">
          <div class="row g-2 align-items-end">
            <div class="col-auto">
              <label class="form-label small mb-1 fw-semibold">Du</label>
              <input type="date" class="form-control form-control-sm" v-model="filters.start_date" @change="onManualDateChange" />
            </div>
            <div class="col-auto">
              <label class="form-label small mb-1 fw-semibold">Au</label>
              <input type="date" class="form-control form-control-sm" v-model="filters.end_date" @change="onManualDateChange" />
            </div>
            <div class="col-auto">
              <button class="btn btn-sm" :class="activeFilter === 'today' ? 'btn-primary' : 'btn-outline-primary'" @click="setToday">Aujourd'hui</button>
            </div>
            <div class="col-auto">
              <button class="btn btn-sm" :class="activeFilter === 'month' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setThisMonth">Ce mois</button>
            </div>
            <div class="col-auto">
              <button class="btn btn-sm" :class="activeFilter === 'all' ? 'btn-dark' : 'btn-outline-dark'" @click="clearFilters">Tout</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <div v-else-if="summary">
        <!-- Global summary cards -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <div class="card border-0 h-100" style="background: #d1fae5">
              <div class="card-body text-center">
                <i class="bi bi-arrow-down-circle fs-4 text-success d-block mb-1"></i>
                <div class="small text-muted">Argent Collecté</div>
                <div class="fw-bold fs-5 text-success">{{ formatCurrency(summary.total_income) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div
              class="card border-0 h-100 text-white"
              :style="summary.total_profit >= 0 ? 'background:#16a34a' : 'background:#dc2626'"
            >
              <div class="card-body text-center">
                <i class="bi bi-graph-up-arrow fs-4 d-block mb-1 opacity-75"></i>
                <div class="small opacity-90">Bénéfices</div>
                <div class="fw-bold fs-5">
                  {{ summary.total_profit >= 0 ? '+' : '' }}{{ formatCurrency(summary.total_profit) }}
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card border-0 h-100" style="background: #fee2e2">
              <div class="card-body text-center">
                <i class="bi bi-arrow-up-circle fs-4 text-danger d-block mb-1"></i>
                <div class="small text-muted">Dépenses</div>
                <div class="fw-bold fs-5 text-danger">{{ formatCurrency(summary.total_expense) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card border-0 h-100" style="background: #fef3c7">
              <div class="card-body text-center">
                <i class="bi bi-exclamation-triangle fs-4 text-warning d-block mb-1"></i>
                <div class="small text-muted">Pertes Stock</div>
                <div class="fw-bold fs-5 text-warning">{{ formatCurrency(summary.total_losses) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Info badges -->
        <div class="d-flex gap-2 mb-4 flex-wrap">
          <span class="badge bg-primary fs-6">
            <i class="bi bi-journal-text me-1"></i>{{ summary.registers_count }} caisse(s) au total
          </span>
          <span class="badge bg-success fs-6">
            <i class="bi bi-unlock me-1"></i>{{ summary.open_registers }} ouverte(s)
          </span>
        </div>

        <!-- Section breakdown -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white fw-semibold">
            <i class="bi bi-bar-chart me-2 text-muted"></i>Répartition par Section
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Section</th>
                  <th class="text-end">Recettes</th>
                  <th class="text-end">Dépenses</th>
                  <th class="text-end">Pertes Stock</th>
                  <th class="text-end">Bénéfice</th>
                  <th class="text-center">Caisses</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in sections" :key="s.section">
                  <td>
                    <i :class="['bi me-1', sectionIcon(s.section)]"></i>
                    {{ sectionLabel(s.section) }}
                  </td>
                  <td class="text-end text-success fw-semibold">+ {{ formatCurrency(s.total_income) }}</td>
                  <td class="text-end text-danger fw-semibold">
                    {{ s.total_expense > 0 ? '- ' + formatCurrency(s.total_expense) : '—' }}
                  </td>
                  <td class="text-end fw-semibold" style="color: #b45309">
                    {{ s.total_losses > 0 ? '- ' + formatCurrency(s.total_losses) : '—' }}
                  </td>
                  <td class="text-end fw-bold" :class="s.profit >= 0 ? 'text-success' : 'text-danger'">
                    {{ s.profit >= 0 ? '+' : '' }}{{ formatCurrency(s.profit) }}
                  </td>
                  <td class="text-center">
                    <span class="badge bg-secondary">{{ s.registers_count }}</span>
                  </td>
                </tr>
                <tr class="table-dark fw-bold">
                  <td>TOTAL</td>
                  <td class="text-end text-success">+ {{ formatCurrency(summary.total_income) }}</td>
                  <td class="text-end text-danger">- {{ formatCurrency(summary.total_expense) }}</td>
                  <td class="text-end" style="color: #fbbf24">
                    {{ summary.total_losses > 0 ? '- ' + formatCurrency(summary.total_losses) : '—' }}
                  </td>
                  <td class="text-end" :class="summary.total_profit >= 0 ? 'text-success' : 'text-danger'">
                    {{ summary.total_profit >= 0 ? '+' : '' }}{{ formatCurrency(summary.total_profit) }}
                  </td>
                  <td class="text-center">{{ summary.registers_count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Movements with pagination -->
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <span class="fw-semibold">
              <i class="bi bi-list-ul me-2 text-muted"></i>Mouvements (toutes sections)
            </span>
            <small v-if="pagination.total" class="text-muted">
              {{ pagination.total }} mouvement(s)
            </small>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0 small">
              <thead class="table-light">
                <tr>
                  <th>Date</th>
                  <th>Section</th>
                  <th>Description</th>
                  <th>Référence</th>
                  <th class="text-end">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="movements.length === 0">
                  <td colspan="5" class="text-center py-4 text-muted">Aucun mouvement</td>
                </tr>
                <tr v-for="m in movements" :key="m.id">
                  <td>{{ formatDateTime(m.created_at) }}</td>
                  <td>
                    <span class="badge" :class="sectionBadgeClass(m.hotel_section)">
                      {{ sectionLabel(m.hotel_section) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="isLossMovement(m)" class="badge bg-warning text-dark me-1">Perte</span>
                    {{ m.description }}
                  </td>
                  <td class="text-muted">{{ m.reference || '—' }}</td>
                  <td class="text-end fw-semibold" :class="movementAmountClass(m)">
                    {{ m.type === 'income' ? '+' : '-' }} {{ formatCurrency(m.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.last_page > 1" class="card-footer bg-white d-flex justify-content-between align-items-center">
            <small class="text-muted">
              Page {{ pagination.current_page }} / {{ pagination.last_page }}
              — {{ pagination.from }}-{{ pagination.to }} sur {{ pagination.total }}
            </small>
            <nav>
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" :class="{ disabled: pagination.current_page <= 1 }">
                  <button class="page-link" @click="goToPage(1)" :disabled="pagination.current_page <= 1">
                    <i class="bi bi-chevron-double-left"></i>
                  </button>
                </li>
                <li class="page-item" :class="{ disabled: pagination.current_page <= 1 }">
                  <button class="page-link" @click="goToPage(pagination.current_page - 1)" :disabled="pagination.current_page <= 1">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                </li>
                <li
                  v-for="p in visiblePages"
                  :key="p"
                  class="page-item"
                  :class="{ active: p === pagination.current_page }"
                >
                  <button class="page-link" @click="goToPage(p)">{{ p }}</button>
                </li>
                <li class="page-item" :class="{ disabled: pagination.current_page >= pagination.last_page }">
                  <button class="page-link" @click="goToPage(pagination.current_page + 1)" :disabled="pagination.current_page >= pagination.last_page">
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </li>
                <li class="page-item" :class="{ disabled: pagination.current_page >= pagination.last_page }">
                  <button class="page-link" @click="goToPage(pagination.last_page)" :disabled="pagination.current_page >= pagination.last_page">
                    <i class="bi bi-chevron-double-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import HotelHeader from '@/views/hotel/HotelHeader.vue';
import api from '@/services/api';

const loading = ref(false);
const summary = ref(null);
const sections = ref([]);
const movements = ref([]);
const pagination = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
  from: 0,
  to: 0,
  per_page: 20,
});

const filters = ref({
  start_date: '',
  end_date: '',
});
const activeFilter = ref('all');

const formatCurrency = (v) => new Intl.NumberFormat('fr-FR').format(v || 0) + ' BIF';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

const isLossMovement = (m) =>
  m.type === 'expense' && (m.description || '').toLowerCase().includes('perte');

const movementAmountClass = (m) => {
  if (m.type === 'income') return 'text-success';
  if (isLossMovement(m)) return 'text-warning';
  return 'text-danger';
};

const sectionLabels = {
  restaurant: 'Restaurant',
  bar: 'Bar',
  rooms: 'Chambres',
  conference: 'Salles Conf.',
  reception: 'Salle Réception',
};

const sectionIcons = {
  restaurant: 'bi-egg-fried',
  bar: 'bi-cup-straw',
  rooms: 'bi-door-closed',
  conference: 'bi-camera-video',
  reception: 'bi-balloon-heart',
};

const sectionLabel = (section) => sectionLabels[section] || section;
const sectionIcon = (section) => sectionIcons[section] || 'bi-circle';

const sectionBadgeClass = (section) => {
  const map = {
    restaurant: 'bg-warning text-dark',
    bar: 'bg-info text-dark',
    rooms: 'bg-primary',
    conference: 'bg-secondary',
    reception: 'bg-danger',
  };
  return map[section] || 'bg-light text-dark';
};

const visiblePages = computed(() => {
  const current = pagination.value.current_page;
  const last = pagination.value.last_page;
  const delta = 2;
  const pages = [];
  for (let i = Math.max(1, current - delta); i <= Math.min(last, current + delta); i++) {
    pages.push(i);
  }
  return pages;
});

const loadData = async (page = 1) => {
  loading.value = true;
  try {
    const params = { page, per_page: 20 };
    if (filters.value.start_date) params.start_date = filters.value.start_date;
    if (filters.value.end_date) params.end_date = filters.value.end_date;

    const res = await api.get('/hotel/caisse/global-summary', { params });
    const d = res.data.data;

    summary.value = d.global;
    sections.value = d.sections;

    movements.value = d.movements.data;
    pagination.value = {
      current_page: d.movements.current_page,
      last_page: d.movements.last_page,
      total: d.movements.total,
      from: d.movements.from || 0,
      to: d.movements.to || 0,
      per_page: d.movements.per_page,
    };
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const goToPage = (page) => {
  if (page < 1 || page > pagination.value.last_page) return;
  loadData(page);
};

const onManualDateChange = () => {
  activeFilter.value = '';
  loadData();
};

const setToday = () => {
  const today = new Date().toISOString().slice(0, 10);
  filters.value.start_date = today;
  filters.value.end_date = today;
  activeFilter.value = 'today';
  loadData();
};

const setThisMonth = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = now.toISOString().slice(0, 10);
  filters.value.start_date = start;
  filters.value.end_date = end;
  activeFilter.value = 'month';
  loadData();
};

const clearFilters = () => {
  filters.value = { start_date: '', end_date: '' };
  activeFilter.value = 'all';
  loadData();
};

onMounted(loadData);
</script>

<style scoped>
.pagination .page-link {
  padding: 0.25rem 0.5rem;
}
</style>
