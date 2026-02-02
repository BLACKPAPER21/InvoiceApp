import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import StockHistory from '../models/StockHistory.js';

// Get all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message,
    });
  }
};

// Get single invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ id: req.params.id });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message,
    });
  }
};

// Create new invoice
export const createInvoice = async (req, res) => {
  try {
    console.log('=== CREATE INVOICE REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!req.body.clientName || !req.body.clientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Client name and email are required',
      });
    }

    if (!req.body.dateIssued || !req.body.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Date issued and due date are required',
      });
    }

    if (!req.body.items || req.body.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required',
      });
    }

    // Generate unique invoice ID with timestamp to avoid duplicates
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const count = await Invoice.countDocuments();
    const invoiceId = `INV-${year}-${String(count + 1).padStart(3, '0')}-${timestamp}`;

    const invoiceData = {
      ...req.body,
      id: invoiceId,
    };

    console.log('Attempting to create invoice with ID:', invoiceId);
    const invoice = await Invoice.create(invoiceData);
    console.log('✅ Invoice created successfully:', invoice.id);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
    });
  } catch (error) {
    console.error('=== ERROR CREATING INVOICE ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    console.error('Full error:', error);

    res.status(400).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message,
      details: error.errors || null,
    });
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating invoice',
      error: error.message,
    });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ id: req.params.id });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error.message,
    });
  }
};

// Get invoice statistics
export const getInvoiceStats = async (req, res) => {
  try {
    const invoices = await Invoice.find();

    const stats = {
      totalRevenue: invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0),
      pendingCount: invoices.filter((inv) => inv.status === 'pending').length,
      paidCount: invoices.filter((inv) => inv.status === 'paid').length,
      overdueCount: invoices.filter((inv) => inv.status === 'overdue').length,
      totalInvoices: invoices.length,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};

// Mark invoice as paid and deduct stock
export const markInvoiceAsPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid',
      });
    }

    // Deduct stock for each item
    for (const item of invoice.items) {
      if (item.productId && !item.stockDeducted) {
        const product = await Product.findById(item.productId);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product not found: ${item.desc}`,
          });
        }

        if (product.stock < item.qty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.qty}`,
          });
        }

        // Deduct stock
        const previousStock = product.stock;
        product.stock -= item.qty;
        await product.save();

        // Create stock history
        await StockHistory.create({
          productId: product._id,
          type: 'OUT',
          quantity: item.qty,
          previousStock,
          newStock: product.stock,
          reference: invoice.id,
          referenceType: 'invoice',
          notes: `Sold via invoice ${invoice.id} to ${invoice.clientName}`,
          createdBy: 'system',
        });

        // Mark as deducted
        item.stockDeducted = true;
      }
    }

    // Update invoice status
    invoice.status = 'paid';
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice marked as paid and stock deducted',
      data: invoice,
    });
  } catch (error) {
    console.error('Mark invoice as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark invoice as paid',
      error: error.message,
    });
  }
};

// Cancel invoice and return stock
export const cancelInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Return stock for items that were deducted
    for (const item of invoice.items) {
      if (item.productId && item.stockDeducted) {
        const product = await Product.findById(item.productId);

        if (product) {
          // Return stock
          const previousStock = product.stock;
          product.stock += item.qty;
          await product.save();

          // Create stock history
          await StockHistory.create({
            productId: product._id,
            type: 'IN',
            quantity: item.qty,
            previousStock,
            newStock: product.stock,
            reference: invoice.id,
            referenceType: 'invoice',
            notes: `Invoice ${invoice.id} cancelled - stock returned`,
            createdBy: 'system',
          });

          // Mark as not deducted
          item.stockDeducted = false;
        }
      }
    }

    // Delete invoice
    await Invoice.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Invoice cancelled and stock returned',
    });
  } catch (error) {
    console.error('Cancel invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel invoice',
      error: error.message,
    });
  }
};
// Add this to the end of invoiceController.js

// Get sales analytics
export const getSalesAnalytics = async (req, res) => {
  try {
    const { period = 30 } = req.query; // days
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all invoices in period
    const invoices = await Invoice.find({
      dateIssued: { $gte: startDate.toISOString().split('T')[0] },
    });

    // Summary statistics
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalItemsSold = paidInvoices.reduce((sum, inv) => {
      return sum + inv.items.reduce((itemSum, item) => itemSum + item.qty, 0);
    }, 0);

    // Revenue trend (group by date)
    const revenueTrend = {};
    paidInvoices.forEach((inv) => {
      const date = inv.dateIssued;
      revenueTrend[date] = (revenueTrend[date] || 0) + inv.total;
    });

    const revenueTrendArray = Object.keys(revenueTrend)
      .sort()
      .map((date) => ({
        date: new Date(date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        }),
        revenue: revenueTrend[date],
      }));

    // Status distribution
    const statusCounts = {
      paid: invoices.filter((inv) => inv.status === 'paid').length,
      pending: invoices.filter((inv) => inv.status === 'pending').length,
      overdue: invoices.filter((inv) => inv.status === 'overdue').length,
    };

    const statusDistribution = [
      { name: 'Paid', value: statusCounts.paid },
      { name: 'Pending', value: statusCounts.pending },
      { name: 'Overdue', value: statusCounts.overdue },
    ].filter((item) => item.value > 0);

    // Top products
    const productStats = {};
    paidInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const key = item.desc;
        if (!productStats[key]) {
          productStats[key] = { name: key, quantity: 0, revenue: 0 };
        }
        productStats[key].quantity += item.qty;
        productStats[key].revenue += item.qty * item.price;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent high-value transactions
    const recentTransactions = invoices
      .sort((a, b) => new Date(b.dateIssued) - new Date(a.dateIssued))
      .slice(0, 10)
      .map((inv) => ({
        id: inv.id,
        clientName: inv.clientName,
        dateIssued: inv.dateIssued,
        total: inv.total,
        status: inv.status,
      }));

    // Calculate growth (compare with previous period)
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysAgo);
    const prevInvoices = await Invoice.find({
      dateIssued: {
        $gte: prevStartDate.toISOString().split('T')[0],
        $lt: startDate.toISOString().split('T')[0],
      },
      status: 'paid',
    });
    const prevRevenue = prevInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const revenueGrowth =
      prevRevenue > 0 ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalInvoices: invoices.length,
          paidInvoices: statusCounts.paid,
          pendingInvoices: statusCounts.pending,
          overdueInvoices: statusCounts.overdue,
          avgInvoiceValue: paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0,
          totalItemsSold,
          revenueGrowth,
        },
        revenueTrend: revenueTrendArray,
        statusDistribution,
        topProducts,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics',
      error: error.message,
    });
  }
};
