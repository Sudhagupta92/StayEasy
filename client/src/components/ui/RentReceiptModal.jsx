import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, FileText, Printer, X, Loader2, AlertCircle, Zap, Utensils, Droplets, Wrench } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ledgerService } from '../../services/ledgerService';

export const RentReceiptModal = ({ invoiceId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchInvoice = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await ledgerService.getInvoiceById(invoiceId);
        if (isMounted && res.success && res.data?.invoice) {
          setInvoice(res.data.invoice);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load rent receipt');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (invoiceId) fetchInvoice();
    return () => {
      isMounted = false;
    };
  }, [invoiceId]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">Retrieving digital rent receipt...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Receipt Notice</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">{error}</p>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        ) : invoice ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">StayEasy Rent Receipt</h3>
                    <p className="text-[11px] font-medium text-slate-500">Verified Monthly Billing Statement</p>
                  </div>
                </div>

                <Badge
                  variant={invoice.status === 'PAID' ? 'emerald' : invoice.status === 'OVERDUE' ? 'rose' : 'amber'}
                  size="md"
                >
                  {invoice.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 font-mono">
                <span>Invoice: <strong className="text-slate-900">{invoice.invoiceNumber}</strong></span>
                {invoice.receiptNumber && <span>Receipt: <strong className="text-emerald-700">{invoice.receiptNumber}</strong></span>}
                <span>Month: <strong className="text-brand-600">{invoice.billingMonth}</strong></span>
              </div>
            </div>

            {/* Parties Info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Resident / Tenant</span>
                <p className="font-bold text-slate-900">{invoice.tenantId?.name}</p>
                <p className="text-slate-500 line-clamp-1">{invoice.tenantId?.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Landlord / Owner</span>
                <p className="font-bold text-slate-900">{invoice.ownerId?.name}</p>
                <p className="text-slate-500 line-clamp-1">{invoice.ownerId?.email}</p>
              </div>
            </div>

            {/* Property */}
            <div className="text-xs space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Accommodation</span>
              <p className="font-bold text-slate-900">{invoice.propertyId?.title}</p>
              <p className="text-slate-500">{invoice.propertyId?.address?.city}, {invoice.propertyId?.address?.state}</p>
            </div>

            {/* Line Item Breakdown */}
            <div className="bg-slate-950 text-white p-5 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Monthly Room Rent</span>
                <span className="font-bold text-white">₹{invoice.breakdown?.baseRent?.toLocaleString()}</span>
              </div>

              {invoice.breakdown?.electricity?.amount > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Sub-meter Electricity ({invoice.breakdown.electricity.unitsConsumed} kWh @ ₹{invoice.breakdown.electricity.ratePerUnit})
                  </span>
                  <span className="font-bold text-white">₹{invoice.breakdown.electricity.amount?.toLocaleString()}</span>
                </div>
              )}

              {invoice.breakdown?.foodCharges > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Food Meal Plan
                  </span>
                  <span className="font-bold text-white">₹{invoice.breakdown.foodCharges?.toLocaleString()}</span>
                </div>
              )}

              {invoice.breakdown?.waterCharges > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" /> Water Charges
                  </span>
                  <span className="font-bold text-white">₹{invoice.breakdown.waterCharges?.toLocaleString()}</span>
                </div>
              )}

              {invoice.breakdown?.maintenanceCharges > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-slate-400" /> Building Maintenance
                  </span>
                  <span className="font-bold text-white">₹{invoice.breakdown.maintenanceCharges?.toLocaleString()}</span>
                </div>
              )}

              {invoice.breakdown?.otherCharges > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Other: {invoice.breakdown.otherChargesDescription || 'Additional Charges'}</span>
                  <span className="font-bold text-white">₹{invoice.breakdown.otherCharges?.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-between text-sm font-extrabold">
                <span>Total Invoice Amount</span>
                <span className="text-emerald-400">₹{invoice.totalAmount?.toLocaleString()}</span>
              </div>

              {invoice.status === 'PAID' && (
                <div className="pt-2 text-[11px] text-emerald-400 flex items-center justify-between font-mono border-t border-slate-800/80">
                  <span>Paid via {invoice.paymentMethod || 'Online'}</span>
                  <span>Ref: {invoice.paymentReference}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={() => window.print()} variant="outline" size="sm" icon={Printer}>
                Print Receipt
              </Button>
              <Button onClick={onClose} variant="primary" size="sm">
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RentReceiptModal;
