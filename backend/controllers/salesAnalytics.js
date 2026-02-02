import db from '../config/database.js';

const { Invoice } = db.models;

// Get sales analytics
export const getSalesAnalytics = async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all invoices in period
    const invoices = await Invoice.findAll({
      where: {
        dateIssued: {
          [db.Sequelize.Op.gte]: startDate.toISOString().split('T')[0],
        },
      },
    });

    // Summary statistics
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
    const totalItemsSold = paidInvoices.reduce((sum, inv) => {
      const items = inv.items || [];
      return sum + items.reduce((itemSum, item) => itemSum + (item.qty || 0), 0);
    }, 0);

    // Revenue trend
    const revenueTrend = {};
    paidInvoices.forEach((inv) => {
      const date = inv.dateIssued;
      revenueTrend[date] = (revenueTrend[date] || 0) + parseFloat(inv.total || 0);
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
      const items = inv.items || [];
      items.forEach((item) => {
        const key = item.desc;
        if (!productStats[key]) {
          productStats[key] = { name: key, quantity: 0, revenue: 0 };
        }
        productStats[key].quantity += item.qty || 0;
        productStats[key].revenue += (item.qty || 0) * (item.price || 0);
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent transactions
    const recentTransactions = invoices
      .sort((a, b) => new Date(b.dateIssued) - new Date(a.dateIssued))
      .slice(0, 10)
      .map((inv) => ({
        id: inv.invoiceId,
        clientName: inv.clientName,
        dateIssued: inv.dateIssued,
        total: inv.total,
        status: inv.status,
      }));

    // Calculate growth
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysAgo);
    const prevInvoices = await Invoice.findAll({
      where: {
        dateIssued: {
          [db.Sequelize.Op.gte]: prevStartDate.toISOString().split('T')[0],
          [db.Sequelize.Op.lt]: startDate.toISOString().split('T')[0],
        },
        status: 'paid',
      },
    });
    const prevRevenue = prevInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
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
