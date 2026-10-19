import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Lock, Download, Printer, X, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { bookingService } from '../../services/bookingService';

export const EscrowReceiptModal = ({ bookingId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchReceipt = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await bookingService.getEscrowReceipt(bookingId);
        if (isMounted && res.success && res.data?.receipt) {
          setReceipt(res.data.receipt);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load escrow receipt');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (bookingId) fetchReceipt();
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">Retrieving official Escrow Receipt...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Escrow Receipt Notice</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">{error}</p>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        ) : receipt ? (
          <div className="space-y-6">
            {/* Header / Brand Badge */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">StayEasy Escrow Protection</h3>
                    <p className="text-[11px] font-medium text-slate-500">Official Deposit Guarantee Receipt</p>
                  </div>
                </div>

                <Badge
                  variant={
                    receipt.escrowFinancials?.escrowStatus === 'HELD_IN_ESCROW'
                      ? 'emerald'
                      : receipt.escrowFinancials?.escrowStatus === 'REFUNDED_TO_TENANT'
                      ? 'blue'
                      : 'purple'
                  }
                  size="md"
                  className="flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" /> {receipt.escrowFinancials?.escrowStatus?.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 font-mono">
                <span>Receipt ID: <strong className="text-slate-900">{receipt.receiptId}</strong></span>
                <span>Ref: <strong className="text-brand-600">{receipt.bookingReference}</strong></span>
              </div>
            </div>

            {/* Property & Parties Summary */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Tenant / Resident</span>
                <p className="font-bold text-slate-900">{receipt.tenant?.name}</p>
                <p className="text-slate-500 line-clamp-1">{receipt.tenant?.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Landlord / Host</span>
                <p className="font-bold text-slate-900">{receipt.landlord?.name}</p>
                <p className="text-slate-500 line-clamp-1">{receipt.landlord?.email}</p>
              </div>
            </div>

            {/* Property Title & Room */}
            <div className="text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Accommodation & Room</span>
              <p className="font-bold text-slate-900 text-sm">{receipt.property?.title}</p>
              <p className="text-slate-600">{receipt.roomName} ({receipt.roomType?.replace(/_/g, ' ')})</p>
            </div>

            {/* Financials Ledger */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>1st Month Room Rent:</span>
                <span className="font-bold text-white">₹{receipt.escrowFinancials?.monthlyRent?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Security Deposit (Protected in Escrow):
                </span>
                <span className="font-bold text-emerald-400">₹{receipt.escrowFinancials?.securityDeposit?.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-extrabold">
                <span>Total Escrow Funds Held:</span>
                <span className="text-emerald-400">₹{receipt.escrowFinancials?.totalUpfrontAmount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Settlement Details if Checkout Settle completed */}
            {receipt.settlementDetails && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                <span className="font-bold text-emerald-900 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Checkout Inspection Settlement:
                </span>
                <div className="flex justify-between text-slate-700">
                  <span>Damage Deductions:</span>
                  <span className="font-bold text-rose-700">₹{receipt.settlementDetails.damageDeductionAmount?.toLocaleString()}</span>
                </div>
                {receipt.settlementDetails.deductionReason && (
                  <p className="text-slate-600 text-[11px]">Reason: {receipt.settlementDetails.deductionReason}</p>
                )}
                <div className="flex justify-between pt-1 border-t border-emerald-200 font-bold text-emerald-950 text-sm">
                  <span>Net Refunded to Tenant:</span>
                  <span className="text-emerald-700">₹{receipt.settlementDetails.tenantRefundAmount?.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Escrow Guarantee Footer Callout */}
            <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              🛡️ {receipt.escrowGuarantee}
            </p>

            <div className="flex justify-end gap-2">
              <Button onClick={() => window.print()} variant="outline" size="sm" icon={Printer}>
                Print Receipt
              </Button>
              <Button onClick={onClose} variant="primary" size="sm">
                Done
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EscrowReceiptModal;
