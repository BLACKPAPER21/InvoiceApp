import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Download,
  Edit,
  Trash2,
  X,
  AlertCircle,
  FileText,
  CheckCircle,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef } from 'react';
import InvoicePreview from '../components/InvoicePreview';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { invoiceAPI } from '../services/api';
import { formatCurrency, formatDate, cn } from '../utils/helpers';

const StatusBadge = ({ status, onClick }) => {
  const variants = {
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    overdue: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  const labels = {
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
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

export default function AllInvoices() {
  const { invoices, isLoading, error, fetchInvoices, clearError, deleteInvoice, updateInvoice } = useInvoiceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      (invoice.invoiceId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (invoice.clientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (invoice.clientEmail?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // View invoice
  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
  };

  // Handle download PDF
  const handleDownload = async (invoice) => {
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

  // Delete invoice
  const handleDelete = (invoice) => {
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

  // Quick status toggle
  const handleQuickStatusToggle = async (invoice) => {
    if (invoice.status === 'pending') {
      // Mark as paid with stock deduction
      handleMarkAsPaid(invoice);
    } else {
      // Regular status toggle
      const statusCycle = { paid: 'overdue', overdue: 'pending' };
      const newStatus = statusCycle[invoice.status] || 'pending';
      const previousStatus = invoice.status;

      const updatedInvoices = invoices.map(inv =>
        inv.id === invoice.id ? { ...inv, status: newStatus } : inv
      );
      useInvoiceStore.setState({ invoices: updatedInvoices });

      try {
        await updateInvoice(invoice.id, { status: newStatus });
      } catch (error) {
        const rollbackInvoices = invoices.map(inv =>
          inv.id === invoice.id ? { ...inv, status: previousStatus } : inv
        );
        useInvoiceStore.setState({ invoices: rollbackInvoices });
        alert('Error updating status: ' + error.message);
      }
    }
  };

  // Mark invoice as paid (with stock deduction)
  const handleMarkAsPaid = async (invoice) => {
    if (!confirm('Mark this invoice as paid? Stock will be deducted for inventory items.')) {
      return;
    }

    try {
      await invoiceAPI.markAsPaid(invoice.invoiceId);
      await fetchInvoices(); // Refresh list
      alert('Invoice marked as paid and stock updated!');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  // Cancel invoice (with stock return)
  const handleCancelInvoice = async (invoice) => {
    if (!confirm('Cancel this invoice? Stock will be returned if it was deducted.')) {
      return;
    }

    try {
      await invoiceAPI.cancel(invoice.invoiceId);
      await fetchInvoices(); // Refresh list
      alert('Invoice cancelled and stock returned!');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-navy">All Invoices</h1>
        <p className="text-gray-600 mt-2">
          Manage and search through all your invoices
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

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, client name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing <span className="font-semibold text-navy">{filteredInvoices.length}</span> of{' '}
          <span className="font-semibold">{invoices.length}</span> invoices
        </div>
      </div>

      {/* Invoice Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Due Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600">Loading invoices...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-lg">
                      {searchQuery || statusFilter !== 'all'
                        ? 'No invoices match your filters'
                        : 'No invoices found'}
                    </p>
                    {(searchQuery || statusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                        }}
                        className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.invoiceId}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm font-medium text-navy">
                        {invoice.invoiceId}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.clientName}</p>
                        <p className="text-xs text-gray-500">{invoice.clientEmail}</p>
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
                        {invoice.status === 'pending' && (
                          <button
                            onClick={() => handleMarkAsPaid(invoice)}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                        )}
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

      {/* Modals same as Dashboard... */}
      {selectedInvoice && !showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-navy">Invoice Details</h2>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-gray-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600">Invoice ID: <span className="font-mono font-bold">{selectedInvoice.invoiceId}</span></p>
            <p className="text-gray-600">Client: {selectedInvoice.clientName}</p>
            <p className="text-gray-600">Total: <span className="font-bold text-navy">{formatCurrency(selectedInvoice.total)}</span></p>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  const invoiceIdToEdit = selectedInvoice.id;
                  setSelectedInvoice(null);
                  onNavigate('edit', invoiceIdToEdit);
                }}
                className="btn-secondary flex-1"
              >
                <Edit className="w-4 h-4 inline mr-2" />
                Edit
              </button>
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
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-navy mb-4">Delete Invoice</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete invoice <span className="font-mono font-bold">{selectedInvoice?.invoiceId}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setSelectedInvoice(null); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">
                Delete
              </button>
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
          />
        </div>
      )}
    </div>
  );
}
