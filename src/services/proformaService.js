import api from './api';

export default {
  getProformas(page = 1) {
    return api.get(`/invoices?page=${page}&invoice_type=FP`);
  },

  createProforma(data) {
    return api.post('/invoices', data);
  },

  updateProforma(id, data) {
    return api.put(`/invoices/${id}`, data);
  },

  deleteProforma(id) {
    return api.delete(`/invoices/${id}`);
  },

  getProforma(id) {
    return api.get(`/invoices/${id}`);
  }
};
