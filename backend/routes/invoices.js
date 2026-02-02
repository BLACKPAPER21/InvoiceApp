import express from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
  markInvoiceAsPaid,
  cancelInvoice,
  getSalesAnalytics,
} from '../controllers/invoiceController.js';

const router = express.Router();

// Statistics route (must be before /:id)
router.get('/stats', getInvoiceStats);
router.get('/analytics', getSalesAnalytics);

// CRUD routes
router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

// Invoice actions
router.post('/:id/pay', markInvoiceAsPaid);
router.post('/:id/cancel', cancelInvoice);

export default router;
