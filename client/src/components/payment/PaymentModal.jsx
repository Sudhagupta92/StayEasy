import React, { useState } from 'react';
import { paymentService } from '../../services/paymentService';

export const PaymentModal = ({ isOpen, onClose, paymentDetails, onSuccess }) => {
  if (!isOpen || !paymentDetails) return null;

  const { amount, title, purpose, referenceId, referenceType, idempotencyKey } = paymentDetails;

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('user@upi');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [simulatedStatus, setSimulatedStatus] = useState('SUCCESS'); // SUCCESS or FAILED
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Order Init, 2: Gateway Sandbox, 3: Success Result

  const handleInitializeAndPay = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Create Gateway Order
      const orderRes = await paymentService.createOrder({
        amount,
        purpose: purpose || 'RENT',
        referenceId,
        referenceType: referenceType || 'RENT_LEDGER',
        idempotencyKey: idempotencyKey || `PAY-${referenceType}-${referenceId}-${Date.now()}`,
        paymentMethod,
      });

      const { orderId, idempotencyKey: resIdempotencyKey } = orderRes;

      if (simulatedStatus === 'FAILED') {
        setLoading(false);
        setError('Payment Authorization Failed: Card or UPI transaction declined by bank.');
        return;
      }

      // 2. Verify Payment
      const mockPaymentId = `pay_SE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const mockSignature = `sig_${Math.random().toString(36).substring(2, 12)}`;

      const verifyRes = await paymentService.verifyPayment({
        orderId,
        paymentId: mockPaymentId,
        signature: mockSignature,
        paymentMethod,
        idempotencyKey: resIdempotencyKey,
      });

      setLoading(false);
      setStep(3);

      if (onSuccess) {
        onSuccess(verifyRes);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Payment processing failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                StayEasy Secure Gateway
              </span>
            </div>
            <h3 className="text-xl font-bold mt-1">{title || 'Complete Payment'}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {step === 1 && (
            <>
              {/* Amount Breakdown */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Amount Payable</p>
                  <p className="text-2xl font-black text-emerald-400">₹{amount?.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg font-semibold">
                    100% Escrow Protected
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / VPA', icon: '⚡' },
                    { id: 'CREDIT_CARD', label: 'Cards', icon: '💳' },
                    { id: 'NET_BANKING', label: 'NetBanking', icon: '🏦' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border text-sm font-semibold flex flex-col items-center space-y-1 transition ${
                        paymentMethod === m.id
                          ? 'border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10'
                          : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Details Input */}
              {paymentMethod === 'UPI' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Enter VPA / UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="user@upi"
                  />
                </div>
              )}

              {paymentMethod === 'CREDIT_CARD' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Card Number (Sandbox Mock)</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Gateway Sandbox Mode Simulator */}
              <div className="border-t border-slate-800 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-400">Sandbox Mode Outcome:</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setSimulatedStatus('SUCCESS')}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                        simulatedStatus === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      Simulate Success
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedStatus('FAILED')}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                        simulatedStatus === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      Simulate Failure
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleInitializeAndPay}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Authorizing Gateway Order...</span>
                  </>
                ) : (
                  <span>Pay ₹{amount?.toLocaleString()} Securely</span>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-3xl">
                ✓
              </div>
              <h4 className="text-xl font-bold text-white">Payment Verified & Settled!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your transaction has been confirmed on the StayEasy digital ledger. Digital receipt generated.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition"
              >
                Close & Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
