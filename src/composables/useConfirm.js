import { reactive } from 'vue';

const state = reactive({
  visible: false,
  title: '',
  message: '',
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  confirmClass: 'btn-danger',
  resolve: null,
});

export function useConfirm() {
  const confirm = (message, options = {}) => {
    return new Promise((resolve) => {
      state.visible = true;
      state.message = message;
      state.title = options.title || 'Confirmation';
      state.confirmText = options.confirmText || 'Confirmer';
      state.cancelText = options.cancelText || 'Annuler';
      state.confirmClass = options.confirmClass || 'btn-danger';
      state.resolve = resolve;
    });
  };

  const handleConfirm = () => {
    state.visible = false;
    if (state.resolve) state.resolve(true);
  };

  const handleCancel = () => {
    state.visible = false;
    if (state.resolve) state.resolve(false);
  };

  return { state, confirm, handleConfirm, handleCancel };
}
