import React, { useState } from 'react';
import { Star, X, AlertCircle, Loader2, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';
import { reviewService } from '../../services/reviewService';

export const ReviewModal = ({ isOpen, onClose, propertyId, propertyTitle, eligibility, onReviewSubmitted }) => {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [overallRating, setOverallRating] = useState(5);
  const [foodQualityRating, setFoodQualityRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [ownerResponsivenessRating, setOwnerResponsivenessRating] = useState(5);
  const [billingTransparencyRating, setBillingTransparencyRating] = useState(5);
  const [amenitiesRating, setAmenitiesRating] = useState(5);
  const [promiseVsRealityScore, setPromiseVsRealityScore] = useState(8);
  const [prosInput, setProsInput] = useState('');
  const [consInput, setConsInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a title for your review.');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters describing your stay experience.');
      return;
    }

    setLoading(true);
    try {
      const res = await reviewService.createReview({
        propertyId,
        title: title.trim(),
        comment: comment.trim(),
        overallRating,
        foodQualityRating,
        cleanlinessRating,
        ownerResponsivenessRating,
        billingTransparencyRating,
        amenitiesRating,
        promiseVsRealityScore,
        pros: prosInput,
        cons: consInput,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onReviewSubmitted) onReviewSubmitted(res.data.review);
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Failed to submit review');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting your review.');
    } finally {
      setLoading(false);
    }
  };

  const renderStarPicker = (label, value, onChange, subtitle = '') => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 last:border-b-0 gap-2">
      <div>
        <label className="text-sm font-medium text-gray-800">{label}</label>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs font-bold text-gray-700 w-6">{value}.0</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-200" />
            <div>
              <h3 className="font-bold text-lg leading-tight">Write Verified Resident Review</h3>
              <p className="text-xs text-emerald-100 line-clamp-1">{propertyTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {success ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-xl font-bold text-gray-900">Review Published!</h4>
              <p className="text-sm text-gray-600">
                Thank you for contributing to the StayEasy Verified Resident Network.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Verified Resident System Banner */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-emerald-950">
                      ✓ Audited Verified Resident
                    </span>
                    <span className="text-emerald-700 font-medium">
                      {eligibility?.stayDurationText || (eligibility?.stayDurationDays ? `Stayed for: ${eligibility.stayDurationDays} days` : 'Active Stay Confirmed')} • {eligibility?.roomName || eligibility?.roomType || 'Accommodation'}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold tracking-wider uppercase shrink-0">
                  Stay Verified
                </span>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Review Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excellent home cooked food & quiet study environment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Detailed Rating Pickers */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center space-x-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Stay Experience Breakdown (1-5 Stars)</span>
                </h4>
                {renderStarPicker('Overall Experience *', overallRating, setOverallRating, 'Your total satisfaction')}
                {renderStarPicker('Food Quality & Menu *', foodQualityRating, setFoodQualityRating, 'Meal taste, hygiene & menu variety')}
                {renderStarPicker('Cleanliness & Hygiene', cleanlinessRating, setCleanlinessRating, 'Washrooms, rooms & daily housekeeping')}
                {renderStarPicker('Owner Responsiveness', ownerResponsivenessRating, setOwnerResponsivenessRating, 'Response speed & repair resolution')}
                {renderStarPicker('Billing & Cost Transparency', billingTransparencyRating, setBillingTransparencyRating, 'No hidden electricity or maintenance fees')}
                {renderStarPicker('WiFi & Amenities Reality', amenitiesRating, setAmenitiesRating, 'Speed, power backup & facilities match')}
              </div>

              {/* Promise vs Reality Score Slider */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Owner Promises vs. Living Reality Score (1 to 10)
                  </label>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    {promiseVsRealityScore} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={promiseVsRealityScore}
                  onChange={(e) => setPromiseVsRealityScore(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>1 - Totally Misleading</span>
                  <span>5 - Average Match</span>
                  <span>10 - Exceeded Promises</span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Detailed Experience & Advice *
                </label>
                <textarea
                  rows={4}
                  placeholder="Share details about food quality, Wi-Fi reliability, landlord behavior, sub-meter billing clarity, and peace of mind..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                    Pros (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delicious meals, 24/7 hot water"
                    value={prosInput}
                    onChange={(e) => setProsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-800 uppercase tracking-wider mb-1">
                    Cons (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Strict gate timing at 10:30 PM"
                    value={consInput}
                    onChange={(e) => setConsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-rose-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none bg-rose-50/30"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loading ? (
                    <span className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </span>
                  ) : (
                    'Submit Verified Review'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
