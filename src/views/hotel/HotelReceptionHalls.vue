<template>
  <div class="hotel-page">
    <HotelHeader modelValue="ReceptionHalls" />

    <div class="px-3 pb-4 mt-3">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="mb-0 fw-bold">
          <i class="bi bi-balloon-heart me-2 text-primary"></i>Salles de Réception
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
                  <div class="fs-3 fw-bold">{{ halls.length }}</div>
                </div>
                <i class="bi bi-balloon-heart fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100" style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%); color: white;">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold opacity-90">CA aujourd'hui</div>
                  <div class="fs-4 fw-bold">{{ formatCurrency(revenueToday) }}</div>
                </div>
                <i class="bi bi-currency-exchange fs-2 opacity-75"></i>
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
          v-for="hall in filteredHalls"
          :key="hall.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <div
            class="card h-100 reception-card"
            :class="getCardClass(hall.status)"
            style="cursor: pointer;"
            @click="selectedHall = hall"
          >
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="card-title mb-0">
                  <i class="bi bi-balloon-heart me-2"></i>{{ hall.name }}
                </h5>
                <span class="badge" :class="getBadgeClass(hall.status)">
                  {{ getStatusLabel(hall.status) }}
                </span>
              </div>
              <div class="row g-1 text-muted small">
                <div class="col-6">
                  <i class="bi bi-people me-1"></i>Capacité : <strong>{{ hall.capacity }} pers.</strong>
                </div>
                <div class="col-6" v-if="hall.floor">
                  <i class="bi bi-layers me-1"></i>Étage : <strong>{{ hall.floor }}</strong>
                </div>
                <div class="col-12 mt-1">
                  <i class="bi bi-currency-dollar me-1"></i>
                  <strong class="text-primary">{{ formatCurrency(hall.price_per_hour) }}/heure</strong>
                </div>
                <div class="col-12 mt-1" v-if="hall.equipment">
                  <i class="bi bi-tools me-1"></i>{{ hall.equipment }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredHalls.length === 0" class="col-12 text-center py-5 text-muted">
          <i class="bi bi-balloon-heart fs-1 d-block mb-2"></i>
          Aucune salle de réception trouvée
        </div>
      </div>

      <!-- Alerte : bookings dépassés -->
      <div v-if="overdueBookings.length > 0" class="alert alert-danger d-flex align-items-start gap-2 mb-3">
        <i class="bi bi-alarm-fill fs-5 mt-1"></i>
        <div>
          <strong>{{ overdueBookings.length }} réservation(s) de salle dépassée(s) !</strong>
          <div v-for="b in overdueBookings" :key="b.id" class="small mt-1">
            Salle <strong>{{ b.reception_hall?.name }}</strong> — <strong>{{ b.guest_name }}</strong>
            (prévu jusqu'à {{ b.end_time?.substring(0,5) }})
            <button class="btn btn-sm btn-warning ms-2 py-0" @click="openExtendModal(b)">
              <i class="bi bi-clock-history me-1"></i>Prolonger
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: Prolongation -->
      <div v-if="showExtendModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showExtendModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 420px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0 fw-bold"><i class="bi bi-clock-history me-2 text-warning"></i>Prolonger la réservation</h5>
            <button class="btn-close" @click="showExtendModal = false"></button>
          </div>
          <div v-if="extendingBooking" class="alert alert-info py-2 small mb-3">
            <strong>{{ extendingBooking.guest_name }}</strong> — {{ extendingBooking.reception_hall?.name }}<br>
            Heure de fin prévue : {{ extendingBooking.end_time?.substring(0,5) }}<br>
            Prix/heure : <strong>{{ formatCurrency(extendingBooking.reception_hall?.price_per_hour) }}</strong>
          </div>
          <div v-if="extendError" class="alert alert-danger py-2 small">{{ extendError }}</div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Durée supplémentaire (heures) <span class="text-danger">*</span></label>
            <select v-model="extendForm.extra_hours" class="form-select">
              <option :value="0.5">30 min</option>
              <option :value="1">1 heure</option>
              <option :value="1.5">1h30</option>
              <option :value="2">2 heures</option>
              <option :value="3">3 heures</option>
              <option :value="4">4 heures</option>
            </select>
            <div class="form-text" v-if="extendingBooking && extendForm.extra_hours > 0">
              Montant supplémentaire :
              <strong class="text-primary">{{ formatCurrency(extendingBooking.reception_hall?.price_per_hour * extendForm.extra_hours) }}</strong>
            </div>
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="showExtendModal = false">Annuler</button>
            <button class="btn btn-warning" @click="saveExtend" :disabled="savingExtend">
              <span v-if="savingExtend" class="spinner-border spinner-border-sm me-1"></span>
              Prolonger
            </button>
          </div>
        </div>
      </div>

      <!-- Bookings list -->
      <div class="card mt-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
          <h6 class="mb-0 fw-bold"><i class="bi bi-calendar-check me-2 text-primary"></i>Réservations de salles <span class="text-muted small">({{ bookingPagination.total }})</span></h6>
          <div class="d-flex gap-2">
            <input v-model="bookingSearch" type="text" class="form-control form-control-sm" placeholder="Rechercher..." style="width:200px" @input="onBookingSearchChange" />
            <select v-model="bookingStatusFilter" class="form-select form-select-sm" style="width:140px" @change="onBookingStatusChange">
              <option value="">Tous statuts</option>
              <option value="confirmed">Confirmée</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Client</th>
                <th>Salle</th>
                <th>Date</th>
                <th>Horaire</th>
                <th>Total</th>
                <th>Avance</th>
                <th>Statut</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredBookings.length === 0">
                <td colspan="8" class="text-center py-4 text-muted">Aucune réservation</td>
              </tr>
              <tr v-for="b in filteredBookings" :key="b.id">
                <td>
                  <div class="fw-semibold">{{ b.guest_name }}</div>
                  <div class="small text-muted">{{ b.guest_phone }}</div>
                </td>
                <td>{{ b.reception_hall?.name }}</td>
                <td>{{ formatDate(b.booking_date) }}</td>
                <td>
                  {{ b.start_time?.substring(0,5) }} – {{ b.end_time?.substring(0,5) }}
                  <span v-if="isBookingOverdue(b)" class="badge bg-danger ms-1 small">
                    <i class="bi bi-alarm-fill"></i> Dépassé
                  </span>
                </td>
                <td>{{ formatCurrency(b.invoice?.invoice_total_amount ?? b.total_amount) }}</td>
                <td>{{ formatCurrency(b.advance_payment) }}</td>
                <td>
                  <span class="badge" :class="getBookingBadgeClass(b.status)">{{ getBookingStatusLabel(b.status) }}</span>
                </td>
                <td class="text-center">
                  <div class="d-flex gap-1 justify-content-center">
                    <button
                      v-if="!b.invoice_id && b.status !== 'cancelled'"
                      class="btn btn-sm btn-outline-primary"
                      :disabled="generatingInvoiceId === b.id"
                      @click="generateInvoice(b)"
                      title="Générer la facture"
                    >
                      <span v-if="generatingInvoiceId === b.id" class="spinner-border spinner-border-sm"></span>
                      <i v-else class="bi bi-receipt"></i>
                    </button>
                    <router-link
                      v-if="b.invoice_id"
                      :to="{ name: 'hotel.invoice', params: { id: b.invoice_id } }"
                      class="btn btn-sm btn-outline-secondary"
                      title="Voir la facture"
                    >
                      <i class="bi bi-eye"></i>
                    </router-link>
                    <button
                      v-if="b.invoice_id && b.invoice && b.invoice.payment_status !== 'paid'"
                      class="btn btn-sm btn-success"
                      @click="openPaymentModal(b)"
                      title="Enregistrer un paiement"
                    >
                      <i class="bi bi-cash-coin"></i>
                    </button>
                    <button
                      v-if="b.status === 'confirmed'"
                      class="btn btn-sm btn-outline-warning"
                      @click="openExtendModal(b)"
                      title="Prolonger"
                    >
                      <i class="bi bi-clock-history"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div v-if="bookingPagination.last_page > 1" class="card-footer d-flex justify-content-between align-items-center">
          <small class="text-muted">Page {{ bookingPagination.current_page }} / {{ bookingPagination.last_page }}</small>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-secondary" :disabled="bookingPagination.current_page === 1" @click="loadBookings(bookingPagination.current_page - 1)">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary" :disabled="bookingPagination.current_page === bookingPagination.last_page" @click="loadBookings(bookingPagination.current_page + 1)">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: Paiement -->
      <div v-if="showPaymentModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showPaymentModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 460px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0 fw-bold"><i class="bi bi-cash-coin me-2 text-success"></i>Enregistrer un paiement</h5>
            <button class="btn-close" @click="showPaymentModal = false"></button>
          </div>
          <div v-if="payingBooking" class="alert alert-info py-2 small mb-3">
            <strong>{{ payingBooking.guest_name }}</strong> — {{ payingBooking.reception_hall?.name }}<br>
            Total : <strong>{{ formatCurrency(payingBooking.invoice?.invoice_total_amount ?? payingBooking.total_amount) }}</strong> &nbsp;|&nbsp;
            Déjà payé : <strong>{{ formatCurrency(payingBooking.invoice?.total_paid ?? payingBooking.advance_payment) }}</strong><br>
            Reste à payer : <strong class="text-danger">{{ formatCurrency(remainingAmount) }}</strong>
          </div>
          <div class="alert alert-danger py-2 small" v-if="paymentError">{{ paymentError }}</div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Montant payé <span class="text-danger">*</span></label>
            <input v-model.number="paymentForm.amount" type="number" class="form-control" :max="remainingAmount" min="0.01" step="any" />
            <div class="form-text text-muted">Maximum : {{ formatCurrency(remainingAmount) }}</div>
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Mode de paiement <span class="text-danger">*</span></label>
            <select v-model="paymentForm.payment_method" class="form-select">
              <option value="cash">Espèces</option>
              <option value="bank_transfer">Virement bancaire</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="card">Carte</option>
              <option value="check">Chèque</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Date de paiement</label>
            <input v-model="paymentForm.payment_date" type="date" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Référence / Note</label>
            <input v-model="paymentForm.reference" type="text" class="form-control" placeholder="N° reçu, référence..." />
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="showPaymentModal = false">Annuler</button>
            <button class="btn btn-success" @click="savePayment" :disabled="savingPayment">
              <span v-if="savingPayment" class="spinner-border spinner-border-sm me-1"></span>
              Confirmer le paiement
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: Detail -->
      <div v-if="selectedHall" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="selectedHall = null">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 480px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0"><i class="bi bi-balloon-heart me-2"></i>{{ selectedHall.name }}</h5>
            <button class="btn-close" @click="selectedHall = null"></button>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <div class="small text-muted">Capacité</div>
              <div class="fw-semibold">{{ selectedHall.capacity }} personnes</div>
            </div>
            <div class="col-6">
              <div class="small text-muted">Étage</div>
              <div class="fw-semibold">{{ selectedHall.floor || 'N/A' }}</div>
            </div>
            <div class="col-6">
              <div class="small text-muted">Prix/heure</div>
              <div class="fw-semibold text-primary">{{ formatCurrency(selectedHall.price_per_hour) }}</div>
            </div>
            <div class="col-6">
              <div class="small text-muted">Statut</div>
              <span class="badge fs-6" :class="getBadgeClass(selectedHall.status)">{{ getStatusLabel(selectedHall.status) }}</span>
            </div>
            <div class="col-12" v-if="selectedHall.equipment">
              <div class="small text-muted">Équipements</div>
              <div>{{ selectedHall.equipment }}</div>
            </div>
            <div class="col-12" v-if="selectedHall.description">
              <div class="small text-muted">Description</div>
              <div>{{ selectedHall.description }}</div>
            </div>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <button
              v-if="selectedHall.status === 'available'"
              class="btn btn-success btn-sm"
              @click="openBookingModal(selectedHall)"
            >
              <i class="bi bi-calendar-plus me-1"></i> Réserver
            </button>
            <button
              v-if="selectedHall.status === 'reserved'"
              class="btn btn-danger btn-sm"
              @click="changeHallStatus(selectedHall, 'occupied')"
            >
              <i class="bi bi-door-open me-1"></i> Occuper (début)
            </button>
            <button
              v-if="selectedHall.status === 'occupied'"
              class="btn btn-success btn-sm"
              @click="changeHallStatus(selectedHall, 'available')"
            >
              <i class="bi bi-check-circle me-1"></i> Libérer (fin)
            </button>
            <button class="btn btn-outline-primary btn-sm" @click="editHall(selectedHall)">
              <i class="bi bi-pencil me-1"></i> Modifier
            </button>
            <button
              v-if="selectedHall.status !== 'occupied'"
              class="btn btn-outline-secondary btn-sm"
              @click="toggleMaintenance(selectedHall)"
            >
              <i class="bi bi-tools me-1"></i>
              {{ selectedHall.status === 'maintenance' ? 'Fin maintenance' : 'Maintenance' }}
            </button>
            <button class="btn btn-outline-danger btn-sm ms-auto" @click="confirmDelete(selectedHall)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: Add/Edit -->
      <div v-if="showModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="closeModal">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">{{ editingHall ? 'Modifier Salle' : 'Nouvelle Salle de Réception' }}</h5>
            <button class="btn-close" @click="closeModal"></button>
          </div>
          <div v-if="formError" class="alert alert-danger py-2">{{ formError }}</div>
          <form @submit.prevent="saveHall">
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
                <input v-model="form.equipment" type="text" class="form-control" placeholder="Scène, sonorisation, décoration, climatisation..." />
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
                {{ saving ? 'Enregistrement...' : (editingHall ? 'Mettre à jour' : 'Enregistrer') }}
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
              <i class="bi bi-calendar-plus me-2"></i>Réserver — {{ bookingForm.hall?.name }}
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
                <select v-model="bookingForm.start_time" class="form-select" required>
                  <option value="">--:--</option>
                  <option v-for="t in timeSlots" :key="'s'+t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Heure fin <span class="text-danger">*</span></label>
                <select v-model="bookingForm.end_time" class="form-select" required>
                  <option value="">--:--</option>
                  <option v-for="t in timeSlots" :key="'e'+t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Objet / Type d'événement</label>
                <input v-model="bookingForm.purpose" type="text" class="form-control" placeholder="Ex: Mariage, anniversaire, baptême..." />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Montant total</label>
                <div class="form-control bg-light fw-semibold text-primary">
                  {{ bookingTotalLabel }}
                </div>
              </div>
              <div class="col-md-3">
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
      <div v-if="hallToDelete" class="modal-overlay d-flex justify-content-center align-items-center">
        <div class="bg-white rounded shadow-lg p-4" style="max-width: 400px; width: 90%;">
          <h5 class="mb-3">Confirmer la suppression</h5>
          <p>Supprimer la salle <strong>{{ hallToDelete.name }}</strong> ?</p>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="hallToDelete = null">Annuler</button>
            <button class="btn btn-danger" @click="deleteHall" :disabled="deleting">
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
import { ref, computed, onMounted, reactive, watch, toRaw } from 'vue';
import api from '@/services/api';
import HotelHeader from './HotelHeader.vue';

const loading = ref(false);
const halls = ref([]);
const bookings = ref([]);
const bookingSearch = ref('');
const bookingStatusFilter = ref('');
const bookingPagination = ref({ current_page: 1, last_page: 1, total: 0 });
let bookingSearchTimer = null;
const generatingInvoiceId = ref(null);
const showPaymentModal = ref(false);
const savingPayment = ref(false);
const payingBooking = ref(null);
const paymentError = ref('');
const paymentForm = reactive({
  amount: 0,
  payment_method: 'cash',
  payment_date: new Date().toISOString().split('T')[0],
  reference: '',
});
const filterStatus = ref('all');
const selectedHall = ref(null);
const showModal = ref(false);
const editingHall = ref(null);
const saving = ref(false);
const formError = ref('');
const hallToDelete = ref(null);
const deleting = ref(false);
const showBookingModal = ref(false);
const savingBooking = ref(false);
const bookingError = ref('');
const today = new Date().toISOString().split('T')[0];

const form = reactive({
  name: '',
  floor: '',
  capacity: 50,
  price_per_hour: 0,
  status: 'available',
  equipment: '',
  description: '',
});

const bookingForm = reactive({
  hall: null,
  reception_hall_id: null,
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
  available: halls.value.filter(h => h.status === 'available').length,
  occupied: halls.value.filter(h => h.status === 'occupied').length,
  reserved: halls.value.filter(h => h.status === 'reserved').length,
}));

const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const revenueToday = computed(() => {
  const today = todayStr();
  return bookings.value
    .filter((b) => b.status !== 'cancelled' && (b.booking_date?.slice(0, 10) === today || (typeof b.booking_date === 'string' && b.booking_date.startsWith(today))))
    .reduce((sum, b) => sum + parseFloat(b.total_amount ?? 0), 0);
});

const filteredHalls = computed(() => {
  if (filterStatus.value === 'all') return halls.value;
  return halls.value.filter(h => h.status === filterStatus.value);
});

const timeSlots = computed(() => {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
});

const bookingTotalAmount = ref(0);
const bookingTotalLabel = ref('—');

const computeBookingTotal = () => {
  const startTime = bookingForm.start_time;
  const endTime = bookingForm.end_time;
  const price = parseFloat(bookingForm.hall?.price_per_hour ?? 0);

  if (!startTime || !endTime || !price) {
    bookingTotalAmount.value = 0;
    bookingTotalLabel.value = '—';
    return;
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  if (isNaN(startH) || isNaN(endH)) {
    bookingTotalLabel.value = '—';
    return;
  }

  const minutes = (endH * 60 + endM) - (startH * 60 + startM);
  const hours = Math.max(0, Math.round(minutes / 60 * 10) / 10);
  const total = Math.round(hours * price * 100) / 100;

  bookingTotalAmount.value = total;
  bookingTotalLabel.value = total > 0 ? `${formatCurrency(total)} (${hours}h)` : '—';
};

watch(
  () => [bookingForm.start_time, bookingForm.end_time, bookingForm.hall],
  computeBookingTotal,
);

const remainingAmount = computed(() => {
  if (!payingBooking.value) { return 0; }
  const total = parseFloat(payingBooking.value.invoice?.invoice_total_amount ?? payingBooking.value.total_amount ?? 0);
  const paid = parseFloat(payingBooking.value.invoice?.total_paid ?? payingBooking.value.advance_payment ?? 0);
  return Math.max(0, total - paid);
});

const filteredBookings = computed(() => bookings.value);

const loadBookings = async (page = 1) => {
  try {
    const params = { page };
    if (bookingSearch.value.trim()) params.search = bookingSearch.value.trim();
    if (bookingStatusFilter.value) params.status = bookingStatusFilter.value;
    const res = await api.get('/hotel/reception-bookings', { params });
    bookings.value = res.data.data;
    bookingPagination.value = res.data.meta ?? { current_page: 1, last_page: 1, total: bookings.value.length };
  } catch (e) {
    console.error('Erreur chargement réservations réception:', e);
  }
};

const onBookingSearchChange = () => {
  clearTimeout(bookingSearchTimer);
  bookingSearchTimer = setTimeout(() => loadBookings(1), 400);
};

const onBookingStatusChange = () => loadBookings(1);

const getBookingBadgeClass = (status) => {
  const classes = { confirmed: 'bg-warning text-dark', completed: 'bg-success', cancelled: 'bg-secondary' };
  return classes[status] || 'bg-secondary';
};

const getBookingStatusLabel = (status) => {
  const labels = { confirmed: 'Confirmée', completed: 'Terminée', cancelled: 'Annulée' };
  return labels[status] || status;
};

const formatDate = (date) => {
  if (!date) { return ''; }
  return new Date(date).toLocaleDateString('fr-FR');
};

const generateInvoice = async (booking) => {
  generatingInvoiceId.value = booking.id;
  try {
    await api.post(`/hotel/reception-bookings/${booking.id}/invoice`);
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.message || 'Impossible de générer la facture');
  } finally {
    generatingInvoiceId.value = null;
  }
};

const openPaymentModal = (booking) => {
  const raw = toRaw(booking);
  payingBooking.value = {
    id: raw.id,
    invoice_id: raw.invoice_id,
    guest_name: raw.guest_name,
    reception_hall: raw.reception_hall ? { name: raw.reception_hall.name } : null,
    total_amount: raw.total_amount,
    advance_payment: raw.advance_payment,
    invoice: raw.invoice ? {
      invoice_total_amount: raw.invoice.invoice_total_amount,
      total_paid: raw.invoice.total_paid,
      payment_status: raw.invoice.payment_status,
    } : null,
  };
  paymentError.value = '';
  const total = parseFloat(payingBooking.value.invoice?.invoice_total_amount ?? payingBooking.value.total_amount ?? 0);
  const paid = parseFloat(payingBooking.value.invoice?.total_paid ?? payingBooking.value.advance_payment ?? 0);
  paymentForm.amount = Math.max(0, total - paid);
  paymentForm.payment_method = 'cash';
  paymentForm.payment_date = new Date().toISOString().split('T')[0];
  paymentForm.reference = '';
  showPaymentModal.value = true;
};

const savePayment = async () => {
  if (!payingBooking.value?.invoice_id) {
    paymentError.value = 'Erreur : facture introuvable. Veuillez rafraîchir la page.';
    return;
  }
  savingPayment.value = true;
  paymentError.value = '';
  try {
    await api.post('/payments', {
      invoice_id: payingBooking.value.invoice_id,
      amount: paymentForm.amount,
      payment_date: paymentForm.payment_date,
      payment_method: paymentForm.payment_method,
      reference: paymentForm.reference || null,
    });
    showPaymentModal.value = false;
    await loadAll();
  } catch (e) {
    paymentError.value = e.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    savingPayment.value = false;
  }
};

const loadAll = async () => {
  loading.value = true;
  try {
    const [hallsRes] = await Promise.all([
      api.get('/hotel/reception-halls'),
      loadBookings(1),
    ]);
    halls.value = hallsRes.data.data;
  } catch (e) {
    console.error('Erreur chargement salles de réception:', e);
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  editingHall.value = null;
  Object.assign(form, { name: '', floor: '', capacity: 50, price_per_hour: 0, status: 'available', equipment: '', description: '' });
  formError.value = '';
  showModal.value = true;
};

const editHall = (hall) => {
  editingHall.value = hall;
  Object.assign(form, { name: hall.name, floor: hall.floor || '', capacity: hall.capacity, price_per_hour: hall.price_per_hour, status: hall.status, equipment: hall.equipment || '', description: hall.description || '' });
  formError.value = '';
  selectedHall.value = null;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingHall.value = null;
};

const saveHall = async () => {
  saving.value = true;
  formError.value = '';
  try {
    if (editingHall.value) {
      await api.put(`/hotel/reception-halls/${editingHall.value.id}`, form);
    } else {
      await api.post('/hotel/reception-halls', form);
    }
    closeModal();
    await loadAll();
  } catch (e) {
    formError.value = e.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (hall) => {
  selectedHall.value = null;
  hallToDelete.value = hall;
};

const deleteHall = async () => {
  deleting.value = true;
  try {
    await api.delete(`/hotel/reception-halls/${hallToDelete.value.id}`);
    hallToDelete.value = null;
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur lors de la suppression');
  } finally {
    deleting.value = false;
  }
};

const changeHallStatus = async (hall, newStatus) => {
  try {
    await api.put(`/hotel/reception-halls/${hall.id}`, { status: newStatus });
    selectedHall.value = null;
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur');
  }
};

const toggleMaintenance = async (hall) => {
  await changeHallStatus(hall, hall.status === 'maintenance' ? 'available' : 'maintenance');
};

const openBookingModal = (hall) => {
  bookingForm.hall = hall;
  bookingForm.reception_hall_id = hall.id;
  bookingForm.guest_name = '';
  bookingForm.guest_phone = '';
  bookingForm.booking_date = today;
  bookingForm.start_time = '';
  bookingForm.end_time = '';
  bookingForm.purpose = '';
  bookingForm.advance_payment = 0;
  bookingForm.notes = '';
  bookingError.value = '';
  selectedHall.value = null;
  showBookingModal.value = true;
};

const saveBooking = async () => {
  savingBooking.value = true;
  bookingError.value = '';
  try {
    await api.post('/hotel/reception-bookings', {
      hotel_reception_hall_id: bookingForm.reception_hall_id,
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

const isBookingOverdue = (booking) => {
  if (booking.status !== 'confirmed') { return false; }
  const dateTime = new Date(`${booking.booking_date}T${booking.end_time}`);
  return new Date() > dateTime;
};

const overdueBookings = computed(() => bookings.value.filter((b) => isBookingOverdue(b)));

const showExtendModal = ref(false);
const extendingBooking = ref(null);
const extendForm = reactive({ extra_hours: 1 });
const savingExtend = ref(false);
const extendError = ref('');

const openExtendModal = (booking) => {
  extendingBooking.value = booking;
  extendForm.extra_hours = 1;
  extendError.value = '';
  showExtendModal.value = true;
};

const saveExtend = async () => {
  savingExtend.value = true;
  extendError.value = '';
  try {
    await api.post(`/hotel/reception-bookings/${extendingBooking.value.id}/extend`, {
      extra_hours: extendForm.extra_hours,
    });
    showExtendModal.value = false;
    await loadAll();
  } catch (e) {
    extendError.value = e.response?.data?.message || 'Erreur lors de la prolongation';
  } finally {
    savingExtend.value = false;
  }
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
.reception-card {
  border-width: 2px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.reception-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
