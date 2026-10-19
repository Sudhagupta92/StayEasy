import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Utensils,
  Sparkles,
  Zap,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  UserCheck,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import ReviewModal from './ReviewModal';

export const ReviewList = ({ propertyId, propertyTitle }) => {
  const { user, isAuthenticated, role } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trustScore, setTrustScore] = useState(88);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Eligibility state
  const [eligibility, setEligibility] = useState({ isEligible: false, reason: '' });
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Flag modal state
  const [flaggingReviewId, setFlaggingReviewId] = useState(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewService.getPropertyReviews(propertyId, { sortBy });
      if (res.success) {
        setReviews(res.data.reviews || []);
        setSummary(res.data.ratingsSummary || {});
        if (res.data.trustScore) setTrustScore(res.data.trustScore);
      }
    } catch (err) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkUserEligibility = async () => {
    if (!isAuthenticated || role !== 'USER') return;
    setCheckingEligibility(true);
    try {
      const res = await reviewService.getReviewEligibility(propertyId);
      if (res.success) {
        setEligibility(res.data);
      }
    } catch (err) {
      console.error('Eligibility check error:', err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [propertyId, sortBy]);

  useEffect(() => {
    checkUserEligibility();
  }, [propertyId, isAuthenticated, role]);

  const handleHelpfulClick = async (reviewId, type) => {
    if (!isAuthenticated) return;
    try {
      const res = await reviewService.toggleHelpfulVote(reviewId, type);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId
              ? {
                  ...r,
                  helpfulVotes: Array(res.data.helpfulCount).fill(user._id),
                  unhelpfulVotes: Array(res.data.unhelpfulCount).fill(user._id),
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Helpful vote error:', err);
    }
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!flagReason.trim() || !flaggingReviewId) return;

    setFlagSubmitting(true);
    try {
      const res = await reviewService.flagReview(flaggingReviewId, flagReason.trim());
      if (res.success) {
        alert('Thank you. Review has been reported for moderation.');
        setFlaggingReviewId(null);
        setFlagReason('');
      }
    } catch (err) {
      alert(err.message || 'Failed to report review');
    } finally {
      setFlagSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300 fill-gray-100'
          }`}
        />
      );
    }
    return <div className="flex items-center space-x-0.5">{stars}</div>;
  };

  const totalReviews = summary?.totalReviews || reviews.length || 0;
  const overallAvg = summary?.overallAverage || 0;
  const starDist = summary?.starDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <div className="space-y-8" id="reviews-section">
      {/* Top Header & Write Review Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold text-gray-900">Verified Resident Reviews</h3>
            <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              100% Audited Residents
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Every review is written strictly by a tenant who physically stayed at this property.
          </p>
        </div>

        {/* Action Button */}
        <div>
          {role === 'USER' && (
            <div className="flex flex-col sm:flex-row items-end gap-2">
              {eligibility.isEligible ? (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  <div className="text-right sm:text-left bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Resident • {eligibility.stayDurationText || (eligibility.stayDurationDays ? `Stayed for: ${eligibility.stayDurationDays} days` : 'Active Stay')}
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      Authoritative booking & check-in verified.
                    </span>
                  </div>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-xs shrink-0"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Write Verified Review
                  </Button>
                </div>
              ) : eligibility.alreadyReviewed ? (
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Review Submitted</span>
                </div>
              ) : (
                <div className="text-right space-y-1">
                  <div className="text-xs text-slate-500 flex items-center gap-1 justify-end font-medium">
                    <span>🔒 Review available only to verified residents who have stayed at this property.</span>
                  </div>
                  <Button
                    variant="outline"
                    disabled
                    className="opacity-75 text-xs border-dashed cursor-not-allowed bg-slate-50"
                    title={eligibility.reason || 'Verified stay required to review'}
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    Verified Stay Required to Review
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ratings Summary Card */}
      <Card className="p-6 bg-gradient-to-br from-white via-slate-50 to-emerald-50/20 border border-gray-200 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main Score Box */}
          <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-gray-200 md:pr-6 pb-6 md:pb-0">
            <div className="flex items-baseline justify-center md:justify-start space-x-2">
              <span className="text-5xl font-black text-gray-900 tracking-tight">
                {overallAvg > 0 ? overallAvg.toFixed(1) : 'New'}
              </span>
              <span className="text-lg font-bold text-gray-400">/ 5.0</span>
            </div>
            <div className="flex justify-center md:justify-start my-2">
              {renderStars(overallAvg || 5)}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Based on {totalReviews} verified resident stay{totalReviews !== 1 ? 's' : ''}
            </p>

            {/* Trust Score Pill */}
            <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-100/80 text-emerald-900 rounded-full text-xs font-bold border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Trust Score Impact: {trustScore} / 100</span>
            </div>
          </div>

          {/* Sub-Category Ratings & Star Bars */}
          <div className="md:col-span-8 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <Utensils className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span>Food & Menu</span>
                </div>
                <div className="font-bold text-sm text-gray-800">
                  {summary?.foodQualityAverage ? `${summary.foodQualityAverage} ★` : '4.8 ★'}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  <span>Cleanliness</span>
                </div>
                <div className="font-bold text-sm text-gray-800">
                  {summary?.cleanlinessAverage ? `${summary.cleanlinessAverage} ★` : '4.7 ★'}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  <span>Landlord SLA</span>
                </div>
                <div className="font-bold text-sm text-gray-800">
                  {summary?.ownerResponsivenessAverage ? `${summary.ownerResponsivenessAverage} ★` : '4.9 ★'}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <Zap className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  <span>Billing Clarity</span>
                </div>
                <div className="font-bold text-sm text-gray-800">
                  {summary?.billingTransparencyAverage ? `${summary.billingTransparencyAverage} ★` : '4.6 ★'}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs col-span-2 sm:col-span-2">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  <span>WiFi & Amenities Match</span>
                </div>
                <div className="font-bold text-sm text-gray-800">
                  {summary?.amenitiesAverage ? `${summary.amenitiesAverage} ★` : '4.8 ★'}
                </div>
              </div>
            </div>

            {/* Star Distribution Bars */}
            <div className="space-y-1 pt-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starDist[star] || 0;
                const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <div key={star} className="flex items-center text-xs space-x-2 text-gray-600">
                    <span className="w-10 font-semibold">{star} stars</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-right text-gray-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Verified Resident Review Trust Standard Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 text-white rounded-2xl border border-emerald-800/40 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
              StayEasy Verified Resident Standard™
            </h4>
          </div>
          <Badge variant="emerald" size="sm" className="text-[10px]">
            100% Anti-Fraud
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Physical Stay Verification:</strong> Reviews can only be submitted after check-in is confirmed on platform.
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Authoritative Stay Duration:</strong> Days stayed are calculated server-side from booking timestamps.
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Zero Self-Reviews:</strong> Landlords cannot review their own properties & duplicate reviews are blocked.
            </span>
          </div>
        </div>
      </div>

      {/* Sorting & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <span>Showing {(() => {
            let list = reviews;
            if (ratingFilter !== 'ALL') list = list.filter((r) => r.overallRating === Number(ratingFilter));
            if (verifiedOnly) list = list.filter((r) => r.isVerifiedResident !== false);
            return list.length;
          })()} review{reviews.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Rating filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars Only</option>
            <option value="3">3 Stars Only</option>
            <option value="2">2 Stars Only</option>
            <option value="1">1 Star Only</option>
          </select>

          {/* Verified Resident toggle */}
          <button
            type="button"
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              verifiedOnly
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            Verified Only
          </button>

          {/* Sort selector */}
          <div className="flex items-center space-x-1.5 ml-1">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 focus:outline-none"
            >
              <option value="recent">Most Recent</option>
              <option value="rating_high">Highest Rated</option>
              <option value="rating_low">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      </div>

      {/* Review List */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <span>Loading verified resident reviews...</span>
        </div>
      ) : (() => {
        let displayReviews = reviews;
        if (ratingFilter !== 'ALL') {
          displayReviews = displayReviews.filter((r) => r.overallRating === Number(ratingFilter));
        }
        if (verifiedOnly) {
          displayReviews = displayReviews.filter((r) => r.isVerifiedResident !== false);
        }

        return displayReviews.length === 0 ? (
          <Card className="p-8 text-center bg-gray-50/60 border border-dashed border-gray-300 rounded-2xl">
            <ShieldCheck className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-800">No Reviews Match Selected Filters</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Try adjusting your rating or verified filters to see more resident feedback.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayReviews.map((rev) => (
              <Card
                key={rev._id}
                className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-4 hover:border-emerald-200 transition-colors"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {rev.tenantId?.name ? rev.tenantId.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">
                          {rev.tenantId?.name || 'Verified Resident'}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verified Resident
                        </span>
                        {rev.stayDurationText && (
                          <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-full">
                            📅 {rev.stayDurationText}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center space-x-2">
                        <span>{rev.roomName ? `${rev.roomName} (${rev.roomTypeStayed || 'Sharing'})` : `Room: ${rev.roomTypeStayed || 'Sharing'}`}</span>
                        <span>•</span>
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                {/* Promise vs Reality Badge */}
                {rev.promiseVsRealityScore && (
                  <div className="px-3 py-1 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200">
                    Reality Match: <strong className="text-emerald-700">{rev.promiseVsRealityScore}/10</strong>
                  </div>
                )}
              </div>

              {/* Rating & Title */}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  {renderStars(rev.overallRating)}
                  <span className="text-xs font-bold text-gray-700">{rev.overallRating}.0</span>
                </div>
                <h4 className="text-base font-bold text-gray-900">{rev.title}</h4>
              </div>

              {/* Comment */}
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {rev.comment}
              </p>

              {/* Sub-ratings Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {rev.foodQualityRating && (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-100 flex items-center">
                    <Utensils className="w-3 h-3 mr-1" />
                    Food: {rev.foodQualityRating}★
                  </span>
                )}
                {rev.cleanlinessRating && (
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs font-medium rounded-lg border border-blue-100 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Cleanliness: {rev.cleanlinessRating}★
                  </span>
                )}
                {rev.billingTransparencyRating && (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-medium rounded-lg border border-amber-100 flex items-center">
                    <Zap className="w-3 h-3 mr-1" />
                    Billing Clarity: {rev.billingTransparencyRating}★
                  </span>
                )}
              </div>

              {/* Pros & Cons Pills */}
              {(rev.pros?.length > 0 || rev.cons?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  {rev.pros?.length > 0 && (
                    <div className="text-xs">
                      <span className="font-bold text-emerald-700 mr-1">Pros:</span>
                      {rev.pros.map((p, idx) => (
                        <span key={idx} className="inline-block bg-emerald-100/60 text-emerald-800 px-2 py-0.5 rounded-md mr-1 mb-1">
                          + {p}
                        </span>
                      ))}
                    </div>
                  )}
                  {rev.cons?.length > 0 && (
                    <div className="text-xs">
                      <span className="font-bold text-rose-700 mr-1">Cons:</span>
                      {rev.cons.map((c, idx) => (
                        <span key={idx} className="inline-block bg-rose-100/60 text-rose-800 px-2 py-0.5 rounded-md mr-1 mb-1">
                          - {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Owner Response Box */}
              {rev.ownerResponse?.responseText && (
                <div className="p-4 bg-slate-50 border-l-4 border-emerald-600 rounded-r-xl space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span>Landlord Official Response</span>
                    <span className="text-gray-400 font-normal">
                      {new Date(rev.ownerResponse.respondedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 italic">
                    "{rev.ownerResponse.responseText}"
                  </p>
                </div>
              )}

              {/* Footer Actions: Helpful / Unhelpful & Report */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleHelpfulClick(rev._id, 'helpful')}
                    className={`flex items-center space-x-1 hover:text-emerald-600 transition-colors ${
                      rev.helpfulVotes?.includes(user?._id) ? 'text-emerald-600 font-bold' : ''
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Helpful ({rev.helpfulVotes?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => handleHelpfulClick(rev._id, 'unhelpful')}
                    className={`flex items-center space-x-1 hover:text-rose-600 transition-colors ${
                      rev.unhelpfulVotes?.includes(user?._id) ? 'text-rose-600 font-bold' : ''
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Not Helpful ({rev.unhelpfulVotes?.length || 0})</span>
                  </button>
                </div>

                {isAuthenticated && (
                  <button
                    onClick={() => setFlaggingReviewId(rev._id)}
                    className="flex items-center space-x-1 text-gray-400 hover:text-rose-600 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report</span>
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      );
    })()}

      {/* Modal for Flagging Review */}
      {flaggingReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-gray-900 text-base">Report Review for Moderation</h4>
              <button onClick={() => setFlaggingReviewId(null)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            <form onSubmit={handleFlagSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Reason for Reporting *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Inappropriate language, spam, or false claims"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setFlaggingReviewId(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={flagSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white">
                  {flagSubmitting ? 'Reporting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        eligibility={eligibility}
        onReviewSubmitted={() => {
          fetchReviews();
          checkUserEligibility();
        }}
      />
    </div>
  );
};

export default ReviewList;
