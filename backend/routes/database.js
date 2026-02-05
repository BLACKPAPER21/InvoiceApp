import express from 'express';
import { exportDatabase, getMySQLConfig } from '../controllers/databaseController.js';

const router = express.Router();

// Export database with proper formatting (split INSERT statements)
router.get('/export', exportDatabase);

// Get MySQL configuration recommendations
router.get('/config', getMySQLConfig);

export default router;
