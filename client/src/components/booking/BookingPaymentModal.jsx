import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  BedDouble,
  CreditCard,
  QrCode,
  Building,
  Banknote,
  ChevronRight,
  ArrowLeft,
  Printer,
  X,
  Sparkles,
  Info,
  Calendar,
  Clock,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { bookingService } from '../../services/bookingService';
import { EscrowReceiptModal } from '../ui/EscrowReceiptModal';

export const BookingPaymentModal = ({
  property,
  initialRoomConfig = null,
  existingBooking = null,
  onClose,
  onBookingSuccess,
}) => {
  const navigate = useNavigate();

  // Current active step: 'DETAILS' | 'SUMMARY' | 'METHOD' | 'RESULT'
  const [currentStep, setCurrentStep] = useState(existingBooking ? 'SUMMARY' : 'DETAILS');

  // Helper to determine available beds for a configuration safely
  const getEffectiveAvailableBeds = (config) => {
    if (!config) return 0;
    if (config.availableBeds !== undefined && config.availableBeds !== null && !isNaN(Number(config.availableBeds))) {
      return Number(config.availableBeds);
    }
    if (config.totalBeds !== undefined && config.totalBeds !== null && !isNaN(Number(config.totalBeds))) {
      return Number(config.totalBeds);
    }
    return 0;
  };

  // Active configurations with safe fallback to rooms if roomConfigurations is empty
  const activeRoomConfigurations = (property?.roomConfigurations && property.roomConfigurations.length > 0)
    ? property.roomConfigurations
    : (property?.rooms && property.rooms.length > 0)
    ? property.rooms.map((r, idx) => ({
        _id: r._id || `room_${idx}`,
        name: `${r.sharingType || r.roomType || 'Standard'} Room (${r.roomNumber})`,
        type: r.roomType || r.sharingType || 'SINGLE',
        rent: r.rent,
        deposit: r.deposit || 0,
        totalBeds: r.beds?.length || 1,
        availableBeds: r.beds ? r.beds.filter((b) => b.status === 'AVAILABLE').length : 1,
        attachedWashroom: !!r.attachedWashroom,
        hasAC: !!r.hasAC,
        hasBalcony: !!r.hasBalcony,
      }))
    : [];

  const isConfigMatch = (cfgA, cfgB) => {
    if (!cfgA || !cfgB) return false;
    const idA = cfgA._id || cfgA.id;
    const idB = cfgB._id || cfgB.id;
    if (idA && idB && String(idA) === String(idB)) return true;
    if (cfgA.name && cfgB.name && cfgA.name === cfgB.name) return true;
    return false;
  };

  // Step 1: Booking Details State
  const [selectedRoomConfig, setSelectedRoomConfig] = useState(() => {
    if (initialRoomConfig && (initialRoomConfig._id || initialRoomConfig.id)) {
      return initialRoomConfig;
    }
    const firstWithBeds = activeRoomConfigurations.find((rc) => getEffectiveAvailableBeds(rc) > 0);
    return firstWithBeds || activeRoomConfigurations[0] || null;
  });

  useEffect(() => {
    if (initialRoomConfig && (initialRoomConfig._id || initialRoomConfig.id)) {
      setSelectedRoomConfig(initialRoomConfig);
    } else if (!selectedRoomConfig || getEffectiveAvailableBeds(selectedRoomConfig) <= 0) {
      const firstWithBeds = activeRoomConfigurations.find((rc) => getEffectiveAvailableBeds(rc) > 0);
      if (firstWithBeds) {
        setSelectedRoomConfig(firstWithBeds);
      } else if (activeRoomConfigurations.length > 0 && !selectedRoomConfig) {
        setSelectedRoomConfig(activeRoomConfigurations[0]);
      }
    }
  }, [initialRoomConfig, property]);

  const [moveInDate, setMoveInDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [durationMonths, setDurationMonths] = useState(3);
  const [bookingNotes, setBookingNotes] = useState('');

  // Active created booking entity (persisted across retries to prevent duplicate bookings)
  const [activeBooking, setActiveBooking] = useState(existingBooking || null);

  // Step 3: Payment Method Selection State
  // 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'OFFLINE_CASH'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI');

  // Sub-details for selected method
  const [upiId, setUpiId] = useState('student@okhdfcbank');
  const [cardHolder, setCardHolder] = useState('Rahul Sharma');
  const [cardNumber, setCardNumber] = useState('4532 8921 4456 1289');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('884');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Edge Case Testing: Toggle to simulate bank payment decline
  const [simulateDecline, setSimulateDecline] = useState(false);

  // Processing & State Flags
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); // { status: 'SUCCESS' | 'FAILED', message, transaction, escrowReceipt }
  const [formError, setFormError] = useState('');

  // Escrow Receipt Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Financial Calculations
  const monthlyRent = selectedRoomConfig?.rent || 0;
  const securityDeposit = selectedRoomConfig?.deposit || 0;
  const foodCharges =
    property?.expenses?.food?.available && !property?.expenses?.food?.includedInRent
      ? property.expenses.food.extraCost || 0
      : 0;
  const electricityEstimate =
    property?.expenses?.electricity?.type === 'PER_UNIT'
      ? (property?.expenses?.electricity?.rate || 8) * 60
      : property?.expenses?.electricity?.rate || 0;
  const maintenanceCharges =
    property?.expenses?.maintenance?.type === 'EXTRA'
      ? property?.expenses?.maintenance?.amount || 0
      : 0;

  const totalUpfrontAmount =
    activeBooking?.costs?.totalUpfrontAmount || monthlyRent + securityDeposit;
  const amountPayingNow =
    selectedPaymentMethod === 'OFFLINE_CASH' ? 0 : totalUpfrontAmount;
  const escrowProtectedDeposit =
    activeBooking?.costs?.securityDeposit || securityDeposit;

  // Check if listing allows Pay at Property
  const isPayAtPropertyAllowed = Boolean(property?.allowPayAtProperty);

  // Helper: Card number spacing
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted.substring(0, 19));
  };

  /**
   * STEP 1 -> STEP 2: Proceed to Summary
   */
  const handleProceedToSummary = (e) => {
    e?.preventDefault();
    const configToUse = (selectedRoomConfig && (selectedRoomConfig._id || selectedRoomConfig.id))
      ? selectedRoomConfig
      : activeRoomConfigurations.find((rc) => getEffectiveAvailableBeds(rc) > 0) || activeRoomConfigurations[0];

    const configId = configToUse?._id || configToUse?.id;
    if (!configId) {
      setFormError('Please select an accommodation room configuration');
      return;
    }
    if (getEffectiveAvailableBeds(configToUse) <= 0) {
      setFormError('No beds available in the selected room configuration');
      return;
    }
    if (!isConfigMatch(selectedRoomConfig, configToUse)) {
      setSelectedRoomConfig(configToUse);
    }
    setFormError('');
    setCurrentStep('SUMMARY');
  };

  /**
   * STEP 2 -> STEP 3: Proceed to Payment Method
   */
  const handleProceedToMethod = () => {
    setFormError('');
    setCurrentStep('METHOD');
  };

  /**
   * STEP 3 -> STEP 4/5: Process Payment with Idempotency & Lifecycle Update
   */
  const handleExecutePayment = async () => {
    setFormError('');
    setIsProcessing(true);

    try {
      let bookingToPay = activeBooking;

      // 1. Ensure booking exists (creates once; reuses on retry to prevent duplicates)
      if (!activeBooking) {
        const configId =
          selectedRoomConfig?._id ||
          selectedRoomConfig?.id ||
          activeRoomConfigurations[0]?._id ||
          activeRoomConfigurations[0]?.id;
        if (!configId) {
          throw new Error('Please select an accommodation room configuration');
        }

        const createPayload = {
          propertyId: property?._id,
          roomConfigId: configId,
          moveInDate,
          durationMonths: Number(durationMonths) || 1,
          notes: bookingNotes || '',
          paymentMethod: selectedPaymentMethod,
        };
        console.log('[BookingPaymentModal] Submitting createBooking:', JSON.stringify(createPayload));

        const createRes = await bookingService.createBooking(createPayload);
        console.log('[BookingPaymentModal] createRes:', JSON.stringify(createRes));
        if (!createRes.success || !createRes.data?.booking) {
          throw new Error(createRes.message || 'Failed to create reservation record');
        }

        bookingToPay = createRes.data.booking;
        setActiveBooking(bookingToPay);
      }

      // 2. Form unique idempotency key per payment attempt
      const idempotencyKey = `SE-IDEM-${bookingToPay._id}-${Date.now()}-${selectedPaymentMethod}`;

      // 3. Process Escrow Deposit payment
      const paymentPayload = {
        paymentMethod: selectedPaymentMethod,
        idempotencyKey,
        simulateFailure: simulateDecline,
      };

      const payRes = await bookingService.payEscrowDeposit(bookingToPay._id, paymentPayload);

      if (payRes.success && payRes.data) {
        setPaymentResult({
          status: 'SUCCESS',
          message: payRes.message || 'Payment processed successfully',
          booking: payRes.data.booking || bookingToPay,
          transaction: payRes.data.transaction,
          escrowReceipt: payRes.data.escrowReceipt,
        });
        setCurrentStep('RESULT');

        if (onBookingSuccess) {
          onBookingSuccess(payRes.data.booking || bookingToPay);
        }
      } else {
        throw new Error(payRes.message || 'Payment authorization failed');
      }
    } catch (err) {
      console.error('[BookingPaymentModal] Failed with error:', err.response?.data ? JSON.stringify(err.response.data) : err.message);
      // Payment failure handling: keep booking intact for retry without creating duplicates
      setPaymentResult({
        status: 'FAILED',
        message: err.response?.data?.message || err.message || 'Payment authorization was declined by the bank or gateway timeout.',
        booking: activeBooking,
      });
      setCurrentStep('RESULT');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * RETRY: Retry payment on the SAME existing booking
   */
  const handleRetryPayment = () => {
    setPaymentResult(null);
    setFormError('');
    setSimulateDecline(false);
    setCurrentStep('METHOD');
  };

  /**
   * CHANGE METHOD: Go back to Step 3
   */
  const handleChangeMethod = () => {
    setPaymentResult(null);
    setFormError('');
    setSimulateDecline(false);
    setCurrentStep('METHOD');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative my-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                  StayEasy Secure Booking
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> 100% Escrow Protected
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                {currentStep === 'DETAILS' && 'Reserve Your Bed'}
                {currentStep === 'SUMMARY' && 'Booking & Escrow Outlay'}
                {currentStep === 'METHOD' && 'Choose Payment Method'}
                {currentStep === 'RESULT' &&
                  (paymentResult?.status === 'SUCCESS'
                    ? 'Payment Confirmed'
                    : 'Payment Unsuccessful')}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Step Indicator (Only during active flow) */}
        {currentStep !== 'RESULT' && (
          <div className="mb-6 flex items-center justify-between gap-1 text-[11px] font-bold">
            <div
              className={`flex-1 py-1.5 text-center border-b-2 transition-colors ${
                currentStep === 'DETAILS'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-emerald-500 text-emerald-600'
              }`}
            >
              1. Room & Dates
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <div
              className={`flex-1 py-1.5 text-center border-b-2 transition-colors ${
                currentStep === 'SUMMARY'
                  ? 'border-brand-600 text-brand-600'
                  : currentStep === 'METHOD'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              2. Escrow Summary
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <div
              className={`flex-1 py-1.5 text-center border-b-2 transition-colors ${
                currentStep === 'METHOD'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              3. Payment Channel
            </div>
          </div>
        )}

        {/* Error Notification */}
        {formError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: ROOM & RESERVATION DETAILS                                       */}
        {/* ========================================================================= */}
        {currentStep === 'DETAILS' && (
          <form onSubmit={handleProceedToSummary} className="space-y-4">
            {/* Property Pill */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Accommodation
                </span>
                <p className="text-xs font-bold text-slate-900">{property?.title}</p>
                <p className="text-[11px] text-slate-600">
                  {property?.address?.city}, {property?.address?.state} · {property?.propertyType}
                </p>
              </div>
              <Badge variant="brand" size="sm">
                Trust Score {property?.trustScore || 95}
              </Badge>
            </div>

            {/* Room Configuration Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-700 block">
                Select Sharing Type & Room
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeRoomConfigurations.map((config) => {
                  const isSelected = isConfigMatch(selectedRoomConfig, config);
                  const configBeds = getEffectiveAvailableBeds(config);
                  const isSoldOut = configBeds <= 0;
                  return (
                    <button
                      key={config._id || config.id || config.name}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => setSelectedRoomConfig(config)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                          : isSoldOut
                          ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{config.name}</span>
                        <span className="text-xs font-black text-brand-700 font-mono">
                          ₹{config.rent?.toLocaleString()}/mo
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                        <span>{config.type?.replace(/_/g, ' ')}</span>
                        <span
                          className={
                            configBeds > 0
                              ? 'text-emerald-700 font-semibold'
                              : 'text-rose-600 font-semibold'
                          }
                        >
                          {configBeds > 0
                            ? `${configBeds} beds free`
                            : 'Sold Out'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dates & Duration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Preferred Move-in Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Stay Commitment
                </label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value={1}>1 Month (Flexible)</option>
                  <option value={3}>3 Months (Quarterly)</option>
                  <option value={6}>6 Months (Semester)</option>
                  <option value={11}>11 Months (Academic Year)</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                Special Requests or Dietary Preferences (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Vegetarian, ground floor preferred, quiet study room"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            {/* CTA Buttons */}
            <div className="pt-3 flex gap-2 justify-end border-t border-slate-100">
              <Button onClick={onClose} variant="outline" size="sm">
                Cancel
              </Button>
              {(() => {
                const effectiveAvailBeds = getEffectiveAvailableBeds(selectedRoomConfig);
                const selectedConfigId = selectedRoomConfig?._id || selectedRoomConfig?.id;
                const isReviewDisabled = !selectedRoomConfig || !selectedConfigId || effectiveAvailBeds <= 0;

                console.log('[BookingPaymentModal Debug]', {
                  hasSelectedRoomConfig: Boolean(selectedRoomConfig),
                  selectedRoomConfigName: selectedRoomConfig?.name,
                  selectedRoomConfigType: selectedRoomConfig?.type,
                  selectedConfigId,
                  rawAvailableBeds: selectedRoomConfig?.availableBeds,
                  effectiveAvailBeds,
                  isReviewDisabled,
                  moveInDate,
                  durationMonths,
                });

                return (
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isReviewDisabled}
                    icon={ChevronRight}
                  >
                    Review Booking & Costs
                  </Button>
                );
              })()}
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: TRANSPARENT BOOKING SUMMARY & ESCROW OUTLAY                      */}
        {/* ========================================================================= */}
        {currentStep === 'SUMMARY' && (
          <div className="space-y-4">
            {/* Escrow Protection Trust Callout */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white border border-emerald-700/40 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>StayEasy Escrow Deposit Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                "Your security deposit is protected by StayEasy Escrow until verified move-in. Landlord does not receive deposit funds until you complete physical on-site check-in."
              </p>
            </div>

            {/* Itemized Cost Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Itemized Reservation Breakdown
              </span>

              <div className="flex justify-between text-slate-700">
                <span>Property:</span>
                <strong className="text-slate-900">{property?.title}</strong>
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Room Configuration & Sharing:</span>
                <strong className="text-slate-900">
                  {selectedRoomConfig?.name} ({selectedRoomConfig?.type?.replace(/_/g, ' ')})
                </strong>
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Move-in Date & Stay Period:</span>
                <strong className="text-slate-900">
                  {moveInDate} ({durationMonths} Month{durationMonths > 1 ? 's' : ''})
                </strong>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-700">
                <span>1st Month Advance Rent:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  ₹{monthlyRent.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-slate-700">
                <span className="flex items-center gap-1">
                  <span>Refundable Security Deposit:</span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-1.5 py-0.2 rounded">
                    Escrow Protected
                  </span>
                </span>
                <span className="font-bold text-emerald-700 font-mono">
                  ₹{securityDeposit.toLocaleString()}
                </span>
              </div>

              {maintenanceCharges > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Maintenance / Common Dues:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    ₹{maintenanceCharges.toLocaleString()}
                  </span>
                </div>
              )}

              {foodCharges > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Optional Mess / Food Plan:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    ₹{foodCharges.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total Amount Payable:</span>
                <span className="text-base text-brand-700 font-mono font-black">
                  ₹{totalUpfrontAmount.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-brand-50/60 border border-brand-100 flex items-center justify-between text-[11px]">
                <span className="font-bold text-brand-900">Amount Being Paid Now:</span>
                <span className="font-black text-brand-700 font-mono text-xs">
                  ₹{totalUpfrontAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                <span>Protected Escrow Outlay:</span>
                <span className="font-semibold text-emerald-700">
                  ₹{escrowProtectedDeposit.toLocaleString()} (Held until check-in)
                </span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-2 flex gap-2 justify-between border-t border-slate-100">
              <Button
                onClick={() => setCurrentStep('DETAILS')}
                variant="outline"
                size="sm"
                icon={ArrowLeft}
              >
                Back to Details
              </Button>
              <Button
                onClick={handleProceedToMethod}
                variant="primary"
                size="sm"
                icon={ChevronRight}
              >
                Choose Payment Method
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CHOOSE PAYMENT METHOD                                            */}
        {/* ========================================================================= */}
        {currentStep === 'METHOD' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Select your preferred secure payment channel. All online transactions are protected by StayEasy Escrow Guarantee.
            </p>

            {/* 4 Payment Options Matrix */}
            <div className="space-y-2.5">
              {/* Option 1: UPI */}
              <div
                onClick={() => setSelectedPaymentMethod('UPI')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedPaymentMethod === 'UPI'
                    ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900">UPI Instant Payment</strong>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
                          Instant · 0% Fee
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM, Cred</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPaymentMethod === 'UPI'}
                    onChange={() => setSelectedPaymentMethod('UPI')}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                </div>

                {selectedPaymentMethod === 'UPI' && (
                  <div className="mt-3 pt-3 border-t border-brand-100/80 space-y-2 animate-in fade-in duration-150">
                    <label className="text-[11px] font-bold uppercase text-slate-600 block">
                      Virtual Payment Address (UPI ID)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. mobile@upi or name@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {['@okhdfcbank', '@okaxis', '@paytm', '@ybl'].map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => setUpiId(`student${handle}`)}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:border-brand-500 hover:text-brand-600 font-mono"
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Debit / Credit Card */}
              <div
                onClick={() => setSelectedPaymentMethod('CREDIT_CARD')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedPaymentMethod === 'CREDIT_CARD' || selectedPaymentMethod === 'DEBIT_CARD'
                    ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900">Debit / Credit Card</strong>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                          Visa, Mastercard, RuPay
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Domestic & international payment cards</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={
                      selectedPaymentMethod === 'CREDIT_CARD' || selectedPaymentMethod === 'DEBIT_CARD'
                    }
                    onChange={() => setSelectedPaymentMethod('CREDIT_CARD')}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                </div>

                {(selectedPaymentMethod === 'CREDIT_CARD' || selectedPaymentMethod === 'DEBIT_CARD') && (
                  <div className="mt-3 pt-3 border-t border-brand-100/80 space-y-2.5 animate-in fade-in duration-150">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 •••• •••• ••••"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                          CVV / CVC
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 3: Net Banking */}
              <div
                onClick={() => setSelectedPaymentMethod('NET_BANKING')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedPaymentMethod === 'NET_BANKING'
                    ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900">Net Banking</strong>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                          50+ Banks
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Direct account transfer via Net Banking portal</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPaymentMethod === 'NET_BANKING'}
                    onChange={() => setSelectedPaymentMethod('NET_BANKING')}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                </div>

                {selectedPaymentMethod === 'NET_BANKING' && (
                  <div className="mt-3 pt-3 border-t border-brand-100/80 space-y-2 animate-in fade-in duration-150">
                    <label className="text-[10px] font-bold uppercase text-slate-600 block">
                      Choose Your Bank
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Bank', 'PNB'].map(
                        (b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setSelectedBank(b)}
                            className={`px-2 py-1.5 rounded-xl border text-center font-medium transition-all ${
                              selectedBank === b
                                ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {b}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Option 4: Pay at Property (Rule Protected) */}
              <div
                onClick={() => {
                  if (isPayAtPropertyAllowed) {
                    setSelectedPaymentMethod('OFFLINE_CASH');
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all ${
                  !isPayAtPropertyAllowed
                    ? 'border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed'
                    : selectedPaymentMethod === 'OFFLINE_CASH'
                    ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20 cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isPayAtPropertyAllowed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900">Pay at Property (Cash / Physical)</strong>
                        {isPayAtPropertyAllowed ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            Allowed by Host
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Online Escrow Required
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {isPayAtPropertyAllowed
                          ? 'Pay rent & security deposit in cash directly to landlord on move-in'
                          : 'This property host requires 100% upfront Escrow Deposit to secure bed'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    disabled={!isPayAtPropertyAllowed}
                    checked={selectedPaymentMethod === 'OFFLINE_CASH'}
                    onChange={() => setSelectedPaymentMethod('OFFLINE_CASH')}
                    className="text-brand-600 focus:ring-brand-500 disabled:opacity-40"
                  />
                </div>
              </div>
            </div>

            {/* Edge Case Demonstration Toggle */}
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-slate-700 font-medium text-[11px]">
                  Simulate Bank Payment Decline (Test failure & retry edge case)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateDecline}
                  onChange={(e) => setSimulateDecline(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* Bottom Proceed Action */}
            <div className="pt-2 flex gap-2 justify-between border-t border-slate-100 items-center">
              <Button
                onClick={() => setCurrentStep('SUMMARY')}
                variant="outline"
                size="sm"
                icon={ArrowLeft}
                disabled={isProcessing}
              >
                Back to Outlay
              </Button>

              <Button
                onClick={handleExecutePayment}
                variant="primary"
                size="md"
                disabled={isProcessing}
                icon={isProcessing ? Loader2 : Lock}
                className="shadow-md"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span>Securing Escrow...</span>
                  </span>
                ) : selectedPaymentMethod === 'OFFLINE_CASH' ? (
                  'Confirm Seat (Pay at Property)'
                ) : (
                  `Pay ₹${totalUpfrontAmount.toLocaleString()} via ${
                    selectedPaymentMethod === 'UPI'
                      ? 'UPI'
                      : selectedPaymentMethod === 'CREDIT_CARD' || selectedPaymentMethod === 'DEBIT_CARD'
                      ? 'Card'
                      : selectedPaymentMethod === 'NET_BANKING'
                      ? 'Net Banking'
                      : 'Escrow'
                  }`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: PAYMENT RESULT (SUCCESS OR FAILURE)                               */}
        {/* ========================================================================= */}
        {currentStep === 'RESULT' && paymentResult && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            {paymentResult.status === 'SUCCESS' ? (
              /* SUCCESS STATE */
              <div className="text-center py-2 space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-slate-900">
                    {selectedPaymentMethod === 'OFFLINE_CASH'
                      ? 'Seat Reservation Confirmed!'
                      : 'Payment Successful!'}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1 leading-relaxed">
                    {selectedPaymentMethod === 'OFFLINE_CASH'
                      ? 'Your bed has been locked. Upfront rent and security deposit will be collected in cash at the property.'
                      : `₹${totalUpfrontAmount.toLocaleString()} has been safely locked in StayEasy Escrow Protection.`}
                  </p>
                </div>

                {/* Receipt Matrix Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold">Booking ID:</span>
                    <strong className="text-brand-600 font-mono text-sm">
                      {paymentResult.booking?.bookingReference || paymentResult.escrowReceipt?.bookingReference || activeBooking?.bookingReference || paymentResult.booking?._id}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Transaction ID:</span>
                    <strong className="text-slate-900 font-mono">
                      {paymentResult.transaction?.transactionReference || `SE-TXN-${Date.now().toString().slice(-6)}`}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Amount Paid:</span>
                    <strong className="text-emerald-700 font-mono font-bold text-sm">
                      ₹{amountPayingNow.toLocaleString()}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Payment Channel:</span>
                    <Badge variant="brand" size="sm">
                      {selectedPaymentMethod?.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">StayEasy Escrow Status:</span>
                    <Badge
                      variant={selectedPaymentMethod === 'OFFLINE_CASH' ? 'amber' : 'emerald'}
                      size="sm"
                      className="flex items-center gap-1 font-semibold"
                    >
                      <Lock className="w-3 h-3" />
                      {selectedPaymentMethod === 'OFFLINE_CASH'
                        ? 'PENDING_OFFLINE'
                        : 'HELD IN ESCROW'}
                    </Badge>
                  </div>

                  {paymentResult.escrowReceipt?.receiptId && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Escrow Certificate #:</span>
                      <strong className="text-slate-700 font-mono text-[11px]">
                        {paymentResult.escrowReceipt.receiptId}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Trust Guarantee callout */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed flex items-center gap-2 text-left">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Your bed reservation is guaranteed. Landlord cannot disburse or claim deposit funds until your on-site physical check-in.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    onClick={() => setIsReceiptModalOpen(true)}
                    variant="outline"
                    size="sm"
                    icon={Printer}
                  >
                    Download / Print Receipt
                  </Button>

                  <Button
                    onClick={() => {
                      onClose();
                      navigate('/user/dashboard');
                    }}
                    variant="primary"
                    size="sm"
                  >
                    View in Tenant Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              /* FAILURE STATE */
              <div className="text-center py-3 space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
                  <AlertCircle className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-slate-900">Payment Failed</h4>
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-2xl max-w-md mx-auto mt-2 leading-relaxed">
                    {paymentResult.message}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Reservation Integrity Guarantee
                  </span>
                  <p className="text-slate-700">
                    • Your seat request (<strong>{activeBooking?.bookingReference || 'Pending'}</strong>) is held safely.
                  </p>
                  <p className="text-slate-700">
                    • <strong>No duplicate booking or duplicate charge was created.</strong>
                  </p>
                  <p className="text-slate-700">
                    • You can retry immediately with the same channel or select an alternative payment method.
                  </p>
                </div>

                {/* Retry & Change Method Buttons */}
                <div className="pt-3 flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    onClick={handleRetryPayment}
                    variant="primary"
                    size="sm"
                    icon={RotateCcw}
                  >
                    Retry Payment
                  </Button>

                  <Button
                    onClick={handleChangeMethod}
                    variant="outline"
                    size="sm"
                    icon={CreditCard}
                  >
                    Change Payment Method
                  </Button>

                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Escrow Printable Receipt Modal */}
      {isReceiptModalOpen && (activeBooking?._id || paymentResult?.booking?._id) && (
        <EscrowReceiptModal
          bookingId={activeBooking?._id || paymentResult?.booking?._id}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </div>
  );
};

export default BookingPaymentModal;
