import 'pg';              // Force Vercel bundler to include pg (Sequelize loads it dynamically)
import 'pg-hstore';       // Same for pg-hstore
import app from '../backend/server.js';
import sequelize from '../backend/config/database.js';

// Cache the DB sync promise so it only runs ONCE per cold start, not every request
let dbReady = null;

function ensureDbReady() {
  if (!dbReady) {
    dbReady = sequelize.authenticate()
      .then(() => sequelize.sync()) // sync() without alter — tables already exist
      .catch((error) => {
        console.error('Database Connection/Sync Error:', error.message);
        dbReady = null; // Reset so next request retries
      });
  }
  return dbReady;
}

export default async function handler(req, res) {
  await ensureDbReady();
  return app(req, res);
}
