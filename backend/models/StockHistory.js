import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const StockHistory = sequelize.define(
    'StockHistory',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Products',
          key: 'id',
        },
      },
      type: {
        type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT'),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      previousStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      newStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reference: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      referenceType: {
        type: DataTypes.ENUM('invoice', 'purchase', 'manual', 'adjustment'),
        defaultValue: 'manual',
      },
      notes: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      createdBy: {
        type: DataTypes.STRING,
        defaultValue: 'system',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
    }
  );

  return StockHistory;
};
