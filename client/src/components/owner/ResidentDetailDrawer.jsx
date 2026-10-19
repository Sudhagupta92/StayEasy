import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Building2,
  BedDouble,
  Calendar,
  DollarSign,
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ledgerService } from '../../services/ledgerService';

export const ResidentDetailDrawer = ({ isOpen, resident, onClose }) => {
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  useEffect(() => {
    if (isOpen && resident?.tenantId?._id) {
      setLoadingInvoices(true);
      ledgerService
        .getOwnerLedger()
        .then((res) => {
          if (res.success && res.data?.invoices) {
            const tenantInvoices = res.data.invoices.filter(
              (inv) =>
                inv.tenantId?._id === resident.tenantId._id ||
                inv.tenantId === resident.tenantId._id ||
                inv.bookingId === resident._id ||
                inv.bookingId?._id === resident._id
            );
            setInvoices(tenantInvoices);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoadingInvoices(false);
        });
    }
  }, [isOpen, resident]);

  if (!isOpen || !resident) return null;

  const tenant = resident.tenantId || {};
  const property = resident.propertyId || {};
  const costs = resident.costs || {};

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center font-bold text-lg">
              {tenant.avatar ? (
                <img
                  src={tenant.avatar}
                  alt={tenant.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900">{tenant.name || 'Resident'}</h3>
                <Badge variant="emerald" size="sm">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified Resident
                </Badge>
              </div>
              <p className="text-xs text-slate-500">{tenant.occupation || 'Working Professional / Student'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Info Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>Phone: <strong>{tenant.phone || '+91 98765 00000'}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Email: <strong>{tenant.email || 'tenant@email.com'}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Property: <strong>{property.title || 'StayEasy PG'}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <BedDouble className="w-4 h-4 text-slate-400" />
            <span>Room & Bed: <strong>{resident.roomName || 'Standard Room'} ({resident.roomType || 'SINGLE'})</strong></span>
          </div>
        </div>

        {/* Stay & Financial Scorecard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <span className="text-[10px] font-bold uppercase text-emerald-800 block">Monthly Rent</span>
            <span className="text-lg font-black text-emerald-700 font-mono">
              ₹{(costs.monthlyRent || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
            <span className="text-[10px] font-bold uppercase text-blue-800 block">Deposit Held</span>
            <span className="text-lg font-black text-blue-700 font-mono">
              ₹{(costs.securityDeposit || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Move-in Date</span>
            <span className="text-xs font-bold text-slate-900 block mt-1">
              {resident.checkInDate ? new Date(resident.checkInDate).toLocaleDateString() : resident.moveInDate ? new Date(resident.moveInDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Stay Status</span>
            <Badge
              variant={resident.status === 'ACTIVE_STAY' || resident.status === 'CHECKED_IN' ? 'emerald' : 'slate'}
              size="sm"
              className="mt-1"
            >
              {resident.status}
            </Badge>
          </div>
        </div>

        {/* Invoices History Table */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-600" /> Resident Rent Invoices & Ledger
            </h4>
            <span className="text-xs text-slate-400">({invoices.length} Invoices)</span>
          </div>

          {loadingInvoices ? (
            <div className="py-6 flex justify-center text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600 mr-2" /> Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
              No rent invoices issued for this resident yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {invoices.map((inv) => (
                <div key={inv._id} className="p-3 bg-white flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">{inv.invoiceNumber}</span>
                      <Badge
                        variant={inv.status === 'PAID' ? 'emerald' : inv.status === 'OVERDUE' ? 'rose' : 'amber'}
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      Month: <strong>{inv.billingMonth}</strong> • Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-slate-900 block">
                      ₹{inv.totalAmount?.toLocaleString()}
                    </span>
                    {inv.status === 'PAID' && (
                      <span className="text-[10px] text-emerald-600 font-semibold">✓ Paid</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <Button onClick={onClose} variant="primary" size="sm">
            Close Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResidentDetailDrawer;
