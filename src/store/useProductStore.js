import { create } from 'zustand';
import { productAPI } from '../services/api';

const useProductStore = create((set, get) => ({
  // State
  products: [],
  currentProduct: null,
  stats: null,
  lowStockProducts: [],
  loading: false,
  error: null,

  // Actions
  fetchProducts: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await productAPI.getAll(filters);
      set({ products: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchProductById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await productAPI.getById(id);
      set({ currentProduct: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createProduct: async (productData) => {
    set({ loading: true, error: null });
    try {
      const response = await productAPI.create(productData);
      const products = get().products;
      set({
        products: [response.data, ...products],
        loading: false,
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    set({ loading: true, error: null });
    try {
      const response = await productAPI.update(id, productData);
      const products = get().products.map((p) =>
        p._id === id ? response.data : p
      );
      set({ products, currentProduct: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      await productAPI.delete(id);
      const products = get().products.filter((p) => p._id !== id);
      set({ products, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await productAPI.getStats();
      set({ stats: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchLowStock: async () => {
    set({ loading: true, error: null });
    try {
      const response = await productAPI.getLowStock();
      set({ lowStockProducts: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  adjustStock: async (id, adjustmentData) => {
    set({ loading: true, error: null });
    try {
      const response = await productAPI.adjustStock(id, adjustmentData);
      const products = get().products.map((p) =>
        p._id === id ? response.data : p
      );
      set({ products, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  searchProducts: async (query) => {
    set({ loading: true, error: null });
    try {
      const response = await productAPI.search(query);
      set({ products: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentProduct: () => set({ currentProduct: null }),
}));

export default useProductStore;
