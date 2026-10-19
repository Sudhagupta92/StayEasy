import React, { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';

export const TenantFinance = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [activePayment, setActivePayment] = useState(null);
  const [activeReceiptNumber, setActiveReceiptNumber] = useState(null);

  const fetchTenantFinance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await paymentService.getTenantFinance();
      setSummary(res.summary);
    } catch (err) {
      setError(err.message || 'Failed to load tenant financial ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantFinance();
  }, []);

  const handlePayInvoice = (inv) => {
    setActivePayment({
      amount: inv.balanceDue || inv.totalAmount,
      title: `Pay Rent Invoice: ${inv.billingMonth}`,
      purpose: 'RENT',
      referenceId: inv._id,
      referenceType: 'RENT_LEDGER',
      idempotencyKey: `PAY-INV-${inv._id}-${Date.now()}`,
    });
  };

  const handlePaymentSuccess = () => {
    fetchTenantFinance();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-center text-sm my-6">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Total Rent Paid</span>
            <span>💰</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            ₹{summary?.totalRentPaid?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed digital ledger payments</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Active Escrow Deposit</span>
            <span>🛡️</span>
          </div>
          <p className="text-2xl font-black text-blue-400">
            ₹{summary?.activeDepositInEscrow?.toLocaleString() || 0}
          </p>
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 mt-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            100% Protected
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Upcoming Pending Dues</span>
            <span>⏳</span>
          </div>
          <p className={`text-2xl font-black ${summary?.pendingDuesTotal > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            ₹{summary?.pendingDuesTotal?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{summary?.pendingInvoicesCount || 0} pending invoices</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Total Refunds Received</span>
            <span>↩️</span>
          </div>
          <p className="text-2xl font-black text-cyan-400">
            ₹{summary?.totalRefundsReceived?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Returned to source bank</p>
        </div>
      </div>

      {/* Pending Rent Invoices */}
      {summary?.pendingInvoices && summary.pendingInvoices.length > 0 && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-amber-400">Pending Rent Invoices</h3>
              <p className="text-xs text-slate-400">Clear your pending dues to maintain verified resident status</p>
            </div>
            <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/30">
              {summary.pendingInvoices.length} Due
            </span>
          </div>

          <div className="space-y-3">
            {summary.pendingInvoices.map((inv) => (
              <div
                key={inv._id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{inv.billingMonth}</span>
                    <span className="text-xs font-mono text-slate-500">({inv.invoiceNumber})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Property: <span className="text-slate-300">{inv.propertyId?.title || 'Accommodation'}</span>
                  </p>
                  <p className="text-[11px] text-amber-400/90 mt-1">
                    Due Date: {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Amount Due</span>
                    <span className="text-xl font-black text-amber-400">₹{(inv.balanceDue || inv.totalAmount).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => handlePayInvoice(inv)}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Payment Audit History & Receipts</h3>
            <p className="text-xs text-slate-400">Complete immutable record of all payments and escrow releases</p>
          </div>
        </div>

        {summary?.transactions && summary.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary.transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(t.paidAt || t.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.type === 'RENT_PAYMENT'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : t.type === 'DEPOSIT'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{t.propertyId?.title || 'Accommodation'}</td>
                    <td className="py-3 px-4 text-slate-400">{t.paymentMethod || 'UPI'}</td>
                    <td className="py-3 px-4 font-bold text-white">₹{t.amount?.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 font-bold">SUCCESS ✓</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {t.receiptNumber && (
                        <button
                          onClick={() => setActiveReceiptNumber(t.receiptNumber)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] font-semibold rounded-lg border border-slate-700 transition"
                        >
                          View Receipt 📜
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">No transaction history recorded yet</div>
        )}
      </div>

      {/* Payment Gateway Modal */}
      <PaymentModal
        isOpen={!!activePayment}
        onClose={() => setActivePayment(null)}
        paymentDetails={activePayment}
        onSuccess={handlePaymentSuccess}
      />

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={!!activeReceiptNumber}
        onClose={() => setActiveReceiptNumber(null)}
        receiptNumber={activeReceiptNumber}
      />
    </div>
  );
};
