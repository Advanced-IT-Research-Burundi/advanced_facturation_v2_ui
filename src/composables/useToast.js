import { useToast as usePrimeVueToast } from 'primevue/usetoast';

const summaries = {
  success: 'Succès',
  error: 'Erreur',
  Warn: 'Attention',
  info: 'Information',
};

const normalizeSeverity = (type) => {
  if (type === 'danger') return 'error';
  return summaries[type] ? type : 'info';
};

export function useToast() {
  const primeToast = usePrimeVueToast();

  const addToast = (message, type = 'info', duration = 4000) => {
    const severity = normalizeSeverity(type);
    primeToast.add({
      severity,
      summary: summaries[severity],
      detail: message,
      life: duration,
    });
  };

  const success = (message, duration) => addToast(message, 'success', duration);
  const error = (message, duration) => addToast(message, 'error', duration);
  const warning = (message, duration) => addToast(message, 'warning', duration);
  const info = (message, duration) => addToast(message, 'info', duration);

  return { success, error, warning, info, addToast };
}
