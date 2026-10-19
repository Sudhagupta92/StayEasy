import React, { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { ReceiptModal } from './ReceiptModal';

export const OwnerFinance = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState('');

  const [activeReceiptNumber, setActiveReceiptNumber] = useState(null);

  const fetchOwnerFinance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await paymentService.getOwnerFinance();
      setSummary(res.summary);
    } catch (err) {
      setError(err.message || 'Failed to load owner financial summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerFinance();
  }, []);

  const handleRequestPayout = async () => {
    if (!summary?.netPayoutBalance || summary.netPayoutBalance <= 0) return;

    setPayoutLoading(true);
    setPayoutMessage('');
    try {
      const res = await paymentService.processPayout({
        amount: summary.netPayoutBalance,
        bankAccount: 'HDFC-XXXX-4321',
      });
      setPayoutMessage(`Payout of ₹${summary.netPayoutBalance.toLocaleString()} processed successfully (${res.receiptNumber})`);
      fetchOwnerFinance();
    } catch (err) {
      setError(err.message || 'Payout processing failed');
    } finally {
      setPayoutLoading(false);
    }
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
      {/* Earnings & Escrow Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Gross Revenue Collected</span>
            <span>💰</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            ₹{summary?.grossEarnings?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Total rent payments processed</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Platform Service Fee (2%)</span>
            <span>🏷️</span>
          </div>
          <p className="text-2xl font-black text-slate-300">
            ₹{summary?.totalPlatformFees?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Automated platform processing fee</p>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative bg-gradient-to-b from-slate-900 to-emerald-950/20">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Net Balance Available</span>
            <span>🏦</span>
          </div>
          <p className="text-2xl font-black text-emerald-300">
            ₹{summary?.netPayoutBalance?.toLocaleString() || 0}
          </p>
          <button
            onClick={handleRequestPayout}
            disabled={payoutLoading || !summary?.netPayoutBalance || summary.netPayoutBalance <= 0}
            className="mt-3 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-40"
          >
            {payoutLoading ? 'Processing Payout...' : 'Request Disbursal 💸'}
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Property Escrow Holdings</span>
            <span>🛡️</span>
          </div>
          <p className="text-2xl font-black text-blue-400">
            ₹{summary?.totalEscrowHeld?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Held in StayEasy Escrow protection</p>
        </div>
      </div>

      {payoutMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-center text-xs font-semibold animate-fade-in">
          {payoutMessage}
        </div>
      )}

      {/* Collection Ledger Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Recent Rent & Deposit Collections</h3>
            <p className="text-xs text-slate-400">Immutable record of tenant transactions across your properties</p>
          </div>
        </div>

        {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Gross</th>
                  <th className="py-3 px-4">Fee (2%)</th>
                  <th className="py-3 px-4">Net Amount</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary.recentTransactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(t.paidAt || t.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{t.tenantId?.name || 'Resident'}</td>
                    <td className="py-3 px-4 text-slate-300">{t.propertyId?.title || 'Property'}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">₹{t.amount?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-400">₹{t.feeAmount?.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-white">₹{t.netAmount?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      {t.receiptNumber && (
                        <button
                          onClick={() => setActiveReceiptNumber(t.receiptNumber)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] font-semibold rounded-lg border border-slate-700 transition"
                        >
                          Receipt 📜
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">No recent collections recorded yet</div>
        )}
      </div>

      <ReceiptModal
        isOpen={!!activeReceiptNumber}
        onClose={() => setActiveReceiptNumber(null)}
        receiptNumber={activeReceiptNumber}
      />
    </div>
  );
};
