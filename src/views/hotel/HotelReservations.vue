<template>
  <div class="container-fluid pb-4">

    <!-- Hotel Header Tabs -->
    <HotelHeader modelValue="Reservations" />

    <div class="mt-3">
      <div class="d-flex justify-content-end align-items-center mb-4">
        <div class="d-flex gap-2">
          <button class="btn btn-primary" @click="openAddModal">
            <i class="bi bi-plus-lg me-1"></i> Nouvelle Réservation
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-center">
            <div class="col-md-4">
              <input
                v-model="search"
                type="text"
                class="form-control form-control-sm"
                placeholder="Rechercher par nom, téléphone..."
                @input="debouncedLoad"
              />
            </div>
            <div class="col-md-3">
              <select v-model="filterStatus" class="form-select form-select-sm" @change="loadReservations">
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmées</option>
                <option value="checked_in">En cours</option>
                <option value="checked_out">Terminées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
            <div class="col-md-3">
              <input
                v-model="filterDate"
                type="date"
                class="form-control form-control-sm"
                @change="loadReservations"
                placeholder="Filtrer par date"
              />
            </div>
            <div class="col-md-2">
              <button class="btn btn-sm btn-outline-secondary w-100" @click="resetFilters">
                <i class="bi bi-x-circle me-1"></i>Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <!-- Table -->
      <div v-else class="card">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Client</th>
                <th>Chambre</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Nuits</th>
                <th>Total</th>
                <th>Avance</th>
                <th>Reste</th>
                <th>Statut</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reservation in reservations" :key="reservation.id">
                <td>
                  <div class="fw-semibold">{{ reservation.guest_name }}</div>
                  <div class="small text-muted">{{ reservation.guest_phone }}</div>
                </td>
                <td>
                  <span class="badge bg-dark">{{ reservation.room?.room_number }}</span>
                  <div class="small text-muted">{{ getRoomTypeLabel(reservation.room?.type) }}</div>
                </td>
                <td>{{ formatDate(reservation.check_in_date) }}</td>
                <td>{{ formatDate(reservation.check_out_date) }}</td>
                <td class="text-center">{{ reservation.nights }}</td>
                <td>{{ formatCurrency(reservation.total_amount) }}</td>
                <td>{{ formatCurrency(reservation.advance_payment) }}</td>
                <td :class="reservation.balance_due > 0 ? 'text-danger fw-semibold' : 'text-success'">
                  {{ formatCurrency(reservation.balance_due) }}
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(reservation.status)">
                    {{ getStatusLabel(reservation.status) }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="d-flex gap-1 justify-content-center">
                    <button
                      v-if="reservation.status === 'confirmed'"
                      class="btn btn-sm btn-success"
                      title="Check-in"
                      @click="doCheckIn(reservation)"
                    >
                      <i class="bi bi-box-arrow-in-right"></i>
                    </button>
                    <button
                      v-if="reservation.status === 'checked_in'"
                      class="btn btn-sm btn-warning"
                      title="Check-out"
                      @click="openCheckOutModal(reservation)"
                    >
                      <i class="bi bi-box-arrow-right"></i>
                    </button>
                    <button
                      v-if="['pending', 'confirmed'].includes(reservation.status)"
                      class="btn btn-sm btn-outline-primary"
                      title="Modifier"
                      @click="editReservation(reservation)"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      v-if="['pending', 'confirmed'].includes(reservation.status)"
                      class="btn btn-sm btn-outline-danger"
                      title="Annuler"
                      @click="confirmCancel(reservation)"
                    >
                      <i class="bi bi-x-circle"></i>
                    </button>
                    <button
                      v-if="['checked_in', 'checked_out'].includes(reservation.status) && !reservation.invoice_id"
                      class="btn btn-sm btn-primary"
                      title="Générer la facture"
                      :disabled="generatingInvoiceId === reservation.id"
                      @click="generateInvoice(reservation)"
                    >
                      <span v-if="generatingInvoiceId === reservation.id" class="spinner-border spinner-border-sm"></span>
                      <i v-else class="bi bi-receipt"></i>
                    </button>
                    <router-link
                      v-if="reservation.invoice_id"
                      :to="{ name: 'hotel.invoice', params: { id: reservation.invoice_id } }"
                      class="btn btn-sm btn-outline-success"
                      title="Voir la facture"
                    >
                      <i class="bi bi-file-earmark-text"></i>
                    </router-link>
                  </div>
                </td>
              </tr>
              <tr v-if="reservations.length === 0">
                <td colspan="10" class="text-center py-5 text-muted">
                  <i class="bi bi-calendar-x fs-3 d-block mb-2"></i>
                  Aucune réservation trouvée
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.last_page > 1" class="card-footer d-flex justify-content-between align-items-center">
          <small class="text-muted">
            Page {{ pagination.current_page }} / {{ pagination.last_page }} — {{ pagination.total }} réservations
          </small>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-secondary" :disabled="pagination.current_page === 1" @click="changePage(pagination.current_page - 1)">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary" :disabled="pagination.current_page === pagination.last_page" @click="changePage(pagination.current_page + 1)">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Add/Edit Reservation -->
    <div v-if="showModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showModal = false">
      <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 650px; max-height: 90vh; overflow-y: auto;">
        <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h5 class="mb-0">{{ editingReservation ? 'Modifier Réservation' : 'Nouvelle Réservation' }}</h5>
          <button class="btn-close" @click="showModal = false"></button>
        </div>

        <div v-if="formError" class="alert alert-danger py-2">{{ formError }}</div>

        <form @submit.prevent="saveReservation">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label small fw-bold">Chambre <span class="text-danger">*</span></label>
              <select v-model="form.hotel_room_id" class="form-select" required :disabled="!!editingReservation">
                <option :value="null">Sélectionner...</option>
                <option v-for="room in availableRooms" :key="room.id" :value="room.id">
                  {{ room.room_number }} — {{ getRoomTypeLabel(room.type) }} ({{ formatCurrency(room.price_per_night) }}/nuit)
                </option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Nom du client <span class="text-danger">*</span></label>
              <input v-model="form.guest_name" type="text" class="form-control" required />
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Téléphone</label>
              <input v-model="form.guest_phone" type="text" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Email</label>
              <input v-model="form.guest_email" type="email" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Client (pour facturation)</label>
              <select v-model="form.customer_id" class="form-select">
                <option :value="null">Aucun / Client occasionnel</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ c.customer_name }} {{ c.customer_TIN ? `(${c.customer_TIN})` : '' }}
                </option>
              </select>
              <small class="text-muted">Requis pour générer la facture</small>
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Check-in <span class="text-danger">*</span></label>
              <input v-model="form.check_in_date" type="date" class="form-control" required :min="today" />
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Check-out <span class="text-danger">*</span></label>
              <input v-model="form.check_out_date" type="date" class="form-control" required :min="form.check_in_date" />
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Nuits</label>
              <input :value="formNights" type="number" class="form-control bg-light" readonly />
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Avance</label>
              <input v-model.number="form.advance_payment" type="number" class="form-control" min="0" step="0.01" />
            </div>
            <div class="col-12">
              <label class="form-label small fw-bold">Notes</label>
              <textarea v-model="form.notes" class="form-control" rows="2"></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-3">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Annuler</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              {{ saving ? 'Enregistrement...' : (editingReservation ? 'Mettre à jour' : 'Confirmer') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: Check-out -->
    <div v-if="checkOutModal" class="modal-overlay d-flex justify-content-center align-items-center">
      <div class="bg-white rounded shadow-lg p-4" style="max-width: 420px; width: 90%;">
        <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h5 class="mb-0">Check-out — {{ checkOutModal.guest_name }}</h5>
          <button class="btn-close" @click="checkOutModal = null"></button>
        </div>
        <p class="mb-1">Chambre: <strong>{{ checkOutModal.room?.room_number }}</strong></p>
        <p class="mb-1">Total: <strong>{{ formatCurrency(checkOutModal.total_amount) }}</strong></p>
        <p class="mb-3">Avance payée: <strong>{{ formatCurrency(checkOutModal.advance_payment) }}</strong></p>

        <div class="mb-3">
          <label class="form-label small fw-bold">Montant total reçu</label>
          <input v-model.number="checkOutPayment" type="number" class="form-control" :min="checkOutModal.advance_payment" step="0.01" />
          <div class="small text-muted mt-1">
            Reste à payer: <strong>{{ formatCurrency(checkOutModal.total_amount - checkOutPayment) }}</strong>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="checkOutModal = null">Annuler</button>
          <button class="btn btn-warning" @click="doCheckOut" :disabled="checkingOut">
            <span v-if="checkingOut" class="spinner-border spinner-border-sm me-1"></span>
            Confirmer le check-out
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Cancel confirm -->
    <div v-if="reservationToCancel" class="modal-overlay d-flex justify-content-center align-items-center">
      <div class="bg-white rounded shadow-lg p-4" style="max-width: 380px; width: 90%;">
        <h5 class="mb-3">Annuler la réservation ?</h5>
        <p>Client: <strong>{{ reservationToCancel.guest_name }}</strong></p>
        <p>Chambre: <strong>{{ reservationToCancel.room?.room_number }}</strong></p>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="reservationToCancel = null">Non</button>
          <button class="btn btn-danger" @click="doCancel" :disabled="cancelling">
            <span v-if="cancelling" class="spinner-border spinner-border-sm me-1"></span>
            Annuler la réservation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/api';
