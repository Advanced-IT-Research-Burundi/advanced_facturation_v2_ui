<template>
  <div class="container-fluid pb-4">
    <!-- Hotel Header Tabs -->
    <HotelHeader modelValue="Rooms" />

    <!-- Tab Content -->
    <div class="mt-3">
      <!-- Rooms Content -->
      <div class="d-flex justify-content-end align-items-center mb-4">
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="loadAll">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button class="btn btn-primary" @click="openAddRoomModal">
            <i class="bi bi-plus-lg me-1"></i> Nouvelle Chambre
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="row mb-4 g-3">
        <div class="col-6 col-md-3">
          <div class="card bg-success text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">Disponibles</div>
                  <div class="fs-3 fw-bold">{{ stats.rooms?.available ?? 0 }}</div>
                </div>
                <i class="bi bi-check-circle fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card bg-danger text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">Occupées</div>
                  <div class="fs-3 fw-bold">{{ stats.rooms?.occupied ?? 0 }}</div>
                </div>
                <i class="bi bi-person-fill fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card bg-warning h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">Réservées</div>
                  <div class="fs-3 fw-bold">{{ stats.rooms?.reserved ?? 0 }}</div>
                </div>
                <i class="bi bi-calendar2-check fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card bg-primary text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">CA du mois</div>
                  <div class="fs-5 fw-bold">{{ formatCurrency(stats.revenue?.month) }}</div>
                </div>
                <i class="bi bi-cash-stack fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Today's actions -->
      <div v-if="stats.reservations?.today_check_ins > 0 || stats.reservations?.today_check_outs > 0" class="row mb-4 g-3">
        <div class="col-md-6" v-if="stats.reservations?.today_check_ins > 0">
          <div class="alert alert-info mb-0 d-flex align-items-center">
            <i class="bi bi-box-arrow-in-right me-2 fs-5"></i>
            <span><strong>{{ stats.reservations.today_check_ins }}</strong> check-in(s) prévu(s) aujourd'hui</span>
            <router-link :to="{ name: 'hotel.reservations', query: { status: 'confirmed', date: today } }" class="btn btn-sm btn-info ms-auto">
              Voir
            </router-link>
          </div>
        </div>
        <div class="col-md-6" v-if="stats.reservations?.today_check_outs > 0">
          <div class="alert alert-warning mb-0 d-flex align-items-center">
            <i class="bi bi-box-arrow-right me-2 fs-5"></i>
            <span><strong>{{ stats.reservations.today_check_outs }}</strong> check-out(s) prévu(s) aujourd'hui</span>
            <router-link :to="{ name: 'hotel.reservations', query: { status: 'checked_in' } }" class="btn btn-sm btn-warning ms-auto">
              Voir
            </router-link>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="d-flex gap-2 mb-3 flex-wrap">
        <button
          v-for="f in statusFilters"
          :key="f.value"
          class="btn btn-sm"
          :class="filterStatus === f.value ? f.activeClass : 'btn-outline-secondary'"
          @click="filterStatus = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <!-- Rooms Grid -->
      <div v-else class="row g-3">
        <div
          v-for="room in filteredRooms"
          :key="room.id"
          class="col-6 col-md-4 col-lg-3 col-xl-2"
        >
          <div
            class="card h-100 room-card"
            :class="getRoomCardClass(room)"
            @click="selectRoom(room)"
            style="cursor: pointer;"
          >
            <div class="card-body text-center p-3">
              <i class="bi bi-door-closed fs-1 mb-2 d-block"></i>
              <h5 class="card-title mb-1">Chambre nº {{ room.room_number }}</h5>
              <div class="badge mb-2" :class="getRoomBadgeClass(room)">{{ getRoomStatusLabel(room.status) }}</div>
              <p class="card-text small mb-1 text-muted">
                <i class="bi bi-tags me-1"></i>{{ getRoomTypeLabel(room.type) }}
              </p>
              <p class="card-text small mb-1 text-muted" v-if="room.floor">
                <i class="bi bi-layers me-1"></i>Étage {{ room.floor }}
              </p>
              <p class="card-text small fw-semibold">
                {{ formatCurrency(room.price_per_night) }}/nuit
              </p>
            </div>
          </div>
        </div>

        <div v-if="filteredRooms.length === 0" class="col-12 text-center py-5 text-muted">
          <i class="bi bi-building fs-1 d-block mb-2"></i>
          Aucune chambre trouvée
        </div>
      </div>

      <!-- MODAL: Chambre Detail -->
      <div v-if="selectedRoom" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="selectedRoom = null">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 500px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">
              <i class="bi bi-door-closed me-2"></i>Chambre {{ selectedRoom.room_number }}
            </h5>
            <button class="btn-close" @click="selectedRoom = null"></button>
          </div>

          <div class="mb-3">
            <div class="row g-2">
              <div class="col-6">
                <div class="small text-muted">Type</div>
                <div class="fw-semibold">{{ getRoomTypeLabel(selectedRoom.type) }}</div>
              </div>
              <div class="col-6">
                <div class="small text-muted">Étage</div>
                <div class="fw-semibold">{{ selectedRoom.floor || 'N/A' }}</div>
              </div>
              <div class="col-6">
                <div class="small text-muted">Capacité</div>
                <div class="fw-semibold">{{ selectedRoom.capacity }} pers.</div>
              </div>
              <div class="col-6">
                <div class="small text-muted">Prix / nuit</div>
                <div class="fw-semibold text-primary">{{ formatCurrency(selectedRoom.price_per_night) }}</div>
              </div>
              <div class="col-12">
                <div class="small text-muted">Statut</div>
                <span class="badge fs-6" :class="getRoomBadgeClass(selectedRoom)">{{ getRoomStatusLabel(selectedRoom.status) }}</span>
              </div>
              <div class="col-12" v-if="selectedRoom.description">
                <div class="small text-muted">Description</div>
                <div>{{ selectedRoom.description }}</div>
              </div>
            </div>
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <button
              v-if="selectedRoom.status === 'available'"
              class="btn btn-success btn-sm"
              @click="openNewReservation(selectedRoom)"
            >
              <i class="bi bi-calendar-plus me-1"></i> Réserver
            </button>
            <button class="btn btn-outline-primary btn-sm" @click="editRoom(selectedRoom)">
              <i class="bi bi-pencil me-1"></i> Modifier
            </button>
            <button
              v-if="selectedRoom.status !== 'occupied'"
              class="btn btn-outline-secondary btn-sm"
              @click="toggleMaintenance(selectedRoom)"
            >
              <i class="bi bi-tools me-1"></i>
              {{ selectedRoom.status === 'maintenance' ? 'Fin maintenance' : 'Maintenance' }}
            </button>
            <button class="btn btn-outline-danger btn-sm ms-auto" @click="confirmDeleteRoom(selectedRoom)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: Add/Edit Room -->
      <div v-if="showRoomModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="closeRoomModal">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 600px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">{{ editingRoom ? 'Modifier Chambre' : 'Nouvelle Chambre' }}</h5>
            <button class="btn-close" @click="closeRoomModal"></button>
          </div>

          <div v-if="formError" class="alert alert-danger py-2">{{ formError }}</div>

          <form @submit.prevent="saveRoom">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label small fw-bold">N° Chambre <span class="text-danger">*</span></label>
                <input v-model="roomForm.room_number" type="text" class="form-control" required maxlength="20" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Nom (optionnel)</label>
                <input v-model="roomForm.name" type="text" class="form-control" maxlength="100" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Étage</label>
                <input v-model="roomForm.floor" type="text" class="form-control" maxlength="10" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Type <span class="text-danger">*</span></label>
                <select v-model="roomForm.type" class="form-select" required>
                  <option value="standard">Standard</option>
                  <option value="double">Double</option>
                  <option value="suite">Suite</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Capacité <span class="text-danger">*</span></label>
                <input v-model.number="roomForm.capacity" type="number" class="form-control" required min="1" max="20" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Prix / nuit <span class="text-danger">*</span></label>
                <input v-model.number="roomForm.price_per_night" type="number" class="form-control" required min="0" step="0.01" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Description</label>
                <textarea v-model="roomForm.description" class="form-control" rows="2"></textarea>
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-3">
              <button type="button" class="btn btn-secondary" @click="closeRoomModal">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="savingRoom">
                <span v-if="savingRoom" class="spinner-border spinner-border-sm me-1"></span>
                {{ savingRoom ? 'Enregistrement...' : (editingRoom ? 'Mettre à jour' : 'Enregistrer') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: New Reservation -->
      <div v-if="showReservationModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showReservationModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">
              <i class="bi bi-calendar-plus me-2"></i>
              Nouvelle Réservation — Chambre {{ reservationForm.room?.room_number }}
            </h5>
            <button class="btn-close" @click="showReservationModal = false"></button>
          </div>

          <div v-if="reservationError" class="alert alert-danger py-2">{{ reservationError }}</div>

          <form @submit.prevent="saveReservation">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold">Nom du client <span class="text-danger">*</span></label>
                <input v-model="reservationForm.guest_name" type="text" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Téléphone</label>
                <input v-model="reservationForm.guest_phone" type="text" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Email</label>
                <input v-model="reservationForm.guest_email" type="email" class="form-control" />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Check-in <span class="text-danger">*</span></label>
                <input v-model="reservationForm.check_in_date" type="date" class="form-control" required :min="today" @change="computeNights" />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Check-out <span class="text-danger">*</span></label>
                <input v-model="reservationForm.check_out_date" type="date" class="form-control" required :min="reservationForm.check_in_date" @change="computeNights" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Nuits</label>
                <input :value="reservationNights" type="number" class="form-control" readonly />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Total</label>
                <input :value="reservationTotal" type="text" class="form-control" readonly />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Avance</label>
                <input v-model.number="reservationForm.advance_payment" type="number" class="form-control" min="0" step="0.01" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Notes</label>
                <textarea v-model="reservationForm.notes" class="form-control" rows="2"></textarea>
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-3">
              <button type="button" class="btn btn-secondary" @click="showReservationModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="savingReservation">
                <span v-if="savingReservation" class="spinner-border spinner-border-sm me-1"></span>
                {{ savingReservation ? 'Enregistrement...' : 'Confirmer la réservation' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: Delete Confirm -->
      <div v-if="roomToDelete" class="modal-overlay d-flex justify-content-center align-items-center">
        <div class="bg-white rounded shadow-lg p-4" style="max-width: 400px; width: 90%;">
          <h5 class="mb-3">Confirmer la suppression</h5>
          <p>Supprimer la chambre <strong>{{ roomToDelete.room_number }}</strong> ?</p>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="roomToDelete = null">Annuler</button>
            <button class="btn btn-danger" @click="deleteRoom" :disabled="deletingRoom">
              <span v-if="deletingRoom" class="spinner-border spinner-border-sm me-1"></span>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import api from '@/services/api';
import HotelHeader from './HotelHeader.vue';
import HotelReservations from './HotelReservations.vue';
import HotelInvoice from './HotelInvoice.vue';

const activeTab = ref('Rooms');

const loading = ref(false);
const rooms = ref([]);
const stats = ref({});
const filterStatus = ref('all');
const selectedRoom = ref(null);

const showRoomModal = ref(false);
const editingRoom = ref(null);
const savingRoom = ref(false);
const formError = ref('');
const roomToDelete = ref(null);
const deletingRoom = ref(false);

const showReservationModal = ref(false);
const savingReservation = ref(false);
const reservationError = ref('');

const today = new Date().toISOString().split('T')[0];

const roomForm = reactive({
  room_number: '',
  name: '',
  type: 'standard',
  floor: '',
  capacity: 1,
  price_per_night: 0,
  description: '',
});

const reservationForm = reactive({
  room: null,
  hotel_room_id: null,
  guest_name: '',
  guest_phone: '',
  guest_email: '',
  check_in_date: today,
  check_out_date: '',
  advance_payment: 0,
  notes: '',
});

const statusFilters = [
  { value: 'all', label: 'Toutes', activeClass: 'btn-dark' },
  { value: 'available', label: 'Disponibles', activeClass: 'btn-success' },
  { value: 'occupied', label: 'Occupées', activeClass: 'btn-danger' },
  { value: 'reserved', label: 'Réservées', activeClass: 'btn-warning' },
  { value: 'maintenance', label: 'Maintenance', activeClass: 'btn-secondary' },
];

const filteredRooms = computed(() => {
  if (filterStatus.value === 'all') {
    return rooms.value;
  }
  return rooms.value.filter(r => r.status === filterStatus.value);
});

const reservationNights = computed(() => {
  if (!reservationForm.check_in_date || !reservationForm.check_out_date) {
    return 0;
  }
  const diff = new Date(reservationForm.check_out_date) - new Date(reservationForm.check_in_date);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
});

const reservationTotal = computed(() => {
  if (!reservationForm.room) {
    return '0';
  }
  const total = reservationForm.room.price_per_night * reservationNights.value;
  return formatCurrency(total);
});

const loadAll = async () => {
  loading.value = true;
  try {
    const [roomsRes, statsRes] = await Promise.all([
      api.get('/hotel/rooms'),
      api.get('/hotel/dashboard'),
    ]);
    rooms.value = roomsRes.data.data;
    stats.value = statsRes.data.data;
  } catch (e) {
    console.error('Erreur chargement hôtel:', e);
  } finally {
    loading.value = false;
  }
};

const selectRoom = (room) => {
  selectedRoom.value = room;
};

const openAddRoomModal = () => {
  editingRoom.value = null;
  Object.assign(roomForm, { room_number: '', name: '', type: 'standard', floor: '', capacity: 1, price_per_night: 0, description: '' });
  formError.value = '';
  showRoomModal.value = true;
};

const editRoom = (room) => {
  editingRoom.value = room;
  Object.assign(roomForm, {
    room_number: room.room_number,
    name: room.name || '',
    type: room.type,
    floor: room.floor || '',
    capacity: room.capacity,
    price_per_night: room.price_per_night,
    description: room.description || '',
  });
  formError.value = '';
  selectedRoom.value = null;
  showRoomModal.value = true;
};

const closeRoomModal = () => {
  showRoomModal.value = false;
  editingRoom.value = null;
};

const saveRoom = async () => {
  savingRoom.value = true;
  formError.value = '';
  try {
    const payload = { ...roomForm };
    if (editingRoom.value) {
      await api.put(`/hotel/rooms/${editingRoom.value.id}`, payload);
    } else {
      await api.post('/hotel/rooms', payload);
    }
    closeRoomModal();
    await loadAll();
  } catch (e) {
    formError.value = e.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    savingRoom.value = false;
  }
};

const confirmDeleteRoom = (room) => {
  selectedRoom.value = null;
  roomToDelete.value = room;
};

const deleteRoom = async () => {
  deletingRoom.value = true;
  try {
    await api.delete(`/hotel/rooms/${roomToDelete.value.id}`);
    roomToDelete.value = null;
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur lors de la suppression');
  } finally {
    deletingRoom.value = false;
  }
};

const toggleMaintenance = async (room) => {
  const newStatus = room.status === 'maintenance' ? 'available' : 'maintenance';
  try {
    await api.put(`/hotel/rooms/${room.id}`, { status: newStatus });
    selectedRoom.value = null;
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur');
  }
};

const openNewReservation = (room) => {
  reservationForm.room = room;
  reservationForm.hotel_room_id = room.id;
  reservationForm.guest_name = '';
  reservationForm.guest_phone = '';
  reservationForm.guest_email = '';
  reservationForm.check_in_date = today;
  reservationForm.check_out_date = '';
  reservationForm.advance_payment = 0;
  reservationForm.notes = '';
  reservationError.value = '';
  selectedRoom.value = null;
  showReservationModal.value = true;
};

const computeNights = () => {};

const saveReservation = async () => {
  savingReservation.value = true;
  reservationError.value = '';
  try {
    const payload = {
      hotel_room_id: reservationForm.hotel_room_id,
      guest_name: reservationForm.guest_name,
      guest_phone: reservationForm.guest_phone,
      guest_email: reservationForm.guest_email,
      check_in_date: reservationForm.check_in_date,
      check_out_date: reservationForm.check_out_date,
      advance_payment: reservationForm.advance_payment,
      notes: reservationForm.notes,
    };
    await api.post('/hotel/reservations', payload);
    showReservationModal.value = false;
    await loadAll();
  } catch (e) {
    reservationError.value = e.response?.data?.message || 'Erreur lors de la réservation';
  } finally {
    savingReservation.value = false;
  }
};

const getRoomCardClass = (room) => {
  const classes = {
    available: 'border-success',
    occupied: 'border-danger bg-danger bg-opacity-10',
    reserved: 'border-warning bg-warning bg-opacity-10',
    maintenance: 'border-secondary bg-secondary bg-opacity-10',
  };
  return classes[room.status] || '';
};

const getRoomBadgeClass = (room) => {
  const classes = {
    available: 'bg-success',
    occupied: 'bg-danger',
    reserved: 'bg-warning text-dark',
    maintenance: 'bg-secondary',
  };
  return classes[room.status] || 'bg-secondary';
};

const getRoomStatusLabel = (status) => {
  const labels = {
    available: 'Disponible',
    occupied: 'Occupée',
    reserved: 'Réservée',
    maintenance: 'Maintenance',
  };
  return labels[status] || status;
};

const getRoomTypeLabel = (type) => {
  const labels = {
    standard: 'Standard',
    double: 'Double',
    suite: 'Suite',
    vip: 'VIP',
  };
  return labels[type] || type;
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0 BIF';
  return new Intl.NumberFormat('fr-BI', { style: 'decimal', minimumFractionDigits: 0 }).format(value) + ' BIF';
};

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.room-card {
  border-width: 2px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.room-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
