<template>
  <div>
    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Proformats</h2>
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="openCreateModal">
          <i class="bi bi-plus-lg"></i>
          Nouveau Proformat
        </button>
      </div>

      <!-- Search and Filter -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-body p-3">
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="input-group">
                        <span class="input-group-text bg-white border-end-0">
                            <i class="bi bi-search text-muted"></i>
                        </span>
                        <input 
                            type="text" 
                            class="form-control border-start-0 ps-0" 
                            placeholder="Rechercher (Client, Type, Signature)..."
                            v-model="searchQuery"
                        >
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>

      <!-- Table -->
      <div v-else class="card shadow-sm border-0">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="bg-light">
                <tr>
                  <th class="border-bottom-0 py-3 ps-4">Signature</th>
                  <th class="border-bottom-0 py-3 ps-4">Date</th>
                  <th class="border-bottom-0 py-3">Client</th>
                  <th class="border-bottom-0 py-3">Montant</th>
                  <th class="border-bottom-0 py-3">Paiement</th>
                  <th class="border-bottom-0 py-3">Statut</th>
                  <th class="border-bottom-0 py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredProformats" :key="item.id">
                  <td class="ps-4 fw-medium">{{ item.invoice_signature || '-' }}</td>
                  <td class="ps-4">{{ item.date_facturation || '-' }}</td>
                  <td>{{ item.client || '-' }}</td>
                  <td class="fw-bold text-primary">{{ formatPrice(item.amount) }} FBU</td>
                  <td>{{ item.type_paiement }}</td>
                  <td>
                    <span v-if="item.is_cancelled" class="badge bg-danger">Annulé</span>
                    <span v-else class="badge bg-success">Actif</span>
                  </td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(item)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(item)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredProformats.length === 0">
                  <td colspan="7" class="text-center py-5 text-muted">
                    Aucun proformat trouvé
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Create/Edit -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light">
            <h5 class="modal-title">{{ isEditing ? 'Modifier Proformat' : 'Nouveau Proformat' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm">
              <div class="mb-3">
                <label class="form-label">Client <span class="text-danger">*</span></label>
                <input type="text" class="form-control" v-model="form.client" required placeholder="Nom du client">
              </div>
              <div class="mb-3">
                <label class="form-label">Adresse Client</label>
                <input type="text" class="form-control" v-model="form.addresse_client" placeholder="Adresse">
              </div>
              
              <div class="row">
                  <div class="col-6 mb-3">
                     <label class="form-label">Montant (FBU)</label>
                     <input type="number" class="form-control" v-model="form.amount" min="0">
                  </div>
                  <div class="col-6 mb-3">
                     <label class="form-label">Taxe</label>
                     <input type="number" class="form-control" v-model="form.tax" min="0">
                  </div>
              </div>

              <div class="row">
                <div class="col-6 mb-3">
                  <label class="form-label">Type Paiement</label>
                  <select class="form-select" v-model="form.type_paiement">
                    <option value="Cash">Cash</option>
                    <option value="Banque">Banque</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Cheque">Chèque</option>
                  </select>
                </div>
                <div class="col-6 mb-3">
                  <label class="form-label">Date Facturation</label>
                  <input type="date" class="form-control" v-model="form.date_facturation">
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light" @click="closeModal">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="formLoading">
                  <span v-if="formLoading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  {{ isEditing ? 'Mettre à jour' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
           <div class="modal-body text-center py-4">
             <i class="bi bi-exclamation-circle text-danger display-1 mb-3"></i>
             <h5 class="mb-3">Êtes-vous sûr ?</h5>
             <p class="text-muted mb-4">Cette action est irréversible.</p>
             <div class="d-flex justify-content-center gap-2">
               <button type="button" class="btn btn-light" @click="closeDeleteModal">Annuler</button>
               <button type="button" class="btn btn-danger" @click="deleteItem" :disabled="formLoading">
                 <span v-if="formLoading" class="spinner-border spinner-border-sm me-1"></span>
                 Supprimer
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore()
const loading = computed(() => store.getters['proformats/isLoading'])
const searchQuery = ref('')
const formLoading = ref(false)

const proformats = computed(() => store.getters['proformats/allProformats'])

const filteredProformats = computed(() => {
  if (!searchQuery.value) return proformats.value
  const query = searchQuery.value.toLowerCase()
  return proformats.value.filter(p => 
    p.client?.toLowerCase().includes(query) || 
    p.invoice_signature?.toLowerCase().includes(query) ||
    p.type_paiement?.toLowerCase().includes(query)
  )
})

const showModal = ref(false)
const isEditing = ref(false)
const showDeleteModal = ref(false)
const itemToDelete = ref(null)

const form = reactive({
  id: null,
  client: '',
  addresse_client: '',
  amount: 0,
  tax: 0,
  type_paiement: 'Cash',
  date_facturation: ''
})

onMounted(() => {
  store.dispatch('proformats/fetchProformats')
})

const formatPrice = (price) => {
  return price ? price.toLocaleString() : '0';
}

const openCreateModal = () => {
  isEditing.value = false
  form.id = null
  form.client = ''
  form.addresse_client = ''
  form.amount = 0
  form.tax = 0
  form.type_paiement = 'Cash'
  form.date_facturation = new Date().toISOString().split('T')[0]
  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  form.id = item.id
  form.client = item.client
  form.addresse_client = item.addresse_client
  form.amount = item.amount
  form.tax = item.tax
  form.type_paiement = item.type_paiement
  form.date_facturation = item.date_facturation
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitForm = async () => {
  formLoading.value = true
  try {
    if (isEditing.value) {
      await store.dispatch('proformats/updateProformat', { ...form })
    } else {
      await store.dispatch('proformats/createProformat', { ...form })
    }
    closeModal()
  } catch (error) {
    console.error(error)
  } finally {
    formLoading.value = false
  }
}

const confirmDelete = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

const deleteItem = async () => {
  if (!itemToDelete.value) return
  formLoading.value = true
  try {
    await store.dispatch('proformats/deleteProformat', itemToDelete.value.id)
    closeDeleteModal()
  } catch (error) {
    console.error(error)
  } finally {
    formLoading.value = false
  }
}
</script>

<style scoped>
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css");

.table > :not(caption) > * > * {
    background-color: transparent;
}
</style>
