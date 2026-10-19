import React from 'react';
import { Sparkles, Brain, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

export const AIInsightBadge = ({ variant = 'AI Insight', className = '' }) => {
  const badgeConfigs = {
    'AI Insight': {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Sparkles,
    },
    'Predicted': {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Brain,
    },
    'Recommended': {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
    },
    'High Confidence': {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Lightbulb,
    },
    'Limited Data': {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
    },
  };

  const config = badgeConfigs[variant] || badgeConfigs['AI Insight'];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{variant}</span>
    </span>
  );
};
