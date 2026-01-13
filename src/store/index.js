import { createStore } from "vuex";
import auth from "./modules/auth";
import clients from "./modules/clients";
import invoices from "./modules/invoices";

const store = createStore({
  state: {
    data: {
      
    }
  },
  modules: {
    auth,
    clients,
    invoices,
  },
});

export default store;
