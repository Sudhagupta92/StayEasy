/**
 * Utility formatters
 */

export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getTrustScoreColor = (score) => {
  if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 75) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
};
