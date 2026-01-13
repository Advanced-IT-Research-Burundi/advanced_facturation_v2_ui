import { createStore } from "vuex";
import auth from "./modules/auth";
import companies from "./modules/companies";
import invoices from "./modules/invoices";
import clients from "./modules/clients"; 
import users from "./modules/users";
const store = createStore({
  state: {
    data: {},
  },
  modules: {
    auth,
    companies,
    invoices,
    clients,
    users,
  },
});

export default store;
