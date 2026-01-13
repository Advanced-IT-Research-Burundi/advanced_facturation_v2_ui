import { createStore } from "vuex";
import auth from "./modules/auth";
import companies from "./modules/companies";
import invoices from "./modules/invoices";

const store = createStore({
  state: {
    data: {},
  },
  modules: {
    auth,
    companies,
    invoices,
  },
});

export default store;
