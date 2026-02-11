import 'pg';              // Force Vercel bundler to include pg (Sequelize loads it dynamically)
import 'pg-hstore';       // Same for pg-hstore
import app from '../backend/server.js';
import sequelize from '../backend/config/database.js';

export default async function handler(req, res) {
  try {
    // Ensure database is connected and synced (essential for serverless cold starts)
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
  } catch (error) {
    console.error('Database Connection/Sync Error:', error);
    // Set CORS headers so the frontend can read the error
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return res.status(500).json({
      success: false,
      message: 'Database Connection/Sync Error',
      error: error.message,
      stack: error.stack
    });
  }

  return app(req, res);
}
