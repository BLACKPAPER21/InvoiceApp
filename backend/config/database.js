import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import initializeModels from '../models/index.js';

dotenv.config();

// Check for DATABASE_URL (standard for Vercel/Neon/Supabase)
// Neon via Vercel Storage uses POSTGRES_URL, so check both
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

let sequelize;

if (databaseUrl) {
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Required for some cloud DBs like Neon/Heroku
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // Fallback to individual env vars (useful for local dev if not using connection string)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'invoiceapp',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || 'postgres',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

// Initialize models
const models = initializeModels(sequelize);

// Export sequelize instance with models attached
sequelize.models = models;

export default sequelize;
export { Sequelize };
