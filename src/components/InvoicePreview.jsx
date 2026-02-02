import React, { forwardRef } from 'react';
import { formatCurrency, formatDate } from '../utils/helpers';

const InvoicePreview = forwardRef(({ formData, calculateSubtotal, calculateTax, calculateTotal }, ref) => {
  // Helper to ensure calculations are done if functions are passed, otherwise rely on formData properties if available (for Dashboard view)
  const subtotal = calculateSubtotal ? calculateSubtotal() : (formData.subtotal || 0);
  // If tax is not calculated via function, try to calculate it from available data or use 0
  const tax = calculateTax ? calculateTax() : (subtotal * (formData.taxRate / 100) || 0);
  const total = calculateTotal ? calculateTotal() : (formData.total || (subtotal + tax));

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 space-y-6" id="invoice-preview" ref={ref}>
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
            {(formData.items || []).map((item, index) => (
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

      {/* Total Section */}
      <div className="border-t-2 border-gray-300 pt-4 space-y-2">
        <div className="flex justify-between items-center text-gray-600">
          <span className="font-medium">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {formData.taxRate > 0 && (
          <div className="flex justify-between items-center text-gray-600">
            <span className="font-medium">Tax ({formData.taxRate}%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
        )}

        <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-2">
          <span className="text-lg font-semibold text-gray-700">
            TOTAL
          </span>
          <span className="text-lg font-bold text-navy">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Footer Reference Layout */}
      <div className="mt-16 pt-8 border-t-2 border-gray-100">
        <div className="flex justify-between items-end pb-12 gap-8">
          {/* Left: Payment Method */}
          <div className="text-left space-y-4 flex-1">
            <h4 className="text-sm font-bold text-sky-500 uppercase tracking-wide">
              Payment Method:
            </h4>
            <div className="grid grid-cols-[100px_1fr] gap-y-2 text-xs text-gray-700">
              <span className="font-bold text-navy">Account No:</span>
              <span className="font-medium">797-107-7747</span>

              <span className="font-bold text-navy">Account Name:</span>
              <span className="font-medium whitespace-nowrap">Idwin Indrabawana Tang.St</span>

              <span className="font-bold text-navy">Bank:</span>
              <span className="font-medium whitespace-nowrap">BCA</span>
            </div>
          </div>

          {/* Right: Signature */}
          <div className="text-center pt-8">
            <div className="h-16 w-40 mb-2 flex items-end justify-center relative">
               {/* Signature Layer */}
               {formData.signatureImage ? (
                  <img
                    src={formData.signatureImage}
                    alt="Signature"
                    className="max-h-full max-w-full object-contain relative z-10"
                  />
               ) : null}

               {/* Stamp Layer - Positioned absolutely in FRONT of signature - Larger & Lower */}
               {formData.stampImage && (
                  <img
                    src={formData.stampImage}
                    alt="Stamp"
                    className="absolute -top-10 left-0 w-40 h-40 object-contain opacity-80 rotate-[-10deg] pointer-events-none z-20"
                  />
               )}
            </div>
            <div className="w-40 border-t font-bold border-gray-400 pt-3">
              <p className="text-sm font-bold text-navy">
                {formData.authorisedPerson || 'Authorised sign'}
              </p>
            </div>
          </div>
        </div>

        {/* Company Address & Info */}
        <div className="pt-6 border-t border-sky-500">
          <h4 className="text-sm font-bold text-slate-950 mb-1">Office :</h4>
          <div className="text-xs text-navy leading-relaxed italic">
             <p>Vidaview Apartement Tower B Lt.33 No.33 O</p>
             <p>Jl. Kapas Raya Topas Raya Kota Makassar</p>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
