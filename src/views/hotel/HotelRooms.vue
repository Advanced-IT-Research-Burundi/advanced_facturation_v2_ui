<template>
  <div class="hotel-page">
    <HotelHeader modelValue="Rooms" />

    <div class="px-3 pb-4 mt-3">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="mb-0 fw-bold">
          <i class="bi bi-door-closed me-2 text-primary"></i>Chambres
        </h5>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="loadAll">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button class="btn btn-success" @click="openWalkInModal">
            <i class="bi bi-person-walking me-1"></i> Walk-in
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

      <!-- ═══ RÉSERVATIONS ═══════════════════════════════════════════════ -->
      <div class="card mt-4">
        <div class="card-header bg-white py-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0 fw-bold"><i class="bi bi-calendar-check me-2 text-primary"></i>Réservations</h6>
            <button class="btn btn-sm btn-primary" @click="openAddReservationModal">
              <i class="bi bi-plus me-1"></i>Nouvelle réservation
            </button>
          </div>
          <div class="row g-2">
            <div class="col-md-4">
              <input v-model="resSearch" type="text" class="form-control form-control-sm" placeholder="Rechercher par nom, téléphone..." @input="debouncedLoad" />
            </div>
            <div class="col-md-3">
              <select v-model="resFilterStatus" class="form-select form-select-sm" @change="loadReservations">
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmées</option>
                <option value="checked_in">En cours</option>
                <option value="checked_out">Terminées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
            <div class="col-md-3">
              <input v-model="resFilterDate" type="date" class="form-control form-control-sm" @change="loadReservations" />
            </div>
            <div class="col-md-2">
              <button class="btn btn-sm btn-outline-secondary w-100" @click="resetResFilters">
                <i class="bi bi-x-circle me-1"></i>Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <!-- Alerte : réservations dépassées -->
        <div v-if="overdueReservations.length > 0" class="alert alert-danger d-flex align-items-start gap-2 m-3 mb-0">
          <i class="bi bi-alarm-fill fs-5 mt-1"></i>
          <div>
            <strong>{{ overdueReservations.length }} réservation(s) dépassée(s) !</strong>
            <div v-for="r in overdueReservations" :key="r.id" class="small mt-1">
              Chambre <strong>{{ r.room?.room_number }}</strong> — <strong>{{ r.guest_name }}</strong>
              (prévu jusqu'au {{ formatDate(r.check_out_date) }})
              <button class="btn btn-sm btn-warning ms-2 py-0" @click="openExtendModal(r)">
                <i class="bi bi-clock-history me-1"></i>Prolonger
              </button>
            </div>
          </div>
        </div>

        <div v-if="resLoading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Client</th>
                <th>Chambre</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th class="text-center">Nuits</th>
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
                <td>
                  {{ formatDate(reservation.check_out_date) }}
                  <span v-if="isOverdue(reservation)" class="badge bg-danger ms-1 small">
                    <i class="bi bi-alarm-fill"></i> Dépassé
                  </span>
                </td>
                <td class="text-center">{{ reservation.nights }}</td>
                <td>{{ formatCurrency(reservation.total_amount) }}</td>
                <td>{{ formatCurrency(reservation.advance_payment) }}</td>
                <td :class="reservation.balance_due > 0 ? 'text-danger fw-semibold' : 'text-success'">
                  {{ formatCurrency(reservation.balance_due) }}
                </td>
                <td>
                  <span class="badge" :class="getReservationStatusBadgeClass(reservation.status)">
                    {{ getReservationStatusLabel(reservation.status) }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="d-flex gap-1 justify-content-center">
                    <button class="btn btn-sm btn-outline-info" title="Voir détails" @click="detailReservation = reservation">
                      <i class="bi bi-info-circle"></i>
                    </button>
                    <button v-if="reservation.status === 'confirmed'" class="btn btn-sm btn-success" title="Check-in" @click="doCheckIn(reservation)">
                      <i class="bi bi-box-arrow-in-right"></i>
                    </button>
                    <button v-if="reservation.status === 'checked_in'" class="btn btn-sm btn-warning" title="Check-out" @click="openCheckOutModal(reservation)">
                      <i class="bi bi-box-arrow-right"></i>
                    </button>
                    <button v-if="reservation.status === 'checked_in'" class="btn btn-sm btn-outline-warning" title="Prolonger" @click="openExtendModal(reservation)">
                      <i class="bi bi-clock-history"></i>
                    </button>
                    <button v-if="reservation.status === 'checked_in'" class="btn btn-sm btn-outline-primary" title="Room Service" @click="openRoomServiceModal(reservation)">
                      <i class="bi bi-cup-hot"></i>
                    </button>
                    <button v-if="['pending', 'confirmed'].includes(reservation.status)" class="btn btn-sm btn-outline-primary" title="Modifier" @click="editReservation(reservation)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button v-if="['pending', 'confirmed'].includes(reservation.status)" class="btn btn-sm btn-outline-danger" title="Annuler" @click="confirmCancelReservation(reservation)">
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
                    <button
                      v-if="reservation.invoice_id && reservation.balance_due > 0"
                      class="btn btn-sm btn-success"
                      title="Enregistrer le paiement restant"
                      @click="openRecordPaymentModal(reservation)"
                    >
                      <i class="bi bi-cash-coin"></i>
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
        <div v-if="resPagination.last_page > 1" class="card-footer d-flex justify-content-between align-items-center">
          <small class="text-muted">
            Page {{ resPagination.current_page }} / {{ resPagination.last_page }} — {{ resPagination.total }} réservations
          </small>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-secondary" :disabled="resPagination.current_page === 1" @click="changeResPage(resPagination.current_page - 1)">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary" :disabled="resPagination.current_page === resPagination.last_page" @click="changeResPage(resPagination.current_page + 1)">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ MODALS CHAMBRES ══════════════════════════════════════════════ -->

      <!-- MODAL: Chambre Detail -->
      <div v-if="selectedRoom" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="selectedRoom = null">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 500px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0"><i class="bi bi-door-closed me-2"></i>Chambre {{ selectedRoom.room_number }}</h5>
            <button class="btn-close" @click="selectedRoom = null"></button>
          </div>
          <div class="row g-2 mb-3">
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
          <div class="d-flex gap-2 flex-wrap">
            <button v-if="selectedRoom.status === 'available'" class="btn btn-success btn-sm" @click="openWalkInForRoom(selectedRoom)">
              <i class="bi bi-person-walking me-1"></i> Walk-in
            </button>
            <button v-if="selectedRoom.status === 'available'" class="btn btn-outline-success btn-sm" @click="openNewReservationForRoom(selectedRoom)">
              <i class="bi bi-calendar-plus me-1"></i> Réserver
            </button>
            <button class="btn btn-outline-primary btn-sm" @click="editRoom(selectedRoom)">
              <i class="bi bi-pencil me-1"></i> Modifier
            </button>
            <button v-if="selectedRoom.status !== 'occupied'" class="btn btn-outline-secondary btn-sm" @click="toggleMaintenance(selectedRoom)">
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

      <!-- MODAL: Delete Room Confirm -->
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

      <!-- ═══ MODALS RÉSERVATIONS ══════════════════════════════════════════ -->

      <!-- MODAL: Add/Edit Reservation -->
      <div v-if="showResModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showResModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 650px; max-height: 90vh; overflow-y: auto;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">{{ editingReservation ? 'Modifier Réservation' : 'Nouvelle Réservation' }}</h5>
            <button class="btn-close" @click="showResModal = false"></button>
          </div>
          <div v-if="resFormError" class="alert alert-danger py-2">{{ resFormError }}</div>
          <form @submit.prevent="saveReservation">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold">Chambre <span class="text-danger">*</span></label>
                <select v-model="resForm.hotel_room_id" class="form-select" required :disabled="!!editingReservation">
                  <option :value="null">Sélectionner...</option>
                  <option v-for="room in availableRooms" :key="room.id" :value="room.id">
                    {{ room.room_number }} — {{ getRoomTypeLabel(room.type) }} ({{ formatCurrency(room.price_per_night) }}/nuit)
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Nom du client <span class="text-danger">*</span></label>
                <input v-model="resForm.guest_name" type="text" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Téléphone</label>
                <input v-model="resForm.guest_phone" type="text" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Email</label>
                <input v-model="resForm.guest_email" type="email" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Type de pièce d'identité</label>
                <select v-model="resForm.guest_id_type" class="form-select">
                  <option value="cni">CNI</option>
                  <option value="passport">Passeport</option>
                </select>
              </div>
              <div class="col-md-8">
                <label class="form-label small fw-bold">N° {{ resForm.guest_id_type === 'passport' ? 'Passeport' : 'CNI' }}</label>
                <input v-model="resForm.guest_id_number" type="text" class="form-control" placeholder="Ex: BU12345678" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Lieu de naissance</label>
                <input v-model="resForm.guest_birthplace" type="text" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Date de naissance</label>
                <input v-model="resForm.guest_birthdate" type="date" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Adresse de résidence</label>
                <input v-model="resForm.guest_address" type="text" class="form-control" />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Check-in <span class="text-danger">*</span></label>
                <input v-model="resForm.check_in_date" type="date" class="form-control" required :min="today" />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Check-out <span class="text-danger">*</span></label>
                <input v-model="resForm.check_out_date" type="date" class="form-control" required :min="resForm.check_in_date" />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Nuits</label>
                <input :value="resFormNights" type="number" class="form-control bg-light" readonly />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Montant total</label>
                <input :value="resFormTotalAmount" type="text" class="form-control bg-light" readonly />
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Avance</label>
                <input v-model.number="resForm.advance_payment" type="number" class="form-control" min="0" step="0.01" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Notes</label>
                <textarea v-model="resForm.notes" class="form-control" rows="2"></textarea>
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-3">
              <button type="button" class="btn btn-secondary" @click="showResModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="savingRes">
                <span v-if="savingRes" class="spinner-border spinner-border-sm me-1"></span>
                {{ savingRes ? 'Enregistrement...' : (editingReservation ? 'Mettre à jour' : 'Confirmer') }}
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
            <input v-model.number="checkOutPayment" type="number" class="form-control" min="0" step="0.01" />
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

      <!-- MODAL: Détail réservation chambre -->
      <div v-if="detailReservation" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="detailReservation = null">
        <div class="bg-white rounded shadow-lg p-4" style="max-width: 600px; width: 95%; max-height: 90vh; overflow-y: auto;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0"><i class="bi bi-door-closed me-2 text-primary"></i>Détail de la réservation</h5>
            <button class="btn-close" @click="detailReservation = null"></button>
          </div>
          <div class="row g-3">
            <div class="col-12">
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge fs-6" :class="getReservationStatusBadgeClass(detailReservation.status)">{{ getReservationStatusLabel(detailReservation.status) }}</span>
                <span class="badge bg-dark">Chambre {{ detailReservation.room?.room_number }}</span>
                <span class="text-muted small">{{ getRoomTypeLabel(detailReservation.room?.type) }}</span>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card border-0 bg-light h-100">
                <div class="card-body py-2 px-3">
                  <div class="small text-muted fw-semibold mb-2"><i class="bi bi-person me-1"></i>Informations client</div>
                  <div class="mb-1"><span class="text-muted small">Nom :</span> <strong>{{ detailReservation.guest_name }}</strong></div>
                  <div class="mb-1" v-if="detailReservation.guest_phone"><span class="text-muted small">Téléphone :</span> {{ detailReservation.guest_phone }}</div>
                  <div class="mb-1" v-if="detailReservation.guest_email"><span class="text-muted small">Email :</span> {{ detailReservation.guest_email }}</div>
                  <div class="mb-1" v-if="detailReservation.guest_id_type"><span class="text-muted small">Pièce d'identité :</span> {{ detailReservation.guest_id_type === 'cni' ? 'CNI' : 'Passeport' }} — {{ detailReservation.guest_id_number }}</div>
                  <div class="mb-1" v-if="detailReservation.guest_birthdate"><span class="text-muted small">Date naissance :</span> {{ formatDate(detailReservation.guest_birthdate) }}</div>
                  <div class="mb-1" v-if="detailReservation.guest_birthplace"><span class="text-muted small">Lieu naissance :</span> {{ detailReservation.guest_birthplace }}</div>
                  <div class="mb-1" v-if="detailReservation.guest_address"><span class="text-muted small">Adresse :</span> {{ detailReservation.guest_address }}</div>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card border-0 bg-light h-100">
                <div class="card-body py-2 px-3">
                  <div class="small text-muted fw-semibold mb-2"><i class="bi bi-calendar me-1"></i>Séjour</div>
                  <div class="mb-1"><span class="text-muted small">Check-in :</span> <strong>{{ formatDate(detailReservation.check_in_date) }}</strong></div>
                  <div class="mb-1"><span class="text-muted small">Check-out :</span> <strong>{{ formatDate(detailReservation.check_out_date) }}</strong></div>
                  <div class="mb-1"><span class="text-muted small">Nuits :</span> {{ detailReservation.nights }}</div>
                  <hr class="my-2" />
                  <div class="small text-muted fw-semibold mb-2"><i class="bi bi-cash me-1"></i>Finances</div>
                  <div class="mb-1"><span class="text-muted small">Total :</span> <strong class="text-primary">{{ formatCurrency(detailReservation.total_amount) }}</strong></div>
                  <div class="mb-1"><span class="text-muted small">Avance :</span> {{ formatCurrency(detailReservation.advance_payment) }}</div>
                  <div class="mb-1"><span class="text-muted small">Reste :</span> <span :class="detailReservation.balance_due > 0 ? 'text-danger fw-semibold' : 'text-success'">{{ formatCurrency(detailReservation.balance_due) }}</span></div>
                </div>
              </div>
            </div>
            <div class="col-12" v-if="detailReservation.notes">
              <div class="card border-0 bg-light">
                <div class="card-body py-2 px-3">
                  <div class="small text-muted fw-semibold mb-1"><i class="bi bi-chat-left-text me-1"></i>Notes</div>
                  <div>{{ detailReservation.notes }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-end mt-3">
            <button class="btn btn-secondary" @click="detailReservation = null">Fermer</button>
          </div>
        </div>
      </div>

      <!-- MODAL: Enregistrer paiement restant -->
      <div v-if="paymentModal" class="modal-overlay d-flex justify-content-center align-items-center">
        <div class="bg-white rounded shadow-lg p-4" style="max-width: 420px; width: 90%;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0"><i class="bi bi-cash-coin me-2 text-success"></i>Enregistrer le paiement restant</h5>
            <button class="btn-close" @click="paymentModal = null"></button>
          </div>
          <p class="mb-2">Client: <strong>{{ paymentModal.guest_name }}</strong> — Chambre {{ paymentModal.room?.room_number }}</p>
          <p class="mb-3 text-muted small">Reste à payer: <strong class="text-danger">{{ formatCurrency(paymentModal.balance_due) }}</strong></p>
          <div class="mb-3">
            <label class="form-label small fw-bold">Montant <span class="text-danger">*</span></label>
            <input v-model.number="paymentAmount" type="number" class="form-control" min="0.01" step="0.01" />
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">Mode de paiement <span class="text-danger">*</span></label>
            <select v-model="paymentMethod" class="form-select">
              <option value="cash">Espèces</option>
              <option value="bank_transfer">Virement</option>
              <option value="mobile_money">Mobile money</option>
              <option value="check">Chèque</option>
              <option value="card">Carte</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">Date du paiement</label>
            <input v-model="paymentDate" type="date" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">Référence</label>
            <input v-model="paymentReference" type="text" class="form-control" placeholder="Optionnel" />
          </div>
          <div v-if="paymentError" class="alert alert-danger py-2 small mb-3">{{ paymentError }}</div>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="paymentModal = null">Annuler</button>
            <button class="btn btn-success" @click="submitRecordPayment" :disabled="savingPayment || !paymentAmount || paymentAmount <= 0">
              <span v-if="savingPayment" class="spinner-border spinner-border-sm me-1"></span>
              Enregistrer le paiement
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: Prolongation -->
      <div v-if="showExtendModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showExtendModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 420px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0 fw-bold"><i class="bi bi-clock-history me-2 text-warning"></i>Prolonger le séjour</h5>
            <button class="btn-close" @click="showExtendModal = false"></button>
          </div>
          <div v-if="extendingReservation" class="alert alert-info py-2 small mb-3">
            <strong>{{ extendingReservation.guest_name }}</strong> — Chambre {{ extendingReservation.room?.room_number }}<br>
            Départ prévu : {{ formatDate(extendingReservation.check_out_date) }}<br>
            Prix/nuit : <strong>{{ formatCurrency(extendingReservation.price_per_night) }}</strong>
          </div>
          <div v-if="extendError" class="alert alert-danger py-2 small">{{ extendError }}</div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Nuits supplémentaires <span class="text-danger">*</span></label>
            <input v-model.number="extendForm.extra_nights" type="number" class="form-control" min="1" />
            <div class="form-text" v-if="extendingReservation && extendForm.extra_nights > 0">
              Montant supplémentaire :
              <strong class="text-primary">{{ formatCurrency(extendingReservation.price_per_night * extendForm.extra_nights) }}</strong>
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

      <!-- MODAL: Room Service -->
      <div v-if="roomServiceModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="roomServiceModal = null">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 620px; max-height: 90vh; overflow-y: auto;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">
              <i class="bi bi-cup-hot me-2 text-warning"></i>Room Service —
              Chambre {{ roomServiceModal.room?.room_number }}
              <span class="small text-muted">({{ roomServiceModal.guest_name }})</span>
            </h5>
            <button class="btn-close" @click="roomServiceModal = null"></button>
          </div>
          <div v-if="roomServiceError" class="alert alert-danger py-2">{{ roomServiceError }}</div>
          <div class="mb-3">
            <label class="form-label small fw-bold">Ajouter un article</label>
            <div class="row g-2 mb-2">
              <div class="col-3">
                <select v-model="rsNewItem.type" class="form-select form-select-sm">
                  <option value="menu">Bar</option>
                  <option value="dish">Cuisine</option>
                </select>
              </div>
              <div class="col-5">
                <select v-if="rsNewItem.type === 'menu'" v-model="rsNewItem.menu_item_id" class="form-select form-select-sm">
                  <option value="">— Article bar —</option>
                  <option v-for="m in rsMenuItems.filter(i => i.available)" :key="m.id" :value="m.id">
                    {{ m.name }} ({{ formatCurrency(m.price) }})
                  </option>
                </select>
                <select v-else v-model="rsNewItem.dish_id" class="form-select form-select-sm">
                  <option value="">— Plat cuisine —</option>
                  <option v-for="d in rsDishes.filter(d => d.available)" :key="d.id" :value="d.id">
                    {{ d.name }} ({{ formatCurrency(d.price) }})
                  </option>
                </select>
              </div>
              <div class="col-2">
                <input v-model.number="rsNewItem.qty" type="number" class="form-control form-select-sm" min="1" />
              </div>
              <div class="col-2">
                <button type="button" class="btn btn-sm btn-primary w-100" @click="rsAddItem">
                  <i class="bi bi-plus"></i>
                </button>
              </div>
            </div>
            <div class="list-group">
              <div v-for="(item, idx) in rsOrderItems" :key="idx" class="list-group-item py-2 d-flex justify-content-between align-items-center">
                <span>
                  <span class="badge me-1" :class="item.type === 'dish' ? 'bg-danger' : 'bg-primary'">{{ item.type === 'dish' ? 'Cuisine' : 'Bar' }}</span>
                  {{ item.name }} × {{ item.qty }}
                </span>
                <div class="d-flex align-items-center gap-2">
                  <span class="fw-semibold text-primary">{{ formatCurrency(item.price * item.qty) }}</span>
                  <button type="button" class="btn btn-sm btn-outline-danger" @click="rsOrderItems.splice(idx, 1)">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>
              <div v-if="rsOrderItems.length === 0" class="list-group-item text-muted text-center py-3">
                Aucun article ajouté
              </div>
            </div>
            <div v-if="rsOrderItems.length > 0" class="text-end mt-2 fw-bold">
              Total : {{ formatCurrency(rsOrderItems.reduce((s, i) => s + i.price * i.qty, 0)) }}
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">Notes</label>
            <input v-model="rsNotes" type="text" class="form-control" placeholder="Demandes spéciales..." />
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="roomServiceModal = null">Annuler</button>
            <button class="btn btn-warning" @click="submitRoomServiceOrder" :disabled="rsOrderItems.length === 0 || rsSaving">
              <span v-if="rsSaving" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-send me-1"></i>
              Envoyer la commande
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: Cancel Reservation Confirm -->
      <div v-if="reservationToCancel" class="modal-overlay d-flex justify-content-center align-items-center">
        <div class="bg-white rounded shadow-lg p-4" style="max-width: 380px; width: 90%;">
          <h5 class="mb-3">Annuler la réservation ?</h5>
          <p>Client: <strong>{{ reservationToCancel.guest_name }}</strong></p>
          <p>Chambre: <strong>{{ reservationToCancel.room?.room_number }}</strong></p>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="reservationToCancel = null">Non</button>
            <button class="btn btn-danger" @click="doCancelReservation" :disabled="cancellingRes">
              <span v-if="cancellingRes" class="spinner-border spinner-border-sm me-1"></span>
              Annuler la réservation
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ MODAL: WALK-IN (Entrée directe) ════════════════════════════════ -->
      <div v-if="showWalkInModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showWalkInModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 95%; max-width: 800px; max-height: 90vh; overflow-y: auto;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">
              <i class="bi bi-person-walking me-2 text-success"></i>Walk-in — Entrée directe
            </h5>
            <button class="btn-close" @click="showWalkInModal = false"></button>
          </div>
          <div class="alert alert-info py-2 small mb-3">
            <i class="bi bi-info-circle me-1"></i>
            Enregistrez un ou plusieurs clients directement sans réservation préalable. Le check-in est immédiat.
          </div>
          <div v-if="walkInError" class="alert alert-danger py-2">{{ walkInError }}</div>

          <div v-for="(guest, idx) in walkInGuests" :key="idx" class="card mb-3" :class="{ 'border-success': walkInGuests.length > 1 }">
            <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
              <span class="fw-semibold small">
                <i class="bi bi-person-fill me-1"></i>
                Client {{ walkInGuests.length > 1 ? `#${idx + 1}` : '' }}
              </span>
              <button v-if="walkInGuests.length > 1" type="button" class="btn btn-sm btn-outline-danger py-0" @click="walkInGuests.splice(idx, 1)">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Chambre <span class="text-danger">*</span></label>
                  <select v-model="guest.hotel_room_id" class="form-select" required>
                    <option :value="null">Sélectionner une chambre...</option>
                    <option
                      v-for="room in walkInAvailableRooms(idx)"
                      :key="room.id"
                      :value="room.id"
                    >
                      N°{{ room.room_number }} — {{ getRoomTypeLabel(room.type) }} ({{ formatCurrency(room.price_per_night) }}/nuit)
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Nom complet <span class="text-danger">*</span></label>
                  <input v-model="guest.guest_name" type="text" class="form-control" required placeholder="Nom du client" />
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-bold">Téléphone</label>
                  <input v-model="guest.guest_phone" type="text" class="form-control" placeholder="+257..." />
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-bold">Type pièce ID</label>
                  <select v-model="guest.guest_id_type" class="form-select">
                    <option value="cni">CNI</option>
                    <option value="passport">Passeport</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label small fw-bold">N° {{ guest.guest_id_type === 'passport' ? 'Passeport' : 'CNI' }}</label>
                  <input v-model="guest.guest_id_number" type="text" class="form-control" />
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-bold">Nuits <span class="text-danger">*</span></label>
                  <input v-model.number="guest.nights" type="number" class="form-control" min="1" required />
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-bold">Départ prévu</label>
                  <input :value="walkInCheckOutDate(guest.nights)" type="text" class="form-control bg-light" readonly />
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-bold">Total</label>
                  <input :value="walkInTotal(guest)" type="text" class="form-control bg-light fw-semibold text-primary" readonly />
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-bold">Avance</label>
                  <input v-model.number="guest.advance_payment" type="number" class="form-control" min="0" step="0.01" />
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold">Notes</label>
                  <input v-model="guest.notes" type="text" class="form-control" placeholder="Optionnel..." />
                </div>
              </div>
            </div>
          </div>

          <button type="button" class="btn btn-outline-success btn-sm mb-3" @click="addWalkInGuest">
            <i class="bi bi-plus-lg me-1"></i> Ajouter un autre client
          </button>

          <div class="d-flex justify-content-between align-items-center border-top pt-3">
            <div class="small text-muted" v-if="walkInGuests.length > 1">
              <i class="bi bi-people-fill me-1"></i> {{ walkInGuests.length }} clients
            </div>
            <div class="d-flex gap-2 ms-auto">
              <button type="button" class="btn btn-secondary" @click="showWalkInModal = false">Annuler</button>
              <button type="button" class="btn btn-success" @click="submitWalkIn" :disabled="savingWalkIn || !isWalkInValid">
                <span v-if="savingWalkIn" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="bi bi-check-lg me-1"></i>
                {{ savingWalkIn ? 'Enregistrement...' : 'Check-in immédiat' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast notifications -->
      <Teleport to="body">
        <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 99999;">
          <TransitionGroup name="toast-fade">
            <div
              v-for="toast in toasts"
              :key="toast.id"
              class="toast show align-items-center border-0 mb-2"
              :class="{
                'text-bg-success': toast.type === 'success',
                'text-bg-danger': toast.type === 'error',
                'text-bg-warning': toast.type === 'warning',
                'text-bg-info': toast.type === 'info',
              }"
              role="alert"
            >
              <div class="d-flex">
                <div class="toast-body">
                  <i class="bi me-1" :class="{
                    'bi-check-circle-fill': toast.type === 'success',
                    'bi-x-circle-fill': toast.type === 'error',
                    'bi-exclamation-triangle-fill': toast.type === 'warning',
                    'bi-info-circle-fill': toast.type === 'info',
                  }"></i>
                  {{ toast.message }}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="removeToast(toast.id)"></button>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, TransitionGroup, Teleport } from 'vue';
import api from '@/services/api';
import HotelHeader from './HotelHeader.vue';

const today = new Date().toISOString().split('T')[0];

// ─── Chambres ────────────────────────────────────────────────────────────────

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

const roomForm = reactive({
  room_number: '', name: '', type: 'standard', floor: '', capacity: 1, price_per_night: 0, description: '',
});

const statusFilters = [
  { value: 'all', label: 'Toutes', activeClass: 'btn-dark' },
  { value: 'available', label: 'Disponibles', activeClass: 'btn-success' },
  { value: 'occupied', label: 'Occupées', activeClass: 'btn-danger' },
  { value: 'reserved', label: 'Réservées', activeClass: 'btn-warning' },
  { value: 'maintenance', label: 'Maintenance', activeClass: 'btn-secondary' },
];

const filteredRooms = computed(() => {
  if (filterStatus.value === 'all') { return rooms.value; }
  return rooms.value.filter(r => r.status === filterStatus.value);
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

const selectRoom = (room) => { selectedRoom.value = room; };

const openAddRoomModal = () => {
  editingRoom.value = null;
  Object.assign(roomForm, { room_number: '', name: '', type: 'standard', floor: '', capacity: 1, price_per_night: 0, description: '' });
  formError.value = '';
  showRoomModal.value = true;
};

const editRoom = (room) => {
  editingRoom.value = room;
  Object.assign(roomForm, { room_number: room.room_number, name: room.name || '', type: room.type, floor: room.floor || '', capacity: room.capacity, price_per_night: room.price_per_night, description: room.description || '' });
  formError.value = '';
  selectedRoom.value = null;
  showRoomModal.value = true;
};

const closeRoomModal = () => { showRoomModal.value = false; editingRoom.value = null; };

const saveRoom = async () => {
  savingRoom.value = true;
  formError.value = '';
  try {
    if (editingRoom.value) {
      await api.put(`/hotel/rooms/${editingRoom.value.id}`, roomForm);
      showToast('Chambre mise à jour', 'success');
    } else {
      await api.post('/hotel/rooms', roomForm);
      showToast('Chambre créée avec succès', 'success');
    }
    closeRoomModal();
    await loadAll();
  } catch (e) {
    formError.value = e.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    savingRoom.value = false;
  }
};

const confirmDeleteRoom = (room) => { selectedRoom.value = null; roomToDelete.value = room; };

const deleteRoom = async () => {
  deletingRoom.value = true;
  try {
    await api.delete(`/hotel/rooms/${roomToDelete.value.id}`);
    roomToDelete.value = null;
    await loadAll();
    showToast('Chambre supprimée avec succès', 'success');
  } catch (e) {
    showToast(e.response?.data?.message || 'Erreur lors de la suppression', 'error');
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
    showToast(newStatus === 'maintenance' ? 'Chambre mise en maintenance' : 'Chambre remise en service', 'success');
  } catch (e) {
    showToast(e.response?.data?.message || 'Erreur', 'error');
  }
};

// ─── Réservations ────────────────────────────────────────────────────────────

const resLoading = ref(false);
const reservations = ref([]);
const allRooms = ref([]);
const customers = ref([]);
const generatingInvoiceId = ref(null);
const paymentModal = ref(null);
const detailReservation = ref(null);
const paymentAmount = ref(0);
const paymentMethod = ref('cash');
const paymentDate = ref('');
const paymentReference = ref('');
const paymentError = ref('');
const savingPayment = ref(false);
const resPagination = ref({ current_page: 1, last_page: 1, total: 0 });
const resSearch = ref('');
const resFilterStatus = ref('');
const resFilterDate = ref('');

const showResModal = ref(false);
const editingReservation = ref(null);
const savingRes = ref(false);
const resFormError = ref('');

const checkOutModal = ref(null);
const checkOutPayment = ref(0);
const checkingOut = ref(false);

const reservationToCancel = ref(null);
const cancellingRes = ref(false);

const showExtendModal = ref(false);
const extendingReservation = ref(null);
const extendForm = reactive({ extra_nights: 1 });
const savingExtend = ref(false);
const extendError = ref('');

let debounceTimer = null;

const resForm = reactive({
  hotel_room_id: null,
  guest_name: '', guest_phone: '', guest_email: '',
  guest_id_number: '', guest_id_type: 'cni',
  guest_address: '', guest_birthplace: '', guest_birthdate: '',
  customer_id: null,
  check_in_date: today, check_out_date: '',
  advance_payment: 0, notes: '',
});

const availableRooms = computed(() => rooms.value.filter(r => r.status === 'available'));

const resFormNights = computed(() => {
  if (!resForm.check_in_date || !resForm.check_out_date) { return 0; }
  const diff = new Date(resForm.check_out_date) - new Date(resForm.check_in_date);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
});

const resFormTotalAmount = computed(() => {
  const room = rooms.value.find((r) => r.id === resForm.hotel_room_id);
  const nights = resFormNights.value;
  if (!room || nights <= 0) return '—';
  const total = parseFloat(room.price_per_night ?? 0) * nights;
  return formatCurrency(total);
});

const loadReservations = async (page = 1) => {
  resLoading.value = true;
  try {
    const params = { page };
    if (resSearch.value) { params.search = resSearch.value; }
    if (resFilterStatus.value) { params.status = resFilterStatus.value; }
    if (resFilterDate.value) { params.date = resFilterDate.value; }
    const res = await api.get('/hotel/reservations', { params });
    reservations.value = res.data.data.data;
    const meta = res.data.data;
    resPagination.value = { current_page: meta.current_page, last_page: meta.last_page, total: meta.total };
  } catch (e) {
    console.error('Erreur chargement réservations:', e);
  } finally {
    resLoading.value = false;
  }
};

const debouncedLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadReservations(), 500);
};

const resetResFilters = () => {
  resSearch.value = '';
  resFilterStatus.value = '';
  resFilterDate.value = '';
  loadReservations();
};

const changeResPage = (page) => { loadReservations(page); };

const loadCustomers = async () => {
  try {
    const res = await api.get('/customers', { params: { per_page: 500 } });
    customers.value = res.data?.data?.data ?? res.data?.data ?? [];
  } catch (e) {
    console.error('Erreur chargement clients:', e);
  }
};

const openAddReservationModal = () => {
  editingReservation.value = null;
  Object.assign(resForm, {
    hotel_room_id: null, guest_name: '', guest_phone: '', guest_email: '',
    guest_id_number: '', guest_id_type: 'cni', guest_address: '', guest_birthplace: '', guest_birthdate: '',
    customer_id: null, check_in_date: today, check_out_date: '', advance_payment: 0, notes: '',
  });
  resFormError.value = '';
  showResModal.value = true;
};

const openNewReservationForRoom = (room) => {
  selectedRoom.value = null;
  editingReservation.value = null;
  Object.assign(resForm, {
    hotel_room_id: room.id, guest_name: '', guest_phone: '', guest_email: '',
    guest_id_number: '', guest_id_type: 'cni', guest_address: '', guest_birthplace: '', guest_birthdate: '',
    customer_id: null, check_in_date: today, check_out_date: '', advance_payment: 0, notes: '',
  });
  resFormError.value = '';
  showResModal.value = true;
};

const editReservation = (reservation) => {
  editingReservation.value = reservation;
  Object.assign(resForm, {
    hotel_room_id: reservation.hotel_room_id,
    guest_name: reservation.guest_name,
    guest_phone: reservation.guest_phone || '',
    guest_email: reservation.guest_email || '',
    guest_id_number: reservation.guest_id_number || '',
    guest_id_type: reservation.guest_id_type || 'cni',
    guest_address: reservation.guest_address || '',
    guest_birthplace: reservation.guest_birthplace || '',
    guest_birthdate: reservation.guest_birthdate || '',
    customer_id: null,
    check_in_date: reservation.check_in_date,
    check_out_date: reservation.check_out_date,
    advance_payment: reservation.advance_payment,
    notes: reservation.notes || '',
  });
  resFormError.value = '';
  showResModal.value = true;
};

const saveReservation = async () => {
  savingRes.value = true;
  resFormError.value = '';
  try {
    if (editingReservation.value) {
      await api.put(`/hotel/reservations/${editingReservation.value.id}`, { ...resForm });
    } else {
      await api.post('/hotel/reservations', { ...resForm });
      if (resForm.advance_payment > 0) {
        const room = rooms.value.find((r) => r.id === resForm.hotel_room_id);
        const roomNum = room?.room_number ?? '?';
        await registerPaymentInCaisse(
          resForm.advance_payment,
          `Avance chambre N°${roomNum} — ${resForm.guest_name}`,
          `CHAMBRE N°${roomNum}`,
        );
      }
    }
    showResModal.value = false;
    showToast(editingReservation.value ? 'Réservation mise à jour' : 'Réservation créée avec succès', 'success');
    await Promise.all([loadAll(), loadReservations()]);
  } catch (e) {
    resFormError.value = e.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    savingRes.value = false;
  }
};

const generateInvoice = async (reservation) => {
  generatingInvoiceId.value = reservation.id;
  try {
    await api.post(`/hotel/reservations/${reservation.id}/invoice`);
    await loadReservations();
    showToast('Facture générée avec succès', 'success');
  } catch (e) {
    showToast(e.response?.data?.message || 'Impossible de générer la facture', 'error');
  } finally {
    generatingInvoiceId.value = null;
  }
};

const doCheckIn = async (reservation) => {
  try {
    await api.post(`/hotel/reservations/${reservation.id}/check-in`);
    await Promise.all([loadAll(), loadReservations()]);
    showToast('Check-in effectué avec succès', 'success');
  } catch (e) {
    showToast(e.response?.data?.message || 'Erreur check-in', 'error');
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
    await Promise.all([loadAll(), loadReservations()]);
    showToast('Check-out effectué avec succès', 'success');
  } catch (e) {
    showToast(e.response?.data?.message || 'Erreur check-out', 'error');
  } finally {
    checkingOut.value = false;
  }
};

const openRecordPaymentModal = (reservation) => {
  paymentModal.value = reservation;
  paymentAmount.value = parseFloat(reservation.balance_due) || 0;
  paymentMethod.value = 'cash';
  const d = new Date();
  paymentDate.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  paymentReference.value = '';
  paymentError.value = '';
};

const registerPaymentInCaisse = async (amount, description, reference) => {
  try {
    const res = await api.get('/hotel/caisse/current', { params: { hotel_section: 'rooms' } });
    const register = res.data?.data?.register;
    if (register?.id) {
      await api.post(`/hotel/caisse/${register.id}/movements`, {
        type: 'income',
        amount,
        description,
        reference,
      });
    }
  } catch {
    // Pas de caisse ouverte — on ignore
  }
};

const submitRecordPayment = async () => {
  if (!paymentModal.value || !paymentAmount.value || paymentAmount.value <= 0) return;
  savingPayment.value = true;
  paymentError.value = '';
  try {
    await api.post('/payments', {
      invoice_id: paymentModal.value.invoice_id,
      amount: paymentAmount.value,
      payment_date: paymentDate.value,
      payment_method: paymentMethod.value,
      reference: paymentReference.value || undefined,
    });
    const roomNum = paymentModal.value.room?.room_number ?? '';
    await registerPaymentInCaisse(
      paymentAmount.value,
      `Paiement chambre N°${roomNum} — ${paymentModal.value.guest_name ?? ''}`.trim(),
      `CHAMBRE N°${roomNum}`,
    );
    paymentModal.value = null;
    showToast('Paiement enregistré avec succès', 'success');
    await loadReservations();
  } catch (e) {
    paymentError.value = e.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement';
  } finally {
    savingPayment.value = false;
  }
};

const confirmCancelReservation = (reservation) => { reservationToCancel.value = reservation; };

const doCancelReservation = async () => {
  cancellingRes.value = true;
  try {
    await api.post(`/hotel/reservations/${reservationToCancel.value.id}/cancel`);
    reservationToCancel.value = null;
    await Promise.all([loadAll(), loadReservations()]);
    showToast('Réservation annulée', 'success');
  } catch (e) {
    showToast(e.response?.data?.message || 'Erreur annulation', 'error');
  } finally {
    cancellingRes.value = false;
  }
};

const isOverdue = (reservation) => {
  if (!['confirmed', 'checked_in'].includes(reservation.status)) { return false; }
  const checkOut = new Date(reservation.check_out_date);
  checkOut.setHours(23, 59, 59);
  return new Date() > checkOut;
};

const overdueReservations = computed(() => reservations.value.filter((r) => isOverdue(r)));

const openExtendModal = (reservation) => {
  extendingReservation.value = reservation;
  extendForm.extra_nights = 1;
  extendError.value = '';
  showExtendModal.value = true;
};

const saveExtend = async () => {
  savingExtend.value = true;
  extendError.value = '';
  try {
    await api.post(`/hotel/reservations/${extendingReservation.value.id}/extend`, {
      extra_nights: extendForm.extra_nights,
    });
    showExtendModal.value = false;
    showToast('Séjour prolongé avec succès', 'success');
    await loadReservations();
  } catch (e) {
    extendError.value = e.response?.data?.message || 'Erreur lors de la prolongation';
  } finally {
    savingExtend.value = false;
  }
};

// ─── Room Service ────────────────────────────────────────────────────────────

const roomServiceModal = ref(null);
const rsMenuItems = ref([]);
const rsDishes = ref([]);
const rsOrderItems = ref([]);
const rsNewItem = reactive({ type: 'menu', menu_item_id: '', dish_id: '', qty: 1 });
const rsNotes = ref('');
const rsSaving = ref(false);
const roomServiceError = ref('');

const openRoomServiceModal = async (reservation) => {
  roomServiceModal.value = reservation;
  rsOrderItems.value = [];
  rsNotes.value = '';
  roomServiceError.value = '';
  rsNewItem.type = 'menu';
  rsNewItem.menu_item_id = '';
  rsNewItem.dish_id = '';
  rsNewItem.qty = 1;
  if (rsMenuItems.value.length === 0 || rsDishes.value.length === 0) {
    const [menuRes, dishRes] = await Promise.all([
      api.get('/hotel/menu-items'),
      api.get('/hotel/dishes'),
    ]);
    rsMenuItems.value = menuRes.data.data;
    rsDishes.value = dishRes.data.data;
  }
};

const rsAddItem = () => {
  if (rsNewItem.type === 'dish') {
    const dish = rsDishes.value.find((d) => d.id === rsNewItem.dish_id);
    if (!dish) { return; }
    const existing = rsOrderItems.value.find((i) => i.type === 'dish' && i.dish_id === rsNewItem.dish_id);
    if (existing) { existing.qty += rsNewItem.qty; } else {
      rsOrderItems.value.push({ type: 'dish', dish_id: dish.id, name: dish.name, price: dish.price, qty: rsNewItem.qty });
    }
    rsNewItem.dish_id = '';
  } else {
    const menu = rsMenuItems.value.find((m) => m.id === rsNewItem.menu_item_id);
    if (!menu) { return; }
    const existing = rsOrderItems.value.find((i) => i.type !== 'dish' && i.menu_item_id === rsNewItem.menu_item_id);
    if (existing) { existing.qty += rsNewItem.qty; } else {
      rsOrderItems.value.push({ type: 'menu', menu_item_id: menu.id, name: menu.name, price: menu.price, qty: rsNewItem.qty });
    }
    rsNewItem.menu_item_id = '';
  }
  rsNewItem.qty = 1;
};

const submitRoomServiceOrder = async () => {
  rsSaving.value = true;
  roomServiceError.value = '';
  try {
    const reservation = roomServiceModal.value;
    await api.post('/hotel/restaurant-orders', {
      room_number: reservation.room?.room_number ?? String(reservation.id),
      client_name: reservation.guest_name,
      notes: rsNotes.value || null,
      items: rsOrderItems.value.map((i) =>
        i.type === 'dish'
          ? { hotel_dish_id: i.dish_id, qty: i.qty }
          : { hotel_menu_item_id: i.menu_item_id, qty: i.qty },
      ),
    });
    roomServiceModal.value = null;
  } catch (e) {
    roomServiceError.value = e.response?.data?.message || 'Erreur lors de l\'envoi';
  } finally {
    rsSaving.value = false;
  }
};

// ─── Walk-in (Entrée directe) ────────────────────────────────────────────────

const showWalkInModal = ref(false);
const savingWalkIn = ref(false);
const walkInError = ref('');

const createEmptyWalkInGuest = (roomId = null) => ({
  hotel_room_id: roomId,
  guest_name: '',
  guest_phone: '',
  guest_id_number: '',
  guest_id_type: 'cni',
  nights: 1,
  advance_payment: 0,
  notes: '',
});

const walkInGuests = ref([createEmptyWalkInGuest()]);

const walkInAvailableRooms = (currentIdx) => {
  const selectedIds = walkInGuests.value
    .filter((_, i) => i !== currentIdx)
    .map((g) => g.hotel_room_id)
    .filter(Boolean);
  return rooms.value.filter(
    (r) => r.status === 'available' && !selectedIds.includes(r.id),
  );
};

const walkInCheckOutDate = (nights) => {
  if (!nights || nights < 1) { return '—'; }
  const d = new Date();
  d.setDate(d.getDate() + nights);
  return d.toLocaleDateString('fr-FR');
};

const walkInTotal = (guest) => {
  const room = rooms.value.find((r) => r.id === guest.hotel_room_id);
  if (!room || !guest.nights || guest.nights < 1) { return '—'; }
  return formatCurrency(parseFloat(room.price_per_night ?? 0) * guest.nights);
};

const isWalkInValid = computed(() =>
  walkInGuests.value.every((g) => g.hotel_room_id && g.guest_name?.trim() && g.nights >= 1),
);

const openWalkInModal = () => {
  walkInGuests.value = [createEmptyWalkInGuest()];
  walkInError.value = '';
  showWalkInModal.value = true;
};

const openWalkInForRoom = (room) => {
  selectedRoom.value = null;
  walkInGuests.value = [createEmptyWalkInGuest(room.id)];
  walkInError.value = '';
  showWalkInModal.value = true;
};

const addWalkInGuest = () => {
  walkInGuests.value.push(createEmptyWalkInGuest());
};

const submitWalkIn = async () => {
  savingWalkIn.value = true;
  walkInError.value = '';
  try {
    const res = await api.post('/hotel/reservations/walk-in', {
      guests: walkInGuests.value,
    });
    showWalkInModal.value = false;
    showToast(res.data.message || 'Walk-in effectué avec succès', 'success');

    for (const guest of walkInGuests.value) {
      if (guest.advance_payment > 0) {
        const room = rooms.value.find((r) => r.id === guest.hotel_room_id);
        const roomNum = room?.room_number ?? '?';
        await registerPaymentInCaisse(
          guest.advance_payment,
          `Walk-in chambre N°${roomNum} — ${guest.guest_name}`,
          `CHAMBRE N°${roomNum}`,
        );
      }
    }

    await Promise.all([loadAll(), loadReservations()]);
  } catch (e) {
    walkInError.value = e.response?.data?.message || 'Erreur lors du walk-in';
  } finally {
    savingWalkIn.value = false;
  }
};

// ─── Toast notifications ─────────────────────────────────────────────────────

const toasts = ref([]);
let toastIdCounter = 0;

const showToast = (message, type = 'success', duration = 4000) => {
  const id = ++toastIdCounter;
  toasts.value.push({ id, message, type });
  setTimeout(() => removeToast(id), duration);
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getRoomCardClass = (room) => {
  const classes = { available: 'border-success', occupied: 'border-danger bg-danger bg-opacity-10', reserved: 'border-warning bg-warning bg-opacity-10', maintenance: 'border-secondary bg-secondary bg-opacity-10' };
  return classes[room.status] || '';
};
const getRoomBadgeClass = (room) => {
  const classes = { available: 'bg-success', occupied: 'bg-danger', reserved: 'bg-warning text-dark', maintenance: 'bg-secondary' };
  return classes[room.status] || 'bg-secondary';
};
const getRoomStatusLabel = (status) => {
  const labels = { available: 'Disponible', occupied: 'Occupée', reserved: 'Réservée', maintenance: 'Maintenance' };
  return labels[status] || status;
};
const getRoomTypeLabel = (type) => {
  const labels = { standard: 'Standard', double: 'Double', suite: 'Suite', vip: 'VIP' };
  return labels[type] || type;
};
const getReservationStatusBadgeClass = (status) => {
  const classes = { pending: 'bg-secondary', confirmed: 'bg-info', checked_in: 'bg-success', checked_out: 'bg-dark', cancelled: 'bg-danger' };
  return classes[status] || 'bg-secondary';
};
const getReservationStatusLabel = (status) => {
  const labels = { pending: 'En attente', confirmed: 'Confirmée', checked_in: 'En cours', checked_out: 'Terminée', cancelled: 'Annulée' };
  return labels[status] || status;
};
const formatDate = (date) => {
  if (!date) { return '—'; }
  return new Date(date).toLocaleDateString('fr-FR');
};
const formatCurrency = (value) => {
  if (!value && value !== 0) { return '0 BIF'; }
  return new Intl.NumberFormat('fr-BI', { style: 'decimal', minimumFractionDigits: 0 }).format(value) + ' BIF';
};

onMounted(() => {
  Promise.all([loadAll(), loadReservations()]);
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal-overlay > div {
  animation: slideUp 0.2s ease;
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.room-card {
  border-width: 2px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.room-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.toast-fade-enter-active {
  animation: slideInRight 0.3s ease;
}
.toast-fade-leave-active {
  animation: slideOutRight 0.3s ease;
}
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOutRight {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
</style>