import HotelHeader from './HotelHeader.vue';

const route = useRoute();

const loading = ref(false);
const reservations = ref([]);
const allRooms = ref([]);
const customers = ref([]);
const generatingInvoiceId = ref(null);
const pagination = ref({ current_page: 1, last_page: 1, total: 0 });
const search = ref('');
const filterStatus = ref('');
const filterDate = ref('');
const today = new Date().toISOString().split('T')[0];

const showModal = ref(false);
const editingReservation = ref(null);
const saving = ref(false);
const formError = ref('');

const checkOutModal = ref(null);
const checkOutPayment = ref(0);
const checkingOut = ref(false);

const reservationToCancel = ref(null);
const cancelling = ref(false);

let debounceTimer = null;

const form = reactive({
  hotel_room_id: null,
  guest_name: '',
  guest_phone: '',
  guest_email: '',
  customer_id: null,
  check_in_date: today,
  check_out_date: '',
  advance_payment: 0,
  notes: '',
});

const availableRooms = computed(() => allRooms.value.filter(r => r.status === 'available'));

const formNights = computed(() => {
  if (!form.check_in_date || !form.check_out_date) {
    return 0;
  }
  const diff = new Date(form.check_out_date) - new Date(form.check_in_date);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
});

const loadReservations = async (page = 1) => {
  loading.value = true;
  try {
    const params = { page };
    if (search.value) {
      params.search = search.value;
    }
    if (filterStatus.value) {
      params.status = filterStatus.value;
    }
    if (filterDate.value) {
      params.date = filterDate.value;
    }
    const res = await api.get('/hotel/reservations', { params });
    reservations.value = res.data.data.data;
    const meta = res.data.data;
    pagination.value = {
      current_page: meta.current_page,
      last_page: meta.last_page,
      total: meta.total,
    };
  } catch (e) {
    console.error('Erreur chargement réservations:', e);
  } finally {
    loading.value = false;
  }
};

