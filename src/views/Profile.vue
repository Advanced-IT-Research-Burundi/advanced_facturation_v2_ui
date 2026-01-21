<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useStore } from "vuex";
import { User, Mail, Building, Shield, Calendar, Hash } from "lucide-vue-next";

const store = useStore();
const fetchedCompanyName = ref("");

// --- Computed Properties ---

const user = computed(() => store.state.auth.user || {});

const userInitials = computed(() => {
  return user.value?.name
    ? user.value.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";
});

const companyName = computed(() => {
  if (user.value?.company?.name) return user.value.company.name;
  if (user.value?.company_name) return user.value.company_name;
  if (fetchedCompanyName.value) return fetchedCompanyName.value;
  return "Non défini";
});

const allRoles = computed(() => {
  return user.value?.roles || [];
});

const allPermissions = computed(() => {
  const perms = new Set();
  if (user.value?.roles) {
    user.value.roles.forEach((role) => {
      if (role.permissions) {
        role.permissions.forEach((p) => perms.add(p));
      }
    });
  }
  return Array.from(perms);
});

// --- Methods ---

const loadCompanyInfo = async () => {
  if (
    user.value &&
    user.value.company_id &&
    !user.value.company &&
    !user.value.company_name
  ) {
    try {
      const result = await store.dispatch(
        "companies/fetchCompany",
        user.value.company_id,
      );
      if (result.success && result.data) {
        fetchedCompanyName.value = result.data.name;
      }
    } catch (error) {
      console.error("Failed to fetch company info", error);
    }
  }
};

onMounted(() => {
  loadCompanyInfo();
});

watch(
  () => store.state.auth.user,
  () => {
    loadCompanyInfo();
  },
);
</script>

<template>
  <div class="container-fluid p-4">
    <!-- Header Section -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card border-0 shadow-sm overflow-hidden">
          <div class="card-body p-0">
            <div class="bg-primary p-4 text-white d-flex align-items-center">
              <div
                class="avatar-circle bg-white text-primary fw-bold shadow me-4"
              >
                {{ userInitials }}
              </div>
              <div>
                <h2 class="fw-bold mb-1">{{ user.name }}</h2>
                <div class="d-flex align-items-center opacity-75">
                  <Mail :size="16" class="me-2" />
                  <span>{{ user.email }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left Column: Personal & Company Info -->
      <div class="col-md-6 col-lg-5">
        <!-- Personal Information -->
        <div class="card border-0 shadow-sm mb-4 h-100">
          <div class="card-header bg-white border-bottom-0 pt-4 pb-0">
            <h5 class="fw-bold text-primary d-flex align-items-center">
              <User class="me-2" :size="20" /> Informations Personnelles
            </h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li
                class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-bottom"
              >
                <span class="text-muted d-flex align-items-center">
                  <Hash :size="16" class="me-2" /> ID Utilisateur
                </span>
                <span class="fw-medium">{{ user.id }}</span>
              </li>
              <li
                class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-bottom"
              >
                <span class="text-muted d-flex align-items-center">
                  <Mail :size="16" class="me-2" /> Email
                </span>
                <span class="fw-medium">{{ user.email }}</span>
              </li>
              <!-- Add created_at if available -->
              <li
                v-if="user.created_at"
                class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-0"
              >
                <span class="text-muted d-flex align-items-center">
                  <Calendar :size="16" class="me-2" /> Date d'inscription
                </span>
                <span class="fw-medium">{{
                  new Date(user.created_at).toLocaleDateString()
                }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Right Column: Professional Info -->
      <div class="col-md-6 col-lg-7">
        <!-- Company Information -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white border-bottom-0 pt-4 pb-0">
            <h5 class="fw-bold text-primary d-flex align-items-center">
              <Building class="me-2" :size="20" /> Entreprise
            </h5>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center p-3 rounded bg-light">
              <div
                class="rounded-circle bg-white p-2 text-primary shadow-sm me-3"
              >
                <Building :size="24" />
              </div>
              <div>
                <div class="small text-muted text-uppercase fw-bold">
                  Nom de l'entreprise
                </div>
                <div class="fs-5 fw-bold">{{ companyName }}</div>
              </div>
              <div class="ms-auto" v-if="user.company_id">
                <span class="badge bg-secondary"
                  >ID: {{ user.company_id }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Roles and Permissions -->
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom-0 pt-4 pb-0">
            <h5 class="fw-bold text-primary d-flex align-items-center">
              <Shield class="me-2" :size="20" /> Rôles et Permissions
            </h5>
          </div>
          <div class="card-body">
            <div class="mb-4">
              <h6 class="text-uppercase text-muted small fw-bold mb-3">
                Rôles Assignés
              </h6>
              <div v-if="allRoles.length > 0" class="d-flex flex-wrap gap-2">
                <span
                  v-for="role in allRoles"
                  :key="role.id"
                  class="badge bg-primary fs-6 px-3 py-2 rounded-pill"
                >
                  {{ role.name }}
                </span>
              </div>
              <div v-else class="text-muted fst-italic">Aucun rôle assigné</div>
            </div>

            <div v-if="allPermissions.length > 0">
              <h6 class="text-uppercase text-muted small fw-bold mb-3">
                Permissions Actives
              </h6>
              <div class="d-flex flex-wrap gap-2">
                <span
                  v-for="(perm, index) in allPermissions"
                  :key="index"
                  class="badge bg-light text-dark border fw-normal"
                >
                  {{ perm }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.card {
  transition: transform 0.2s ease-in-out;
}
</style>
