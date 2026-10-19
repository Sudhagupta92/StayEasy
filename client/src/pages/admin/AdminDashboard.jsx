import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  Users,
  AlertOctagon,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Activity,
  UserCheck,
  Eye,
  Check,
  X,
  Loader2,
  AlertCircle,
  Star,
  Flag,
  ThumbsDown,
  Wrench,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { propertyService } from '../../services/propertyService';
import { reviewService } from '../../services/reviewService';
import { maintenanceService } from '../../services/maintenanceService';
import { AdminAnalytics } from '../../components/analytics/AdminAnalytics';
import { AdminAIInsights } from '../../components/ai/AdminAIInsights';
import { AdminFinance } from '../../components/payment/AdminFinance';
import { CreditCard } from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'overview'
  const [stats, setStats] = useState(null);
  const [adminProperties, setAdminProperties] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [maintenanceOverview, setMaintenanceOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Selected verification modal state
  const [selectedPropToVerify, setSelectedPropToVerify] = useState(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [auditTrustScore, setAuditTrustScore] = useState(92);
  const [verifying, setVerifying] = useState(false);
  const [moderatingId, setModeratingId] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [statsRes, propsRes, reviewsRes, maintRes] = await Promise.all([
        authService.getAdminOverview().catch(() => ({})),
        propertyService.getAdminProperties().catch(() => ({})),
        reviewService.getAdminFlaggedReviews().catch(() => ({})),
        maintenanceService.getAdminOverview().catch(() => ({})),
      ]);

      if (statsRes.success && statsRes.data?.systemStats) {
        setStats(statsRes.data.systemStats);
      }

      if (propsRes.success && propsRes.data) {
        setAdminProperties(propsRes.data.properties || []);
      }

      if (reviewsRes.success && reviewsRes.data) {
        setFlaggedReviews(reviewsRes.data.reviews || []);
      }

      if (maintRes.success && maintRes.data) {
        setMaintenanceOverview(maintRes.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load administrative console');
    } finally {
      setLoading(false);
    }
  };

  const handleModerateReview = async (reviewId, status) => {
    setModeratingId(reviewId);
    setActionSuccess('');
    setErrorMsg('');
    try {
      const res = await reviewService.moderateReview(reviewId, status);
      if (res.success) {
        setActionSuccess(`Review marked as ${status} successfully.`);
        await fetchAdminData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to moderate review');
    } finally {
      setModeratingId(null);
    }
  };


  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyAction = async (status) => {
    if (!selectedPropToVerify) return;
    setVerifying(true);

    try {
      const res = await propertyService.verifyProperty(selectedPropToVerify._id, {
        status,
        notes: auditNotes || `Audited and marked as ${status} by Admin.`,
        trustScore: Number(auditTrustScore) || 90,
      });

      if (res.success) {
        setActionSuccess(`Property listing ${status.toLowerCase()} successfully.`);
        setSelectedPropToVerify(null);
        setAuditNotes('');
        await fetchAdminData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update property status.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Admin Header */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center text-2xl font-black">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">StayEasy Trust & Audit Control</h2>
              <Badge variant="brand" size="sm">
                Admin Console
              </Badge>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Admin: {user?.name}</span>
              <span>• {user?.email}</span>
              <span>• Atlas Database: stayeasy</span>
            </p>
          </div>
        </div>

        <Button
          onClick={fetchAdminData}
          variant="outline"
          size="sm"
          className="bg-white/10 text-white border-white/20 hover:bg-white/20 self-start md:self-auto"
          icon={RefreshCw}
        >
          {loading ? 'Refreshing...' : 'Refresh Metrics'}
        </Button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" /> AI Platform Intelligence
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" /> Platform Analytics & Telemetry
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'finance'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-blue-600" /> Platform Financial Control
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-brand-600" /> Audit Pipeline & Moderation Control
        </button>
      </div>

      {activeTab === 'finance' && <AdminFinance />}

      {activeTab === 'ai' && <AdminAIInsights />}

      {activeTab === 'analytics' && <AdminAnalytics />}

      {activeTab === 'overview' && (
        <>
          {/* Real Atlas Admin Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats ? stats.totalUsers : '...'}
          </div>
          <span className="text-xs text-slate-500">Across USER, OWNER & ADMIN</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Properties</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {adminProperties.length}
          </div>
          <span className="text-xs text-emerald-600 font-medium">Listed in Atlas</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Landlords (Owners)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats ? stats.totalOwners : '...'}
          </div>
          <span className="text-xs text-indigo-600 font-medium">Registered Partners</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Audits</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {adminProperties.filter((p) => p.verificationStatus === 'PENDING').length}
          </div>
          <span className="text-xs text-amber-700 font-medium">Awaiting Physical Audit</span>
        </Card>
      </div>

      {/* Property Moderation & Verification Pipeline */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Platform Listings & Verification Pipeline</h3>
            <p className="text-xs text-slate-500">Inspect physical audit compliance, power sub-meters, and verify listings.</p>
          </div>
          <Badge variant="brand" size="sm">
            Verification Pipeline
          </Badge>
        </div>

        <div className="divide-y divide-slate-100">
          {adminProperties.map((prop) => (
            <div key={prop._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={prop.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5'}
                  alt={prop.title}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{prop.title}</h4>
                    <Badge variant="brand" size="sm">{prop.propertyType}</Badge>
                    <Badge
                      variant={
                        prop.verificationStatus === 'VERIFIED'
                          ? 'emerald'
                          : prop.verificationStatus === 'REJECTED'
                          ? 'rose'
                          : 'amber'
                      }
                      size="sm"
                    >
                      {prop.verificationStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{prop.address?.city}</span>
                    <span>• Landlord: {prop.ownerId?.name || 'Owner'}</span>
                    <span>• Trust Score: {prop.trustScore || 88}/100</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button
                  to={`/properties/${prop._id}`}
                  variant="ghost"
                  size="sm"
                  icon={Eye}
                >
                  Inspect
                </Button>
                <Button
                  onClick={() => {
                    setSelectedPropToVerify(prop);
                    setAuditNotes(prop.verificationNotes || '');
                    setAuditTrustScore(prop.trustScore || 92);
                  }}
                  variant="primary"
                  size="sm"
                  icon={ShieldCheck}
                >
                  Verify / Audit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Flagged Reviews & Moderation Queue */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Review Moderation Queue</h3>
            <p className="text-xs text-slate-500">Inspect reported resident reviews, flag inappropriate content, or approve valid reviews.</p>
          </div>
          <Badge variant="amber" size="sm" className="flex items-center gap-1">
            <Flag className="w-3.5 h-3.5" />
            {flaggedReviews.length} Flagged Review{flaggedReviews.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {flaggedReviews.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-slate-700">Moderation Queue Clear</p>
            <p className="mt-1">No reported reviews require administrative action.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {flaggedReviews.map((rev) => (
              <div key={rev._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{rev.title}</h4>
                    <span className="text-xs font-bold text-amber-500 flex items-center">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                      {rev.overallRating}.0
                    </span>
                    <Badge variant={rev.status === 'APPROVED' ? 'emerald' : rev.status === 'REJECTED' ? 'rose' : 'amber'} size="sm">
                      {rev.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{rev.comment}"</p>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>Property: {rev.propertyId?.title || 'Unknown'}</span>
                    <span>• Author: {rev.tenantId?.name || 'Resident'}</span>
                    <span>• Reports: {rev.flags?.length || 0} user flag(s)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <Button
                    onClick={() => handleModerateReview(rev._id, 'REJECTED')}
                    variant="outline"
                    size="sm"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    disabled={moderatingId === rev._id}
                  >
                    Reject & Remove
                  </Button>
                  <Button
                    onClick={() => handleModerateReview(rev._id, 'APPROVED')}
                    variant="primary"
                    size="sm"
                    disabled={moderatingId === rev._id}
                    icon={Check}
                  >
                    Approve Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Platform Maintenance & Complaint SLA Audit */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-brand-600" />
              Platform Maintenance & SLA Performance Audit
            </h3>
            <p className="text-xs text-slate-500">
              Audit complaint turnaround times, category hotspots, and landlord SLA compliance metrics.
            </p>
          </div>
          <Badge variant="brand" size="sm">
            SLA Resolution Engine
          </Badge>
        </div>

        {/* SLA KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-slate-900 text-white">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Complaints</span>
            <span className="text-2xl font-extrabold text-white font-mono">
              {maintenanceOverview?.summary?.totalTickets || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase text-rose-800">SLA Breach Rate</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-2xl font-extrabold text-rose-700 font-mono">
              {maintenanceOverview?.summary?.slaBreachRate != null
                ? `${maintenanceOverview.summary.slaBreachRate}%`
                : '0%'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase text-blue-800">Avg Response SLA</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-2xl font-extrabold text-blue-800 font-mono">
              {maintenanceOverview?.summary?.avgResponseHours != null
                ? `${maintenanceOverview.summary.avgResponseHours}h`
                : '0h'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Avg Resolution</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-extrabold text-emerald-800 font-mono">
              {maintenanceOverview?.summary?.avgResolutionHours != null
                ? `${maintenanceOverview.summary.avgResolutionHours}h`
                : '0h'}
            </span>
          </div>
        </div>

        {/* Breakdown: Categories & Landlord Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-700">Complaint Distribution by Category</h4>
            {maintenanceOverview?.byCategory && maintenanceOverview.byCategory.length > 0 ? (
              <div className="space-y-2">
                {maintenanceOverview.byCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{cat.count} tickets</span>
                      {cat.breachedCount > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {cat.breachedCount} breached
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No category telemetry data available yet.</p>
            )}
          </div>

          {/* Landlord SLA Performance Table */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-700">Landlord SLA Compliance Audit</h4>
            {maintenanceOverview?.ownerPerformance && maintenanceOverview.ownerPerformance.length > 0 ? (
              <div className="divide-y divide-slate-200 text-xs">
                {maintenanceOverview.ownerPerformance.slice(0, 5).map((owner) => (
                  <div key={owner.ownerId} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{owner.ownerName}</p>
                      <p className="text-[11px] text-slate-500">{owner.propertiesCount} properties • {owner.totalTickets} total tickets</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold ${owner.breachRate > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {owner.breachRate}% breach rate
                      </span>
                      <p className="text-[10px] text-slate-400">Avg Fix: {owner.avgResolutionHours}h</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No landlord maintenance records yet.</p>
            )}
          </div>
        </div>
      </Card>


      {/* Verification Action Modal */}
      {selectedPropToVerify && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase text-brand-600">Audit Verification</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedPropToVerify.title}</h3>
              </div>
              <button
                onClick={() => setSelectedPropToVerify(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">StayEasy Trust Score (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={auditTrustScore}
                  onChange={(e) => setAuditTrustScore(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Notes & Inspection Findings</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Verified sub-meter wiring, emergency fire exits, food license..."
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <Button
                onClick={() => handleVerifyAction('REJECTED')}
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                disabled={verifying}
              >
                Reject Listing
              </Button>
              <Button
                onClick={() => handleVerifyAction('VERIFIED')}
                variant="primary"
                size="sm"
                disabled={verifying}
                icon={Check}
              >
                {verifying ? 'Saving...' : 'Approve & Verify Listing'}
              </Button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default AdminDashboard;
