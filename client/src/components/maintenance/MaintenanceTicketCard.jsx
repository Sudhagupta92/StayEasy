import React from 'react';
import {
  Zap,
  Wrench,
  Wifi,
  Sparkles,
  Tv,
  Armchair,
  Droplets,
  Shield,
  FileText,
  Clock,
  User,
  Building,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { SLABadge } from './SLABadge';

export const getCategoryIcon = (category) => {
  switch (category) {
    case 'ELECTRICAL':
      return <Zap className="w-4 h-4 text-amber-500" />;
    case 'PLUMBING':
      return <Wrench className="w-4 h-4 text-blue-500" />;
    case 'INTERNET':
      return <Wifi className="w-4 h-4 text-indigo-500" />;
    case 'CLEANING':
      return <Sparkles className="w-4 h-4 text-emerald-500" />;
    case 'APPLIANCE':
      return <Tv className="w-4 h-4 text-purple-500" />;
    case 'FURNITURE':
      return <Armchair className="w-4 h-4 text-amber-700" />;
    case 'WATER':
      return <Droplets className="w-4 h-4 text-cyan-500" />;
    case 'SECURITY':
      return <Shield className="w-4 h-4 text-rose-500" />;
    default:
      return <FileText className="w-4 h-4 text-slate-500" />;
  }
};

export const getPriorityBadge = (priority) => {
  switch (priority) {
    case 'URGENT':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-200">
          Urgent (2h SLA)
        </span>
      );
    case 'HIGH':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
          High (8h SLA)
        </span>
      );
    case 'LOW':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-slate-100 text-slate-700 border border-slate-200">
          Low (48h SLA)
        </span>
      );
    case 'MEDIUM':
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">
          Medium (24h SLA)
        </span>
      );
  }
};

export const getStatusBadge = (status) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Open
        </span>
      );
    case 'ACKNOWLEDGED':
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
          Acknowledged
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Resolved
        </span>
      );
    case 'CLOSED':
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Closed
        </span>
      );
    case 'REOPENED':
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
          Reopened
        </span>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

export const MaintenanceTicketCard = ({
  ticket,
  onSelect,
  isOwner = false,
  onAcknowledge,
  onStart,
  onResolve,
  onReopen,
  onClose,
}) => {
  if (!ticket) return null;

  const propertyTitle = ticket.propertyId?.title || 'Accommodation Property';
  const tenantName = ticket.tenantId?.name || 'Resident';

  return (
    <Card
      className="p-5 hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-brand-300 flex flex-col justify-between gap-4 cursor-pointer"
      onClick={() => onSelect && onSelect(ticket)}
    >
      <div>
        {/* Top bar: Reference, Category, Priority, Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              {getCategoryIcon(ticket.category)}
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                #{ticket.ticketReference}
              </span>
              <span className="text-xs font-semibold text-slate-700 ml-2">
                {ticket.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getPriorityBadge(ticket.priority)}
            {getStatusBadge(ticket.status)}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-900 mb-1.5 line-clamp-1 group-hover:text-brand-600">
          {ticket.title}
        </h3>
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
          {ticket.description}
        </p>

        {/* Property & Tenant/Owner metadata */}
        <div className="space-y-1 py-2.5 border-t border-b border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate font-medium text-slate-700">{propertyTitle}</span>
          </div>
          {isOwner ? (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Resident: <strong className="text-slate-800">{tenantName}</strong></span>
            </div>
          ) : (
            ticket.assignedTo && (
              <div className="flex items-center gap-1.5 text-purple-700 font-medium">
                <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Assigned: {ticket.assignedTo}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Footer: SLA Countdown & Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <SLABadge ticket={ticket} />

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {isOwner ? (
            <>
              {(ticket.status === 'OPEN' || ticket.status === 'REOPENED') && onAcknowledge && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAcknowledge(ticket)}
                  className="text-xs py-1"
                >
                  Acknowledge
                </Button>
              )}
              {ticket.status === 'ACKNOWLEDGED' && onStart && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onStart(ticket)}
                  className="text-xs py-1"
                >
                  Start Work
                </Button>
              )}
              {ticket.status === 'IN_PROGRESS' && onResolve && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onResolve(ticket)}
                  className="text-xs py-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Resolve
                </Button>
              )}
            </>
          ) : (
            <>
              {ticket.status === 'RESOLVED' && onReopen && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReopen(ticket)}
                  className="text-xs py-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                  icon={RotateCcw}
                >
                  Reopen
                </Button>
              )}
              {ticket.status === 'RESOLVED' && onClose && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onClose(ticket)}
                  className="text-xs py-1 bg-emerald-600 hover:bg-emerald-700"
                  icon={CheckCircle2}
                >
                  Close
                </Button>
              )}
            </>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSelect && onSelect(ticket)}
            className="text-xs py-1"
            icon={ChevronRight}
            iconPosition="right"
          >
            Details
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MaintenanceTicketCard;
