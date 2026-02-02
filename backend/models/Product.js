import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sku: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      category: {
        type: DataTypes.STRING,
        defaultValue: 'General',
      },
      unit: {
        type: DataTypes.ENUM('pcs', 'kg', 'liter', 'meter', 'box', 'pack'),
        defaultValue: 'pcs',
      },
      price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      cost: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      minStock: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
      },
      location: {
        type: DataTypes.STRING,
        defaultValue: 'Main Warehouse',
      },
      supplier: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      image: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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

  return Product;
};
