import { reactive } from 'vue';

const state = reactive({
  toasts: [],
});

let idCounter = 0;

export function useToast() {
  const addToast = (message, type = 'info', duration = 4000) => {
    const id = ++idCounter;
    state.toasts.push({ id, message, type });
    setTimeout(() => {
      state.toasts = state.toasts.filter((t) => t.id !== id);
    }, duration);
  };

  const success = (message) => addToast(message, 'success');
  const error = (message) => addToast(message, 'danger');
  const warning = (message) => addToast(message, 'warning');
  const info = (message) => addToast(message, 'info');

  return { toasts: state.toasts, success, error, warning, info, addToast };
}
