import { createStore } from "vuex";
import auth from "./modules/auth";
import invoices from "./modules/invoices";

const store = createStore({
  state: {
    data: {
      
    }
  },
  modules: {
    auth,
    invoices,
  },
});

export default store;
