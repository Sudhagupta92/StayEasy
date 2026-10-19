import apiClient from './api';

export const ledgerService = {
  /**
   * Create a new monthly rent invoice for an active resident (OWNER / ADMIN)
   */
  createRentInvoice: async (invoiceData) => {
    return await apiClient.post('/ledger/invoice', invoiceData);
  },

  /**
   * Get tenant digital rent ledger statement & history
   */
  getTenantLedger: async () => {
    return await apiClient.get('/ledger/my-ledger');
  },

  /**
   * Get owner collection ledger & invoices statement
   */
  getOwnerLedger: async () => {
    return await apiClient.get('/ledger/owner-ledger');
  },

  /**
   * Pay monthly rent invoice online (Tenant action)
   */
  payRentInvoice: async (id, paymentData = {}) => {
    return await apiClient.post(`/ledger/${id}/pay`, paymentData);
  },

  /**
   * Mark rent invoice as paid offline (Landlord action)
   */
  markInvoicePaid: async (id, paymentData = {}) => {
    return await apiClient.patch(`/ledger/${id}/mark-paid`, paymentData);
  },

  /**
   * Tenant submits formal move-out notice
   */
  serveMoveOutNotice: async (noticeData) => {
    return await apiClient.post('/ledger/notice', noticeData);
  },

  /**
   * Get single invoice & printable digital rent receipt details
   */
  getInvoiceById: async (id) => {
    return await apiClient.get(`/ledger/invoice/${id}`);
  },
};

export default ledgerService;
