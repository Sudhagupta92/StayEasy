import React, { useState } from 'react';
import {
  X,
  Clock,
  Building,
  User,
  CheckCircle2,
  AlertCircle,
  Wrench,
  RotateCcw,
  ShieldCheck,
  Send,
  Loader2,
  Calendar,
  FileText,
  Flame,
  Phone,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { SLABadge } from './SLABadge';
import { getCategoryIcon, getPriorityBadge, getStatusBadge } from './MaintenanceTicketCard';
import { maintenanceService } from '../../services/maintenanceService';

export const MaintenanceTicketDetail = ({
  isOpen,
  ticket,
  onClose,
  onUpdate,
  isOwner = false,
  isAdmin = false,
}) => {
  const [actionType, setActionType] = useState(null); // 'acknowledge', 'start', 'resolve', 'reopen', 'close'
  const [responseText, setResponseText] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !ticket) return null;

  const property = ticket.propertyId || {};
  const tenant = ticket.tenantId || {};
  const owner = ticket.ownerId || {};
  const timeline = ticket.timeline || [];

  const handleAcknowledgeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await maintenanceService.acknowledgeTicket(ticket._id, {
        ownerResponse: responseText.trim(),
      });
      if (res.success) {
        if (onUpdate) onUpdate(res.data?.ticket);
        setActionType(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to acknowledge ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await maintenanceService.startTicket(ticket._id, {
        assignedTo: assignedTo.trim(),
        notes: actionNotes.trim(),
      });
      if (res.success) {
        if (onUpdate) onUpdate(res.data?.ticket);
        setActionType(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start maintenance work');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (actionNotes.trim().length < 5) {
      setErrorMsg('Resolution notes must be at least 5 characters');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await maintenanceService.resolveTicket(ticket._id, {
        resolutionNotes: actionNotes.trim(),
      });
      if (res.success) {
        if (onUpdate) onUpdate(res.data?.ticket);
        setActionType(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to mark ticket resolved');
    } finally {
      setLoading(false);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (reopenReason.trim().length < 5) {
      setErrorMsg('Please specify why the issue is still unresolved (min 5 chars)');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await maintenanceService.reopenTicket(ticket._id, {
        reason: reopenReason.trim(),
      });
      if (res.success) {
        if (onUpdate) onUpdate(res.data?.ticket);
        setActionType(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reopen ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSubmit = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await maintenanceService.closeTicket(ticket._id, {
        feedback: 'Verified and closed by resident',
      });
      if (res.success) {
        if (onUpdate) onUpdate(res.data?.ticket);
        setActionType(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to close ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md">
              {getCategoryIcon(ticket.category)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-300">
                  #{ticket.ticketReference}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-300 font-semibold">{ticket.category}</span>
              </div>
              <h2 className="text-base font-bold truncate max-w-md">{ticket.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Top Status & SLA Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
            <SLABadge ticket={ticket} />
          </div>

          {/* Issue Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Issue Details & Location
            </h4>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-800 leading-relaxed">
              {ticket.description}
            </div>

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="pt-2">
                <h5 className="text-xs font-semibold text-slate-600 mb-2">Attached Photos:</h5>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {ticket.attachments.map((imgUrl, idx) => (
                    <a
                      key={idx}
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-24 h-24 rounded-xl border border-slate-200 overflow-hidden group relative flex-shrink-0"
                    >
                      <img
                        src={imgUrl}
                        alt={`Attachment ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Property & Tenant / Landlord Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase">
                <Building className="w-3.5 h-3.5 text-brand-600" /> Accommodation
              </div>
              <p className="font-bold text-slate-900 text-sm">{property.title || 'Accommodation'}</p>
              <p className="text-slate-600">{property.address?.street}, {property.address?.city}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase">
                <User className="w-3.5 h-3.5 text-brand-600" />
                {isOwner ? 'Resident Tenant' : 'Landlord / Property Owner'}
              </div>
              {isOwner ? (
                <>
                  <p className="font-bold text-slate-900 text-sm">{tenant.name || 'Resident'}</p>
                  <p className="text-slate-600">{tenant.phone || tenant.email}</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-slate-900 text-sm">{owner.name || 'Landlord'}</p>
                  <p className="text-slate-600">{owner.phone || owner.email}</p>
                </>
              )}
            </div>
          </div>

          {/* Current Technician / Response Notes */}
          {(ticket.assignedTo || ticket.ownerResponse || ticket.resolutionNotes) && (
            <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-200/80 space-y-2.5 text-xs">
              {ticket.assignedTo && (
                <div>
                  <span className="font-bold text-brand-900 uppercase">Assigned Technician:</span>
                  <p className="text-slate-800 font-semibold mt-0.5">{ticket.assignedTo}</p>
                </div>
              )}
              {ticket.ownerResponse && (
                <div>
                  <span className="font-bold text-brand-900 uppercase">Landlord Acknowledgment Note:</span>
                  <p className="text-slate-700 mt-0.5 italic">"{ticket.ownerResponse}"</p>
                </div>
              )}
              {ticket.resolutionNotes && (
                <div>
                  <span className="font-bold text-emerald-900 uppercase">Resolution Verification Notes:</span>
                  <p className="text-emerald-800 font-semibold mt-0.5">"{ticket.resolutionNotes}"</p>
                </div>
              )}
            </div>
          )}

          {/* Visual Lifecycle Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Lifecycle Transition Timeline
            </h4>
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-brand-600 border-2 border-white shadow-sm"></div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-900">
                      {event.status} ({event.actionByName} • {event.actionRole})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(event.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {event.notes && (
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{event.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Modals / In-Place Forms */}
          {actionType === 'acknowledge' && (
            <form onSubmit={handleAcknowledgeSubmit} className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 space-y-3">
              <h5 className="text-xs font-bold text-cyan-900 uppercase">Acknowledge Complaint</h5>
              <textarea
                placeholder="Optional message to resident (e.g. Electrician scheduled for 3 PM)..."
                rows={2}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cyan-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setActionType(null)} disabled={loading}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Acknowledging...' : 'Confirm Acknowledgment'}
                </Button>
              </div>
            </form>
          )}

          {actionType === 'start' && (
            <form onSubmit={handleStartSubmit} className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-3">
              <h5 className="text-xs font-bold text-purple-900 uppercase">Commence Maintenance Work</h5>
              <div>
                <label className="text-[11px] font-bold text-purple-900 block mb-1">Assign Lead Technician / Phone</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar (Plumber, 9876543210)"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <textarea
                placeholder="Work description / parts ordered..."
                rows={2}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setActionType(null)} disabled={loading}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Starting...' : 'Mark In Progress'}
                </Button>
              </div>
            </form>
          )}

          {actionType === 'resolve' && (
            <form onSubmit={handleResolveSubmit} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <h5 className="text-xs font-bold text-emerald-900 uppercase">Mark Complaint as Resolved</h5>
              <textarea
                required
                placeholder="Enter details of parts replaced, test verification results, and technician sign-off..."
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setActionType(null)} disabled={loading}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading ? 'Resolving...' : 'Submit Resolution'}
                </Button>
              </div>
            </form>
          )}

          {actionType === 'reopen' && (
            <form onSubmit={handleReopenSubmit} className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-3">
              <h5 className="text-xs font-bold text-orange-900 uppercase">Reopen Unresolved Complaint</h5>
              <p className="text-xs text-orange-800">
                Please explain why the issue persists or if previous repairs were unsuccessful:
              </p>
              <textarea
                required
                placeholder="Describe why the issue is not fixed..."
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-orange-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setActionType(null)} disabled={loading}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={loading}>
                  {loading ? 'Reopening...' : 'Reopen Complaint'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close Window
          </Button>

          <div className="flex items-center gap-2">
            {/* Landlord Actions */}
            {(isOwner || isAdmin) && (
              <>
                {(ticket.status === 'OPEN' || ticket.status === 'REOPENED') && !actionType && (
                  <Button size="sm" variant="outline" onClick={() => setActionType('acknowledge')}>
                    Acknowledge
                  </Button>
                )}
                {(ticket.status === 'ACKNOWLEDGED' || ticket.status === 'OPEN') && !actionType && (
                  <Button size="sm" variant="primary" onClick={() => setActionType('start')}>
                    Start Work
                  </Button>
                )}
                {(ticket.status === 'IN_PROGRESS' || ticket.status === 'ACKNOWLEDGED') && !actionType && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setActionType('resolve')}
                  >
                    Mark Resolved
                  </Button>
                )}
              </>
            )}

            {/* Tenant Actions */}
            {!isOwner && (
              <>
                {ticket.status === 'RESOLVED' && !actionType && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      icon={RotateCcw}
                      onClick={() => setActionType('reopen')}
                    >
                      Reopen
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      icon={CheckCircle2}
                      onClick={handleCloseSubmit}
                      disabled={loading}
                    >
                      {loading ? 'Closing...' : 'Close Ticket'}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTicketDetail;
