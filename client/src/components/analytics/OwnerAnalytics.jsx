import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  Star,
  ShieldCheck,
  Clock,
  Wrench,
  AlertCircle,
  Loader2,
  ChevronDown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  BedDouble,
  CheckCircle2,
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
import { Button } from '../common/Button';
import analyticsService from '../../services/analyticsService';

const PERIOD_OPTIONS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '12 Months', value: '12m' },
];

const COLORS = ['#0c8de6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export const OwnerAnalytics = ({ properties: parentProperties = [] }) => {
  const [period, setPeriod] = useState('12m');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Analytics data state
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [propertyPerf, setPropertyPerf] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = { period };
      if (selectedPropertyId) params.propertyId = selectedPropertyId;

      const [overviewRes, revRes, occRes, propsRes, maintRes] = await Promise.all([
        analyticsService.getOwnerOverview(params).catch((e) => ({ error: e })),
        analyticsService.getOwnerRevenue(params).catch((e) => ({ error: e })),
        analyticsService.getOwnerOccupancy(params).catch((e) => ({ error: e })),
        analyticsService.getOwnerProperties(params).catch((e) => ({ error: e })),
        analyticsService.getOwnerMaintenance(params).catch((e) => ({ error: e })),
      ]);

      if (overviewRes?.success) setOverview(overviewRes.data);
      if (revRes?.success) setRevenueData(revRes.data || []);
      if (occRes?.success) setOccupancyData(occRes.data || []);
      if (propsRes?.success) setPropertyPerf(propsRes.data || []);
      if (maintRes?.success) setMaintenanceData(maintRes.data);

      const firstError = [overviewRes, revRes, occRes, propsRes, maintRes].find((r) => r?.error);
      if (firstError?.error) {
        setErrorMsg(firstError.error.message || 'Failed to load some analytics metrics');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to analytics service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, selectedPropertyId]);

  // Derived Insights
  const calculateInsights = () => {
    if (!overview) return [];
    const insights = [];

    // 1. Occupancy Insight
    if (overview.occupancyPercentage >= 80) {
      insights.push({
        type: 'positive',
        title: 'Strong Occupancy Performance',
        description: `Your portfolio occupancy is currently at ${overview.occupancyPercentage}% with ${overview.occupiedBeds} of ${overview.totalBeds} beds occupied.`,
      });
    } else if (overview.occupancyPercentage > 0) {
      insights.push({
        type: 'warning',
        title: 'Occupancy Optimization Opportunity',
        description: `Current occupancy is ${overview.occupancyPercentage}%. ${overview.availableBeds} beds are currently vacant across listed accommodations.`,
      });
    } else {
      insights.push({
        type: 'info',
        title: 'No Active Occupancy',
        description: 'Publish room configurations or accept booking requests to start tracking occupancy metrics.',
      });
    }

    // 2. Revenue & Pending Rent Insight
    if (overview.pendingRent > 0) {
      insights.push({
        type: 'warning',
        title: 'Pending Rent Collection',
        description: `Pending rent balance stands at ₹${overview.pendingRent.toLocaleString()}. Total collected revenue is ₹${overview.totalRevenue.toLocaleString()}.`,
      });
    } else if (overview.totalRevenue > 0) {
      insights.push({
        type: 'positive',
        title: 'Rent Collection Up To Date',
        description: `All issued rent invoices are fully settled. Monthly rent collected is ₹${overview.monthlyRentCollected.toLocaleString()}.`,
      });
    }

    // 3. Best Performing Property Insight
    if (propertyPerf.length > 0) {
      const topProp = [...propertyPerf].sort((a, b) => b.occupancy - a.occupancy || b.revenue - a.revenue)[0];
      if (topProp && topProp.revenue > 0) {
        insights.push({
          type: 'positive',
          title: `Top Performer: ${topProp.propertyName}`,
          description: `Leading performance with ${topProp.occupancy}% occupancy, ₹${topProp.revenue.toLocaleString()} revenue, and ${topProp.rating}★ rating.`,
        });
      }
    }

    // 4. Maintenance SLA Insight
    if (overview.slaCompliancePercentage >= 90) {
      insights.push({
        type: 'positive',
        title: 'High SLA Maintenance Turnaround',
        description: `Maintenance SLA compliance is at ${overview.slaCompliancePercentage}%. Average resolution time is ${overview.averageMaintenanceResolutionTime}h.`,
      });
    } else if (overview.openMaintenanceTickets > 0) {
      insights.push({
        type: 'warning',
        title: 'Open Complaints Need Attention',
        description: `You have ${overview.openMaintenanceTickets} open ticket(s) including ${overview.urgentMaintenanceTickets} urgent request(s). SLA compliance is ${overview.slaCompliancePercentage}%.`,
      });
    }

    return insights;
  };

  const insightsList = calculateInsights();

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label, unit = '₹' }) => {
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
      {/* Analytics Controls & Period Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            Landlord Analytics & Financial Telemetry
          </h2>
          <p className="text-xs text-slate-500">
            Real MongoDB aggregation insights for properties, occupancy, revenue, and maintenance SLAs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Property Selector */}
          {parentProperties.length > 0 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Properties ({parentProperties.length})</option>
              {parentProperties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          {/* Period Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  period === opt.value
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
          <p className="font-semibold">Calculating real-time analytics pipelines...</p>
        </div>
      ) : (
        <>
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="p-4 border-l-4 border-l-brand-600">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Portfolio Occupancy
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {overview?.occupancyPercentage || 0}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {overview?.occupiedBeds || 0} / {overview?.totalBeds || 0} Beds Occupied
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-emerald-500">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Total Revenue
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                ₹{(overview?.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                ₹{(overview?.monthlyRentCollected || 0).toLocaleString()} Monthly Collected
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-indigo-500">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Active Residents
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {overview?.totalActiveResidents || 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {overview?.completedBookings || 0} Completed Stays
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-amber-500">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Pending Rent
              </span>
              <div className="text-2xl font-black text-amber-600 font-mono">
                ₹{(overview?.pendingRent || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-amber-700 mt-1 font-medium">
                {overview?.pendingBookings || 0} Pending Bookings
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-500">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Average Rating
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono flex items-center gap-1">
                {overview?.averagePropertyRating || 0}
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                From {overview?.totalReviews || 0} Resident Reviews
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-teal-500">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                SLA Compliance
              </span>
              <div className="text-2xl font-black text-teal-600 font-mono">
                {overview?.slaCompliancePercentage || 100}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {overview?.openMaintenanceTickets || 0} Open ({overview?.urgentMaintenanceTickets || 0} Urgent)
              </p>
            </Card>
          </div>

          {/* Dynamic Insight Cards */}
          {insightsList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {insightsList.map((ins, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs space-y-1 ${
                    ins.type === 'positive'
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : ins.type === 'warning'
                      ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                      : 'bg-brand-50/60 border-brand-200 text-brand-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <span>{ins.title}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{ins.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Multi-Property Comparative Cards */}
          {((overview?.propertiesSummary && overview.propertiesSummary.length > 0) || propertyPerf.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-brand-600" />
                    Multi-Property Comparative Scorecards
                  </h3>
                  <p className="text-xs text-slate-500">
                    Side-by-side performance across your accommodations (Beds, Occupancy, Revenue, and Ratings).
                  </p>
                </div>
                <Badge variant="purple" size="sm">
                  {overview?.propertiesSummary?.length || propertyPerf.length} Listed Properties
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(overview?.propertiesSummary || propertyPerf).map((prop) => {
                  const pTitle = prop.title || prop.propertyName || 'Property';
                  const pOccupancy = prop.occupancyRate ?? prop.occupancy ?? 0;
                  const pTotalB = prop.totalBeds || 0;
                  const pOccupiedB = prop.occupiedBeds || 0;
                  const pRev = prop.revenue || 0;
                  const pRating = prop.rating || 0;
                  const pReviews = prop.reviews || 0;
                  const pActive = prop.activeResidents || 0;
                  const pType = prop.propertyType || 'PG';
                  const pCity = prop.city || '';

                  return (
                    <Card
                      key={prop.propertyId || prop.title}
                      className="p-5 border-slate-200 hover:border-brand-300 transition-all shadow-xs space-y-3 bg-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge variant="brand" size="sm">
                              {pType}
                            </Badge>
                            {pCity && <span className="text-[10px] text-slate-500 font-semibold">{pCity}</span>}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{pTitle}</h4>
                        </div>

                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-lg">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{pRating}</span>
                          <span className="text-[10px] text-slate-400">({pReviews})</span>
                        </div>
                      </div>

                      {/* Occupancy Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Occupancy</span>
                          <span className="font-mono font-bold text-slate-900">
                            {pOccupancy}% ({pOccupiedB}/{pTotalB} Beds)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pOccupancy >= 80 ? 'bg-emerald-500' : pOccupancy >= 50 ? 'bg-brand-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, pOccupancy)}%` }}
                          />
                        </div>
                      </div>

                      {/* Revenue & Active Residents */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Revenue</span>
                          <span className="font-mono font-black text-emerald-600">
                            ₹{pRev.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Residents</span>
                          <span className="font-bold text-slate-800">{pActive} Active</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Charts Row 1: Monthly Revenue & Occupancy Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Monthly Revenue */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Monthly Revenue Trend</h3>
                  <p className="text-xs text-slate-500">Rent Collected vs Pending Rent over time</p>
                </div>
                <Badge variant="emerald" size="sm">
                  Financial Telemetry
                </Badge>
              </div>

              {revenueData.length === 0 || revenueData.every((r) => r.totalRevenue === 0 && r.pendingRent === 0) ? (
                <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  <DollarSign className="w-8 h-8 mb-1 opacity-40" />
                  No revenue data available yet for the selected period.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <Tooltip content={<CustomTooltip unit="₹" />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Bar dataKey="rentCollected" name="Rent Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pendingRent" name="Pending Rent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Chart 2: Occupancy Trend */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Occupancy Trend</h3>
                  <p className="text-xs text-slate-500">Monthly capacity utilization rate (%)</p>
                </div>
                <Badge variant="brand" size="sm">
                  Seat Capacity
                </Badge>
              </div>

              {occupancyData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  <BedDouble className="w-8 h-8 mb-1 opacity-40" />
                  No occupancy trend records available yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={occupancyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0c8de6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0c8de6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <Tooltip content={<CustomTooltip unit="%" />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Area
                        type="monotone"
                        dataKey="occupancyRate"
                        name="Occupancy Rate (%)"
                        stroke="#0c8de6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorOcc)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Charts Row 2: Property Performance Comparison & Maintenance SLA Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Property Performance Comparison */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Property Performance Comparison</h3>
                  <p className="text-xs text-slate-500">Revenue & Occupancy across accommodation listings</p>
                </div>
                <Badge variant="purple" size="sm">
                  Listing Comparison
                </Badge>
              </div>

              {propertyPerf.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  <Building2 className="w-8 h-8 mb-1 opacity-40" />
                  No property performance records found.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={propertyPerf} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="propertyName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <Tooltip content={<CustomTooltip unit="₹" />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#0c8de6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="occupancy" name="Occupancy (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Chart 4: Maintenance SLA Telemetry */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Maintenance Complaint SLA Distribution</h3>
                  <p className="text-xs text-slate-500">Complaint resolution by category & priority</p>
                </div>
                <Badge variant="brand" size="sm">
                  SLA Resolution Engine
                </Badge>
              </div>

              {!maintenanceData || maintenanceData.totalTickets === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  <Wrench className="w-8 h-8 mb-1 opacity-40" />
                  No maintenance complaints reported yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-64 items-center">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={maintenanceData.byCategory || []}
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          innerRadius={35}
                          paddingAngle={3}
                        >
                          {(maintenanceData.byCategory || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Tickets</span>
                      <span className="text-lg font-black text-slate-900 font-mono">
                        {maintenanceData.totalTickets} ({maintenanceData.openTickets} Open)
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Avg Turnaround</span>
                      <span className="text-lg font-black text-emerald-600 font-mono">
                        {maintenanceData.averageResolutionTime}h Fix / {maintenanceData.averageResponseTime}h Resp
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">SLA Compliance</span>
                      <span className="text-lg font-black text-brand-600 font-mono">
                        {maintenanceData.slaCompliancePercentage}% Met On-Time
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Property Performance Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Property Performance Matrix</h3>
                <p className="text-xs text-slate-500">Listing breakdown of occupancy, revenue, ratings, and SLA scores.</p>
              </div>
            </div>

            {propertyPerf.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No property listings found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
                      <th className="p-3">Property</th>
                      <th className="p-3">Type / City</th>
                      <th className="p-3">Occupancy</th>
                      <th className="p-3">Revenue</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Active Residents</th>
                      <th className="p-3">SLA Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {propertyPerf.map((prop) => (
                      <tr key={prop.propertyId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{prop.propertyName}</td>
                        <td className="p-3 text-slate-600">
                          {prop.propertyType} • {prop.city}
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-900">{prop.occupancy}%</span>
                          <span className="text-[10px] text-slate-400 block">
                            {prop.occupiedBeds}/{prop.totalBeds} Beds
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-600">
                          ₹{prop.revenue.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-1 font-bold text-slate-800">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            {prop.rating}
                            <span className="text-[10px] text-slate-400 font-normal">({prop.reviews})</span>
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{prop.activeResidents} Residents</td>
                        <td className="p-3">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                              prop.slaCompliance >= 90
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {prop.slaCompliance}% SLA
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default OwnerAnalytics;
