import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Building,
  Star,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Info,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { AIInsightBadge } from './AIInsightBadge';
import { aiService } from '../../services/aiService';

export const TenantAIInsights = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState([]);
  const [preferences, setPreferences] = useState({
    budgetMin: 0,
    budgetMax: 50000,
    preferredLocations: [],
    preferredAmenities: [],
    preferredRoomType: '',
    foodPreference: '',
  });
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedPropId, setExpandedPropId] = useState(null);
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [recsRes, insightsRes, prefsRes] = await Promise.allSettled([
        aiService.getRecommendations(),
        aiService.getTenantInsights(),
        aiService.getPreferences(),
      ]);

      if (recsRes.status === 'fulfilled' && recsRes.value?.success) {
        const recData = recsRes.value.data;
        setRecommendations(recData.recommendations || []);
        setIsFallback(Boolean(recData.isFallback));
      }

      if (insightsRes.status === 'fulfilled' && insightsRes.value?.success) {
        setInsights(insightsRes.value.data?.insights || []);
      }

      if (prefsRes.status === 'fulfilled' && prefsRes.value?.success) {
        setPreferences((prev) => ({ ...prev, ...(prefsRes.value.data || {}) }));
      }
    } catch (err) {
      console.error('[Tenant AI Insights] Error:', err);
      setErrorMsg('AI insights are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const res = await aiService.updatePreferences(preferences);
      if (res.success) {
        setShowPrefModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm font-medium">Analyzing listings & computing personalized match scores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AIInsightBadge variant={isFallback ? 'Limited Data' : 'AI Insight'} />
            <span className="text-xs text-purple-200 uppercase tracking-widest font-semibold">
              StayEasy Intelligence Engine
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">Smart Match & Residency Insights</h2>
          <p className="text-sm text-purple-200 mt-1 max-w-xl">
            Hybrid algorithmic property matching evaluating budget constraints, location proximity, verified ratings, and amenities.
          </p>
        </div>
        <Button
          onClick={() => setShowPrefModal(true)}
          variant="secondary"
          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          icon={SlidersHorizontal}
        >
          Update Preferences
        </Button>
      </div>

      {isFallback && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Notice:</span> AI microservice is currently running on limited data fallback. Core StayEasy recommendations remain active.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Smart Spending & Residency Telemetry */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <Card key={idx} className="p-5 border-l-4 border-l-brand-600">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  {insight.type === 'SPENDING' ? <DollarSign className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
                <h4 className="text-sm font-bold text-slate-800">{insight.title}</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{insight.description}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" /> Recommended For You
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {recommendations.length} property match(es) computed
          </span>
        </div>

        {recommendations.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <Building className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium">No property recommendations found matching your parameters.</p>
            <p className="text-xs text-slate-400 mt-1">Try updating your budget limits or preferred locations.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const isExpanded = expandedPropId === rec.propertyId;
              return (
                <Card key={rec.propertyId} className="p-5 hover:border-brand-300 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 line-clamp-1">{rec.propertyName}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {rec.city || 'Prime City Location'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                        {rec.score}% Match
                      </span>
                      <AIInsightBadge variant={rec.score >= 85 ? 'Recommended' : 'AI Insight'} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Monthly Rent</span>
                      <p className="text-xs font-black text-slate-800">₹{rec.price?.toLocaleString()}/mo</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Rating</span>
                      <p className="text-xs font-black text-amber-600 flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" /> {rec.rating || 4.5}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Seats</span>
                      <p className="text-xs font-black text-emerald-700">{rec.availability}</p>
                    </div>
                  </div>

                  {/* Reasons Preview */}
                  <div className="space-y-1.5 mb-3">
                    {rec.reasons?.slice(0, 2).map((reason, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* Expandable Explanation */}
                  <button
                    onClick={() => setExpandedPropId(isExpanded ? null : rec.propertyId)}
                    className="w-full pt-2 flex items-center justify-between text-xs font-bold text-brand-600 hover:text-brand-700 border-t border-slate-100"
                  >
                    <span>Why this property match?</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs space-y-2">
                      <div className="font-bold text-purple-900 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-purple-600" /> Algorithmic Match Factors:
                      </div>
                      <ul className="space-y-1 text-slate-700 pl-4 list-disc">
                        {rec.reasons?.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                      <div className="pt-1 text-[11px] text-purple-700 font-medium">
                        Verified StayEasy Trust Score: <span className="font-bold">{rec.trustScore || 88}/100</span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Preferences Modal */}
      {showPrefModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-brand-600" /> Update Tenant Preferences
            </h3>
            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Budget Limits (₹/month)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min Rent"
                    value={preferences.budgetMin}
                    onChange={(e) => setPreferences({ ...preferences, budgetMin: Number(e.target.value) })}
                    className="px-3 py-2 border rounded-xl text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max Rent"
                    value={preferences.budgetMax}
                    onChange={(e) => setPreferences({ ...preferences, budgetMax: Number(e.target.value) })}
                    className="px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Preferred Location (City / Area)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Koramangala"
                  value={preferences.preferredLocations.join(', ')}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      preferredLocations: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Preferred Amenities (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. AC, Wi-Fi, Food, Power Backup"
                  value={preferences.preferredAmenities.join(', ')}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      preferredAmenities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPrefModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={savingPrefs}>
                  {savingPrefs ? 'Saving...' : 'Save & Refresh Recommendations'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
