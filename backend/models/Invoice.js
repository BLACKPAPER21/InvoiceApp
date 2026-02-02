import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Invoice = sequelize.define(
    'Invoice',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      invoiceId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      clientName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      clientEmail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'overdue'),
        defaultValue: 'pending',
      },
      signatureImage: {
        type: DataTypes.JSON,
      },
      stampImage: {
        type: DataTypes.JSON,
      },
      authorisedPerson: {
        type: DataTypes.STRING,
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      dateIssued: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dueDate: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      items: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
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

  return Invoice;
};
