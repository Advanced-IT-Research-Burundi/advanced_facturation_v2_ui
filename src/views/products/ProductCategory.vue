<template>
  <div>
    <StockHeader />

    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Catégories des produits</h2>
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="openCreateModal">
          <i class="bi bi-plus-lg"></i>
          Nouvelle Categorie
        </button>
      </div>

      <!-- Table -->
      <div class="card shadow-sm border-0">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="bg-light">
                <tr>
                  <th class="border-bottom-0 py-3 ps-4">Nom</th>
                  <th class="border-bottom-0 py-3">Description</th>
                  <th class="border-bottom-0 py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="category in categories" :key="category.id">
                  <td class="ps-4 fw-medium">{{ category.name }}</td>
                  <td>{{ category.description || '-' }}</td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(category)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(category)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="!loading && categories.length === 0">
                  <td colspan="3" class="text-center py-5 text-muted">
                    Aucune catégorie trouvée
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
                  <button class="page-link" @click="fetchCategories(pagination.prev_page_url)" :disabled="!pagination.prev_page_url">
                    <span aria-hidden="true">&laquo;</span>
                  </button>
                </li>
                
                <!-- Simple numeric pagination logic can be improved based on 'links' array if needed -->
                <li class="page-item active" aria-current="page">
                   <span class="page-link">{{ pagination.current_page }}</span>
                </li>

                <li class="page-item" :class="{ disabled: !pagination.next_page_url }">
                  <button class="page-link" @click="fetchCategories(pagination.next_page_url)" :disabled="!pagination.next_page_url">
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light">
            <h5 class="modal-title">{{ isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm">
              <div class="mb-3">
                <label for="name" class="form-label">Nom <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="name" v-model="form.name" required placeholder="Nom de la catégorie">
              </div>
              <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea class="form-control" id="description" v-model="form.description" rows="3" placeholder="Description courte (optionnel)"></textarea>
              </div>
              <div class="d-flex justify-content-end gap-2">
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

    <!-- Delete Confirmation Modal (Simple) -->
    <div v-if="showDeleteModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
           <div class="modal-body text-center py-4">
             <i class="bi bi-exclamation-circle text-danger display-1 mb-3"></i>
             <h5 class="mb-3">Êtes-vous sûr ?</h5>
             <p class="text-muted mb-4">Cette action est irréversible.</p>
             <div class="d-flex justify-content-center gap-2">
               <button type="button" class="btn btn-light" @click="closeDeleteModal">Annuler</button>
               <button type="button" class="btn btn-danger" @click="deleteCategory" :disabled="formLoading">
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
import { ref, reactive, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import api from '@/services/api';
import StockHeader from '../stocks/StockHeader.vue';
import { useToast } from '@/composables/useToast';

const store = useStore()
const toast = useToast()
const loading = ref(false)
const formLoading = ref(false)

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
    description: ''
})

const showDeleteModal = ref(false)
const categoryToDelete = ref(null)

onMounted(() => {
    fetchCategories()
})

const fetchCategories = async (url = '/category-products') => {
    loading.value = true
    try {
        // If url is full URL, we need to extract relative path or handle it. 
        // api.get usually prepends base URL. 
        // If the API returns full URL (http://...), axios might handle it if we pass it directly, 
        // but with baseURL set, we might need to be careful.
        // Assuming pagination URLs are handled correctly or we extract the query params.
        
        // Quick fix for pagination URLs if they contain the base URL already:
        let endpoint = url;
        if (url.startsWith('http')) {
             const urlObj = new URL(url);
             endpoint = '/category-products' + urlObj.search;
        }

        const resp = await api.get(endpoint)
        if (resp.data.success) {
            const result = resp.data.data
           
            // Update store if needed by legacy code
            store.state.data.categories = result


            pagination.value = {
                current_page: result.current_page,
                from: result.from,
                to: result.to,
                total: result.total,
                prev_page_url: result.prev_page_url,
                next_page_url: result.next_page_url
            }
        }
    } catch (error) {
        console.error("Erreur chargement categories:", error)
        // Optionally show toast
    } finally {
        loading.value = false
    }
}

// Modal Actions
const openCreateModal = () => {
    isEditing.value = false
    form.id = null
    form.name = ''
    form.description = ''
    showModal.value = true
}

const openEditModal = (category) => {
    isEditing.value = true
    form.id = category.id
    form.name = category.name
    form.description = category.description
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
            description: form.description
        }
        
        if (isEditing.value) {
            await api.put(`/category-products/${form.id}`, payload)
        } else {
            await api.post('/category-products', payload)
        }
        
        await fetchCategories()
        closeModal()
    } catch (error) {
        console.error("Erreur sauvegarde:", error)
        toast.error("Une erreur est survenue lors de la sauvegarde.")
    } finally {
        formLoading.value = false
    }
}

// Delete Actions
const confirmDelete = (category) => {
    categoryToDelete.value = category
    showDeleteModal.value = true
}

const closeDeleteModal = () => {
    showDeleteModal.value = false
    categoryToDelete.value = null
}

const deleteCategory = async () => {
    if (!categoryToDelete.value) return
    
    formLoading.value = true
    try {
        await api.delete(`/category-products/${categoryToDelete.value.id}`)
        await fetchCategories()
        closeDeleteModal()
    } catch (error) {
        console.error("Erreur suppression:", error)
        toast.error("Impossible de supprimer cette catégorie.")
    } finally {
        formLoading.value = false
    }
}
const categories = computed(() => store.state.data?.categories.data|| [])

</script>

<style scoped>
.table > :not(caption) > * > * {
    background-color: transparent;
}
</style>
