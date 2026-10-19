import React, { useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Loader2, LogOut, X } from 'lucide-react';
import { Button } from '../common/Button';
import { ledgerService } from '../../services/ledgerService';

export const MoveOutNoticeModal = ({ booking, onClose, onSuccess }) => {
  const noticePeriodDays = booking?.propertyId?.noticePeriodDays || 30;

  // Calculate min checkout date (today + noticePeriodDays)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + noticePeriodDays);
  const defaultCheckoutStr = minDate.toISOString().split('T')[0];

  const [intendedCheckoutDate, setIntendedCheckoutDate] = useState(defaultCheckoutStr);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await ledgerService.serveMoveOutNotice({
        bookingId: booking._id,
        intendedCheckoutDate,
        reason,
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.message);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit move-out notice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-extrabold text-slate-900">Serve Move-Out Notice</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1 text-amber-900">
          <span className="font-bold block">Property Notice Period Policy:</span>
          <p>This accommodation requires a <strong>{noticePeriodDays}-day notice period</strong> prior to checkout.</p>
          <p className="text-slate-600 pt-1">Earliest allowed checkout date: <strong>{minDate.toLocaleDateString()}</strong>.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
              Intended Checkout Date
            </label>
            <input
              type="date"
              required
              min={defaultCheckoutStr}
              value={intendedCheckoutDate}
              onChange={(e) => setIntendedCheckoutDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
              Reason for Move-Out / Feedback
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Completed college course, relocation to new office..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 flex gap-2 justify-end">
            <Button onClick={onClose} variant="outline" size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
              disabled={submitting}
              icon={submitting ? Loader2 : CheckCircle2}
            >
              {submitting ? 'Submitting...' : 'Submit Move-Out Notice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MoveOutNoticeModal;