const loadRooms = async () => {
  try {
    const res = await api.get('/hotel/rooms');
    allRooms.value = res.data.data;
  } catch (e) {
    console.error('Erreur chargement chambres:', e);
  }
};

const debouncedLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadReservations(), 500);
};

const resetFilters = () => {
  search.value = '';
  filterStatus.value = '';
  filterDate.value = '';
  loadReservations();
};

const changePage = (page) => {
  loadReservations(page);
};

const openAddModal = () => {
  editingReservation.value = null;
  Object.assign(form, {
    hotel_room_id: null,
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    customer_id: null,
    check_in_date: today,
    check_out_date: '',
    advance_payment: 0,
    notes: '',
  });
  formError.value = '';
  showModal.value = true;
};

const editReservation = (reservation) => {
  editingReservation.value = reservation;
  Object.assign(form, {
    hotel_room_id: reservation.hotel_room_id,
    guest_name: reservation.guest_name,
    guest_phone: reservation.guest_phone || '',
    guest_email: reservation.guest_email || '',
    customer_id: reservation.customer_id ?? null,
    check_in_date: reservation.check_in_date,
    check_out_date: reservation.check_out_date,
    advance_payment: reservation.advance_payment,
    notes: reservation.notes || '',
  });
  formError.value = '';
  showModal.value = true;
};

