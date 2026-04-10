<template>
  <div>
    <StockHeader />
    
    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Fournisseurs</h2>
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="openCreateModal">
          <i class="bi bi-plus-lg"></i>
          Nouveau Fournisseur
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
                            placeholder="Rechercher (Nom, Email, NIF, Tel)..."
                            v-model="searchQuery"
                            @input="debouncedSearch"
                        >
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && fournisseurs.length === 0" class="text-center py-5">
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
                  <th class="border-bottom-0 py-3 ps-4">ID</th>
                  <th class="border-bottom-0 py-3 ps-4">Nom</th>
                  <th class="border-bottom-0 py-3">Téléphone</th>
                  <th class="border-bottom-0 py-3">NIF</th>
                  <th class="border-bottom-0 py-3">Email</th>
                  <th class="border-bottom-0 py-3">Adresse</th>
                  <th class="border-bottom-0 py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="supplier in suppliers" :key="supplier.id">
                  <td class="ps-4 fw-medium">{{ supplier.id }}</td>
                  <td class="ps-4 fw-medium">{{ supplier.name }}</td>
                  <td>{{ supplier.phone_number }}</td>
                  <td>{{ supplier.nif || '-' }}</td>
                  <td>{{ supplier.email || '-' }}</td>
                  <td>{{ supplier.address || '-' }}</td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(supplier)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(supplier)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="suppliers && suppliers?.length === 0">
                  <td colspan="6" class="text-center py-5 text-muted">
                    Aucun fournisseur trouvé
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Pagination -->
        <div class="card-footer bg-white border-top-0 py-3" v-if="pagination.total > 0">
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              Affichage de {{ pagination.from }} à {{ pagination.to }} sur {{ pagination.total }} éléments
            </small>
            <nav aria-label="Page navigation">
              <ul class="pagination mb-0">
                <li class="page-item" :class="{ disabled: !pagination.prev_page_url }">
                  <button class="page-link" @click="fetchSuppliers(pagination.prev_page_url)" :disabled="!pagination.prev_page_url">
                    <span aria-hidden="true">&laquo;</span>
                  </button>
                </li>
                
                <li class="page-item active" aria-current="page">
                   <span class="page-link">{{ pagination.current_page }}</span>
                </li>

                <li class="page-item" :class="{ disabled: !pagination.next_page_url }">
                  <button class="page-link" @click="fetchSuppliers(pagination.next_page_url)" :disabled="!pagination.next_page_url">
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Create/Edit -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light">
            <h5 class="modal-title">{{ isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm">
              <div class="mb-3">
                <label for="name" class="form-label">Nom <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="name" v-model="form.name" required placeholder="Nom du fournisseur">
              </div>
              <div class="row">
                  <div class="col-6 mb-3">
                     <label for="phone" class="form-label">Téléphone</label>
                     <input type="text" class="form-control" id="phone" v-model="form.phone_number" placeholder="ex: +123...">
                  </div>
                  <div class="col-6 mb-3">
                     <label for="nif" class="form-label">NIF</label>
                     <input type="text" class="form-control" id="nif" v-model="form.nif" placeholder="Numéro d'Identification Fiscal">
                  </div>
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" v-model="form.email" placeholder="user@example.com">
              </div>
              <div class="mb-3">
                <label for="address" class="form-label">Adresse</label>
                <textarea class="form-control" id="address" v-model="form.address" rows="2" placeholder="Adresse complète"></textarea>
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
               <button type="button" class="btn btn-danger" @click="deleteSupplier" :disabled="formLoading">
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
import { ref, reactive, onMounted } from 'vue';
import { useStore } from 'vuex';
import api from '@/services/api'; // Adjust path if needed, assuming alias @ works
import StockHeader from '../stocks/StockHeader.vue';
import { useToast } from '@/composables/useToast';

const store = useStore()
const toast = useToast()
const loading = ref(false)
const formLoading = ref(false)
const suppliers = ref([])
const searchQuery = ref('')
const dbSearch = ref(null) // for debounce
const fournisseurs = ref([])

const pagination = ref({
    current_page: 1,
    from: 0,
    to: 0,
    total: 0,
    prev_page_url: null,
    next_page_url: null
})

// Modal states
const showModal = ref(false)
const isEditing = ref(false)
const form = reactive({
    id: null,
    name: '',
    phone_number: '',
    nif: '',
    email: '',
    address: ''
})

const showDeleteModal = ref(false)
const supplierToDelete = ref(null)

onMounted(() => {
    fetchSuppliers()
})

const debouncedSearch = () => {
    if (dbSearch.value) clearTimeout(dbSearch.value)
    dbSearch.value = setTimeout(() => {
        fetchSuppliers()
    }, 500)
}

const fetchSuppliers = async (pageOrUrl = 1) => {
  loading.value = true
  try {
    const isUrl = typeof pageOrUrl === 'string' && pageOrUrl.startsWith('http')
    const endpoint = isUrl ? pageOrUrl : '/fournisseurs'
    const params = isUrl
      ? {}
      : { page: pageOrUrl, per_page: 20, ...(searchQuery.value ? { search: searchQuery.value } : {}) }

    const resp = await api.get(endpoint, { params })
    const payload = resp.data?.data
    const rows = payload?.data || []
    suppliers.value = rows

    pagination.value = {
      current_page: payload?.current_page || 1,
      from: payload?.from || 0,
      to: payload?.to || rows.length,
      total: payload?.total || rows.length,
      prev_page_url: payload?.prev_page_url || null,
      next_page_url: payload?.next_page_url || null
    }

  } catch (error) {
    console.error("Erreur chargement fournisseurs:", error)
  } finally {
    loading.value = false
  }
}


// Modal Actions
const openCreateModal = () => {
    isEditing.value = false
    form.id = null
    form.name = ''
    form.phone_number = ''
    form.nif = ''
    form.email = ''
    form.address = ''
    showModal.value = true
}

const openEditModal = (supplier) => {
    isEditing.value = true
    form.id = supplier.id
    form.name = supplier.name
    form.phone_number = supplier.phone_number
    form.nif = supplier.nif
    form.email = supplier.email
    form.address = supplier.address
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
}

const submitForm = async () => {
    formLoading.value = true
    try {
        const payload = {
            name: form.name,
            phone_number: form.phone_number,
            nif: form.nif,
            email: form.email,
            address: form.address
        }
        
        if (isEditing.value) {
            await api.put(`/fournisseurs/${form.id}`, payload)
        } else {
            await api.post('/fournisseurs', payload)
        }
        
        await fetchSuppliers()
        closeModal()
    } catch (error) {
        console.error("Erreur sauvegarde:", error)
        toast.error("Une erreur est survenue lors de la sauvegarde.")
    } finally {
        formLoading.value = false
    }
}

// Delete Actions
const confirmDelete = (supplier) => {
    supplierToDelete.value = supplier
    showDeleteModal.value = true
}

const closeDeleteModal = () => {
    showDeleteModal.value = false
    supplierToDelete.value = null
}

const deleteSupplier = async () => {
    if (!supplierToDelete.value) return
    
    formLoading.value = true
    try {
        await api.delete(`/fournisseurs/${supplierToDelete.value.id}`)
        await fetchSuppliers()
        closeDeleteModal()
    } catch (error) {
        console.error("Erreur suppression:", error)
        toast.error("Impossible de supprimer ce fournisseur.")
    } finally {
        formLoading.value = false
    }
}
</script>

<style scoped>
/* Bootstrap Icons fallback if not loaded globally */
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css");

.table > :not(caption) > * > * {
    background-color: transparent;
}
</style>


