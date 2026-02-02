import { useState } from 'react';
import { Plus, Trash2, Download, Save } from 'lucide-react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { formatCurrency, formatDate, generateInvoiceId } from '../utils/helpers';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import InvoicePreview from '../components/InvoicePreview';

export default function InvoiceEditor({ onNavigate }) {
  const addInvoice = useInvoiceStore((state) => state.addInvoice);

  const [formData, setFormData] = useState({
    id: generateInvoiceId(),
    clientName: '',
    clientEmail: '',
    dateIssued: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'pending',
    taxRate: 0,
    items: [{ desc: '', qty: 1, price: 0 }],
    signatureImage: null,
    stampImage: null,
    authorisedPerson: 'Authorised sign',
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

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + item.qty * item.price;
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (formData.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
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
        signatureImage: formData.signatureImage,
        stampImage: formData.stampImage,
        authorisedPerson: formData.authorisedPerson,
        taxRate: formData.taxRate,
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
    // Use slightly higher scale for better quality, but not too high to crash mobile
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true // Ensure images are loaded
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    // A4 Dimensions: 210mm x 297mm
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate aspect ratios
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0; // Align to top

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
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

          {/* Tax & Total */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-end">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-gray-600">
              <span className="text-sm">Subtotal:</span>
              <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
            </div>

            <div className="flex justify-between items-center text-gray-600">
              <span className="text-sm">Tax ({formData.taxRate}%):</span>
              <span className="font-medium">{formatCurrency(calculateTax())}</span>
            </div>

            <div className="flex justify-between items-center border-t pt-3 mt-2">
              <span className="text-lg font-semibold text-gray-700">
                Total Amount:
              </span>
              <span className="text-2xl font-bold text-navy">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          {/* Signature & Authorization */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Signature & Authorization</h3>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Authorised Person Name
              </label>
              <input
                type="text"
                value={formData.authorisedPerson}
                onChange={(e) => updateField('authorisedPerson', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Digital Signature
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateField('signatureImage', reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-navy/10 file:text-navy hover:file:bg-navy/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Company Stamp
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateField('stampImage', reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-navy/10 file:text-navy hover:file:bg-navy/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              {formData.signatureImage && (
                <button
                  onClick={() => updateField('signatureImage', null)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove Signature
                </button>
              )}
              {formData.stampImage && (
                <button
                  onClick={() => updateField('stampImage', null)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove Stamp
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="glass-card p-8">
          <InvoicePreview
            formData={formData}
            calculateSubtotal={calculateSubtotal}
            calculateTax={calculateTax}
            calculateTotal={calculateTotal}
          />
        </div>
      </div>
    </div>
  );
}
