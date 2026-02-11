import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import invoiceRoutes from './routes/invoices.js';
import productRoutes from './routes/products.js';
import databaseRoutes from './routes/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Invoice API Server is running',
    version: '1.0.0',
    endpoints: {
      invoices: '/api/invoices',
      products: '/api/products',
      stats: '/api/invoices/stats',
      database: '/api/database',
    },
  });
});

app.use('/api/invoices', invoiceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/database', databaseRoutes);

// Health/Diagnostic endpoint for debugging deployment issues
app.get('/api/health', async (req, res) => {
  const envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    NODE_ENV: process.env.NODE_ENV || 'not set',
    VERCEL: !!process.env.VERCEL,
  };

  let dbStatus = 'not tested';
  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    success: true,
    message: 'Health Check',
    environment: envCheck,
    database: dbStatus,
    dialect: sequelize.getDialect(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Connect to MySQL and start server
// Connect to MySQL/Postgres and start server
const startServer = async () => {
  try {
    // Test connection and sync database
    await sequelize.authenticate();
    console.log('✅ Connected to Database');

    // Sync models with database (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synced');

    // Only listen if not running in Vercel (Vercel handles the port binding)
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📝 API Docs: http://localhost:${PORT}/api/invoices`);
        console.log(`🔥 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    // don't exit process in Vercel, might crash the function
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Start server if not in Vercel (or explicitly called)
if (process.env.NODE_ENV !== 'production') {
    startServer();
} else {
    // In production (Vercel), we might still want to ensure DB connection
    // But Vercel functions are stateless/ephemeral.
    // Usually we connect lazily or at top level.
    // We'll trust Sequelize connection pool.
    sequelize.authenticate().then(() => console.log('✅ DB Connected (Vercel)'));
}

export default app;

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await sequelize.close();
  console.log('✅ MySQL connection closed');
  process.exit(0);
});
