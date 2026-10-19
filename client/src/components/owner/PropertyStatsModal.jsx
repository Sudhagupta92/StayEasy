import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  BedDouble,
  DollarSign,
  Users,
  Star,
  Wrench,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { propertyService } from '../../services/propertyService';

export const PropertyStatsModal = ({ isOpen, property, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && property?._id) {
      setLoading(true);
      setErrorMsg('');
      propertyService
        .getPropertyStats(property._id)
        .then((res) => {
          if (res.success && res.data) {
            setStats(res.data);
          }
        })
        .catch((err) => {
          setErrorMsg(err.message || 'Failed to fetch property statistics');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, property?._id]);

  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase text-brand-600">
              {property.propertyType} • {property.address?.city}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">{property.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            <span>Calculating property statistics...</span>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Occupancy Hero Metric */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-brand-950 text-white space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Seat Occupancy Rate
                </span>
                <Badge variant="emerald" size="sm">
                  {stats.occupancyRate >= 80 ? 'High Demand' : 'Normal'}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono">{stats.occupancyRate}%</span>
                <span className="text-xs text-slate-300">
                  ({stats.occupiedBeds} occupied / {stats.totalBeds} total beds)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.occupancyRate)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-400 pt-1">
                <span>{stats.availableBeds} Vacant Seats</span>
                <span>{stats.totalRooms} Rooms</span>
              </div>
            </div>

            {/* Metric Scorecard Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Monthly Revenue
                </span>
                <span className="text-xl font-black text-emerald-700 font-mono block">
                  ₹{stats.monthlyRevenue?.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600">Collected this month</span>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Pending Rent
                </span>
                <span className="text-xl font-black text-amber-700 font-mono block">
                  ₹{stats.pendingRent?.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-600">Due from residents</span>
              </div>

              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-indigo-800 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Active Residents
                </span>
                <span className="text-xl font-black text-indigo-700 font-mono block">
                  {stats.activeResidents}
                </span>
                <span className="text-[10px] text-indigo-600">Checked-in tenants</span>
              </div>

              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-purple-800 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Resident Rating
                </span>
                <span className="text-xl font-black text-slate-900 font-mono block">
                  {stats.averageRating}★
                </span>
                <span className="text-[10px] text-purple-600">{stats.totalReviews} Reviews</span>
              </div>

              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-rose-800 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" /> Open Maintenance
                </span>
                <span className="text-xl font-black text-rose-700 font-mono block">
                  {stats.pendingMaintenanceRequests}
                </span>
                <span className="text-[10px] text-rose-600">Pending issues</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> Trust Score
                </span>
                <span className="text-xl font-black text-brand-600 font-mono block">
                  {property.trustScore || 88} / 100
                </span>
                <span className="text-[10px] text-slate-500">Physical audit score</span>
              </div>
            </div>

            {/* Room Type Breakdown */}
            {stats.roomTypeBreakdown && Object.keys(stats.roomTypeBreakdown).length > 0 && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Room Sharing Type Distribution
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.roomTypeBreakdown).map(([type, count]) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    >
                      {type.replace('_', ' ')}: <strong>{count} Rooms</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="pt-2 flex justify-end">
          <Button onClick={onClose} variant="primary" size="sm">
            Close Scorecard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertyStatsModal;
