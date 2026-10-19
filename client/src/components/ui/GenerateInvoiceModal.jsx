import React, { useState } from 'react';
import { FileText, CheckCircle2, Loader2, Zap, X } from 'lucide-react';
import { Button } from '../common/Button';
import { ledgerService } from '../../services/ledgerService';

export const GenerateInvoiceModal = ({ residents, onClose, onSuccess }) => {
  const [selectedBookingId, setSelectedBookingId] = useState(residents[0]?._id || '');
  const [billingMonth, setBillingMonth] = useState('September 2026');

  // Calculate default due date (5th of next month)
  const defaultDueDate = (() => {
    const d = new Date();
    d.setDate(5);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  })();

  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [prevMeter, setPrevMeter] = useState(100);
  const [currMeter, setCurrMeter] = useState(160);
  const [waterCharges, setWaterCharges] = useState(0);
  const [maintenanceCharges, setMaintenanceCharges] = useState(0);
  const [foodCharges, setFoodCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedResident = residents.find((r) => r._id === selectedBookingId) || residents[0];
  const ratePerUnit = selectedResident?.propertyId?.expenses?.electricity?.rate || 8;
  const unitsConsumed = Math.max(0, currMeter - prevMeter);
  const electricityAmount = unitsConsumed * ratePerUnit;
  const baseRent = selectedResident?.costs?.monthlyRent || 0;
  const calculatedTotal = baseRent + electricityAmount + Number(waterCharges) + Number(maintenanceCharges) + Number(foodCharges) + Number(otherCharges);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        bookingId: selectedBookingId,
        billingMonth,
        dueDate,
        previousMeterReading: Number(prevMeter),
        currentMeterReading: Number(currMeter),
        waterCharges: Number(waterCharges),
        maintenanceCharges: Number(maintenanceCharges),
        foodCharges: Number(foodCharges),
        otherCharges: Number(otherCharges),
        notes,
      };

      const res = await ledgerService.createRentInvoice(payload);
      if (res.success) {
        if (onSuccess) onSuccess(res.message);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to generate rent invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase text-brand-600">Digital Invoicing Engine</span>
            <h3 className="text-xl font-extrabold text-slate-900">Issue Monthly Rent Invoice</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Resident */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Select Active Resident</label>
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 font-medium text-slate-800"
            >
              {residents.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.tenantId?.name} — {r.propertyId?.title} ({r.roomName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Billing Month</label>
              <input
                type="text"
                required
                placeholder="e.g. September 2026"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
              />
            </div>
          </div>

          {/* Sub-Meter Power Readings */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Zap className="w-4 h-4 text-amber-600" /> Sub-Meter Electricity Meter Readings (Rate: ₹{ratePerUnit}/unit)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Previous kWh</label>
                <input
                  type="number"
                  min={0}
                  value={prevMeter}
                  onChange={(e) => setPrevMeter(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Current kWh</label>
                <input
                  type="number"
                  min={prevMeter}
                  value={currMeter}
                  onChange={(e) => setCurrMeter(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>

            <div className="pt-1 text-[11px] text-amber-950 font-semibold flex justify-between">
              <span>Units Consumed: {unitsConsumed} kWh</span>
              <span>Calculated Power: ₹{electricityAmount}</span>
            </div>
          </div>

          {/* Total Calculation Card */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Base Monthly Rent:</span>
              <span>₹{baseRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Electricity Charge ({unitsConsumed} kWh):</span>
              <span>₹{electricityAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 text-sm font-extrabold text-emerald-400">
              <span>Total Invoice Amount:</span>
              <span>₹{calculatedTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-2 justify-end">
            <Button onClick={onClose} variant="outline" size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              icon={submitting ? Loader2 : CheckCircle2}
            >
              {submitting ? 'Generating...' : 'Issue Rent Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateInvoiceModal;
