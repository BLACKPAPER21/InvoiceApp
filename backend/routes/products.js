import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductStockHistory,
  getInventoryStats,
  adjustStock,
} from '../controllers/productController.js';

const router = express.Router();

// Statistics route (must be before /:id)
router.get('/stats', getInventoryStats);
router.get('/low-stock', getLowStockProducts);
router.get('/stock-history', getProductStockHistory); // All stock history

// CRUD routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Stock management
router.post('/:id/adjust-stock', adjustStock);
router.get('/:id/history', getProductStockHistory); // Single product history

export default router;
