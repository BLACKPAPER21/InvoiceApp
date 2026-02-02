import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    unit: {
      type: String,
      enum: ['pcs', 'kg', 'liter', 'meter', 'box', 'pack'],
      default: 'pcs',
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price cannot be negative'],
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    minStock: {
      type: Number,
      default: 10,
      min: [0, 'Minimum stock cannot be negative'],
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Warehouse',
    },
    supplier: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.minStock;
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function () {
  if (this.cost === 0) return 0;
  return ((this.price - this.cost) / this.cost * 100).toFixed(2);
});

// Ensure virtuals are included when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Index for search
productSchema.index({ name: 'text', sku: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
