import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, Flame, ShieldAlert } from 'lucide-react';
import { SLA_CONFIG } from '../../constants';

export const SLABadge = ({ ticket, compact = false }) => {
  if (!ticket) return null;

  const {
    priority,
    status,
    createdAt,
    responseDeadline,
    resolutionDeadline,
    acknowledgedAt,
    resolvedAt,
    responseBreached,
    resolutionBreached,
    responseDurationHours,
    resolutionDurationHours,
  } = ticket;

  const slaInfo = SLA_CONFIG[priority] || SLA_CONFIG.MEDIUM;
  const now = new Date();

  // Helper to format remaining duration
  const getRemainingText = (targetDate) => {
    if (!targetDate) return '';
    const diffMs = new Date(targetDate).getTime() - now.getTime();
    if (diffMs <= 0) return 'Overdue';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;
      return `${days}d ${remainingHours}h remaining`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m remaining`;
    }
    return `${diffMins}m remaining`;
  };

  // State 1: Resolved or Closed
  if (status === 'RESOLVED' || status === 'CLOSED') {
    const isBreached = resolutionBreached;
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isBreached
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}
      >
        {isBreached ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>SLA Breached ({resolutionDurationHours != null ? `${resolutionDurationHours}h` : 'Late'})</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>SLA Met ({resolutionDurationHours != null ? `${resolutionDurationHours}h` : 'On-Time'})</span>
          </>
        )}
      </div>
    );
  }

  // State 2: Open (Awaiting First Response / Acknowledgment)
  if (status === 'OPEN' || status === 'REOPENED') {
    const isOverdue = responseBreached || now > new Date(responseDeadline);
    const text = getRemainingText(responseDeadline);

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isOverdue
            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
            : priority === 'URGENT'
            ? 'bg-amber-100 text-amber-900 border border-amber-300'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}
      >
        {isOverdue ? (
          <>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Response Overdue ({text})</span>
          </>
        ) : priority === 'URGENT' ? (
          <>
            <Flame className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            <span>Resp: {text}</span>
          </>
        ) : (
          <>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Resp: {text}</span>
          </>
        )}
      </div>
    );
  }

  // State 3: In Progress or Acknowledged (Awaiting Resolution)
  const isResolutionLate = resolutionBreached || now > new Date(resolutionDeadline);
  const remainingResText = getRemainingText(resolutionDeadline);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isResolutionLate
          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
      }`}
    >
      {isResolutionLate ? (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Resolution Overdue ({remainingResText})</span>
        </>
      ) : (
        <>
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>Fix: {remainingResText}</span>
        </>
      )}
    </div>
  );
};

export default SLABadge;
