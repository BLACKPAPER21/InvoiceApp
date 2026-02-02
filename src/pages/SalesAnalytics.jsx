import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  FileText,
  Package,
  Calendar,
  Download,
  FileDown,
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function SalesAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // 7, 30, 90 days

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/invoices/analytics?period=${period}`);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatCompactCurrency = (value) => {
    // Format compact untuk chart axis
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(0)}K`;
    }
    return `Rp ${value}`;
  };

  const handleExportReport = () => {
    if (!analytics) return;

    // Create CSV content
    const csvContent = [
      // Header
      ['Sales Analytics Report'],
      [`Period: Last ${period} Days`],
      [`Generated: ${new Date().toLocaleString('id-ID')}`],
      [''],
      // Summary Section
      ['SUMMARY'],
      ['Metric', 'Value'],
      ['Total Revenue', formatCurrency(analytics.summary.totalRevenue)],
      ['Total Invoices', analytics.summary.totalInvoices],
      ['Paid Invoices', analytics.summary.paidInvoices],
      ['Pending Invoices', analytics.summary.pendingInvoices],
      ['Overdue Invoices', analytics.summary.overdueInvoices],
      ['Average Invoice Value', formatCurrency(analytics.summary.avgInvoiceValue)],
      ['Total Items Sold', analytics.summary.totalItemsSold],
      ['Revenue Growth', `${analytics.summary.revenueGrowth}%`],
      [''],
      // Revenue Trend
      ['REVENUE TREND'],
      ['Date', 'Revenue'],
      ...analytics.revenueTrend.map(item => [item.date, item.revenue]),
      [''],
      // Top Products
      ['TOP SELLING PRODUCTS'],
      ['Product Name', 'Quantity Sold', 'Revenue'],
      ...analytics.topProducts.map(item => [item.name, item.quantity, item.revenue]),
      [''],
      // Recent Transactions
      ['RECENT TRANSACTIONS'],
      ['Invoice ID', 'Client', 'Date', 'Amount', 'Status'],
      ...analytics.recentTransactions.map(item => [
        item.id,
        item.clientName,
        item.dateIssued,
        item.total,
        item.status
      ])
    ];

    // Convert to CSV string
    const csv = csvContent.map(row => row.join(',')).join('\n');

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `sales-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!analytics) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const lineHeight = 7;
    const cellPadding = 3;

    // Helper function to draw a simple table
    const drawTable = (columns, rows, startY, columnWidths) => {
      let currentY = startY;
      const pageHeight = doc.internal.pageSize.getHeight();

      // Draw header
      doc.setFillColor(30, 58, 138);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');

      let xPos = margin;
      columns.forEach((col, idx) => {
        doc.rect(xPos, currentY, columnWidths[idx], lineHeight, 'F');
        doc.text(col, xPos + cellPadding, currentY + cellPadding + 2);
        xPos += columnWidths[idx];
      });

      currentY += lineHeight;

      // Draw rows
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);

      rows.forEach((row, rowIdx) => {
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = 20;
        }

        // Alternate row colors
        if (rowIdx % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          xPos = margin;
          columns.forEach((_, idx) => {
            doc.rect(xPos, currentY, columnWidths[idx], lineHeight, 'F');
            xPos += columnWidths[idx];
          });
        }

        xPos = margin;
        row.forEach((cell, idx) => {
          doc.text(String(cell).substring(0, 30), xPos + cellPadding, currentY + cellPadding + 2);
          xPos += columnWidths[idx];
        });

        currentY += lineHeight;
      });

      return currentY;
    };

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('Sales Analytics Report', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: Last ${period} Days`, margin, yPosition);
    yPosition += 5;
    doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, margin, yPosition);
    yPosition += 15;

    // Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', margin, yPosition);
    yPosition += 8;
    doc.setFont(undefined, 'normal');

    const summaryData = [
      ['Metric', 'Value'],
      ['Total Revenue', formatCurrency(analytics.summary.totalRevenue)],
      ['Total Invoices', analytics.summary.totalInvoices.toString()],
      ['Paid Invoices', analytics.summary.paidInvoices.toString()],
      ['Pending Invoices', analytics.summary.pendingInvoices.toString()],
      ['Overdue Invoices', analytics.summary.overdueInvoices.toString()],
      ['Average Invoice Value', formatCurrency(analytics.summary.avgInvoiceValue)],
      ['Total Items Sold', analytics.summary.totalItemsSold.toString()],
      ['Revenue Growth', `${analytics.summary.revenueGrowth}%`],
    ];

    yPosition = drawTable(
      summaryData[0],
      summaryData.slice(1),
      yPosition,
      [70, 80]
    ) + 10;

    // Top Products Section
    if (analytics.topProducts.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Top Selling Products', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');

      const productsData = [
        ['Product Name', 'Quantity', 'Revenue'],
        ...analytics.topProducts.map(p => [
          p.name,
          p.quantity.toString(),
          formatCurrency(p.revenue)
        ])
      ];

      yPosition = drawTable(
        productsData[0],
        productsData.slice(1),
        yPosition,
        [60, 35, 75]
      ) + 10;
    }

    // Recent Transactions
    if (analytics.recentTransactions.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Recent High-Value Transactions', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');

      const transactionsData = [
        ['Invoice ID', 'Client', 'Date', 'Amount', 'Status'],
        ...analytics.recentTransactions.slice(0, 8).map(t => [
          t.id,
          t.clientName,
          new Date(t.dateIssued).toLocaleDateString('id-ID'),
          formatCurrency(t.total),
          t.status
        ])
      ];

      drawTable(
        transactionsData[0],
        transactionsData.slice(1),
        yPosition,
        [35, 35, 30, 50, 25]
      );
    }

    // Footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`sales-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy">Sales Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive sales and revenue insights</p>
        </div>
        <div className="flex gap-3">
          {/* Period Filter */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <button className="btn-secondary flex items-center gap-2" onClick={handleExportPDF}>
            <FileDown className="w-4 h-4" />
            Export as PDF
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={handleExportReport}>
            <Download className="w-4 h-4" />
            Export as CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {formatCurrency(analytics?.summary?.totalRevenue || 0)}
              </p>
              <p className="text-xs text-green-600 mt-2">
                +{analytics?.summary?.revenueGrowth || 0}% from last period
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Invoices</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {analytics?.summary?.totalInvoices || 0}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                {analytics?.summary?.paidInvoices || 0} paid,{' '}
                {analytics?.summary?.pendingInvoices || 0} pending
              </p>
            </div>
            <FileText className="w-12 h-12 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Avg Invoice Value</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {formatCurrency(analytics?.summary?.avgInvoiceValue || 0)}
              </p>
              <p className="text-xs text-purple-600 mt-2">Per transaction</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Items Sold</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">
                {analytics?.summary?.totalItemsSold || 0}
              </p>
              <p className="text-xs text-orange-600 mt-2">Across all invoices</p>
            </div>
            <Package className="w-12 h-12 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={analytics?.revenueTrend || []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatCompactCurrency} width={80} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#1e3a8a"
                strokeWidth={2}
                dot={{ fill: '#1e3a8a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.statusDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {(analytics?.statusDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Top Selling Products
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={analytics?.topProducts || []}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatCompactCurrency} width={80} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="quantity" fill="#1e3a8a" name="Quantity Sold" />
            <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent High-Value Transactions */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-navy flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent High-Value Transactions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(analytics?.recentTransactions || []).map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.dateIssued).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(transaction.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
