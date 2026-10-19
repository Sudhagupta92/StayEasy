import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Building,
  Loader2,
  AlertCircle,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AIInsightBadge } from './AIInsightBadge';
import { aiService } from '../../services/aiService';

export const OwnerAIInsights = () => {
  const [occupancy, setOccupancy] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [maintenanceRisk, setMaintenanceRisk] = useState([]);
  const [insights, setInsights] = useState([]);
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
      const [occRes, revRes, maintRes, insRes] = await Promise.allSettled([
        aiService.getOccupancyPrediction(),
        aiService.getRevenuePrediction(),
        aiService.getMaintenanceRisk(),
        aiService.getOwnerInsights(),
      ]);

      if (occRes.status === 'fulfilled' && occRes.value?.success) {
        setOccupancy(occRes.value.data);
        if (occRes.value.data?.isFallback) setIsFallback(true);
      }

      if (revRes.status === 'fulfilled' && revRes.value?.success) {
        setRevenue(revRes.value.data);
      }

      if (maintRes.status === 'fulfilled' && maintRes.value?.success) {
        setMaintenanceRisk(maintRes.value.data?.riskMatrix || []);
      }

      if (insRes.status === 'fulfilled' && insRes.value?.success) {
        setInsights(insRes.value.data?.insights || []);
      }
    } catch (err) {
      console.error('[Owner AI Insights] Error:', err);
      setErrorMsg('AI predictions are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm font-medium">Computing occupancy forecast & maintenance risk telemetry...</p>
      </div>
    );
  }

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AIInsightBadge variant={isFallback ? 'Limited Data' : 'Predicted'} />
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              Landlord Predictive Engine
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">Occupancy & Revenue Forecast Intelligence</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Machine learning regression models analyzing booking velocity, rent collection cycles, and maintenance SLA risk.
          </p>
        </div>
      </div>

      {isFallback && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Notice:</span> Prediction engine running on limited-data weighted moving average fallback.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid 1: Occupancy & Revenue Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Occupancy Forecast Card */}
        {occupancy && (
          <Card className="p-6 space-y-4 border-l-4 border-l-indigo-600">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Occupancy Forecast</span>
                <h3 className="text-xl font-extrabold text-slate-900">Next Month Projection</h3>
              </div>
              <AIInsightBadge variant="High Confidence" />
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Current Capacity</span>
                <p className="text-2xl font-black text-slate-800">{occupancy.currentOccupancy}%</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Predicted Occupancy</span>
                <p className="text-2xl font-black text-indigo-700 flex items-center gap-1">
                  {occupancy.predictedOccupancy}%
                  {occupancy.trend === 'INCREASING' ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-rose-600" />
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Model Evaluation Confidence:</span>
                <span className="text-indigo-700 font-bold">{occupancy.confidence}%</span>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Key Prediction Factors:</span>
                {occupancy.factors?.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Revenue Forecast Card */}
        {revenue && (
          <Card className="p-6 space-y-4 border-l-4 border-l-emerald-600">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue Forecast</span>
                <h3 className="text-xl font-extrabold text-slate-900">Earnings Projection</h3>
              </div>
              <AIInsightBadge variant="Predicted" />
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Next Month Est.</span>
                <p className="text-2xl font-black text-emerald-700">
                  ₹{revenue.predictedNextMonthRevenue?.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">3-Month Forecast</span>
                <p className="text-2xl font-black text-slate-800">
                  ₹{revenue.predictedThreeMonthRevenue?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Data Window Evaluated:</span>
                <span className="text-slate-800 font-bold">{revenue.dataWindow}</span>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Revenue Dynamics:</span>
                {revenue.factors?.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Maintenance Risk Telemetry Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-600" /> Property Maintenance Risk Matrix
        </h3>

        {maintenanceRisk.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <Building className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium">No maintenance risk anomalies detected across listings.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenanceRisk.map((risk) => (
              <Card key={risk.propertyId} className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{risk.propertyName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {risk.openTickets} open issue(s) • {risk.urgentTickets} urgent ticket(s)
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${getRiskBadgeColor(risk.riskLevel)}`}>
                    {risk.riskLevel} RISK ({risk.riskScore}/100)
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Risk Factors:</span>
                  {risk.factors?.map((fact, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Preventative Action:</span>
                  {risk.recommendations?.map((rec, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-brand-700">
                      <Lightbulb className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Smart Suggestions */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" /> Landlord Smart Suggestions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins, idx) => (
              <Card key={idx} className="p-4 border-l-4 border-l-amber-500 bg-amber-50/30">
                <h4 className="text-sm font-bold text-slate-800 mb-1">{ins.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{ins.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
