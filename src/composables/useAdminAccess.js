import { computed } from "vue";
import { useStore } from "vuex";

const ADMIN_ROLE_NAMES = ["admin", "super_admin"];
const ADMIN_ROLE_LABELS = ["administrateur", "super administrateur"];

const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

export function useAdminAccess() {
  const store = useStore();

  const currentUser = computed(() => store.getters["auth/currentUser"] || getStoredUser());

  const isAdmin = computed(() => {
    const roles = currentUser.value?.roles || [];
    const roleNames = currentUser.value?.role_names || [];

    return roles.some(
      (role) =>
        ADMIN_ROLE_NAMES.includes(role?.name?.toLowerCase()) ||
        ADMIN_ROLE_LABELS.includes(role?.label?.toLowerCase()),
    ) || roleNames.some((name) => ADMIN_ROLE_NAMES.includes(name?.toLowerCase()));
  });

  return { currentUser, isAdmin };
}
