import { useState } from 'react';
import { Plus, Trash2, Download, Save } from 'lucide-react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { formatCurrency, formatDate, generateInvoiceId } from '../utils/helpers';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InvoiceEditor({ onNavigate }) {
  const addInvoice = useInvoiceStore((state) => state.addInvoice);

  const [formData, setFormData] = useState({
    id: generateInvoiceId(),
    clientName: '',
    clientEmail: '',
    dateIssued: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'pending',
    items: [{ desc: '', qty: 1, price: 0 }],
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { desc: '', qty: 1, price: 0 }],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + item.qty * item.price;
    }, 0);
  };

  const handleSave = async () => {
    try {
      const invoice = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        dateIssued: formData.dateIssued,
        dueDate: formData.dueDate,
        status: formData.status === 'draft' ? 'pending' : formData.status,
        items: formData.items,
        total: calculateTotal(),
      };

      await addInvoice(invoice);
      alert('Invoice saved successfully!');
      onNavigate('dashboard');
    } catch (error) {
      alert('Error creating invoice: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-preview');
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${formData.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy">
            Create New Invoice
          </h1>
          <p className="text-gray-600 mt-2">
            Fill in the details and preview your invoice in real-time
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} className="btn-primary">
            <Save className="w-4 h-4 inline mr-2" />
            Save Invoice
          </button>
          <button onClick={handleDownloadPDF} className="btn-secondary">
            <Download className="w-4 h-4 inline mr-2" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <div className="glass-card p-6 space-y-6">
          <h2 className="text-xl font-semibold text-navy border-b pb-3">
            Invoice Details
          </h2>

          {/* Invoice ID (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice ID
            </label>
            <input
              type="text"
              value={formData.id}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm"
            />
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                placeholder="PT Example Ltd"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Email *
              </label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => updateField('clientEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                placeholder="client@example.com"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date
              </label>
              <input
                type="date"
                value={formData.dateIssued}
                onChange={(e) => updateField('dateIssued', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Items / Services
              </label>
              <button
                onClick={addItem}
                className="text-sm text-navy hover:text-navy-dark font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Item #{index + 1}
                    </span>
                    {formData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={item.desc}
                    onChange={(e) =>
                      updateItem(index, 'desc', e.target.value)
                    }
                    placeholder="Description (e.g., Web Development)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(index, 'qty', parseInt(e.target.value) || 1)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Price (IDR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, 'price', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="text-right text-sm font-semibold text-gray-700">
                    Subtotal: {formatCurrency(item.qty * item.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">
                Total Amount:
              </span>
              <span className="text-2xl font-bold text-navy">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="glass-card p-8" id="invoice-preview">
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start pb-8 border-b-2 border-gray-200">
              {/* Left: Logo */}
              <div>
                <img
                  src="/assets/codeinkamu-logo.png"
                  alt="CodeInKamu"
                  className="h-40 w-auto object-contain"
                />
              </div>

              {/* Right: Invoice Details */}
              <div className="text-right h-40 flex flex-col justify-center gap-2">
                <h2 className="text-4xl font-display font-bold text-navy tracking-tight leading-none">
                  INVOICE
                </h2>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                    INVOICE NO: {formData.id}
                  </p>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    DATE: {formatDate(formData.dateIssued)}
                  </p>
                </div>
              </div>
            </div>
            {/* Bill To */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Bill To:
              </h3>
              <p className="text-lg font-semibold text-gray-900">
                {formData.clientName || 'Client Name'}
              </p>
              <p className="text-sm text-gray-600">
                {formData.clientEmail || 'client@example.com'}
              </p>
            </div>

            {/* Due Date */}
            {formData.dueDate && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800">
                  Due Date: {formatDate(formData.dueDate)}
                </p>
              </div>
            )}

            {/* Items Table */}
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 text-sm font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="text-center py-2 text-sm font-semibold text-gray-700">
                      Qty
                    </th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 text-sm text-gray-900">
                        {item.desc || '-'}
                      </td>
                      <td className="py-3 text-sm text-center text-gray-700">
                        {item.qty}
                      </td>
                      <td className="py-3 text-sm text-right text-gray-700">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(item.qty * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">
                  TOTAL
                </span>
                <span className="text-3xl font-bold text-navy">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>

            {/* Footer Reference Layout */}
            <div className="mt-16 pt-8 border-t-2 border-gray-100">
              <div className="flex justify-between items-end pb-12 gap-8">
                {/* Left: Payment Method */}
                <div className="text-left space-y-4 flex-1">
                  <h4 className="text-sm font-bold text-orange-500 uppercase tracking-wide">
                    Payment Method:
                  </h4>
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-xs text-gray-700">
                    <span className="font-bold text-navy">Account No:</span>
                    <span className="font-medium">123 456 7890</span>

                    <span className="font-bold text-navy">Account Name:</span>
                    <span className="font-medium whitespace-nowrap">CODEINKAMU AGENCY</span>

                    <span className="font-bold text-navy">Branch Name:</span>
                    <span className="font-medium whitespace-nowrap">BCA - KCP JAKARTA</span>
                  </div>
                </div>

                {/* Right: Signature */}
                <div className="text-center pt-8">
                  <div className="h-16 w-32 mb-2 flex items-end justify-center">
                     {/* Placeholder */}
                  </div>
                  <div className="w-40 border-t font-bold border-gray-400 pt-3">
                    <p className="text-sm font-bold text-navy">Authorised sign</p>
                  </div>
                </div>
              </div>

              {/* Company Address & Info */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-orange-500 mb-2">Office Address:</h4>
                <div className="text-xs text-gray-500 leading-relaxed">
                   <p className="font-bold text-navy text-sm mb-1">CODEINKAMU AGENCY</p>
                   <p>Jl. Teknologi No. 45, Creative Hub</p>
                   <p>Jakarta Selatan, Indonesia 12345</p>
                   <p className="mt-2 text-gray-600">
                     <span className="font-semibold text-navy">Email:</span> info@codeinkamu.com &nbsp;|&nbsp;
                     <span className="font-semibold text-navy">Phone:</span> +62 812-3456-7890
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
