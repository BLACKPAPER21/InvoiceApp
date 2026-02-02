import mongoose from 'mongoose';

const stockHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    type: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUSTMENT'],
      required: [true, 'Transaction type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
    },
    previousStock: {
      type: Number,
      required: [true, 'Previous stock is required'],
    },
    newStock: {
      type: Number,
      required: [true, 'New stock is required'],
    },
    reference: {
      type: String,
      default: '',
      trim: true,
    },
    referenceType: {
      type: String,
      enum: ['invoice', 'purchase', 'manual', 'adjustment'],
      default: 'manual',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: String,
      default: 'system',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
stockHistorySchema.index({ productId: 1, createdAt: -1 });
stockHistorySchema.index({ reference: 1 });

const StockHistory = mongoose.model('StockHistory', stockHistorySchema);

export default StockHistory;
