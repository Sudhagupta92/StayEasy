import apiClient from './api';

export const paymentService = {
  createOrder: async (data) => {
    const response = await apiClient.post('/payments/create-order', data);
    return response.data;
  },

  verifyPayment: async (data) => {
    const response = await apiClient.post('/payments/verify', data);
    return response.data;
  },

  getTransactions: async (params) => {
    const response = await apiClient.get('/payments/transactions', { params });
    return response.data;
  },

  getReceipt: async (receiptNumber) => {
    const response = await apiClient.get(`/payments/receipt/${receiptNumber}`);
    return response.data;
  },

  getTenantFinance: async () => {
    const response = await apiClient.get('/payments/finance/tenant');
    return response.data;
  },

  getOwnerFinance: async () => {
    const response = await apiClient.get('/payments/finance/owner');
    return response.data;
  },

  getAdminFinance: async () => {
    const response = await apiClient.get('/payments/finance/admin');
    return response.data;
  },

  processRefund: async (data) => {
    const response = await apiClient.post('/payments/refund', data);
    return response.data;
  },

  processPayout: async (data) => {
    const response = await apiClient.post('/payments/owner/payout', data);
    return response.data;
  },

  triggerWebhook: async (data) => {
    const response = await apiClient.post('/payments/webhook', data);
    return response.data;
  },
};

export default paymentService;
