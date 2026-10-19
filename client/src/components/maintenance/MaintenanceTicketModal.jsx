import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  Loader2,
  Clock,
  Zap,
  Wrench,
  Wifi,
  Sparkles,
  Tv,
  Armchair,
  Droplets,
  Shield,
  FileText,
  ShieldCheck,
  Building,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../common/Button';
import { maintenanceService } from '../../services/maintenanceService';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, SLA_CONFIG } from '../../constants';

export const MaintenanceTicketModal = ({
  isOpen,
  onClose,
  onSuccess,
  bookings = [],
  preselectedPropertyId = null,
}) => {
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [category, setCategory] = useState('ELECTRICAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-select first booking or preselected property booking
  useEffect(() => {
    if (bookings.length > 0) {
      if (preselectedPropertyId) {
        const found = bookings.find((b) => (b.propertyId?._id || b.propertyId) === preselectedPropertyId);
        if (found) setSelectedBookingId(found._id);
        else setSelectedBookingId(bookings[0]._id);
      } else if (!selectedBookingId) {
        setSelectedBookingId(bookings[0]._id);
      }
    }
  }, [bookings, preselectedPropertyId]);

  if (!isOpen) return null;

  const selectedBooking = bookings.find((b) => b._id === selectedBookingId) || bookings[0];
  const activeSla = SLA_CONFIG[priority] || SLA_CONFIG.MEDIUM;

  const categoriesList = [
    { key: 'ELECTRICAL', label: 'Electrical & Power', icon: Zap },
    { key: 'PLUMBING', label: 'Plumbing & Drainage', icon: Wrench },
    { key: 'INTERNET', label: 'Wi-Fi & Internet', icon: Wifi },
    { key: 'CLEANING', label: 'Housekeeping & Hygiene', icon: Sparkles },
    { key: 'APPLIANCE', label: 'Appliance (Geyser/AC/RO)', icon: Tv },
    { key: 'WATER', label: 'Water Supply', icon: Droplets },
    { key: 'FURNITURE', label: 'Furniture & Carpentry', icon: Armchair },
    { key: 'SECURITY', label: 'Door Lock & Security', icon: Shield },
    { key: 'OTHER', label: 'Other Issue', icon: FileText },
  ];

  const prioritiesList = [
    { key: 'LOW', label: 'Low', desc: '48h Response / 5d Fix', color: 'border-slate-300 hover:border-blue-400' },
    { key: 'MEDIUM', label: 'Medium', desc: '24h Response / 3d Fix', color: 'border-blue-300 hover:border-blue-500' },
    { key: 'HIGH', label: 'High', desc: '8h Response / 24h Fix', color: 'border-amber-300 hover:border-amber-500' },
    { key: 'URGENT', label: 'Urgent', desc: '2h Response / 8h Fix', color: 'border-rose-300 hover:border-rose-500' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedBooking) {
      setErrorMsg('Please select an active stay / property for this complaint.');
      return;
    }

    if (title.trim().length < 3) {
      setErrorMsg('Title must be at least 3 characters long.');
      return;
    }

    if (description.trim().length < 10) {
      setErrorMsg('Please provide a detailed description (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const propertyId = selectedBooking.propertyId?._id || selectedBooking.propertyId;
      const res = await maintenanceService.createTicket({
        propertyId,
        bookingId: selectedBooking._id,
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
        attachments: attachmentUrl ? [attachmentUrl.trim()] : [],
      });

      if (res.success) {
        setTitle('');
        setDescription('');
        setAttachmentUrl('');
        if (onSuccess) onSuccess(res.data?.ticket);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit maintenance ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Raise Maintenance Ticket</h2>
              <p className="text-xs text-slate-400">Guaranteed SLA turnaround and resolution tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Stay / Property Selector */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-700 block mb-1.5">
              Select Accommodation / Stay
            </label>
            {bookings.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                No active or confirmed stays found in your account. You can only raise maintenance tickets for properties you are staying in.
              </div>
            ) : (
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 font-medium"
              >
                {bookings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.propertyId?.title || 'Accommodation'} ({b.roomName || b.roomType}) — Ref: {b.bookingReference}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Category Picker */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-700 block mb-2">
              Complaint Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categoriesList.map((c) => {
                const IconComponent = c.icon;
                const isSelected = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`p-2.5 rounded-xl text-left border flex flex-col gap-1 transition-all ${
                      isSelected
                        ? 'bg-brand-50/80 border-brand-500 text-brand-900 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold line-clamp-1">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Selector & SLA Commitment */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-700 block mb-2">
              Priority Level & SLA Commitment
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {prioritiesList.map((p) => {
                const isSelected = priority === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-brand-500/50'
                        : `bg-white border-slate-200 text-slate-700 ${p.color}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{p.label}</span>
                      {p.key === 'URGENT' && <Flame className="w-3 h-3 text-rose-400" />}
                    </div>
                    <span className={`text-[10px] block ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SLA Commitment Banner */}
            <div className="mt-2.5 p-3 rounded-2xl bg-brand-50/60 border border-brand-200 flex items-center justify-between text-xs text-brand-900">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>
                  <strong>StayEasy SLA Commitment:</strong> Landlord acknowledgment within{' '}
                  <strong>{activeSla.responseHours}h</strong>, full resolution within{' '}
                  <strong>{activeSla.resolutionHours}h</strong>.
                </span>
              </div>
              <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0 hidden sm:block" />
            </div>
          </div>

          {/* Complaint Title */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
              Issue Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Geyser stopped heating in Room 302"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
              Detailed Description & Location
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the issue in detail, when it started, and exact room/floor location..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>

          {/* Photo URL / Attachment */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
              Photo / Media URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/issue-photo.jpg"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting || bookings.length === 0}
              icon={submitting ? Loader2 : CheckCircle}
            >
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceTicketModal;
