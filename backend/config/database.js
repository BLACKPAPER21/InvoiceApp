import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import initializeModels from '../models/index.js';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'invoiceapp',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Initialize models
const models = initializeModels(sequelize);

// Export sequelize instance with models attached
sequelize.models = models;

export default sequelize;
export { Sequelize };
