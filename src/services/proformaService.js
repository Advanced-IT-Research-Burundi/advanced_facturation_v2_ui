import api from "@/services/api";

export default {
  /**
   * Fetch all invoices (can be filtered by type/action via params if backend supports it)
   * The user's current controller seems to return a paginated list of ALL invoices.
   * We will pass params hoping the backend will eventually support them, or we filter on frontend.
   */
  getProformas(page = 1) {
    // Assuming we want only Proforma (FP) and Service invoices
    // If backend ignores params, we get everything and might need client-side filtering (handled in store/component for now)
    return api.get(`/invoices?page=${page}&invoice_type=FP&invoice_action=SERVICE`);
  },

  /**
   * Create a new Proforma
   * @param {Object} data 
   */
  createProforma(data) {
    // Construct payload strictly matching the store() method validation
    // 'invoice_type', 'invoice_action', 'invoice_currency', 'customer_id', 'items', etc.
    const payload = {
        invoice_type: 'FP', // Facture Proforma
        invoice_action: 'SERVICE',
        invoice_currency: data.currency || 'BIF',
        customer_id: data.customer_id,
        items: data.items.map(item => ({
            product_id: null, // Not needed for SERVICE action usually, or nullable
            item_designation: item.description,
            item_quantity: item.quantity,
            item_price: item.price, // Unit Price
            vat: item.tvaRate, // VAT Rate %
            // Optional fields if needed
            item_ct: 0,
            item_tl: 0
        })),
        // Optional fields
        obr_submission_status: 'PENDING' 
    };
    return api.post("/invoices", payload);
  },

  /**
   * Update an existing Proforma
   * @param {Number} id 
   * @param {Object} data 
   */
  updateProforma(id, data) {
    // The update() method validates: invoice_number, date, type, identifier, currency, status, response, signature...
    // It seems the 'items' are NOT updateable via the main PUT /invoices/{id} endpoint based on the controller snippet provided?
    // The controller update() only has validation for invoice fields, not items.
    // Usually one would need to update items specifically or the backend handles sync.
    // For now we will send what we can.
    return api.put(`/invoices/${id}`, data);
  },

  /**
   * Delete a Proforma
   * @param {Number} id 
   */
  deleteProforma(id) {
    return api.delete(`/invoices/${id}`);
  }
};
