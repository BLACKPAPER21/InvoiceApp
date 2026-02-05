import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  MoreVertical,
  Plus,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef } from 'react';
import InvoicePreview from '../components/InvoicePreview';
import DatabaseTools from '../components/DatabaseTools';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { formatCurrency, formatDate, cn } from '../utils/helpers';

const StatusBadge = ({ status, onClick }) => {
  const variants = {
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    overdue: 'bg-rose-100 text-rose-700 border-rose-200',
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const labels = {
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
    draft: 'Draft',
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
        variants[status],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity'
      )}
      title={onClick ? 'Click to change status' : ''}
    >
      {labels[status]}
    </span>
  );
};

export default function Dashboard({ onNavigate }) {
  const { invoices, isLoading, error, fetchInvoices, clearError, deleteInvoice, updateInvoice } = useInvoiceStore();
  const stats = useInvoiceStore.getState().getStats();

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Handle view invoice
  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
  };

  // Handle download PDF
  const handleDownload = async (invoice) => {
    // Create a temporary hidden container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '800px'; // Set fixed width for consistency
    document.body.appendChild(container);

    // Import functionality dynamically or use global accessible logic
    // Since we can't easily mount a React component imperatively without proper setup,
    // we'll rely on a hidden component rendered in the JSX that we update with state.
    // However, cleaner approach: Set a 'downloadingInvoice' state that renders the Preview in a hidden div,
    // then triggers the download effect.

    setDownloadingInvoice(invoice);
  };

  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const previewRef = useRef();

  useEffect(() => {
    if (downloadingInvoice && previewRef.current) {
      const generatePDF = async () => {
        try {
          const element = previewRef.current;
          const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const imgX = (pdfWidth - imgWidth * ratio) / 2;

          pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
          pdf.save(`${downloadingInvoice.id}.pdf`);
        } catch (err) {
          console.error("PDF Generation failed", err);
          alert("Failed to generate PDF");
        } finally {
          setDownloadingInvoice(null);
        }
      };

      // Slight delay to ensure render
      setTimeout(generatePDF, 500);
    }
  }, [downloadingInvoice]);

  // Handle delete invoice
  const handleDelete = async (invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteInvoice(selectedInvoice.id);
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    } catch (error) {
      alert('Error deleting invoice: ' + error.message);
    }
  };

  // Handle status update (in modal)
  const handleStatusUpdate = async (newStatus) => {
    const previousStatus = selectedInvoice.status;

    // Optimistic update - update UI immediately
    setSelectedInvoice({ ...selectedInvoice, status: newStatus });

    // Update in invoices list immediately for smooth transition
    const updatedInvoices = invoices.map(inv =>
      inv.id === selectedInvoice.id ? { ...inv, status: newStatus } : inv
    );
    useInvoiceStore.setState({ invoices: updatedInvoices });

    try {
      // Send API request in background
      await updateInvoice(selectedInvoice.id, { status: newStatus });
    } catch (error) {
      // Rollback on error
      setSelectedInvoice({ ...selectedInvoice, status: previousStatus });
      const rollbackInvoices = invoices.map(inv =>
        inv.id === selectedInvoice.id ? { ...inv, status: previousStatus } : inv
      );
      useInvoiceStore.setState({ invoices: rollbackInvoices });
      alert('Error updating status: ' + error.message);
    }
  };

  // Quick status toggle from table (optimistic)
  const handleQuickStatusToggle = async (invoice) => {
    const statusCycle = {
      pending: 'paid',
      paid: 'overdue',
      overdue: 'pending',
    };
    const newStatus = statusCycle[invoice.status] || 'pending';
    const previousStatus = invoice.status;

    // Optimistic update - update UI immediately
    const updatedInvoices = invoices.map(inv =>
      inv.id === invoice.id ? { ...inv, status: newStatus } : inv
    );
    useInvoiceStore.setState({ invoices: updatedInvoices });

    try {
      // Send API request in background
      await updateInvoice(invoice.id, { status: newStatus });
    } catch (error) {
      // Rollback on error
      const rollbackInvoices = invoices.map(inv =>
        inv.id === invoice.id ? { ...inv, status: previousStatus } : inv
      );
      useInvoiceStore.setState({ invoices: rollbackInvoices });
      alert('Error updating status: ' + error.message);
    }
  };

  const summaryCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      bgColor: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-500/20',
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingCount,
      icon: Clock,
      bgColor: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-500/20',
    },
    {
      title: 'Paid Invoices',
      value: stats.paidCount,
      icon: CheckCircle,
      bgColor: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/20',
    },
    {
      title: 'Overdue',
      value: stats.overdueCount,
      icon: AlertCircle,
      bgColor: 'from-rose-500 to-rose-600',
      iconBg: 'bg-rose-500/20',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-navy">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's what's happening with your invoices.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-rose-500 bg-rose-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <p className="text-rose-700 font-medium">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-rose-500 hover:text-rose-700 font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={cn('p-3 rounded-lg', card.iconBg)}>
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
              </div>
              <div
                className={cn(
                  'h-1 rounded-full mt-4 bg-gradient-to-r',
                  card.bgColor
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Database Tools */}
      <DatabaseTools />

      {/* Recent Invoices Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-display font-semibold text-navy">
              Recent Invoices
            </h2>
            <p className="text-sm text-gray-600 mt-1">Latest 5 invoices</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate('invoices')}
              className="btn-secondary"
            >
              View All
            </button>
            <button
              onClick={() => onNavigate('create')}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              New Invoice
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Invoice ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Client
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Due Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                    <p className="text-gray-600 mt-4">Loading invoices...</p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <p className="text-gray-500 text-lg">No invoices found</p>
                    <p className="text-gray-400 text-sm mt-2">Create your first invoice to get started</p>
                  </td>
                </tr>
              ) : (
                invoices.slice(0, 5).map((invoice, idx) => (
                <tr
                  key={invoice.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span className="font-mono text-sm font-medium text-navy">
                      {invoice.id}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {invoice.clientName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {invoice.clientEmail}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {formatDate(invoice.dateIssued)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="py-4 px-4 font-semibold text-gray-900">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge
                      status={invoice.status}
                      onClick={() => handleQuickStatusToggle(invoice)}
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(invoice)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDownload(invoice)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice)}
                        className="p-2 hover:bg-rose-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && !showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-navy">Invoice Details</h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Invoice ID</p>
                  <p className="font-mono font-bold text-navy">{selectedInvoice.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Status</p>
                  <select
                    value={selectedInvoice.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-navy focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client Name</p>
                  <p className="font-semibold">{selectedInvoice.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client Email</p>
                  <p>{selectedInvoice.clientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date Issued</p>
                  <p>{formatDate(selectedInvoice.dateIssued)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p>{formatDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Description</th>
                      <th className="text-center py-2">Qty</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2">{item.desc}</td>
                        <td className="text-center py-2">{item.qty}</td>
                        <td className="text-right py-2">{formatCurrency(item.price)}</td>
                        <td className="text-right py-2 font-semibold">
                          {formatCurrency(item.qty * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold text-navy">
                    {formatCurrency(selectedInvoice.total)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleDownload(selectedInvoice)}
                  className="btn-primary flex-1"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Invoice Preview for PDF Generation */}
      {downloadingInvoice && (
        <div style={{ position: 'absolute', top: -9999, left: -9999 }} className="hidden-preview">
          <InvoicePreview
            ref={previewRef}
            formData={downloadingInvoice}
            // We don't pass calculate functions here, InvoicePreview will use formData values (total, etc)
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 rounded-full">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">Delete Invoice</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete invoice{' '}
              <span className="font-mono font-bold">{selectedInvoice?.id}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedInvoice(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
