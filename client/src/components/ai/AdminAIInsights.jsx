import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Building,
  Users,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AIInsightBadge } from './AIInsightBadge';
import { aiService } from '../../services/aiService';

export const AdminAIInsights = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await aiService.getAdminInsights();
      if (res.success) {
        setAdminData(res.data);
        if (res.data?.isFallback) setIsFallback(true);
      }
    } catch (err) {
      console.error('[Admin AI Insights] Error:', err);
      setErrorMsg('Platform AI insights are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm font-medium">Aggregating platform demand telemetry & maintenance risk alerts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AIInsightBadge variant={isFallback ? 'Limited Data' : 'AI Insight'} />
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              Platform Regulator Telemetry
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">Platform Demand & Risk Intelligence</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Macro platform analytics evaluating student demand growth, room sharing preferences, and landlord SLA compliance risks.
          </p>
        </div>
      </div>

      {isFallback && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Notice:</span> Platform insights calculated from statistical MongoDB aggregation fallback.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Demand Forecast Insights */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" /> Platform Demand & Market Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {adminData?.demandTrends?.map((trend, idx) => (
            <Card key={idx} className="p-5 border-l-4 border-l-emerald-600">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-2">
                <Sparkles className="w-4 h-4" /> Market Telemetry #{idx + 1}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{trend}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Alerts & Telemetry */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" /> System Alerts & Operational Telemetry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminData?.platformAlerts?.map((alert, idx) => (
            <Card key={idx} className="p-5 border-l-4 border-l-amber-500 bg-amber-50/20">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-2">
                <ShieldCheck className="w-4 h-4" /> Operational Alert #{idx + 1}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">{alert}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
