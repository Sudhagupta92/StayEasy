import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  Zap,
  Home,
  Wrench,
  Star,
  Clock,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
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

const COLORS = ['#0c8de6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const UserAnalytics = () => {
  const [period, setPeriod] = useState('12m');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [overview, setOverview] = useState(null);
  const [spendingData, setSpendingData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState(null);

  const fetchTenantAnalytics = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = { period };
      const [overviewRes, spendRes, maintRes] = await Promise.all([
        analyticsService.getUserOverview(params).catch((e) => ({ error: e })),
        analyticsService.getUserSpending(params).catch((e) => ({ error: e })),
        analyticsService.getUserMaintenance(params).catch((e) => ({ error: e })),
      ]);

      if (overviewRes?.success) setOverview(overviewRes.data);
      if (spendRes?.success) setSpendingData(spendRes.data || []);
      if (maintRes?.success) setMaintenanceData(maintRes.data);

      const firstError = [overviewRes, spendRes, maintRes].find((r) => r?.error);
      if (firstError?.error) {
        setErrorMsg(firstError.error.message || 'Failed to load some spending analytics');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to analytics service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantAnalytics();
  }, [period]);

  // Derived Insights
  const calculateInsights = () => {
    if (!overview) return [];
    const insights = [];

    // 1. Spending Insight
    const totalSpent = overview.totalRentPaid + overview.pendingRent;
    if (totalSpent > 0) {
      insights.push({
        type: 'info',
        title: 'Monthly Expenditure Summary',
        description: `Total accumulated accommodation spending is ₹${totalSpent.toLocaleString()} (₹${overview.totalRentPaid.toLocaleString()} paid, ₹${overview.pendingRent.toLocaleString()} pending).`,
      });
    }

    // 2. Electricity Usage Insight
    if (overview.totalElectricityCost > 0 && totalSpent > 0) {
      const elecPct = Math.round((overview.totalElectricityCost / totalSpent) * 100);
      insights.push({
        type: 'warning',
        title: 'Sub-metered Electricity Usage',
        description: `Electricity costs account for ${elecPct}% (₹${overview.totalElectricityCost.toLocaleString()}) of your total living expenses.`,
      });
    } else {
      insights.push({
        type: 'positive',
        title: 'Electricity Metering Included',
        description: 'Transparent sub-meter readings ensure accurate billing for energy consumption.',
      });
    }

    // 3. Maintenance Turnaround Insight
    if (maintenanceData) {
      if (maintenanceData.slaStatus?.complianceRate >= 90) {
        insights.push({
          type: 'positive',
          title: 'Reliable Landlord SLA Response',
          description: `Your landlord has met ${maintenanceData.slaStatus.complianceRate}% of complaint SLA turnaround deadlines (avg fix time: ${maintenanceData.averageResolutionTime}h).`,
        });
      } else if (maintenanceData.open > 0) {
        insights.push({
          type: 'warning',
          title: 'Open Complaints In Progress',
          description: `You have ${maintenanceData.open} active complaint ticket(s) currently being addressed by landlord.`,
        });
      }
    }

    return insights;
  };

  const insightsList = calculateInsights();

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
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
              <span className="font-mono font-bold">₹{Number(entry.value).toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            Tenant Spending & Accommodation Telemetry
          </h2>
          <p className="text-xs text-slate-500">
            Real MongoDB insights on your rent ledger, sub-meter power costs, and complaint turnaround SLAs.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200 self-start sm:self-auto">
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

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="font-semibold">Loading tenant financial insights...</p>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 border-l-4 border-l-brand-600">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Total Rent Paid
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                ₹{(overview?.totalRentPaid || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Pending: ₹{(overview?.pendingRent || 0).toLocaleString()}
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-amber-500">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Electricity Cost
              </span>
              <div className="text-2xl font-black text-amber-600 font-mono">
                ₹{(overview?.totalElectricityCost || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Sub-Meter Power Charges</p>
            </Card>

            <Card className="p-4 border-l-4 border-l-emerald-500">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Total Spending
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                ₹{((overview?.totalRentPaid || 0) + (overview?.totalElectricityCost || 0)).toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-700 mt-1 font-medium">Rent + Sub-meter Power</p>
            </Card>

            <Card className="p-4 border-l-4 border-l-indigo-500">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Active Stay
              </span>
              <div className="text-sm font-bold text-slate-900 truncate">
                {overview?.currentProperty || 'No Active Stay'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {overview?.currentRoom || 'N/A'}
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-500">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Maintenance Tickets
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {overview?.totalMaintenanceTickets || 0}
              </div>
              <p className="text-[11px] text-purple-700 mt-1 font-medium">
                {overview?.resolvedMaintenanceTickets || 0} Resolved On-Time
              </p>
            </Card>
          </div>

          {/* Dynamic Insight Cards */}
          {insightsList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <p className="text-[11px] text-slate-600 leading-snug">{ins.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Monthly Spending */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Monthly Spending Trend</h3>
                  <p className="text-xs text-slate-500">Total expenditure per month (Rent & Sub-meter power)</p>
                </div>
                <Badge variant="brand" size="sm">
                  Monthly Run Rate
                </Badge>
              </div>

              {spendingData.length === 0 || spendingData.every((s) => s.total === 0) ? (
                <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  <Receipt className="w-8 h-8 mb-1 opacity-40" />
                  No spending history available yet for the selected period.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spendingData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0c8de6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0c8de6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Total Monthly Spending (₹)"
                        stroke="#0c8de6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSpend)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Chart 2: Rent vs Electricity Breakdown */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Base Rent vs Sub-meter Electricity</h3>
                  <p className="text-xs text-slate-500">Breakdown of accommodation costs per billing cycle</p>
                </div>
                <Badge variant="emerald" size="sm">
                  Cost Breakdown
                </Badge>
              </div>

              {spendingData.length === 0 || spendingData.every((s) => s.rent === 0 && s.electricity === 0) ? (
                <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  <Zap className="w-8 h-8 mb-1 opacity-40" />
                  No cost breakdown records available yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={spendingData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Bar dataKey="rent" name="Base Rent" fill="#0c8de6" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="electricity" name="Electricity Charges" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Maintenance & SLA Resolution Performance */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Landlord Maintenance SLA Reliability</h3>
                <p className="text-xs text-slate-500">Turnaround tracking for reported maintenance issues</p>
              </div>
              <Badge variant="purple" size="sm">
                SLA Performance
              </Badge>
            </div>

            {!maintenanceData || maintenanceData.totalTickets === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
                No maintenance tickets submitted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Complaints</span>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {maintenanceData.totalTickets} ({maintenanceData.open} Active)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{maintenanceData.resolved} Fully Resolved</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">Avg Resolution Time</span>
                  <div className="text-2xl font-black text-emerald-700 font-mono">
                    {maintenanceData.averageResolutionTime} Hours
                  </div>
                  <p className="text-[11px] text-emerald-600 mt-1">From submission to fix</p>
                </div>

                <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200">
                  <span className="text-[10px] font-bold uppercase text-brand-800 block mb-1">SLA Compliance</span>
                  <div className="text-2xl font-black text-brand-700 font-mono">
                    {maintenanceData.slaStatus?.complianceRate || 100}%
                  </div>
                  <p className="text-[11px] text-brand-600 mt-1">
                    {maintenanceData.slaStatus?.metCount || 0} Met / {maintenanceData.slaStatus?.breachedCount || 0} Breached
                  </p>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default UserAnalytics;
