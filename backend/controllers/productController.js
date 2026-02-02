import db from '../config/database.js';
import { Op } from 'sequelize';

const { Product, StockHistory } = db.models;

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

    // Build where clause
    const where = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (lowStock === 'true') {
      where[Op.where] = db.sequelize.where(
        db.sequelize.col('stock'),
        Op.lte,
        db.sequelize.col('minStock')
      );
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Sort
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    const order_by = [[sortBy, sortOrder]];

    const products = await Product.findAll({
      where,
      order: order_by,
    });

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
    const product = await Product.findByPk(req.params.id);

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
        productId: product.id,
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

    if (error.name === 'SequelizeUniqueConstraintError') {
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
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const previousStock = product.stock;
    await product.update(req.body);

    // If stock changed, create history
    if (req.body.stock !== undefined && req.body.stock !== previousStock) {
      const stockDiff = req.body.stock - previousStock;
      await StockHistory.create({
        productId: product.id,
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
      data: product,
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
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await product.destroy();

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
    const products = await Product.findAll({
      where: db.sequelize.where(
        db.sequelize.col('stock'),
        Op.lte,
        db.sequelize.col('minStock')
      ),
      isActive: true,
      order: [['stock', 'ASC']],
    });

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

    const where = productId ? { productId } : {};

    const history = await StockHistory.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      include: [{
        model: Product,
        attributes: ['id', 'name', 'sku'],
      }],
    });

    res.json({
      success: true,
      count: history.length,
      data: history.map(h => ({
        id: h.id,
        product: h.Product,
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
    const totalProducts = await Product.count({ where: { isActive: true } });
    const lowStockCount = await Product.count({
      where: db.sequelize.where(
        db.sequelize.col('stock'),
        Op.lte,
        db.sequelize.col('minStock')
      ),
      isActive: true,
    });

    const products = await Product.findAll({ where: { isActive: true } });

    const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    const totalRetailValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

    // Get categories
    const categories = await db.sequelize.query(
      'SELECT DISTINCT category FROM Products'
    );

    const categoryList = categories[0].map(c => c.category);

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        totalStockValue,
        totalRetailValue,
        totalItems,
        categories: categoryList.length,
        categoryList,
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

    const product = await Product.findByPk(req.params.id);

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
      productId: product.id,
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
