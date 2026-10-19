import React, { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService';

export const ReceiptModal = ({ isOpen, onClose, receiptNumber }) => {
  if (!isOpen || !receiptNumber) return null;

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReceipt = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await paymentService.getReceipt(receiptNumber);
        setReceipt(res.receipt);
      } catch (err) {
        setError(err.message || 'Failed to load receipt details');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptNumber]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-fade-in print:bg-white print:text-black">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700/80 p-5 flex justify-between items-center print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📜</span>
            <h3 className="text-lg font-bold text-white">Digital Payment Receipt</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
            >
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 rounded-full w-7 h-7 flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm animate-pulse">Loading receipt data...</div>
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-center text-sm">
              {error}
            </div>
          ) : receipt ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-200 print:border-slate-300 print:bg-white print:text-black space-y-6">
              {/* Branding Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-blue-400 tracking-tight">StayEasy</h2>
                  <p className="text-xs text-slate-400">Housing & Accommodation Escrow Platform</p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {receipt.receiptType || 'OFFICIAL RECEIPT'}
                  </span>
                  <p className="text-xs font-mono text-slate-400 mt-1">{receipt.receiptNumber}</p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Issue Date</span>
                  <span className="font-semibold text-white">
                    {new Date(receipt.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Payment Reference</span>
                  <span className="font-mono text-slate-300">{receipt.gatewayPaymentId || receipt.paymentReference || 'CONFIRMED'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Payer / Resident</span>
                  <span className="font-semibold text-white">{receipt.payer?.name || 'Verified Tenant'}</span>
                  <span className="text-slate-400 block">{receipt.payer?.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Property / Accommodation</span>
                  <span className="font-semibold text-white">{receipt.property?.title || 'StayEasy Verified PG'}</span>
                  <span className="text-slate-400 block">{receipt.property?.address?.city}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Amount Paid</p>
                  <p className="text-xs text-slate-500 font-mono">Method: {receipt.paymentMethod || 'UPI'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-400">₹{receipt.amount?.toLocaleString()}</p>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Status: PAID ✓</span>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="border-t border-slate-800 pt-4 flex justify-between items-center text-[10px] text-slate-500">
                <span>Verified by StayEasy Financial Ledger Gateway</span>
                <span>Computer Generated Receipt — Signature Not Required</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
