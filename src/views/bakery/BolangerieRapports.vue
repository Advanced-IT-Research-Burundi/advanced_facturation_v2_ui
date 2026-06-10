<template>
  <div class="bakery-report-page container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h1 class="h3 mb-1 fw-bold">
          <i class="bi bi-graph-up-arrow me-2 text-warning"></i>Rapport Boulangerie
        </h1>
        <div class="text-muted small">
          Stocks, mouvements, entrées, sorties et autres opérations séparés par production / hors production.
        </div>
      </div>
      <div class="d-flex gap-2 no-print">
        <router-link to="/bakery/production" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-arrow-left me-1"></i>Retour
        </router-link>
        <button class="btn btn-outline-secondary btn-sm" @click="loadReport">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
        <button class="btn btn-success btn-sm" :disabled="!report" @click="exportToExcel">
          <i class="bi bi-file-earmark-spreadsheet me-1"></i>Excel
        </button>
        <button class="btn btn-outline-dark btn-sm" @click="printReport">
          <i class="bi bi-printer me-1"></i>Imprimer
        </button>
      </div>
    </div>

    <div class="card border-0 shadow-sm mb-4 no-print">
      <div class="card-body py-3">
        <div class="row g-2 align-items-end">
          <div class="col-6 col-md-auto">
            <label class="form-label small mb-1 fw-semibold">Du</label>
            <input type="date" class="form-control form-control-sm" v-model="filters.start_date" @change="onManualDateChange" />
          </div>
          <div class="col-6 col-md-auto">
            <label class="form-label small mb-1 fw-semibold">Au</label>
            <input type="date" class="form-control form-control-sm" v-model="filters.end_date" @change="onManualDateChange" />
          </div>
          <div class="col-12 col-md-3 col-lg-2">
            <label class="form-label small mb-1 fw-semibold">Lecture</label>
            <select class="form-select form-select-sm" v-model="filters.scope" @change="onScopeChange">
              <option value="all">Tout stock</option>
              <option value="production">Seulement en production</option>
              <option value="non_production">Hors production</option>
            </select>
          </div>
          <div class="col-12 col-md-3 col-lg-2">
            <label class="form-label small mb-1 fw-semibold">Stock</label>
            <select class="form-select form-select-sm" v-model="filters.warehouse_id" @change="loadReport">
              <option value="all">Tous les stocks</option>
              <option v-for="stock in filteredWarehouseOptions" :key="stock.id" :value="String(stock.id)">
                {{ stock.name }} — {{ stock.is_production ? 'Production' : 'Hors production' }}
              </option>
            </select>
          </div>
          <div class="col-12 col-md-4 col-lg-3">
            <label class="form-label small mb-1 fw-semibold">Mouvement</label>
            <select class="form-select form-select-sm" v-model="filters.movement_type" @change="loadReport">
              <option v-for="movement in movementFilterOptions" :key="movement.value" :value="movement.value">
                {{ movement.label }}
              </option>
            </select>
          </div>
          <div class="col-auto">
            <button class="btn btn-sm" :class="activeFilter === 'today' ? 'btn-warning' : 'btn-outline-warning'" @click="setToday">
              Aujourd'hui
            </button>
          </div>
          <div class="col-auto">
            <button class="btn btn-sm" :class="activeFilter === 'week' ? 'btn-info text-white' : 'btn-outline-info'" @click="setThisWeek">
              Cette semaine
            </button>
          </div>
          <div class="col-auto">
            <button class="btn btn-sm" :class="activeFilter === 'month' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setThisMonth">
              Ce mois
            </button>
          </div>
          <div class="col-auto">
            <button class="btn btn-sm" :class="activeFilter === 'year' ? 'btn-primary' : 'btn-outline-primary'" @click="setThisYear">
              Cette année
            </button>
          </div>
          <div class="col-auto">
            <button class="btn btn-sm" :class="activeFilter === 'all' ? 'btn-dark' : 'btn-outline-dark'" @click="clearDateFilters">
              Tout
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger no-print">
      <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-warning"></div>
      <div class="small text-muted mt-2">Chargement du rapport boulangerie...</div>
    </div>

    <div v-else-if="report" id="printable-bakery-report">
      <div class="period-chip mb-3">
        <i class="bi bi-calendar3 me-2"></i>{{ periodLabel }}
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-xl-3">
          <div class="metric-card bg-stock-total">
            <div class="metric-icon"><i class="bi bi-boxes"></i></div>
            <div class="metric-label">Valeur Stock Total</div>
            <div class="metric-value">{{ formatCurrency(stockSummary('total').total_value) }}</div>
            <div class="metric-subtitle">
              {{ formatNumber(stockSummary('total').items_count) }} lignes • {{ formatNumber(stockSummary('total').total_quantity) }} qté
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="metric-card bg-production">
            <div class="metric-icon"><i class="bi bi-hourglass-split"></i></div>
            <div class="metric-label">Stock en Production</div>
            <div class="metric-value">{{ formatCurrency(stockSummary('production').total_value) }}</div>
            <div class="metric-subtitle">
              {{ formatNumber(stockSummary('production').items_count) }} lignes • {{ formatNumber(stockSummary('production').total_quantity) }} qté
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="metric-card bg-outside">
            <div class="metric-icon"><i class="bi bi-shop-window"></i></div>
            <div class="metric-label">Stock Hors Production</div>
            <div class="metric-value">{{ formatCurrency(stockSummary('non_production').total_value) }}</div>
            <div class="metric-subtitle">
              {{ formatNumber(stockSummary('non_production').items_count) }} lignes • {{ formatNumber(stockSummary('non_production').total_quantity) }} qté
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="metric-card" :class="movementMetricClass('total')">
            <div class="metric-icon"><i class="bi bi-activity"></i></div>
            <div class="metric-label">{{ movementMetricLabel }}</div>
            <div class="metric-value">{{ movementMetricValue('total') }}</div>
            <div class="metric-subtitle">{{ movementMetricSubtitle('total') }}</div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <template v-if="isSpecificMovement">
          <div class="col-12">
            <div class="movement-card" :class="selectedMovementDirection">
              <div>
                <div class="movement-label">Mouvement sélectionné</div>
                <div class="movement-title">{{ selectedMovementOption.label }}</div>
                <div class="movement-value">{{ movementAmountLabel(selectedMovementSummary('total')) }}</div>
                <div class="small text-muted">
                  {{ formatNumber(selectedMovementSummary('total').count) }} opérations •
                  {{ formatNumber(selectedMovementSummary('total').quantity) }} qté •
                  {{ directionLabel(selectedMovementDirection) }}
                </div>
              </div>
              <i :class="selectedMovementIcon"></i>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="col-md-4">
          <div class="movement-card entry">
            <div>
              <div class="movement-label">Entrées</div>
              <div class="movement-value">+{{ formatCurrency(movementSummary('total').entries_value) }}</div>
              <div class="small text-muted">
                {{ formatNumber(movementSummary('total').entries_count) }} opérations • {{ formatNumber(movementSummary('total').entries_quantity) }} qté
              </div>
            </div>
            <i class="bi bi-arrow-down-circle"></i>
          </div>
          </div>
          <div class="col-md-4">
          <div class="movement-card exit">
            <div>
              <div class="movement-label">Sorties</div>
              <div class="movement-value">-{{ formatCurrency(movementSummary('total').exits_value) }}</div>
              <div class="small text-muted">
                {{ formatNumber(movementSummary('total').exits_count) }} opérations • {{ formatNumber(movementSummary('total').exits_quantity) }} qté
              </div>
            </div>
            <i class="bi bi-arrow-up-circle"></i>
          </div>
          </div>
          <div class="col-md-4">
          <div class="movement-card other">
            <div>
              <div class="movement-label">Autres</div>
              <div class="movement-value">{{ formatCurrency(movementSummary('total').others_value) }}</div>
              <div class="small text-muted">
                {{ formatNumber(movementSummary('total').others_count) }} opérations • {{ formatNumber(movementSummary('total').others_quantity) }} qté
              </div>
            </div>
            <i class="bi bi-shuffle"></i>
          </div>
          </div>
        </template>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100 border-top-warning">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-hourglass-split me-2 text-warning"></i>Lecture en Production
            </div>
            <div v-if="isSpecificMovement" class="card-body">
              <div class="row g-2 text-center">
                <div class="col-6 col-lg-3">
                  <div class="mini-label">Stock</div>
                  <div class="mini-value text-warning">{{ formatCurrency(stockSummary('production').total_value) }}</div>
                </div>
                <div class="col-6 col-lg-3">
                  <div class="mini-label">Opérations</div>
                  <div class="mini-value">{{ formatNumber(selectedMovementSummary('production').count) }}</div>
                </div>
                <div class="col-6 col-lg-3">
                  <div class="mini-label">Quantité</div>
                  <div class="mini-value">{{ formatNumber(selectedMovementSummary('production').quantity) }}</div>
                </div>
                <div class="col-6 col-lg-3">
                  <div class="mini-label">Montant</div>
                  <div class="mini-value" :class="movementTextClass(selectedMovementDirection)">
                    {{ movementAmountLabel(selectedMovementSummary('production')) }}
                  </div>
                </div>
              </div>
              <div class="split-line mt-3">
                <span>{{ selectedMovementOption.label }}</span>
                <strong :class="movementTextClass(selectedMovementDirection)">{{ directionLabel(selectedMovementDirection) }}</strong>
              </div>
            </div>
            <div v-else class="card-body">
              <div class="row g-2 text-center">
                <div class="col-4">
                  <div class="mini-label">Stock</div>
                  <div class="mini-value text-warning">{{ formatCurrency(stockSummary('production').total_value) }}</div>
                </div>
                <div class="col-4">
                  <div class="mini-label">Entrées</div>
                  <div class="mini-value text-success">+{{ formatCurrency(movementSummary('production').entries_value) }}</div>
                </div>
                <div class="col-4">
                  <div class="mini-label">Sorties</div>
                  <div class="mini-value text-danger">-{{ formatCurrency(movementSummary('production').exits_value) }}</div>
                </div>
              </div>
              <div class="split-line mt-3">
                <span>Autres mouvements</span>
                <strong>{{ formatCurrency(movementSummary('production').others_value) }}</strong>
              </div>
              <div class="split-line">
                <span>Solde mouvements</span>
                <strong :class="movementSummary('production').net_value >= 0 ? 'text-success' : 'text-danger'">
                  {{ signedCurrency(movementSummary('production').net_value) }}
                </strong>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100 border-top-blue">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-shop-window me-2 text-primary"></i>Lecture Hors Production
            </div>
            <div v-if="isSpecificMovement" class="card-body">
              <div class="row g-2 text-center">
                <div class="col-6 col-lg-3">
                  <div class="mini-label">Stock</div>
                  <div class="mini-value text-primary">{{ formatCurrency(stockSummary('non_production').total_value) }}</div>
                </div>
                <div class="col-6 col-lg-3">
                  <div class="mini-label">Opérations</div>
                  <div class="mini-value">{{ formatNumber(selectedMovementSummary('non_production').count) }}</div>
                </div>
                <div class="col-6 col-lg-3">
                  <div class="mini-label">Quantité</div>
                  <div class="mini-value">{{ formatNumber(selectedMovementSummary('non_production').quantity) }}</div>
                </div>
                <div class="col-6 col-lg-3">
                  <div class="mini-label">Montant</div>
                  <div class="mini-value" :class="movementTextClass(selectedMovementDirection)">
                    {{ movementAmountLabel(selectedMovementSummary('non_production')) }}
                  </div>
                </div>
              </div>
              <div class="split-line mt-3">
                <span>{{ selectedMovementOption.label }}</span>
                <strong :class="movementTextClass(selectedMovementDirection)">{{ directionLabel(selectedMovementDirection) }}</strong>
              </div>
            </div>
            <div v-else class="card-body">
              <div class="row g-2 text-center">
                <div class="col-4">
                  <div class="mini-label">Stock</div>
                  <div class="mini-value text-primary">{{ formatCurrency(stockSummary('non_production').total_value) }}</div>
                </div>
                <div class="col-4">
                  <div class="mini-label">Entrées</div>
                  <div class="mini-value text-success">+{{ formatCurrency(movementSummary('non_production').entries_value) }}</div>
                </div>
                <div class="col-4">
                  <div class="mini-label">Sorties</div>
                  <div class="mini-value text-danger">-{{ formatCurrency(movementSummary('non_production').exits_value) }}</div>
                </div>
              </div>
              <div class="split-line mt-3">
                <span>Autres mouvements</span>
                <strong>{{ formatCurrency(movementSummary('non_production').others_value) }}</strong>
              </div>
              <div class="split-line">
                <span>Solde mouvements</span>
                <strong :class="movementSummary('non_production').net_value >= 0 ? 'text-success' : 'text-danger'">
                  {{ signedCurrency(movementSummary('non_production').net_value) }}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div v-for="status in statusCards" :key="status.status" class="col-md-4">
          <div class="status-card" :style="{ '--accent': status.color }">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="small text-muted">{{ status.label }}</div>
                <div class="status-number">{{ formatCurrency(status.total_value) }}</div>
                <div class="small text-muted">
                  {{ formatNumber(status.items_count) }} lignes • {{ formatNumber(status.total_quantity) }} qté
                </div>
              </div>
              <i :class="['bi', status.icon]"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-xl-5">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-building me-2 text-muted"></i>Stock par dépôt
            </div>
            <div class="table-responsive">
              <table class="table table-sm table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Dépôt</th>
                    <th class="text-center">Nature</th>
                    <th class="text-end">Quantité</th>
                    <th class="text-end">Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="stockByWarehouse.length === 0">
                    <td colspan="4" class="text-center py-4 text-muted">Aucun stock trouvé</td>
                  </tr>
                  <tr v-for="warehouse in stockByWarehouse" :key="warehouse.warehouse_id">
                    <td class="fw-semibold">{{ warehouse.warehouse_name }}</td>
                    <td class="text-center">
                      <span class="badge" :class="warehouse.is_production ? 'bg-warning text-dark' : 'bg-primary'">
                        {{ warehouse.is_production ? 'Production' : 'Hors prod.' }}
                      </span>
                    </td>
                    <td class="text-end fw-semibold">{{ formatNumber(warehouse.total_quantity) }}</td>
                    <td class="text-end fw-bold">{{ formatCurrency(warehouse.total_value) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-xl-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-tags me-2 text-muted"></i>Mouvements par type
            </div>
            <div class="table-responsive">
              <table class="table table-sm table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Code</th>
                    <th>Libellé</th>
                    <th class="text-center">Cas</th>
                    <th class="text-end">Nombre</th>
                    <th class="text-end">Quantité</th>
                    <th class="text-end">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="movementTypes.length === 0">
                    <td colspan="6" class="text-center py-4 text-muted">Aucun mouvement sur cette période</td>
                  </tr>
                  <tr v-for="type in movementTypes" :key="type.movement_type">
                    <td><code>{{ type.movement_type }}</code></td>
                    <td class="fw-semibold">{{ type.movement_type_label }}</td>
                    <td class="text-center">
                      <span class="badge" :class="directionClass(type.direction)">
                        {{ directionLabel(type.direction) }}
                      </span>
                    </td>
                    <td class="text-end">{{ formatNumber(type.count) }}</td>
                    <td class="text-end fw-semibold">{{ formatNumber(type.quantity) }}</td>
                    <td class="text-end fw-bold">{{ formatCurrency(type.total_value) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-xl-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-hourglass me-2 text-warning"></i>Stocks en production
            </div>
            <StockTable
              :items="productionStockItems"
              empty-message="Aucun stock en production"
              :format-number="formatNumber"
              :format-currency="formatCurrency"
              :status-label="statusLabel"
            />
          </div>
        </div>
        <div class="col-xl-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-shop me-2 text-primary"></i>Stocks hors production
            </div>
            <StockTable
              :items="nonProductionStockItems"
              empty-message="Aucun stock hors production"
              :format-number="formatNumber"
              :format-currency="formatCurrency"
              :status-label="statusLabel"
            />
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-xl-5">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-trophy me-2 text-warning"></i>Produits les plus mouvementés
            </div>
            <div class="table-responsive">
              <table class="table table-sm table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Produit</th>
                    <th class="text-end">Entrées</th>
                    <th class="text-end">Sorties</th>
                    <th class="text-end">Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="topProducts.length === 0">
                    <td colspan="4" class="text-center py-4 text-muted">Aucune donnée</td>
                  </tr>
                  <tr v-for="product in topProducts" :key="product.product_code + product.product_name">
                    <td>
                      <div class="fw-semibold">{{ product.product_name }}</div>
                      <small class="text-muted">{{ product.product_code }}</small>
                    </td>
                    <td class="text-end text-success fw-semibold">+{{ formatNumber(product.entries_quantity) }} {{ product.unit }}</td>
                    <td class="text-end text-danger fw-semibold">-{{ formatNumber(product.exits_quantity) }} {{ product.unit }}</td>
                    <td class="text-end fw-bold">{{ formatCurrency(product.total_value) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-xl-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-calendar3 me-2 text-muted"></i>Lecture journalière des mouvements
            </div>
            <div class="table-responsive">
              <table class="table table-sm table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Date</th>
                    <th class="text-end">Entrées</th>
                    <th class="text-end">Sorties</th>
                    <th class="text-end">Autres</th>
                    <th class="text-end">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="movementsByDay.length === 0">
                    <td colspan="5" class="text-center py-4 text-muted">Aucune activité journalière</td>
                  </tr>
                  <tr v-for="day in movementsByDay" :key="day.date">
                    <td class="fw-semibold">{{ formatDate(day.date) }}</td>
                    <td class="text-end text-success">+{{ formatCurrency(day.entries_value) }}</td>
                    <td class="text-end text-danger">-{{ formatCurrency(day.exits_value) }}</td>
                    <td class="text-end">{{ formatCurrency(day.others_value) }}</td>
                    <td class="text-end fw-bold" :class="day.entries_value - day.exits_value >= 0 ? 'text-success' : 'text-danger'">
                      {{ signedCurrency(day.entries_value - day.exits_value) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white fw-semibold">
          <i class="bi bi-clock-history me-2 text-muted"></i>Derniers mouvements visibles
        </div>
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Dépôt</th>
                <th>Zone</th>
                <th>Type</th>
                <th class="text-end">Quantité</th>
                <th class="text-end">Prix</th>
                <th class="text-end">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recentMovements.length === 0">
                <td colspan="8" class="text-center py-4 text-muted">Aucun mouvement trouvé</td>
              </tr>
              <tr v-for="movement in recentMovements" :key="movement.id">
                <td><small>{{ movement.date }}</small></td>
                <td>
                  <div class="fw-semibold">{{ movement.product_name }}</div>
                  <small class="text-muted">{{ movement.product_code }}</small>
                </td>
                <td>{{ movement.warehouse_name }}</td>
                <td>
                  <span class="badge" :class="movement.is_production ? 'bg-warning text-dark' : 'bg-primary'">
                    {{ movement.scope_label }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="directionClass(movement.direction)">
                    {{ movement.movement_type }} — {{ directionLabel(movement.direction) }}
                  </span>
                </td>
                <td class="text-end fw-semibold">
                  {{ movement.direction === 'entry' ? '+' : movement.direction === 'exit' ? '-' : '' }}{{ formatNumber(movement.quantity) }} {{ movement.unit }}
                </td>
                <td class="text-end">{{ formatCurrency(movement.unit_price, movement.currency) }}</td>
                <td class="text-end fw-bold">{{ formatCurrency(movement.total_value, movement.currency) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-5 text-muted">
      <i class="bi bi-bar-chart fs-1 d-block mb-2"></i>
      Aucun rapport à afficher.
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import api from '@/services/api';

const emptyStockSummary = {
  items_count: 0,
  total_quantity: 0,
  total_value: 0,
  alerts_count: 0,
};

const emptyMovementSummary = {
  total_movements: 0,
  entries_count: 0,
  entries_quantity: 0,
  entries_value: 0,
  exits_count: 0,
  exits_quantity: 0,
  exits_value: 0,
  others_count: 0,
  others_quantity: 0,
  others_value: 0,
  net_value: 0,
};

const StockTable = defineComponent({
  name: 'StockTable',
  props: {
    items: { type: Array, required: true },
    emptyMessage: { type: String, required: true },
    formatNumber: { type: Function, required: true },
    formatCurrency: { type: Function, required: true },
    statusLabel: { type: Function, required: true },
  },
  setup(props) {
    return () => {
      const rows = props.items.length === 0
        ? [h('tr', [h('td', { colspan: 5, class: 'text-center py-4 text-muted' }, props.emptyMessage)])]
        : props.items.map((item) => h('tr', { key: item.id }, [
              h('td', [
                h('div', { class: 'fw-semibold' }, item.product_name),
                h('small', { class: 'text-muted' }, `${item.product_code} • ${item.warehouse_name}`),
              ]),
              h('td', [
                h('span', {
                  class: ['badge', item.is_production ? 'bg-warning text-dark' : 'bg-primary'],
                }, props.statusLabel(item.production_status)),
              ]),
              h('td', { class: ['text-end fw-bold', item.is_alert ? 'text-danger' : ''] }, `${props.formatNumber(item.quantity)} ${item.unit}`),
              h('td', { class: 'text-end' }, props.formatCurrency(item.unit_price, item.currency)),
              h('td', { class: 'text-end fw-bold' }, props.formatCurrency(item.total_value, item.currency)),
            ]));

      return h('div', { class: 'table-responsive stock-table-wrapper' }, [
        h('table', { class: 'table table-sm table-hover mb-0' }, [
          h('thead', { class: 'table-light' }, [
            h('tr', [
              h('th', 'Produit'),
              h('th', 'Statut'),
              h('th', { class: 'text-end' }, 'Quantité'),
              h('th', { class: 'text-end' }, 'Prix'),
              h('th', { class: 'text-end' }, 'Valeur'),
            ]),
          ]),
          h('tbody', rows),
        ]),
      ]);
    };
  },
});

const loading = ref(false);
const error = ref(null);
const report = ref(null);
const activeFilter = ref('month');
const filters = ref({
  start_date: '',
  end_date: '',
  scope: 'all',
  warehouse_id: 'all',
  movement_type: 'all',
});

const movementFilterOptions = [
  { value: 'all', label: 'Tous les mouvements', direction: 'all', icon: 'bi bi-activity' },
  { value: 'EN', label: 'EN - Entrée Normale', direction: 'entry', icon: 'bi bi-arrow-down-circle' },
  { value: 'ER', label: 'ER - Entrée par Retour (depuis Produits Finis)', direction: 'entry', icon: 'bi bi-arrow-down-circle' },
  { value: 'EI', label: 'EI - Entrée par Inventaire', direction: 'entry', icon: 'bi bi-arrow-down-circle' },
  { value: 'EAJ', label: 'EAJ - Entrée par Ajustement', direction: 'entry', icon: 'bi bi-arrow-down-circle' },
  { value: 'SC', label: 'SC - Sortie par Consommation', direction: 'exit', icon: 'bi bi-arrow-up-circle' },
  { value: 'SP', label: 'SP - Sortie par Perte', direction: 'exit', icon: 'bi bi-arrow-up-circle' },
  { value: 'SD', label: 'SD - Sortie par Détérioration', direction: 'exit', icon: 'bi bi-arrow-up-circle' },
  { value: 'SAJ', label: 'SAJ - Sortie par Ajustement', direction: 'exit', icon: 'bi bi-arrow-up-circle' },
];

const loadReport = async () => {
  loading.value = true;
  error.value = null;

  try {
    const params = {
      scope: filters.value.scope,
      warehouse_id: filters.value.warehouse_id,
      movement_type: filters.value.movement_type,
    };
    if (filters.value.start_date) { params.start_date = filters.value.start_date; }
    if (filters.value.end_date) { params.end_date = filters.value.end_date; }

    const response = await api.get('bakery/production/rapports', { params });
    if (response.data.success) {
      report.value = response.data.data;
    } else {
      error.value = response.data.message || 'Impossible de charger le rapport.';
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors du chargement du rapport boulangerie.';
  } finally {
    loading.value = false;
  }
};

const stockSummary = (key) => report.value?.stock?.summary?.[key] || emptyStockSummary;
const movementSummary = (key) => report.value?.movements?.summary?.[key] || emptyMovementSummary;

const stockByWarehouse = computed(() => report.value?.stock?.by_warehouse || []);
const productionStockItems = computed(() => (report.value?.stock?.items || []).filter((item) => item.is_production));
const nonProductionStockItems = computed(() => (report.value?.stock?.items || []).filter((item) => !item.is_production));
const movementTypes = computed(() => report.value?.movements?.by_type || []);
const movementsByDay = computed(() => report.value?.movements?.by_day || []);
const topProducts = computed(() => report.value?.movements?.top_products || []);
const recentMovements = computed(() => report.value?.movements?.recent || []);
const warehouseOptions = computed(() => report.value?.warehouses?.items || []);
const filteredWarehouseOptions = computed(() => warehouseOptions.value.filter((warehouse) => {
  if (filters.value.scope === 'production') { return warehouse.is_production; }
  if (filters.value.scope === 'non_production') { return !warehouse.is_production; }
  return true;
}));

const selectedWarehouseLabel = computed(() => {
  if (filters.value.warehouse_id === 'all') { return 'tous les stocks'; }
  const selected = warehouseOptions.value.find((warehouse) => String(warehouse.id) === String(filters.value.warehouse_id));
  return selected ? selected.name : `stock #${filters.value.warehouse_id}`;
});

const selectedMovementLabel = computed(() => {
  const selected = movementFilterOptions.find((movement) => movement.value === filters.value.movement_type);
  return selected?.label?.toLowerCase() || 'tous les mouvements';
});
const selectedMovementOption = computed(() => (
  movementFilterOptions.find((movement) => movement.value === filters.value.movement_type) || movementFilterOptions[0]
));
const isSpecificMovement = computed(() => selectedMovementOption.value.value !== 'all');
const selectedMovementDirection = computed(() => selectedMovementOption.value.direction === 'all' ? 'other' : selectedMovementOption.value.direction);
const selectedMovementIcon = computed(() => selectedMovementOption.value.icon);

const selectedMovementSummary = (key) => {
  const summary = movementSummary(key);

  if (selectedMovementDirection.value === 'entry') {
    return {
      count: summary.entries_count,
      quantity: summary.entries_quantity,
      value: summary.entries_value,
      direction: 'entry',
    };
  }

  if (selectedMovementDirection.value === 'exit') {
    return {
      count: summary.exits_count,
      quantity: summary.exits_quantity,
      value: summary.exits_value,
      direction: 'exit',
    };
  }

  return {
    count: summary.others_count,
    quantity: summary.others_quantity,
    value: summary.others_value,
    direction: 'other',
  };
};

const movementMetricLabel = computed(() => (
  isSpecificMovement.value ? 'Total Mouvement Sélectionné' : 'Solde Mouvements'
));

const movementMetricValue = (key) => (
  isSpecificMovement.value ? movementAmountLabel(selectedMovementSummary(key)) : signedCurrency(movementSummary(key).net_value)
);

const movementMetricSubtitle = (key) => {
  if (!isSpecificMovement.value) {
    return `${formatNumber(movementSummary(key).total_movements)} mouvements`;
  }

  const summary = selectedMovementSummary(key);
  return `${formatNumber(summary.count)} opérations • ${formatNumber(summary.quantity)} qté`;
};

const movementMetricClass = (key) => {
  if (!isSpecificMovement.value) {
    return movementSummary(key).net_value >= 0 ? 'bg-net-good' : 'bg-net-bad';
  }

  return {
    entry: 'bg-net-good',
    exit: 'bg-net-bad',
    other: 'bg-stock-total',
  }[selectedMovementDirection.value] || 'bg-stock-total';
};

const statusCards = computed(() => {
  const byStatus = report.value?.stock?.by_status || [];
  const lookup = Object.fromEntries(byStatus.map((item) => [item.status, item]));
  const cards = [
    { status: 'RAW', label: 'Produits en production', icon: 'bi-hourglass-split', color: '#f59e0b' },
    { status: 'FINISHED', label: 'Produits finis', icon: 'bi-basket2-fill', color: '#10b981' },
    { status: 'TRANSFERRED', label: 'Transférés', icon: 'bi-truck', color: '#3b82f6' },
  ];

  return cards.map((card) => ({
    ...card,
    ...(lookup[card.status] || emptyStockSummary),
  }));
});

const periodLabel = computed(() => {
  const { start_date: startDate, end_date: endDate, scope } = report.value?.period || {};
  const scopeLabel = {
    all: 'tout stock',
    production: 'seulement en production',
    non_production: 'hors production',
  }[scope || 'all'];

  if (startDate && endDate) {
    return `Période du ${formatDate(startDate)} au ${formatDate(endDate)} — ${scopeLabel} — ${selectedWarehouseLabel.value} — ${selectedMovementLabel.value}`;
  }

  return `Toutes les dates — ${scopeLabel} — ${selectedWarehouseLabel.value} — ${selectedMovementLabel.value}`;
});

const formatNumber = (value) => new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const formatCurrency = (value, currency = 'BIF') => `${formatNumber(value)} ${currency || 'BIF'}`;

const signedCurrency = (value) => {
  const numericValue = Number(value || 0);
  return `${numericValue >= 0 ? '+' : '-'}${formatCurrency(Math.abs(numericValue))}`;
};

const formatDate = (date) => {
  if (!date) { return '—'; }
  return new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR');
};

const statusLabel = (status) => ({
  RAW: 'En production',
  FINISHED: 'Produit fini',
  TRANSFERRED: 'Transféré',
  OUT_OF_PRODUCTION: 'Hors production',
}[status] || status || '—');

const directionLabel = (direction) => ({
  entry: 'Entrée',
  exit: 'Sortie',
  other: 'Autre',
}[direction] || 'Autre');

const directionClass = (direction) => ({
  entry: 'bg-success',
  exit: 'bg-danger',
  other: 'bg-secondary',
}[direction] || 'bg-secondary');

const movementTextClass = (direction) => ({
  entry: 'text-success',
  exit: 'text-danger',
  other: 'text-secondary',
}[direction] || 'text-secondary');

const movementAmountLabel = (summary) => {
  const prefix = summary.direction === 'entry' ? '+' : summary.direction === 'exit' ? '-' : '';
  return `${prefix}${formatCurrency(summary.value)}`;
};

const onManualDateChange = () => {
  activeFilter.value = '';
  loadReport();
};

const onScopeChange = () => {
  filters.value.warehouse_id = 'all';
  loadReport();
};

const setToday = () => {
  const today = new Date().toISOString().slice(0, 10);
  filters.value = { ...filters.value, start_date: today, end_date: today };
  activeFilter.value = 'today';
  loadReport();
};

const setThisWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  filters.value = {
    ...filters.value,
    start_date: monday.toISOString().slice(0, 10),
    end_date: now.toISOString().slice(0, 10),
  };
  activeFilter.value = 'week';
  loadReport();
};

const setThisMonth = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  filters.value = {
    ...filters.value,
    start_date: start,
    end_date: now.toISOString().slice(0, 10),
  };
  activeFilter.value = 'month';
  loadReport();
};

const setThisYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  filters.value = {
    ...filters.value,
    start_date: start,
    end_date: now.toISOString().slice(0, 10),
  };
  activeFilter.value = 'year';
  loadReport();
};

const clearDateFilters = () => {
  filters.value = { ...filters.value, start_date: '', end_date: '' };
  activeFilter.value = 'all';
  loadReport();
};

const printReport = () => {
  window.print();
};

const escapeXml = (str) => String(str ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const buildSheet = (name, headers, rows) => {
  let xml = `<Worksheet ss:Name="${escapeXml(name)}"><Table>\n`;
  xml += '<Row ss:StyleID="Bold">';
  headers.forEach((header) => { xml += `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`; });
  xml += '</Row>\n';
  rows.forEach((row) => {
    xml += '<Row>';
    row.forEach((cell) => {
      const type = typeof cell === 'number' ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`;
    });
    xml += '</Row>\n';
  });
  xml += '</Table></Worksheet>\n';
  return xml;
};

const exportToExcel = () => {
  if (!report.value) { return; }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Styles><Style ss:ID="Bold"><Font ss:Bold="1"/></Style></Styles>\n';

  xml += buildSheet('Résumé', ['Indicateur', 'Valeur'], [
    ['Période', periodLabel.value],
    ['Valeur stock total', stockSummary('total').total_value],
    ['Valeur stock en production', stockSummary('production').total_value],
    ['Valeur stock hors production', stockSummary('non_production').total_value],
    ['Entrées', movementSummary('total').entries_value],
    ['Sorties', movementSummary('total').exits_value],
    ['Autres', movementSummary('total').others_value],
    ['Solde mouvements', movementSummary('total').net_value],
  ]);

  xml += buildSheet('Stock par dépôt', ['Dépôt', 'Nature', 'Articles', 'Quantité', 'Valeur'], stockByWarehouse.value.map((item) => [
    item.warehouse_name,
    item.is_production ? 'Production' : 'Hors production',
    item.items_count,
    item.total_quantity,
    item.total_value,
  ]));

  xml += buildSheet('Stocks production', ['Code', 'Produit', 'Dépôt', 'Statut', 'Quantité', 'Unité', 'Prix', 'Valeur'], productionStockItems.value.map((item) => [
    item.product_code,
    item.product_name,
    item.warehouse_name,
    statusLabel(item.production_status),
    item.quantity,
    item.unit,
    item.unit_price,
    item.total_value,
  ]));

  xml += buildSheet('Stocks hors production', ['Code', 'Produit', 'Dépôt', 'Quantité', 'Unité', 'Prix', 'Valeur'], nonProductionStockItems.value.map((item) => [
    item.product_code,
    item.product_name,
    item.warehouse_name,
    item.quantity,
    item.unit,
    item.unit_price,
    item.total_value,
  ]));

  xml += buildSheet('Mouvements par type', ['Code', 'Libellé', 'Cas', 'Nombre', 'Quantité', 'Montant'], movementTypes.value.map((type) => [
    type.movement_type,
    type.movement_type_label,
    directionLabel(type.direction),
    type.count,
    type.quantity,
    type.total_value,
  ]));

  xml += buildSheet('Derniers mouvements', ['Date', 'Produit', 'Dépôt', 'Zone', 'Type', 'Quantité', 'Prix', 'Montant'], recentMovements.value.map((movement) => [
    movement.date,
    movement.product_name,
    movement.warehouse_name,
    movement.scope_label,
    movement.movement_type_label,
    movement.quantity,
    movement.unit_price,
    movement.total_value,
  ]));

  xml += '</Workbook>';

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport_boulangerie_${timestamp}.xls`;
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
.period-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #fff7ed;
  color: #9a3412;
  padding: 0.45rem 0.8rem;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px #fed7aa;
}

.metric-card {
  min-height: 155px;
  border-radius: 18px;
  padding: 1.15rem;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
}

.metric-card::after {
  content: '';
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  right: -44px;
  top: -48px;
}

.metric-icon {
  font-size: 2rem;
  opacity: 0.86;
}

.metric-label {
  font-size: 0.82rem;
  opacity: 0.88;
  margin-top: 0.25rem;
}

.metric-value {
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 900;
  line-height: 1.15;
  margin-top: 0.25rem;
}

.metric-subtitle {
  font-size: 0.78rem;
  opacity: 0.9;
  margin-top: 0.3rem;
}

.bg-stock-total {
  background: linear-gradient(135deg, #111827, #475569);
}

.bg-production {
  background: linear-gradient(135deg, #d97706, #f59e0b);
}

.bg-outside {
  background: linear-gradient(135deg, #2563eb, #60a5fa);
}

.bg-net-good {
  background: linear-gradient(135deg, #047857, #10b981);
}

.bg-net-bad {
  background: linear-gradient(135deg, #b91c1c, #ef4444);
}

.movement-card {
  border-radius: 16px;
  padding: 1rem;
  min-height: 118px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  border-left: 5px solid var(--accent);
}

.movement-card.entry {
  --accent: #10b981;
}

.movement-card.exit {
  --accent: #ef4444;
}

.movement-card.other {
  --accent: #64748b;
}

.movement-card > i {
  color: var(--accent);
  font-size: 2.4rem;
  opacity: 0.85;
}

.movement-label,
.mini-label {
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.movement-value {
  font-size: 1.45rem;
  font-weight: 900;
}

.movement-title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
  margin: 0.1rem 0 0.2rem;
}

.mini-value {
  font-size: 1.1rem;
  font-weight: 900;
}

.split-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px dashed #e2e8f0;
  padding-top: 0.65rem;
  margin-top: 0.65rem;
}

.border-top-warning {
  border-top: 4px solid #f59e0b !important;
}

.border-top-blue {
  border-top: 4px solid #3b82f6 !important;
}

.status-card {
  border-radius: 16px;
  background: #fff;
  padding: 1rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  border-top: 4px solid var(--accent);
}

.status-card i {
  color: var(--accent);
  font-size: 2rem;
}

.status-number {
  font-size: 1.35rem;
  font-weight: 900;
  color: #0f172a;
}

.stock-table-wrapper {
  max-height: 470px;
}

code {
  font-size: 0.78rem;
  background: #f8fafc;
  color: #334155;
  border-radius: 5px;
  padding: 0.15rem 0.35rem;
}

@media print {
  .no-print,
  .btn,
  .form-control,
  .form-select {
    display: none !important;
  }

  .bakery-report-page {
    padding: 0 !important;
  }

  .card,
  .metric-card,
  .movement-card,
  .status-card {
    break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #dee2e6 !important;
  }

  .metric-card {
    color: #111827 !important;
  }
}
</style>
