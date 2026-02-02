import InvoiceModel from './Invoice.js';
import ProductModel from './Product.js';
import StockHistoryModel from './StockHistory.js';

export default (sequelize) => {
  const Invoice = InvoiceModel(sequelize);
  const Product = ProductModel(sequelize);
  const StockHistory = StockHistoryModel(sequelize);

  // Define associations
  StockHistory.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product',
  });

  Product.hasMany(StockHistory, {
    foreignKey: 'productId',
    as: 'stockHistory',
  });

  return {
    Invoice,
    Product,
    StockHistory,
  };
};
