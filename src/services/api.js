import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:5000/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increase to 30 seconds for debugging
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response:`, response.data);
    return response;
  },
  (error) => {
    console.error('[API] Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Invoice API methods
export const invoiceAPI = {
  // Get all invoices
  getAll: async () => {
    const response = await api.get('/invoices');
    return response.data;
  },

  // Get single invoice by ID
  getById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  // Create new invoice
  create: async (invoiceData) => {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
  },

  // Update invoice
  update: async (id, invoiceData) => {
    const response = await api.put(`/invoices/${id}`, invoiceData);
    return response.data;
  },

  // Delete invoice
  delete: async (id) => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get('/invoices/stats');
    return response.data;
  },

  // Mark invoice as paid
  markAsPaid: async (id) => {
    const response = await api.post(`/invoices/${id}/pay`);
    return response.data;
  },

  // Cancel invoice
  cancel: async (id) => {
    const response = await api.post(`/invoices/${id}/cancel`);
    return response.data;
  },
};

// Product API methods
export const productAPI = {
  // Get all products
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Get single product by ID
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create new product
  create: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Update product
  update: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Get low stock products
  getLowStock: async () => {
    const response = await api.get('/products/low-stock');
    return response.data;
  },

  // Get product stock history
  getHistory: async (id, limit = 50) => {
    const response = await api.get(`/products/${id}/history`, { params: { limit } });
    return response.data;
  },

  // Get inventory statistics
  getStats: async () => {
    const response = await api.get('/products/stats');
    return response.data;
  },

  // Adjust stock
  adjustStock: async (id, adjustmentData) => {
    const response = await api.post(`/products/${id}/adjust-stock`, adjustmentData);
    return response.data;
  },

  // Search products
  search: async (query) => {
    const response = await api.get('/products', { params: { search: query } });
    return response.data;
  },
};

export default api;
