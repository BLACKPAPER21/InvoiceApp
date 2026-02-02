import Product from '../models/Product.js';
import StockHistory from '../models/StockHistory.js';

// Get all products with filters
export const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      lowStock,
      isActive,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$minStock'] };
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const products = await Product.find(query).sort(sortOptions);

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
};

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
    });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    // Create initial stock history
    if (product.stock > 0) {
      await StockHistory.create({
        productId: product._id,
        type: 'IN',
        quantity: product.stock,
        previousStock: 0,
        newStock: product.stock,
        referenceType: 'manual',
        notes: 'Initial stock',
        createdBy: 'admin',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists',
      });
    }

    res.status(400).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const previousStock = product.stock;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // If stock changed, create history
    if (req.body.stock !== undefined && req.body.stock !== previousStock) {
      const stockDiff = req.body.stock - previousStock;
      await StockHistory.create({
        productId: product._id,
        type: stockDiff > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(stockDiff),
        previousStock,
        newStock: req.body.stock,
        referenceType: 'adjustment',
        notes: req.body.stockNotes || 'Manual adjustment',
        createdBy: req.body.updatedBy || 'admin',
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
};

// Get products with low stock
export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true,
    }).sort({ stock: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products',
      error: error.message,
    });
  }
};

// Get product stock history
export const getProductStockHistory = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const productId = req.params.id;

    // Build query - if no productId, get all history
    const query = productId ? { productId } : {};

    const history = await StockHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('productId', 'name sku');

    res.json({
      success: true,
      count: history.length,
      data: history.map(h => ({
        _id: h._id,
        product: h.productId,
        type: h.type,
        quantity: h.quantity,
        quantityBefore: h.previousStock,
        quantityAfter: h.newStock,
        reference: h.reference,
        referenceType: h.referenceType,
        notes: h.notes,
        createdAt: h.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock history',
      error: error.message,
    });
  }
};

// Get inventory statistics
export const getInventoryStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true,
    });

    const products = await Product.find({ isActive: true });

    const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    const totalRetailValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

    // Get categories
    const categories = await Product.distinct('category');

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        totalStockValue,
        totalRetailValue,
        totalItems,
        categories: categories.length,
        categoryList: categories,
      },
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory statistics',
      error: error.message,
    });
  }
};

// Adjust stock manually
export const adjustStock = async (req, res) => {
  try {
    const { quantity, type, notes, createdBy } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const previousStock = product.stock;
    let newStock;

    if (type === 'IN') {
      newStock = previousStock + quantity;
    } else if (type === 'OUT') {
      newStock = previousStock - quantity;
      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock',
        });
      }
    } else {
      newStock = quantity;
    }

    product.stock = newStock;
    await product.save();

    // Create stock history
    await StockHistory.create({
      productId: product._id,
      type,
      quantity: Math.abs(quantity),
      previousStock,
      newStock,
      referenceType: 'manual',
      notes: notes || 'Manual stock adjustment',
      createdBy: createdBy || 'admin',
    });

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: product,
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to adjust stock',
      error: error.message,
    });
  }
};
