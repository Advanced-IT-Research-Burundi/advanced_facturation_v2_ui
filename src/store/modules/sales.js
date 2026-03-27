import api from "@/services/api";

const state = {
  // Partie POS
  cart: [],

  // Partie Facture de Service
  // TVA rate should come from the product or company config
  serviceItems: [{ description: "", quantity: 1, price: 0, tvaRate: 0 }],

  // Métadonnées communes
  invoiceForm: {
    customerId: null,
    paymentType: "",
    currency: "BIF",
  },

  loading: false,
};

const getters = {
  // Getters POS
  cartTotal: (state) =>
    state.cart.reduce((total, item) => total + item.price * item.quantity, 0),

  // Getters Service (Calculs automatiques demandés)
  serviceTotals: (state) => {
    let totalTva = 0;
    let totalHt = 0;
    state.serviceItems.forEach((item) => {
      const rowHt =
        (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
      totalHt += rowHt;
      totalTva += rowHt * ((parseFloat(item.tvaRate) || 0) / 100);
    });
    return {
      totalHt,
      totalTva,
      totalTtc: totalHt + totalTva,
    };
  },
};

const actions = {
  // Action pour enregistrer une facture (POS ou Service)
  async submitInvoice({ state, commit, getters }, type = "service") {
    commit("SET_LOADING", true);
    try {
      const payload = {
        type: type,
        customer_id: state.invoiceForm.customerId,
        payment_type: state.invoiceForm.paymentType,
        currency: state.invoiceForm.currency,
        items: type === "POS" ? state.cart : state.serviceItems,
        totals:
          type === "POS" ? { ttc: getters.cartTotal } : getters.serviceTotals,
      };

      const response = await api.post("/sales", payload);
      if (response.data.success) {
        commit("RESET_SALES");
        return response.data;
      }
    } catch (error) {
      throw error.response ? error.response.data : error;
    } finally {
      commit("SET_LOADING", false);
    }
  },
};

const mutations = {
  // Mutations POS
  ADD_TO_CART(state, product) {
    const item = state.cart.find((i) => i.id === product.id);
    if (item) item.quantity++;
    else state.cart.push({ ...product, quantity: 1 });
  },
  REMOVE_FROM_CART(state, productId) {
    state.cart = state.cart.filter((i) => i.id !== productId);
  },
  UPDATE_CART_QTY(state, { id, delta }) {
    const item = state.cart.find((i) => i.id === id);
    if (item && item.quantity + delta > 0) item.quantity += delta;
  },

  // Mutations Service (Image 1 & 2)
  ADD_SERVICE_ROW(state) {
    state.serviceItems.push({
      description: "",
      quantity: 1,
      price: 0,
      tvaRate: 0,
    });
  },
  REMOVE_SERVICE_ROW(state, index) {
    if (state.serviceItems.length > 1) state.serviceItems.splice(index, 1);
    else
      state.serviceItems[0] = {
        description: "",
        quantity: 1,
        price: 0,
        tvaRate: 0,
      };
  },
  UPDATE_SERVICE_ITEM(state, { index, field, value }) {
    state.serviceItems[index][field] = value;
  },
  SET_FORM_FIELD(state, { field, value }) {
    state.invoiceForm[field] = value;
  },

  SET_LOADING(state, status) {
    state.loading = status;
  },
  RESET_SALES(state) {
    state.cart = [];
    state.serviceItems = [
      { description: "", quantity: 1, price: 0, tvaRate: 0 },
    ];
    state.invoiceForm = { customerId: null, paymentType: "", currency: "BIF" };
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