const saveReservation = async () => {
  saving.value = true;
  formError.value = '';
  try {
    const payload = { ...form };
    if (editingReservation.value) {
      await api.put(`/hotel/reservations/${editingReservation.value.id}`, payload);
    } else {
      await api.post('/hotel/reservations', payload);
    }
    showModal.value = false;
    await loadReservations();
  } catch (e) {
    formError.value = e.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    saving.value = false;
  }
};

const loadCustomers = async () => {
  try {
    const res = await api.get('/customers', { params: { per_page: 500 } });
    customers.value = res.data?.data?.data ?? res.data?.data ?? [];
  } catch (e) {
    console.error('Erreur chargement clients:', e);
  }
};

const generateInvoice = async (reservation) => {
  generatingInvoiceId.value = reservation.id;
  try {
    await api.post(`/hotel/reservations/${reservation.id}/invoice`);
    await loadReservations();
  } catch (e) {
    alert(e.response?.data?.message || 'Impossible de générer la facture');
  } finally {
    generatingInvoiceId.value = null;
  }
};

const doCheckIn = async (reservation) => {
  try {
    await api.post(`/hotel/reservations/${reservation.id}/check-in`);
    await loadReservations();
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur check-in');
  }
};

const openCheckOutModal = (reservation) => {
  checkOutModal.value = reservation;
  checkOutPayment.value = reservation.advance_payment;
};

const doCheckOut = async () => {
  checkingOut.value = true;
  try {
    await api.post(`/hotel/reservations/${checkOutModal.value.id}/check-out`, {
      advance_payment: checkOutPayment.value,
    });
    checkOutModal.value = null;
    await loadReservations();
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur check-out');
  } finally {
    checkingOut.value = false;
  }
};

const confirmCancel = (reservation) => {
  reservationToCancel.value = reservation;
};

const doCancel = async () => {
  cancelling.value = true;
  try {
    await api.post(`/hotel/reservations/${reservationToCancel.value.id}/cancel`);
    reservationToCancel.value = null;
    await loadReservations();
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur annulation');
  } finally {
    cancelling.value = false;
  }
};

const getStatusBadgeClass = (status) => {
  const classes = {
    pending: 'bg-secondary',
    confirmed: 'bg-info',
    checked_in: 'bg-success',
    checked_out: 'bg-dark',
    cancelled: 'bg-danger',
  };
  return classes[status] || 'bg-secondary';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    checked_in: 'En cours',
    checked_out: 'Terminée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
};

const getRoomTypeLabel = (type) => {
  const labels = { standard: 'Standard', double: 'Double', suite: 'Suite', vip: 'VIP' };
  return labels[type] || type;
};

const formatDate = (date) => {
  if (!date) {
    return '—';
  }
  return new Date(date).toLocaleDateString('fr-FR');
};

const formatCurrency = (value) => {
  if (!value && value !== 0) {
    return '0 BIF';
  }
  return new Intl.NumberFormat('fr-BI', { style: 'decimal', minimumFractionDigits: 0 }).format(value) + ' BIF';
};

watch(() => route.query, (query) => {
  if (query.status) {
    filterStatus.value = query.status;
  }
  if (query.date) {
    filterDate.value = query.date;
  }
  loadReservations();
}, { immediate: false });

onMounted(() => {
  if (route.query.status) {
    filterStatus.value = route.query.status;
  }
  if (route.query.date) {
    filterDate.value = route.query.date;
  }
  Promise.all([loadReservations(), loadRooms(), loadCustomers()]);
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}
</style>
