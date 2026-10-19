import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Building,
  DollarSign,
  Star,
  Wrench,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import analyticsService from '../../services/analyticsService';

const PERIOD_OPTIONS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '12 Months', value: '12m' },
];

const COLORS = ['#0c8de6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export const AdminAnalytics = () => {
  const [period, setPeriod] = useState('12m');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topProperties, setTopProperties] = useState([]);
  const [maintAnalytics, setMaintAnalytics] = useState(null);

  const fetchAdminAnalytics = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = { period };
      const [overviewRes, trendsRes, topPropsRes, maintRes] = await Promise.all([
        analyticsService.getAdminOverview(params).catch((e) => ({ error: e })),
        analyticsService.getAdminTrends(params).catch((e) => ({ error: e })),
        analyticsService.getAdminTopProperties(params).catch((e) => ({ error: e })),
        analyticsService.getAdminMaintenance(params).catch((e) => ({ error: e })),
      ]);

      if (overviewRes?.success) setOverview(overviewRes.data);
      if (trendsRes?.success) setTrends(trendsRes.data || []);
      if (topPropsRes?.success) setTopProperties(topPropsRes.data || []);
      if (maintRes?.success) setMaintAnalytics(maintRes.data);

      const firstError = [overviewRes, trendsRes, topPropsRes, maintRes].find((r) => r?.error);
      if (firstError?.error) {
        setErrorMsg(firstError.error.message || 'Failed to load platform analytics telemetry');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to platform analytics service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminAnalytics();
  }, [period]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label, unit = '' }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
          <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-mono font-bold">
                {unit === '₹' ? `₹${Number(entry.value).toLocaleString()}` : `${entry.value}${unit}`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              StayEasy Platform Analytics & Audit Command
            </h2>
            <p className="text-xs text-slate-400">
              Platform-wide telemetry from MongoDB collections for growth, revenue, listings, and landlord compliance.
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex bg-slate-900 p-1 rounded-xl gap-1 border border-slate-800 self-start sm:self-auto">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                period === opt.value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="font-semibold">Aggregating platform-wide telemetry pipelines...</p>
        </div>
      ) : (
        <>
          {/* Top Platform KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3">
            <Card className="p-3.5 border-l-4 border-l-brand-600">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Total Users</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {overview?.totalUsers || 0}
              </span>
            </Card>

            <Card className="p-3.5 border-l-4 border-l-indigo-600">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Landlords</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {overview?.totalOwners || 0}
              </span>
            </Card>

            <Card className="p-3.5 border-l-4 border-l-emerald-600">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Properties</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {overview?.totalProperties || 0}
              </span>
              <span className="text-[9px] text-emerald-600 font-semibold block">
                {overview?.verifiedProperties || 0} Verified
              </span>
            </Card>

            <Card className="p-3.5 border-l-4 border-l-amber-500">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Pending Audits</span>
              <span className="text-xl font-extrabold text-amber-600 font-mono">
                {overview?.pendingPropertyVerification || 0}
              </span>
            </Card>

            <Card className="p-3.5 border-l-4 border-l-purple-600">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Bookings</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {overview?.totalBookings || 0}
              </span>
              <span className="text-[9px] text-slate-500 block">{overview?.activeStays || 0} Active</span>
            </Card>

            <Card className="p-3.5 border-l-4 border-l-teal-600">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Platform GMV</span>
              <span className="text-xl font-extrabold text-teal-600 font-mono">
                ₹{(overview?.totalRevenue || 0).toLocaleString()}
              </span>
            </Card>

            <Card className="p-3.5 border-l-4 border-l-amber-600">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Verified Reviews</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono flex items-center gap-1">
                {overview?.totalVerifiedReviews || overview?.totalReviews || 0}
                <span className="text-xs text-amber-500 font-bold">★{overview?.averagePlatformRating || 0}</span>
              </span>
              <span className="text-[9px] text-emerald-600 font-semibold block">
                {overview?.totalVerifiedResidents || 0} Verified Residents
              </span>
            </Card>

            <Card className="p-3.5 border-l-4 border-l-rose-500">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Tickets</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {overview?.totalMaintenanceTickets || 0}
              </span>
              <span className="text-[9px] text-rose-600 font-semibold block">
                {overview?.openMaintenanceTickets || 0} Open
              </span>
            </Card>

            <Card className="p-3.5 border-l-4 border-l-emerald-500">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">SLA Rate</span>
              <span className="text-xl font-extrabold text-emerald-600 font-mono">
                {overview?.slaCompliance || 100}%
              </span>
            </Card>
          </div>

          {/* Platform Bed Capacity & Financial Escrow Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-indigo-950 to-slate-900 text-white border-indigo-800/50 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Platform Bed Inventory</span>
                <Building className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-2xl font-black font-mono mt-2">{overview?.platformBeds?.totalPlatformBeds || 0}</div>
              <div className="text-xs text-indigo-200 mt-1">
                {overview?.platformBeds?.occupiedPlatformBeds || 0} Occupied ({overview?.platformBeds?.platformOccupancyRate || 0}%)
              </div>
              <div className="w-full bg-indigo-950/80 h-2 rounded-full mt-3 overflow-hidden border border-indigo-700/50">
                <div 
                  className="bg-indigo-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(overview?.platformBeds?.platformOccupancyRate || 0, 100)}%` }}
                />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-emerald-950 to-slate-900 text-white border-emerald-800/50 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Available Vacancies</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black font-mono mt-2">{overview?.platformBeds?.availablePlatformBeds || 0}</div>
              <div className="text-xs text-emerald-200 mt-1">Live vacant beds ready for instant booking</div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-teal-950 to-slate-900 text-white border-teal-800/50 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">Gross Merchandise Value</span>
                <DollarSign className="w-5 h-5 text-teal-400" />
              </div>
              <div className="text-2xl font-black font-mono mt-2">₹{(overview?.grossMerchandiseValue || overview?.totalRevenue || 0).toLocaleString()}</div>
              <div className="text-xs text-teal-200 mt-1">Cumulative platform-wide transacted rent</div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-amber-950 to-slate-900 text-white border-amber-800/50 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Escrow Held Deposits</span>
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-black font-mono mt-2">₹{(overview?.escrowHeld || 0).toLocaleString()}</div>
              <div className="text-xs text-amber-200 mt-1">Security deposits protected under escrow</div>
            </Card>
          </div>

          {/* Property Type Distribution Breakdown */}
          {overview?.propertyTypeDistribution && overview.propertyTypeDistribution.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Platform Property Classification Mix</h3>
                  <p className="text-xs text-slate-500">Telemetry across PGs, Hostels, Co-living, Flats, and Private Rooms</p>
                </div>
                <Badge variant="indigo" size="sm">
                  Inventory Distribution
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {overview.propertyTypeDistribution.map((item, idx) => (
                  <div key={item.type || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        {item.type ? item.type.replace('_', ' ') : 'PG'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 font-mono">
                      {item.count} <span className="text-xs font-normal text-slate-500">listings</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-brand-600 h-full rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Growth & Trend Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: User & Landlord Growth */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">User & Landlord Acquisition</h3>
                  <p className="text-xs text-slate-500">Monthly new tenants (`USER`) and landlords (`OWNER`)</p>
                </div>
                <Badge variant="brand" size="sm">
                  Acquisition
                </Badge>
              </div>

              {trends.length === 0 ? (
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  No user growth records.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0c8de6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0c8de6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorOwners" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Area type="monotone" dataKey="newUsers" name="New Tenants" stroke="#0c8de6" fill="url(#colorUsers)" />
                      <Area type="monotone" dataKey="newOwners" name="New Landlords" stroke="#8b5cf6" fill="url(#colorOwners)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Chart 2: Revenue & Booking Volume */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Platform GMV & Booking Volume</h3>
                  <p className="text-xs text-slate-500">Gross platform revenue and completed reservations</p>
                </div>
                <Badge variant="emerald" size="sm">
                  Platform GMV
                </Badge>
              </div>

              {trends.length === 0 ? (
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  No revenue trends found.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <Tooltip content={<CustomTooltip unit="₹" />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="bookings" name="Bookings Count" fill="#0c8de6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Tables Row: Top Properties & Landlord SLA Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table 1: Top Performing Properties */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Top Performing Accommodations</h3>
                  <p className="text-xs text-slate-500">Ranked by composite occupancy, ratings, and revenue</p>
                </div>
                <Badge variant="brand" size="sm">
                  Top Listings
                </Badge>
              </div>

              {topProperties.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No listings found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
                        <th className="p-2.5">Property</th>
                        <th className="p-2.5">Landlord</th>
                        <th className="p-2.5">Occupancy</th>
                        <th className="p-2.5">Rating</th>
                        <th className="p-2.5">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topProperties.slice(0, 5).map((prop) => (
                        <tr key={prop.propertyId} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-900">{prop.propertyName}</td>
                          <td className="p-2.5 text-slate-600">{prop.ownerName}</td>
                          <td className="p-2.5 font-mono font-bold text-slate-900">{prop.occupancy}%</td>
                          <td className="p-2.5 font-bold text-amber-600">★ {prop.rating}</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-600">
                            ₹{prop.revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Table 2: Landlord SLA Compliance Ranking */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Landlord SLA Compliance Audit</h3>
                  <p className="text-xs text-slate-500">Ranked landlord maintenance turnaround reliability</p>
                </div>
                <Badge variant="purple" size="sm">
                  SLA Resolution Audit
                </Badge>
              </div>

              {!maintAnalytics || !maintAnalytics.ownerComplianceRanking || maintAnalytics.ownerComplianceRanking.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No landlord maintenance records.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
                        <th className="p-2.5">Landlord</th>
                        <th className="p-2.5">Properties</th>
                        <th className="p-2.5">Total Tickets</th>
                        <th className="p-2.5">Breach %</th>
                        <th className="p-2.5">Avg Fix Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {maintAnalytics.ownerComplianceRanking.slice(0, 5).map((o) => (
                        <tr key={o.ownerId} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-900">{o.ownerName}</td>
                          <td className="p-2.5 text-slate-600">{o.propertiesCount} Props</td>
                          <td className="p-2.5 font-mono">{o.totalTickets}</td>
                          <td className="p-2.5 font-mono font-bold">
                            <span className={o.breachRate > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                              {o.breachRate}%
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-700">{o.avgResolutionHours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Maintenance Categories Breakdown */}
          {maintAnalytics && maintAnalytics.categoryDistribution && (
            <Card className="p-6">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Platform Maintenance Complaint Category Telemetry
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                {maintAnalytics.categoryDistribution.map((cat) => (
                  <div key={cat.category} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      {cat.category}
                    </span>
                    <span className="text-lg font-black text-slate-900 font-mono block">
                      {cat.count} tickets
                    </span>
                    {cat.breachedCount > 0 && (
                      <span className="text-[10px] font-bold text-rose-600">
                        {cat.breachedCount} SLA Breaches
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
