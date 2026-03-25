<template>
  <div class="hotel-page">
    <HotelHeader modelValue="Rapports" />

    <div class="px-3 pb-4 mt-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 fw-bold">
          <i class="bi bi-graph-up me-2 text-primary"></i>Rapport Directeur
        </h5>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary btn-sm" @click="loadReport">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button class="btn btn-success btn-sm" @click="exportToExcel" :disabled="!report">
            <i class="bi bi-file-earmark-spreadsheet me-1"></i>Excel
          </button>
          <button class="btn btn-outline-dark btn-sm" @click="printReport">
            <i class="bi bi-printer me-1"></i>Imprimer
          </button>
        </div>
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
              <button class="btn btn-sm" :class="activeFilter === 'week' ? 'btn-info text-white' : 'btn-outline-info'" @click="setThisWeek">Cette semaine</button>
            </div>
            <div class="col-auto">
              <button class="btn btn-sm" :class="activeFilter === 'month' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setThisMonth">Ce mois</button>
            </div>
            <div class="col-auto">
              <button class="btn btn-sm" :class="activeFilter === 'year' ? 'btn-warning' : 'btn-outline-warning'" @click="setThisYear">Cette année</button>
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
        <div class="small text-muted mt-2">Chargement du rapport...</div>
      </div>

      <div v-else-if="report" id="printable-report">

        <!-- ═══ 1. CHIFFRE D'AFFAIRES GLOBAL ═════════════════════════════════ -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <div class="card border-0 h-100" style="background: linear-gradient(135deg, #059669, #10b981);">
              <div class="card-body text-white text-center">
                <i class="bi bi-cash-stack fs-3 d-block mb-1 opacity-75"></i>
                <div class="small opacity-90">Chiffre d'Affaires Total</div>
                <div class="fw-bold fs-5">{{ formatCurrency(report.revenue.total) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 h-100" style="background: linear-gradient(135deg, #2563eb, #3b82f6);">
              <div class="card-body text-white text-center">
                <i class="bi bi-receipt fs-3 d-block mb-1 opacity-75"></i>
                <div class="small opacity-90">Argent Collecté (Caisse)</div>
                <div class="fw-bold fs-5">{{ formatCurrency(report.caisse.total_income) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 h-100" style="background: linear-gradient(135deg, #dc2626, #ef4444);">
              <div class="card-body text-white text-center">
                <i class="bi bi-arrow-up-circle fs-3 d-block mb-1 opacity-75"></i>
                <div class="small opacity-90">Total Dépenses</div>
                <div class="fw-bold fs-5">{{ formatCurrency(report.caisse.total_expense + report.expenses.total) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 h-100" :style="report.caisse.total_profit >= 0
              ? 'background: linear-gradient(135deg, #16a34a, #22c55e)'
              : 'background: linear-gradient(135deg, #b91c1c, #dc2626)'">
              <div class="card-body text-white text-center">
                <i class="bi bi-graph-up-arrow fs-3 d-block mb-1 opacity-75"></i>
                <div class="small opacity-90">Bénéfice Net</div>
                <div class="fw-bold fs-5">{{ formatCurrency(report.caisse.total_profit) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ 2. OCCUPATION & RÉSERVATIONS ═════════════════════════════════ -->
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white fw-semibold">
                <i class="bi bi-door-closed me-2 text-primary"></i>État des Chambres
              </div>
              <div class="card-body">
                <div class="row g-2 text-center">
                  <div class="col-3">
                    <div class="fs-3 fw-bold text-dark">{{ report.rooms.total }}</div>
                    <div class="small text-muted">Total</div>
                  </div>
                  <div class="col-3">
                    <div class="fs-3 fw-bold text-success">{{ report.rooms.available }}</div>
                    <div class="small text-muted">Disponibles</div>
                  </div>
                  <div class="col-3">
                    <div class="fs-3 fw-bold text-danger">{{ report.rooms.occupied }}</div>
                    <div class="small text-muted">Occupées</div>
                  </div>
                  <div class="col-3">
                    <div class="fs-3 fw-bold text-warning">{{ report.rooms.reserved }}</div>
                    <div class="small text-muted">Réservées</div>
                  </div>
                </div>
                <div class="progress mt-3" style="height: 24px;">
                  <div class="progress-bar bg-danger" :style="{ width: occupiedPct + '%' }">
                    {{ report.rooms.occupancy_rate }}%
                  </div>
                  <div class="progress-bar bg-warning" :style="{ width: reservedPct + '%' }"></div>
                  <div class="progress-bar bg-secondary" :style="{ width: maintenancePct + '%' }"></div>
                </div>
                <div class="d-flex justify-content-between small text-muted mt-1">
                  <span>Taux d'occupation: <strong>{{ report.rooms.occupancy_rate }}%</strong></span>
                  <span v-if="report.rooms.maintenance > 0">{{ report.rooms.maintenance }} en maintenance</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white fw-semibold">
                <i class="bi bi-calendar-check me-2 text-info"></i>Réservations
              </div>
              <div class="card-body">
                <div class="row g-2">
                  <div class="col-6">
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="badge bg-primary rounded-pill fs-6">{{ report.reservations.total }}</span>
                      <span class="small">Total réservations</span>
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="badge bg-success rounded-pill">{{ report.reservations.checked_in }}</span>
                      <span class="small">En cours</span>
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="badge bg-info rounded-pill">{{ report.reservations.confirmed }}</span>
                      <span class="small">Confirmées</span>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="badge bg-dark rounded-pill">{{ report.reservations.checked_out }}</span>
                      <span class="small">Terminées</span>
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="badge bg-danger rounded-pill">{{ report.reservations.cancelled }}</span>
                      <span class="small">Annulées</span>
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="badge bg-secondary rounded-pill">{{ report.reservations.avg_stay }}</span>
                      <span class="small">Séjour moyen (nuits)</span>
                    </div>
                  </div>
                </div>
                <div class="small text-muted mt-2 border-top pt-2">
                  <i class="bi bi-people me-1"></i>{{ report.reservations.total_guests }} clients hébergés
                  — {{ report.reservations.total_nights }} nuitées au total
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ 3. REVENUS PAR SECTION ═══════════════════════════════════════ -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white fw-semibold">
            <i class="bi bi-pie-chart me-2 text-muted"></i>Répartition du Chiffre d'Affaires par Section
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div v-for="section in report.revenue.sections" :key="section.label" class="col-6 col-lg-3">
                <div class="text-center p-3 rounded" style="background: #f8fafc;">
                  <i :class="['bi', 'bi-' + section.icon, 'fs-2 d-block mb-1']" style="color: #6366f1;"></i>
                  <div class="small text-muted">{{ section.label }}</div>
                  <div class="fw-bold fs-6 text-dark">{{ formatCurrency(section.amount) }}</div>
                  <div class="small text-muted" v-if="report.revenue.total > 0">
                    {{ ((section.amount / report.revenue.total) * 100).toFixed(1) }}%
                  </div>
                </div>
              </div>
            </div>
            <div class="progress mt-3" style="height: 20px;" v-if="report.revenue.total > 0">
              <div class="progress-bar" style="background: #6366f1" :style="{ width: revPct('rooms') + '%' }" :title="'Chambres: ' + revPct('rooms') + '%'">
                <span v-if="revPct('rooms') > 10">Chambres</span>
              </div>
              <div class="progress-bar" style="background: #f59e0b" :style="{ width: revPct('restaurant') + '%' }" :title="'Restaurant: ' + revPct('restaurant') + '%'">
                <span v-if="revPct('restaurant') > 10">Restaurant</span>
              </div>
              <div class="progress-bar" style="background: #10b981" :style="{ width: revPct('conference') + '%' }" :title="'Conf.: ' + revPct('conference') + '%'">
                <span v-if="revPct('conference') > 10">Conf.</span>
              </div>
              <div class="progress-bar" style="background: #ef4444" :style="{ width: revPct('reception') + '%' }" :title="'Réception: ' + revPct('reception') + '%'">
                <span v-if="revPct('reception') > 10">Réception</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ 4. FACTURES & CRÉANCES ═══════════════════════════════════════ -->
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white fw-semibold">
                <i class="bi bi-receipt me-2 text-primary"></i>Facturation Hôtel
              </div>
              <div class="card-body">
                <table class="table table-sm mb-0">
                  <tbody>
                    <tr>
                      <td class="text-muted">Factures émises</td>
                      <td class="text-end fw-semibold">{{ report.invoices.total_count }}</td>
                    </tr>
                    <tr>
                      <td class="text-muted">Montant total facturé</td>
                      <td class="text-end fw-bold text-primary">{{ formatCurrency(report.invoices.total_amount) }}</td>
                    </tr>
                    <tr>
                      <td class="text-muted">Montant payé</td>
                      <td class="text-end fw-semibold text-success">{{ formatCurrency(report.invoices.total_paid) }}</td>
                    </tr>
                    <tr>
                      <td class="text-muted">Créances (impayés)</td>
                      <td class="text-end fw-bold text-danger">{{ formatCurrency(report.invoices.total_unpaid) }}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="d-flex gap-2 mt-3">
                  <span class="badge bg-success">{{ report.invoices.paid_count }} payées</span>
                  <span class="badge bg-warning text-dark">{{ report.invoices.partial_count }} partielles</span>
                  <span class="badge bg-danger">{{ report.invoices.unpaid_count }} impayées</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white fw-semibold">
                <i class="bi bi-wallet2 me-2 text-danger"></i>Créances Chambres
              </div>
              <div class="card-body">
                <table class="table table-sm mb-0">
                  <tbody>
                    <tr>
                      <td class="text-muted">CA Chambres</td>
                      <td class="text-end fw-bold">{{ formatCurrency(report.revenue.rooms) }}</td>
                    </tr>
                    <tr>
                      <td class="text-muted">Déjà perçu (avances)</td>
                      <td class="text-end fw-semibold text-success">{{ formatCurrency(report.revenue.rooms_collected) }}</td>
                    </tr>
                    <tr class="table-danger">
                      <td class="fw-semibold">Reste à percevoir</td>
                      <td class="text-end fw-bold text-danger">{{ formatCurrency(report.revenue.rooms_balance) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ 5. SECTIONS DÉTAILLÉES ═══════════════════════════════════════ -->
        <div class="row g-3 mb-4">
          <div class="col-md-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white fw-semibold">
                <i class="bi bi-cup-straw me-2 text-warning"></i>Restaurant-Bar
              </div>
              <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Commandes</span>
                  <span class="fw-bold">{{ report.restaurant.total_orders }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Revenus</span>
                  <span class="fw-bold text-success">{{ formatCurrency(report.restaurant.total_revenue) }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Room service</span>
                  <span class="fw-bold">{{ report.restaurant.room_service }}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">En attente</span>
                  <span class="badge bg-warning text-dark">{{ report.restaurant.pending }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white fw-semibold">
                <i class="bi bi-camera-video me-2 text-secondary"></i>Salles de Conférence
              </div>
              <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Réservations</span>
                  <span class="fw-bold">{{ report.conference.total_bookings }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Revenus</span>
                  <span class="fw-bold text-success">{{ formatCurrency(report.conference.total_revenue) }}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Annulées</span>
                  <span class="badge bg-danger">{{ report.conference.cancelled }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white fw-semibold">
                <i class="bi bi-balloon-heart me-2 text-danger"></i>Salle de Réception
              </div>
              <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Réservations</span>
                  <span class="fw-bold">{{ report.reception.total_bookings }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Revenus</span>
                  <span class="fw-bold text-success">{{ formatCurrency(report.reception.total_revenue) }}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Annulées</span>
                  <span class="badge bg-danger">{{ report.reception.cancelled }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ 6. DÉPENSES PAR SECTION ═════════════════════════════════════ -->
        <div class="card border-0 shadow-sm mb-4" v-if="report.expenses.count > 0">
          <div class="card-header bg-white fw-semibold">
            <i class="bi bi-wallet2 me-2 text-danger"></i>Dépenses par Section
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Section</th>
                  <th class="text-center">Nombre</th>
                  <th class="text-end">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(data, section) in report.expenses.by_section" :key="section">
                  <td>
                    <i :class="['bi me-1', sectionIcon(section)]"></i>
                    {{ sectionLabel(section) }}
                  </td>
                  <td class="text-center">{{ data.count }}</td>
                  <td class="text-end fw-semibold text-danger">{{ formatCurrency(data.total) }}</td>
                </tr>
                <tr class="table-dark fw-bold">
                  <td>TOTAL</td>
                  <td class="text-center">{{ report.expenses.count }}</td>
                  <td class="text-end text-danger">{{ formatCurrency(report.expenses.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ═══ 7. TOP CHAMBRES & TOP CLIENTS ═══════════════════════════════ -->
        <div class="row g-3 mb-4">
          <div class="col-md-6" v-if="report.top_rooms.length > 0">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white fw-semibold">
                <i class="bi bi-trophy me-2 text-warning"></i>Top Chambres (par revenus)
              </div>
              <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Chambre</th>
                      <th class="text-center">Séjours</th>
                      <th class="text-end">Revenus</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(room, idx) in report.top_rooms" :key="idx">
                      <td>
                        <span v-if="idx < 3" class="badge" :class="['bg-warning text-dark', 'bg-secondary', 'bg-danger'][idx]">{{ idx + 1 }}</span>
                        <span v-else class="text-muted">{{ idx + 1 }}</span>
                      </td>
                      <td>
                        <span class="fw-semibold">N°{{ room.room_number }}</span>
                        <span class="small text-muted ms-1">{{ getRoomTypeLabel(room.type) }}</span>
                      </td>
                      <td class="text-center">{{ room.bookings }}</td>
                      <td class="text-end fw-semibold text-success">{{ formatCurrency(room.revenue) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="col-md-6" v-if="report.top_clients.length > 0">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white fw-semibold">
                <i class="bi bi-people me-2 text-info"></i>Top Clients
              </div>
              <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Client</th>
                      <th class="text-center">Séjours</th>
                      <th class="text-end">Dépensé</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(client, idx) in report.top_clients" :key="idx">
                      <td>
                        <span v-if="idx < 3" class="badge" :class="['bg-warning text-dark', 'bg-secondary', 'bg-danger'][idx]">{{ idx + 1 }}</span>
                        <span v-else class="text-muted">{{ idx + 1 }}</span>
                      </td>
                      <td>
                        <div class="fw-semibold">{{ client.name }}</div>
                        <div class="small text-muted" v-if="client.phone">{{ client.phone }}</div>
                      </td>
                      <td class="text-center">{{ client.stays }}</td>
                      <td class="text-end fw-semibold text-success">{{ formatCurrency(client.revenue) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ 8. REVENUS JOURNALIERS ═══════════════════════════════════════ -->
        <div class="card border-0 shadow-sm mb-4" v-if="report.daily_revenue.length > 0">
          <div class="card-header bg-white fw-semibold">
            <i class="bi bi-calendar3 me-2 text-muted"></i>Revenus Journaliers
          </div>
          <div class="table-responsive">
            <table class="table table-sm table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Date</th>
                  <th class="text-end">Chambres</th>
                  <th class="text-end">Restaurant</th>
                  <th class="text-end fw-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="day in report.daily_revenue" :key="day.date">
                  <td>{{ formatDate(day.date) }}</td>
                  <td class="text-end">{{ formatCurrency(day.rooms) }}</td>
                  <td class="text-end">{{ formatCurrency(day.restaurant) }}</td>
                  <td class="text-end fw-bold text-primary">{{ formatCurrency(day.total) }}</td>
                </tr>
                <tr class="table-dark fw-bold">
                  <td>TOTAL</td>
                  <td class="text-end">{{ formatCurrency(report.daily_revenue.reduce((s, d) => s + d.rooms, 0)) }}</td>
                  <td class="text-end">{{ formatCurrency(report.daily_revenue.reduce((s, d) => s + d.restaurant, 0)) }}</td>
                  <td class="text-end">{{ formatCurrency(report.daily_revenue.reduce((s, d) => s + d.total, 0)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ═══ 9. CAISSE RÉCAPITULATIF ═════════════════════════════════════ -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white fw-semibold">
            <i class="bi bi-safe me-2 text-success"></i>Récapitulatif Caisse Hôtel
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-6 col-md-3 text-center">
                <div class="small text-muted">Recettes</div>
                <div class="fw-bold fs-5 text-success">+{{ formatCurrency(report.caisse.total_income) }}</div>
              </div>
              <div class="col-6 col-md-3 text-center">
                <div class="small text-muted">Dépenses</div>
                <div class="fw-bold fs-5 text-danger">-{{ formatCurrency(report.caisse.total_expense) }}</div>
              </div>
              <div class="col-6 col-md-3 text-center">
                <div class="small text-muted">Pertes Stock</div>
                <div class="fw-bold fs-5" style="color: #b45309;">-{{ formatCurrency(report.caisse.total_losses) }}</div>
              </div>
              <div class="col-6 col-md-3 text-center">
                <div class="small text-muted">Bénéfice Net</div>
                <div class="fw-bold fs-5" :class="report.caisse.total_profit >= 0 ? 'text-success' : 'text-danger'">
                  {{ report.caisse.total_profit >= 0 ? '+' : '' }}{{ formatCurrency(report.caisse.total_profit) }}
                </div>
              </div>
            </div>
            <div class="d-flex gap-2 mt-3 justify-content-center">
              <span class="badge bg-primary">{{ report.caisse.registers_count }} caisses au total</span>
              <span class="badge bg-success">{{ report.caisse.open_registers }} ouverte(s)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import HotelHeader from './HotelHeader.vue';
import api from '@/services/api';

const loading = ref(false);
const report = ref(null);
const filters = ref({ start_date: '', end_date: '' });
const activeFilter = ref('month');

const loadReport = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.value.start_date) { params.start_date = filters.value.start_date; }
    if (filters.value.end_date) { params.end_date = filters.value.end_date; }

    const res = await api.get('/hotel/reports/summary', { params });
    report.value = res.data.data;
  } catch (e) {
    console.error('Erreur chargement rapport:', e);
  } finally {
    loading.value = false;
  }
};

const occupiedPct = computed(() => {
  if (!report.value || report.value.rooms.total === 0) { return 0; }
  return (report.value.rooms.occupied / report.value.rooms.total) * 100;
});
const reservedPct = computed(() => {
  if (!report.value || report.value.rooms.total === 0) { return 0; }
  return (report.value.rooms.reserved / report.value.rooms.total) * 100;
});
const maintenancePct = computed(() => {
  if (!report.value || report.value.rooms.total === 0) { return 0; }
  return (report.value.rooms.maintenance / report.value.rooms.total) * 100;
});

const revPct = (key) => {
  if (!report.value || report.value.revenue.total === 0) { return 0; }
  return ((report.value.revenue[key] / report.value.revenue.total) * 100).toFixed(1);
};

const sectionLabels = {
  restaurant: 'Restaurant', bar: 'Bar', rooms: 'Chambres',
  conference: 'Salles Conf.', reception: 'Salle Réception',
};
const sectionIcons = {
  restaurant: 'bi-egg-fried', bar: 'bi-cup-straw', rooms: 'bi-door-closed',
  conference: 'bi-camera-video', reception: 'bi-balloon-heart',
};
const sectionLabel = (s) => sectionLabels[s] || s;
const sectionIcon = (s) => sectionIcons[s] || 'bi-circle';

const getRoomTypeLabel = (type) => {
  const labels = { standard: 'Standard', double: 'Double', suite: 'Suite', vip: 'VIP' };
  return labels[type] || type;
};

const formatCurrency = (v) => new Intl.NumberFormat('fr-FR').format(v || 0) + ' BIF';
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const onManualDateChange = () => { activeFilter.value = ''; loadReport(); };

const setToday = () => {
  const today = new Date().toISOString().slice(0, 10);
  filters.value = { start_date: today, end_date: today };
  activeFilter.value = 'today';
  loadReport();
};

const setThisWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  filters.value = { start_date: monday.toISOString().slice(0, 10), end_date: now.toISOString().slice(0, 10) };
  activeFilter.value = 'week';
  loadReport();
};

const setThisMonth = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  filters.value = { start_date: start, end_date: now.toISOString().slice(0, 10) };
  activeFilter.value = 'month';
  loadReport();
};

const setThisYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  filters.value = { start_date: start, end_date: now.toISOString().slice(0, 10) };
  activeFilter.value = 'year';
  loadReport();
};

const clearFilters = () => {
  filters.value = { start_date: '', end_date: '' };
  activeFilter.value = 'all';
  loadReport();
};

const printReport = () => {
  window.print();
};

// ─── Excel Export (multi-sheet) ──────────────────────────────────────────────

const escapeXml = (str) => String(str ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const buildSheet = (name, headers, rows) => {
  let xml = `<Worksheet ss:Name="${escapeXml(name)}"><Table>\n`;
  xml += '<Row ss:StyleID="Bold">';
  headers.forEach((h) => { xml += `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`; });
  xml += '</Row>\n';
  rows.forEach((row) => {
    xml += '<Row>';
    row.forEach((cell) => {
      const type = typeof cell === 'number' ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${type}">${escapeXml(String(cell ?? ''))}</Data></Cell>`;
    });
    xml += '</Row>\n';
  });
  xml += '</Table></Worksheet>\n';
  return xml;
};

const exportToExcel = () => {
  if (!report.value) { return; }
  const r = report.value;
  const period = filters.value.start_date && filters.value.end_date
    ? `${filters.value.start_date} au ${filters.value.end_date}`
    : 'Toutes les données';

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Styles>';
  xml += '<Style ss:ID="Bold"><Font ss:Bold="1"/></Style>';
  xml += '<Style ss:ID="Currency"><NumberFormat ss:Format="#,##0"/></Style>';
  xml += '</Styles>\n';

  xml += buildSheet('Résumé Global', [
    'Indicateur', 'Valeur',
  ], [
    ['Période', period],
    [''],
    ['=== CHIFFRE D\'AFFAIRES ===', ''],
    ['CA Total', r.revenue.total],
    ['CA Chambres', r.revenue.rooms],
    ['CA Restaurant-Bar', r.revenue.restaurant],
    ['CA Salles de Conférence', r.revenue.conference],
    ['CA Salle de Réception', r.revenue.reception],
    [''],
    ['=== CAISSE ===', ''],
    ['Argent Collecté (Recettes)', r.caisse.total_income],
    ['Dépenses', r.caisse.total_expense],
    ['Pertes Stock', r.caisse.total_losses],
    ['Bénéfice Net', r.caisse.total_profit],
    ['Nombre de Caisses', r.caisse.registers_count],
    ['Caisses Ouvertes', r.caisse.open_registers],
    [''],
    ['=== CHAMBRES ===', ''],
    ['Total Chambres', r.rooms.total],
    ['Disponibles', r.rooms.available],
    ['Occupées', r.rooms.occupied],
    ['Réservées', r.rooms.reserved],
    ['En Maintenance', r.rooms.maintenance],
    ['Taux d\'Occupation (%)', r.rooms.occupancy_rate],
    [''],
    ['=== RÉSERVATIONS ===', ''],
    ['Total Réservations', r.reservations.total],
    ['En Cours', r.reservations.checked_in],
    ['Confirmées', r.reservations.confirmed],
    ['Terminées', r.reservations.checked_out],
    ['Annulées', r.reservations.cancelled],
    ['Séjour Moyen (nuits)', r.reservations.avg_stay],
    ['Nuitées Totales', r.reservations.total_nights],
    ['Clients Hébergés', r.reservations.total_guests],
    [''],
    ['=== FACTURATION ===', ''],
    ['Factures Émises', r.invoices.total_count],
    ['Montant Total Facturé', r.invoices.total_amount],
    ['Montant Payé', r.invoices.total_paid],
    ['Créances (Impayés)', r.invoices.total_unpaid],
    ['Factures Payées', r.invoices.paid_count],
    ['Factures Partielles', r.invoices.partial_count],
    ['Factures Impayées', r.invoices.unpaid_count],
    [''],
    ['=== CRÉANCES CHAMBRES ===', ''],
    ['CA Chambres', r.revenue.rooms],
    ['Avances Perçues', r.revenue.rooms_collected],
    ['Reste à Percevoir', r.revenue.rooms_balance],
    [''],
    ['=== DÉPENSES TOTALES ===', ''],
    ['Total Dépenses', r.expenses.total],
    ['Nombre de Dépenses', r.expenses.count],
  ]);

  xml += buildSheet('Revenus par Section', [
    'Section', 'Montant (BIF)', 'Pourcentage (%)',
  ], r.revenue.sections.map((s) => [
    s.label,
    s.amount,
    r.revenue.total > 0 ? parseFloat(((s.amount / r.revenue.total) * 100).toFixed(1)) : 0,
  ]));

  xml += buildSheet('Restaurant-Bar', [
    'Indicateur', 'Valeur',
  ], [
    ['Total Commandes', r.restaurant.total_orders],
    ['Revenus', r.restaurant.total_revenue],
    ['Commandes Payées', r.restaurant.paid],
    ['Commandes en Attente', r.restaurant.pending],
    ['Room Service', r.restaurant.room_service],
  ]);

  xml += buildSheet('Conférence & Réception', [
    'Section', 'Réservations', 'Revenus (BIF)', 'Confirmées', 'Annulées',
  ], [
    ['Salles de Conférence', r.conference.total_bookings, r.conference.total_revenue, r.conference.confirmed, r.conference.cancelled],
    ['Salle de Réception', r.reception.total_bookings, r.reception.total_revenue, r.reception.confirmed, r.reception.cancelled],
  ]);

  if (Object.keys(r.expenses.by_section).length > 0) {
    xml += buildSheet('Dépenses par Section', [
      'Section', 'Nombre', 'Montant (BIF)',
    ], Object.entries(r.expenses.by_section).map(([section, data]) => [
      sectionLabel(section),
      data.count,
      data.total,
    ]));
  }

  if (r.top_rooms.length > 0) {
    xml += buildSheet('Top Chambres', [
      'Rang', 'Chambre', 'Type', 'Séjours', 'Revenus (BIF)',
    ], r.top_rooms.map((room, idx) => [
      idx + 1,
      'N°' + room.room_number,
      getRoomTypeLabel(room.type),
      room.bookings,
      room.revenue,
    ]));
  }

  if (r.top_clients.length > 0) {
    xml += buildSheet('Top Clients', [
      'Rang', 'Nom', 'Téléphone', 'Séjours', 'Dépensé (BIF)',
    ], r.top_clients.map((client, idx) => [
      idx + 1,
      client.name,
      client.phone || '—',
      client.stays,
      client.revenue,
    ]));
  }

  if (r.daily_revenue.length > 0) {
    xml += buildSheet('Revenus Journaliers', [
      'Date', 'Chambres (BIF)', 'Restaurant (BIF)', 'Total (BIF)',
    ], r.daily_revenue.map((d) => [
      d.date,
      d.rooms,
      d.restaurant,
      d.total,
    ]));
  }

  xml += '</Workbook>';

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport_hotel_${timestamp}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

onMounted(() => {
  setThisMonth();
});
</script>

<style scoped>
@media print {
  .hotel-page .tabs-wrapper,
  .hotel-page .btn,
  .hotel-page .card.border-0.shadow-sm.mb-4:first-child {
    display: none !important;
  }
  .card {
    break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #dee2e6 !important;
  }
  .progress-bar {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
