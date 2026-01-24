import Invoice from '../models/Invoice.js';

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
    // Generate unique invoice ID
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments();
    const invoiceId = `INV-${year}-${String(count + 1).padStart(3, '0')}`;

    const invoiceData = {
      ...req.body,
      id: invoiceId,
    };

    const invoice = await Invoice.create(invoiceData);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message,
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
