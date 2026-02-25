<template>
  <div class="hotel-page">
    <HotelHeader modelValue="ConferenceRooms" />

    <div class="px-3 pb-4 mt-3">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="mb-0 fw-bold">
          <i class="bi bi-camera-video me-2 text-primary"></i>Salles de Conférences
        </h5>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="loadAll">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button class="btn btn-primary" @click="openAddModal">
            <i class="bi bi-plus-lg me-1"></i> Nouvelle Salle
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
                  <div class="fs-3 fw-bold">{{ stats.available }}</div>
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
                  <div class="fs-3 fw-bold">{{ stats.occupied }}</div>
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
                  <div class="fs-3 fw-bold">{{ stats.reserved }}</div>
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
                  <div class="small fw-semibold">Total salles</div>
                  <div class="fs-3 fw-bold">{{ rooms.length }}</div>
                </div>
                <i class="bi bi-camera-video fs-2 opacity-75"></i>
              </div>
            </div>
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

      <!-- Grid -->
      <div v-else class="row g-3">
        <div
          v-for="room in filteredRooms"
          :key="room.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <div
            class="card h-100 conference-card"
            :class="getCardClass(room.status)"
            style="cursor: pointer;"
            @click="selectedRoom = room"
          >
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="card-title mb-0">
                  <i class="bi bi-camera-video me-2"></i>{{ room.name }}
                </h5>
                <span class="badge" :class="getBadgeClass(room.status)">
                  {{ getStatusLabel(room.status) }}
                </span>
              </div>
              <div class="row g-1 text-muted small">
                <div class="col-6">
                  <i class="bi bi-people me-1"></i>Capacité : <strong>{{ room.capacity }} pers.</strong>
                </div>
                <div class="col-6" v-if="room.floor">
                  <i class="bi bi-layers me-1"></i>Étage : <strong>{{ room.floor }}</strong>
                </div>
                <div class="col-12 mt-1">
                  <i class="bi bi-currency-dollar me-1"></i>
                  <strong class="text-primary">{{ formatCurrency(room.price_per_hour) }}/heure</strong>
                </div>
                <div class="col-12 mt-1" v-if="room.equipment">
                  <i class="bi bi-tools me-1"></i>{{ room.equipment }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredRooms.length === 0" class="col-12 text-center py-5 text-muted">
          <i class="bi bi-camera-video fs-1 d-block mb-2"></i>
          Aucune salle de conférence trouvée
        </div>
      </div>

      <!-- MODAL: Detail -->
      <div v-if="selectedRoom" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="selectedRoom = null">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 480px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0"><i class="bi bi-camera-video me-2"></i>{{ selectedRoom.name }}</h5>
            <button class="btn-close" @click="selectedRoom = null"></button>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <div class="small text-muted">Capacité</div>
              <div class="fw-semibold">{{ selectedRoom.capacity }} personnes</div>
            </div>
            <div class="col-6">
              <div class="small text-muted">Étage</div>
              <div class="fw-semibold">{{ selectedRoom.floor || 'N/A' }}</div>
            </div>
            <div class="col-6">
              <div class="small text-muted">Prix/heure</div>
              <div class="fw-semibold text-primary">{{ formatCurrency(selectedRoom.price_per_hour) }}</div>
            </div>
            <div class="col-6">
              <div class="small text-muted">Statut</div>
              <span class="badge fs-6" :class="getBadgeClass(selectedRoom.status)">{{ getStatusLabel(selectedRoom.status) }}</span>
            </div>
            <div class="col-12" v-if="selectedRoom.equipment">
              <div class="small text-muted">Équipements</div>
              <div>{{ selectedRoom.equipment }}</div>
            </div>
            <div class="col-12" v-if="selectedRoom.description">
              <div class="small text-muted">Description</div>
              <div>{{ selectedRoom.description }}</div>
            </div>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <button
              v-if="selectedRoom.status === 'available'"
              class="btn btn-success btn-sm"
              @click="openBookingModal(selectedRoom)"
            >
              <i class="bi bi-calendar-plus me-1"></i> Réserver
            </button>
            <button
              v-if="selectedRoom.status === 'reserved'"
              class="btn btn-danger btn-sm"
              @click="changeRoomStatus(selectedRoom, 'occupied')"
            >
              <i class="bi bi-door-open me-1"></i> Occuper (début)
            </button>
            <button
              v-if="selectedRoom.status === 'occupied'"
              class="btn btn-success btn-sm"
              @click="changeRoomStatus(selectedRoom, 'available')"
            >
              <i class="bi bi-check-circle me-1"></i> Libérer (fin)
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
            <button class="btn btn-outline-danger btn-sm ms-auto" @click="confirmDelete(selectedRoom)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: Add/Edit -->
      <div v-if="showModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="closeModal">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">{{ editingRoom ? 'Modifier Salle' : 'Nouvelle Salle de Conférence' }}</h5>
            <button class="btn-close" @click="closeModal"></button>
          </div>
          <div v-if="formError" class="alert alert-danger py-2">{{ formError }}</div>
          <form @submit.prevent="saveRoom">
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label small fw-bold">Nom de la salle <span class="text-danger">*</span></label>
                <input v-model="form.name" type="text" class="form-control" required />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Étage</label>
                <input v-model="form.floor" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Capacité <span class="text-danger">*</span></label>
                <input v-model.number="form.capacity" type="number" class="form-control" required min="1" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Prix/heure <span class="text-danger">*</span></label>
                <input v-model.number="form.price_per_hour" type="number" class="form-control" required min="0" step="0.01" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Statut</label>
                <select v-model="form.status" class="form-select">
                  <option value="available">Disponible</option>
                  <option value="reserved">Réservée</option>
                  <option value="occupied">Occupée</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Équipements</label>
                <input v-model="form.equipment" type="text" class="form-control" placeholder="Projecteur, microphone, climatisation..." />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Description</label>
                <textarea v-model="form.description" class="form-control" rows="2"></textarea>
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-3">
              <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                {{ saving ? 'Enregistrement...' : (editingRoom ? 'Mettre à jour' : 'Enregistrer') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: Booking -->
      <div v-if="showBookingModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showBookingModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 560px; max-height: 90vh; overflow-y: auto;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">
              <i class="bi bi-calendar-plus me-2"></i>Réserver — {{ bookingForm.room?.name }}
            </h5>
            <button class="btn-close" @click="showBookingModal = false"></button>
          </div>
          <div v-if="bookingError" class="alert alert-danger py-2">{{ bookingError }}</div>
          <form @submit.prevent="saveBooking">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold">Nom du client <span class="text-danger">*</span></label>
                <input v-model="bookingForm.guest_name" type="text" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Téléphone</label>
                <input v-model="bookingForm.guest_phone" type="text" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Date <span class="text-danger">*</span></label>
                <input v-model="bookingForm.booking_date" type="date" class="form-control" required :min="today" />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Heure début <span class="text-danger">*</span></label>
                <input v-model="bookingForm.start_time" type="time" class="form-control" required />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Heure fin <span class="text-danger">*</span></label>
                <input v-model="bookingForm.end_time" type="time" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Objet de la réunion</label>
                <input v-model="bookingForm.purpose" type="text" class="form-control" placeholder="Ex: Réunion de direction" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Avance payée</label>
                <input v-model.number="bookingForm.advance_payment" type="number" class="form-control" min="0" step="0.01" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Notes</label>
                <textarea v-model="bookingForm.notes" class="form-control" rows="2"></textarea>
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-3">
              <button type="button" class="btn btn-secondary" @click="showBookingModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="savingBooking">
                <span v-if="savingBooking" class="spinner-border spinner-border-sm me-1"></span>
                {{ savingBooking ? 'Enregistrement...' : 'Confirmer la réservation' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: Delete Confirm -->
      <div v-if="roomToDelete" class="modal-overlay d-flex justify-content-center align-items-center">
        <div class="bg-white rounded shadow-lg p-4" style="max-width: 400px; width: 90%;">
          <h5 class="mb-3">Confirmer la suppression</h5>
          <p>Supprimer la salle <strong>{{ roomToDelete.name }}</strong> ?</p>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="roomToDelete = null">Annuler</button>
            <button class="btn btn-danger" @click="deleteRoom" :disabled="deleting">
              <span v-if="deleting" class="spinner-border spinner-border-sm me-1"></span>
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

const loading = ref(false);
const rooms = ref([]);
const filterStatus = ref('all');
const selectedRoom = ref(null);
const showModal = ref(false);
const editingRoom = ref(null);
const saving = ref(false);
const formError = ref('');
const roomToDelete = ref(null);
const deleting = ref(false);
const showBookingModal = ref(false);
const savingBooking = ref(false);
const bookingError = ref('');
const today = new Date().toISOString().split('T')[0];

const form = reactive({
  name: '',
  floor: '',
  capacity: 10,
  price_per_hour: 0,
  status: 'available',
  equipment: '',
  description: '',
});

const bookingForm = reactive({
  room: null,
  conference_room_id: null,
  guest_name: '',
  guest_phone: '',
  booking_date: today,
  start_time: '',
  end_time: '',
  purpose: '',
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

const stats = computed(() => ({
  available: rooms.value.filter(r => r.status === 'available').length,
  occupied: rooms.value.filter(r => r.status === 'occupied').length,
  reserved: rooms.value.filter(r => r.status === 'reserved').length,
}));

const filteredRooms = computed(() => {
  if (filterStatus.value === 'all') return rooms.value;
  return rooms.value.filter(r => r.status === filterStatus.value);
});

const loadAll = async () => {
  loading.value = true;
  try {
    const res = await api.get('/hotel/conference-rooms');
    rooms.value = res.data.data;
  } catch (e) {
    console.error('Erreur chargement salles de conférence:', e);
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  editingRoom.value = null;
  Object.assign(form, { name: '', floor: '', capacity: 10, price_per_hour: 0, status: 'available', equipment: '', description: '' });
  formError.value = '';
  showModal.value = true;
};

const editRoom = (room) => {
  editingRoom.value = room;
  Object.assign(form, { name: room.name, floor: room.floor || '', capacity: room.capacity, price_per_hour: room.price_per_hour, status: room.status, equipment: room.equipment || '', description: room.description || '' });
  formError.value = '';
  selectedRoom.value = null;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingRoom.value = null;
};

const saveRoom = async () => {
  saving.value = true;
  formError.value = '';
  try {
    if (editingRoom.value) {
      await api.put(`/hotel/conference-rooms/${editingRoom.value.id}`, form);
    } else {
      await api.post('/hotel/conference-rooms', form);
    }
    closeModal();
    await loadAll();
  } catch (e) {
    formError.value = e.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (room) => {
  selectedRoom.value = null;
  roomToDelete.value = room;
};

const deleteRoom = async () => {
  deleting.value = true;
  try {
    await api.delete(`/hotel/conference-rooms/${roomToDelete.value.id}`);
    roomToDelete.value = null;
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur lors de la suppression');
  } finally {
    deleting.value = false;
  }
};

const changeRoomStatus = async (room, newStatus) => {
  try {
    await api.put(`/hotel/conference-rooms/${room.id}`, { status: newStatus });
    selectedRoom.value = null;
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur');
  }
};

const toggleMaintenance = async (room) => {
  await changeRoomStatus(room, room.status === 'maintenance' ? 'available' : 'maintenance');
};

const openBookingModal = (room) => {
  bookingForm.room = room;
  bookingForm.conference_room_id = room.id;
  bookingForm.guest_name = '';
  bookingForm.guest_phone = '';
  bookingForm.booking_date = today;
  bookingForm.start_time = '';
  bookingForm.end_time = '';
  bookingForm.purpose = '';
  bookingForm.advance_payment = 0;
  bookingForm.notes = '';
  bookingError.value = '';
  selectedRoom.value = null;
  showBookingModal.value = true;
};

const saveBooking = async () => {
  savingBooking.value = true;
  bookingError.value = '';
  try {
    await api.post('/hotel/conference-bookings', {
      hotel_conference_room_id: bookingForm.conference_room_id,
      guest_name: bookingForm.guest_name,
      guest_phone: bookingForm.guest_phone,
      booking_date: bookingForm.booking_date,
      start_time: bookingForm.start_time,
      end_time: bookingForm.end_time,
      purpose: bookingForm.purpose,
      advance_payment: bookingForm.advance_payment,
      notes: bookingForm.notes,
    });
    showBookingModal.value = false;
    await loadAll();
  } catch (e) {
    bookingError.value = e.response?.data?.message || 'Erreur lors de la réservation';
  } finally {
    savingBooking.value = false;
  }
};

const getCardClass = (status) => {
  const classes = { available: 'border-success', occupied: 'border-danger bg-danger bg-opacity-10', reserved: 'border-warning bg-warning bg-opacity-10', maintenance: 'border-secondary bg-secondary bg-opacity-10' };
  return classes[status] || '';
};

const getBadgeClass = (status) => {
  const classes = { available: 'bg-success', occupied: 'bg-danger', reserved: 'bg-warning text-dark', maintenance: 'bg-secondary' };
  return classes[status] || 'bg-secondary';
};

const getStatusLabel = (status) => {
  const labels = { available: 'Disponible', occupied: 'Occupée', reserved: 'Réservée', maintenance: 'Maintenance' };
  return labels[status] || status;
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0 BIF';
  return new Intl.NumberFormat('fr-BI', { style: 'decimal', minimumFractionDigits: 0 }).format(value) + ' BIF';
};

onMounted(() => loadAll());
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}
.conference-card {
  border-width: 2px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.conference-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
