import React, { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { ReceiptModal } from './ReceiptModal';

export const AdminFinance = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [webhookMessage, setWebhookMessage] = useState('');
  const [webhookLoading, setWebhookLoading] = useState(false);

  const [activeReceiptNumber, setActiveReceiptNumber] = useState(null);

  const fetchAdminFinance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await paymentService.getAdminFinance();
      setSummary(res.summary);
    } catch (err) {
      setError(err.message || 'Failed to load admin platform financial overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminFinance();
  }, []);

  const handleSimulateWebhook = async () => {
    setWebhookLoading(true);
    setWebhookMessage('');
    try {
      const res = await paymentService.triggerWebhook({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_wh_${Math.random().toString(36).substring(2, 8)}`,
              order_id: summary?.recentTransactions?.[0]?.gatewayOrderId || 'order_SE_DEMO',
            },
          },
        },
      });
      setWebhookMessage(`Webhook trigger test: ${res.message}`);
      fetchAdminFinance();
    } catch (err) {
      setWebhookMessage(`Webhook simulation error: ${err.message}`);
    } finally {
      setWebhookLoading(false);
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
      {/* Platform GMV & Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Platform GMV</span>
            <span>🌐</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            ₹{summary?.platformGMV?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Gross Merchandise Volume</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Platform Fee Earnings</span>
            <span>💰</span>
          </div>
          <p className="text-2xl font-black text-amber-400">
            ₹{summary?.totalPlatformFeeEarnings?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">StayEasy 2% commission</p>
        </div>

        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Total Escrow Pool Held</span>
            <span>🛡️</span>
          </div>
          <p className="text-2xl font-black text-blue-400">
            ₹{summary?.totalEscrowPoolHeld?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Total active tenant security deposits</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>Total Refunds Processed</span>
            <span>↩️</span>
          </div>
          <p className="text-2xl font-black text-cyan-400">
            ₹{summary?.totalRefundsProcessed?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Returned to tenants upon checkout</p>
        </div>
      </div>

      {/* Webhook Simulation Tool */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <span>⚡ Gateway Webhook Testing Tool</span>
          </h4>
          <p className="text-xs text-slate-400">Simulate asynchronous gateway callback notifications (`payment.captured`)</p>
        </div>
        <button
          onClick={handleSimulateWebhook}
          disabled={webhookLoading}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50"
        >
          {webhookLoading ? 'Simulating...' : 'Test Webhook Signature Event'}
        </button>
      </div>

      {webhookMessage && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-3 rounded-xl text-xs font-mono">
          {webhookMessage}
        </div>
      )}

      {/* Global Transaction Audit Trail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">System-Wide Financial Audit Log</h3>
            <p className="text-xs text-slate-400">Real-time audit log of all financial transactions on StayEasy</p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {summary?.totalTransactionsCount || 0} Total Records
          </span>
        </div>

        {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Txn Ref</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Fee (2%)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {summary.recentTransactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-400">{t.transactionReference || t.gatewayOrderId}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-white">{t.userId?.name || 'User'}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">{t.propertyId?.title || 'Property'}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">₹{t.amount?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-400">₹{t.feeAmount?.toLocaleString()}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="text-emerald-400 font-bold">SUCCESS ✓</span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
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
          <div className="text-center py-8 text-slate-500 text-xs">No transactions logged</div>
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
