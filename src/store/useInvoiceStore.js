import { create } from 'zustand';
import { invoiceAPI } from '../services/api';

export const useInvoiceStore = create((set, get) => ({
  invoices: [],
  currentInvoice: null,
  isLoading: false,
  error: null,

  // Fetch all invoices from API
  fetchInvoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await invoiceAPI.getAll();
      set({ invoices: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch invoices',
        isLoading: false
      });
      console.error('Error fetching invoices:', error);
    }
  },

  // Add new invoice
  addInvoice: async (invoice) => {
    set({ isLoading: true, error: null });
    try {
      const response = await invoiceAPI.create(invoice);
      set((state) => ({
        invoices: [response.data, ...state.invoices],
        isLoading: false
      }));
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create invoice',
        isLoading: false
      });
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  // Update existing invoice
  updateInvoice: async (id, updatedInvoice) => {
    set({ isLoading: true, error: null });
    try {
      const response = await invoiceAPI.update(id, updatedInvoice);
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? response.data : inv
        ),
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update invoice',
        isLoading: false
      });
      console.error('Error updating invoice:', error);
      throw error;
    }
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await invoiceAPI.delete(id);
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to delete invoice',
        isLoading: false
      });
      console.error('Error deleting invoice:', error);
      throw error;
    }
  },

  // Set current invoice for editing
  setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),

  // Clear current invoice
  clearCurrentInvoice: () => set({ currentInvoice: null }),

  // Clear error
  clearError: () => set({ error: null }),

  // Get summary stats
  getStats: () => {
    const invoices = get().invoices;
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    const pendingCount = invoices.filter((inv) => inv.status === 'pending').length;
    const paidCount = invoices.filter((inv) => inv.status === 'paid').length;
    const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

    return { totalRevenue, pendingCount, paidCount, overdueCount };
  },
}));
