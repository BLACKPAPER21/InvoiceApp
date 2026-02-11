import app from '../backend/server.js';
import sequelize from '../backend/config/database.js';

export default async function handler(req, res) {
  try {
    // Ensure database is connected and synced (essential for serverless cold starts)
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
  } catch (error) {
    console.error('Database Connection/Sync Error:', error);
  }

  return app(req, res);
}
