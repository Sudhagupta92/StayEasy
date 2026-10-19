import React, { useState, useEffect } from 'react';
import {
  Building2,
  BedDouble,
  ShieldCheck,
  PlusCircle,
  TrendingUp,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  X,
  Plus,
  Loader2,
  DollarSign,
  MapPin,
  Utensils,
  Zap,
  Users,
  UserCheck,
  Check,
  LogIn,
  LogOut,
  FileText,
  Star,
  MessageSquare,
  Wrench,
  Flame,
  AlertTriangle,
  Camera,
  Layers,
  BarChart3,
  Filter,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { propertyService } from '../../services/propertyService';
import { bookingService } from '../../services/bookingService';
import { ledgerService } from '../../services/ledgerService';
import { reviewService } from '../../services/reviewService';
import { maintenanceService } from '../../services/maintenanceService';
import { analyticsService } from '../../services/analyticsService';
import { GenerateInvoiceModal } from '../../components/ui/GenerateInvoiceModal';
import { RentReceiptModal } from '../../components/ui/RentReceiptModal';
import { MaintenanceTicketCard } from '../../components/maintenance/MaintenanceTicketCard';
import { MaintenanceTicketDetail } from '../../components/maintenance/MaintenanceTicketDetail';
import { OwnerAIInsights } from '../../components/ai/OwnerAIInsights';
import { OwnerFinance } from '../../components/payment/OwnerFinance';
import { OwnerAnalytics } from '../../components/analytics/OwnerAnalytics';
import { EditPropertyModal } from '../../components/owner/EditPropertyModal';
import { ManageRoomsModal } from '../../components/owner/ManageRoomsModal';
import { ManagePhotosModal } from '../../components/owner/ManagePhotosModal';
import { PropertyStatsModal } from '../../components/owner/PropertyStatsModal';
import { ResidentDetailDrawer } from '../../components/owner/ResidentDetailDrawer';
import { Brain, CreditCard } from 'lucide-react';


export const OwnerDashboard = () => {
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState('properties');
  const [ownerProfile, setOwnerProfile] = useState(user?.ownerProfile || null);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [residents, setResidents] = useState([]);
  const [ledgerInvoices, setLedgerInvoices] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [ownerReviews, setOwnerReviews] = useState([]);

  // Resident Reviews Tab Filters & Scorecard
  const [reviewPropertyFilter, setReviewPropertyFilter] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('ALL');
  const [reviewVerifiedFilter, setReviewVerifiedFilter] = useState('ALL');

  // Active Residents Tab Filters & Search
  const [residentPropertyFilter, setResidentPropertyFilter] = useState('');
  const [residentSearch, setResidentSearch] = useState('');
  const [residentStatusFilter, setResidentStatusFilter] = useState('ALL');
  const [residentVerificationFilter, setResidentVerificationFilter] = useState('ALL');

  // Platform Aggregate Stats State (Zero PII)
  const [platformOverview, setPlatformOverview] = useState(null);

  // Maintenance Tickets & SLA State
  const [ownerTickets, setOwnerTickets] = useState([]);
  const [slaSummary, setSlaSummary] = useState(null);
  const [ticketFilter, setTicketFilter] = useState('ALL');
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState(null);

  const [loadingData, setLoadingData] = useState(true);

  // Upgrade Modals States
  const [selectedPropForEdit, setSelectedPropForEdit] = useState(null);
  const [selectedPropForRooms, setSelectedPropForRooms] = useState(null);
  const [selectedPropForPhotos, setSelectedPropForPhotos] = useState(null);
  const [selectedPropForStats, setSelectedPropForStats] = useState(null);
  const [selectedResidentForDetail, setSelectedResidentForDetail] = useState(null);

  // Modal states
  const [isGenerateInvoiceOpen, setIsGenerateInvoiceOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [markingPaidId, setMarkingPaidId] = useState(null);

  // Business Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [businessName, setBusinessName] = useState(user?.ownerProfile?.businessName || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.ownerProfile?.emergencyContact || '');
  const [city, setCity] = useState(user?.ownerProfile?.address?.city || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Add Property Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submittingProp, setSubmittingProp] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Property Form State
  const [newProp, setNewProp] = useState({
    title: '',
    tagline: '',
    description: '',
    propertyType: 'PG',
    genderPreference: 'UNISEX',
    address: {
      street: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      landmark: '',
    },
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    ],
    roomConfigurations: [
      {
        type: 'SINGLE',
        name: 'Single Private Deluxe AC',
        rent: 14000,
        deposit: 20000,
        totalBeds: 5,
        availableBeds: 2,
        attachedWashroom: true,
        hasAC: true,
        hasBalcony: true,
      },
      {
        type: 'DOUBLE',
        name: '2-Seater Premium Sharing',
        rent: 9500,
        deposit: 15000,
        totalBeds: 10,
        availableBeds: 4,
        attachedWashroom: true,
        hasAC: true,
        hasBalcony: false,
      },
    ],
    expenses: {
      electricity: {
        type: 'PER_UNIT',
        rate: 8,
        description: 'Sub-metered billing at ₹8/unit',
      },
      water: { type: 'INCLUDED', amount: 0 },
      maintenance: { type: 'INCLUDED', amount: 0 },
      food: {
        available: true,
        includedInRent: true,
        extraCost: 0,
        foodType: 'BOTH',
        mealSchedule: ['Breakfast', 'Dinner'],
      },
    },
    noticePeriodDays: 30,
    depositRefundPolicy: 'Full deposit settled within 5 working days of checkout.',
    amenities: ['High-Speed WiFi', 'Daily Housekeeping', 'Power Backup', 'CCTV 24/7'],
  });

  // Owner Reviews Reply State
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchAllOwnerData = async () => {
    setLoadingData(true);
    try {
      const [profileRes, propsRes, bkRes, resRes, ledgerRes, reviewsRes, ticketsRes, slaRes, platRes] = await Promise.all([
        authService.getOwnerProfile().catch(() => ({})),
        propertyService.getMyProperties().catch(() => ({})),
        bookingService.getOwnerBookings().catch(() => ({})),
        bookingService.getOwnerResidents().catch(() => ({})),
        ledgerService.getOwnerLedger().catch(() => ({})),
        reviewService.getOwnerPropertyReviews().catch(() => ({})),
        maintenanceService.getOwnerTickets().catch(() => ({})),
        maintenanceService.getSLASummary().catch(() => ({})),
        analyticsService.getPlatformOverview().catch(() => ({})),
      ]);

      if (profileRes.success && profileRes.data?.ownerProfile) {
        setOwnerProfile(profileRes.data.ownerProfile);
        setBusinessName(profileRes.data.ownerProfile.businessName || '');
        setEmergencyContact(profileRes.data.ownerProfile.emergencyContact || '');
        setCity(profileRes.data.ownerProfile.address?.city || '');
      }

      if (propsRes.success && propsRes.data) {
        setProperties(propsRes.data.properties || []);
      }

      if (bkRes.success && bkRes.data) {
        setBookings(bkRes.data.bookings || []);
      }

      if (resRes.success && resRes.data) {
        setResidents(resRes.data.residents || []);
      }

      if (ledgerRes.success && ledgerRes.data) {
        setLedgerInvoices(ledgerRes.data.invoices || []);
        setLedgerSummary(ledgerRes.data.summary || null);
      }

      if (reviewsRes.success && reviewsRes.data) {
        setOwnerReviews(reviewsRes.data.reviews || []);
      }

      if (ticketsRes.success && ticketsRes.data) {
        setOwnerTickets(ticketsRes.data.tickets || []);
      }

      if (slaRes.success && slaRes.data) {
        setSlaSummary(slaRes.data.summary || null);
      }

      if (platRes.success && platRes.data) {
        setPlatformOverview(platRes.data);
      }
    } catch (err) {
      console.warn('Failed to load owner portal data:', err.message);
    } finally {
      setLoadingData(false);
    }
  };


  const handleMarkInvoicePaid = async (invoiceId) => {
    setMarkingPaidId(invoiceId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await ledgerService.markInvoicePaid(invoiceId, {
        paymentMethod: 'CASH',
        paymentReference: 'DIRECT_OFFLINE_PAYMENT',
      });
      if (res.success) {
        setSuccessMsg(res.message);
        await fetchAllOwnerData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to mark invoice paid.');
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handlePostOwnerResponse = async (e) => {
    e.preventDefault();
    if (!replyingReviewId || !responseText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await reviewService.ownerRespondToReview(replyingReviewId, responseText.trim());
      if (res.success) {
        setSuccessMsg('Response published to resident review!');
        setReplyingReviewId(null);
        setResponseText('');
        await fetchAllOwnerData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to post owner response');
    } finally {
      setSubmittingReply(false);
    }
  };

  useEffect(() => {
    fetchAllOwnerData();
  }, []);


  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await authService.updateOwnerProfile({
        businessName,
        emergencyContact,
        address: { city },
      });

      if (res.success && res.data?.ownerProfile) {
        setOwnerProfile(res.data.ownerProfile);
        setSuccessMsg('Owner business profile updated successfully!');
        setIsEditingProfile(false);
        await refreshUser();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update owner profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmittingProp(true);

    try {
      const res = await propertyService.createProperty(newProp);
      if (res.success) {
        setSuccessMsg('New property listed successfully! It has been submitted for physical audit.');
        setIsAddModalOpen(false);
        await fetchAllOwnerData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create property listing.');
    } finally {
      setSubmittingProp(false);
    }
  };

  const handleDeleteProperty = async (propId) => {
    if (!window.confirm('Are you sure you want to remove this property listing?')) return;

    try {
      const res = await propertyService.deleteProperty(propId);
      if (res.success) {
        setSuccessMsg('Property listing removed.');
        await fetchAllOwnerData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete property.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await bookingService.updateBookingStatus(bookingId, newStatus);
      if (res.success) {
        setSuccessMsg(`Reservation status updated to ${newStatus}.`);
        await fetchAllOwnerData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update booking status.');
    }
  };

  const addRoomConfigRow = () => {
    setNewProp({
      ...newProp,
      roomConfigurations: [
        ...newProp.roomConfigurations,
        {
          type: 'TRIPLE',
          name: '3-Seater Budget Sharing',
          rent: 7500,
          deposit: 12000,
          totalBeds: 6,
          availableBeds: 3,
          attachedWashroom: true,
          hasAC: false,
          hasBalcony: false,
        },
      ],
    });
  };

  const removeRoomConfigRow = (idx) => {
    if (newProp.roomConfigurations.length <= 1) return;
    const updated = newProp.roomConfigurations.filter((_, i) => i !== idx);
    setNewProp({ ...newProp, roomConfigurations: updated });
  };

  // Compute Occupancy
  const totalBeds = properties.reduce(
    (acc, p) => acc + (p.roomConfigurations?.reduce((rAcc, r) => rAcc + r.totalBeds, 0) || 0),
    0
  );
  const availableBeds = properties.reduce(
    (acc, p) => acc + (p.roomConfigurations?.reduce((rAcc, r) => rAcc + r.availableBeds, 0) || 0),
    0
  );
  const occupiedBeds = totalBeds - availableBeds;
  const pendingBookings = bookings.filter((b) => b.status === 'REQUESTED' || b.status === 'PENDING');

  // Escrow Settlement Modal State
  const [settleBookingModal, setSettleBookingModal] = useState(null);
  const [damageDeduction, setDamageDeduction] = useState(0);
  const [deductionReason, setDeductionReason] = useState('');
  const [settlingEscrow, setSettlingEscrow] = useState(false);

  const handleSettleEscrowSubmit = async (e) => {
    e.preventDefault();
    if (!settleBookingModal) return;

    setSettlingEscrow(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const deductionNum = Number(damageDeduction) || 0;
      const depositAmount = settleBookingModal.costs?.securityDeposit || 0;

      if (deductionNum < 0) {
        setErrorMsg('Deduction amount cannot be negative.');
        setSettlingEscrow(false);
        return;
      }

      if (deductionNum > depositAmount) {
        setErrorMsg(`Deduction amount (₹${deductionNum}) cannot exceed total deposit (₹${depositAmount}).`);
        setSettlingEscrow(false);
        return;
      }

      const res = await bookingService.settleEscrowDeposit(settleBookingModal._id, {
        damageDeductionAmount: deductionNum,
        deductionReason: deductionReason || 'Checkout inspection settlement',
      });

      if (res.success) {
        setSuccessMsg(`Check-out completed! Security deposit settled. Tenant Refund: ₹${depositAmount - deductionNum}`);
        setSettleBookingModal(null);
        setDamageDeduction(0);
        setDeductionReason('');
        await fetchAllOwnerData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to settle escrow deposit.');
    } finally {
      setSettlingEscrow(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center text-2xl font-black">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{ownerProfile?.businessName || user?.name}</h2>
              <Badge variant="emerald" size="sm">
                Verified Landlord Partner
              </Badge>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>Owner: {user?.name}</span>
              <span>• {user?.email}</span>
              {ownerProfile?.address?.city && <span>• {ownerProfile.address.city}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            variant="outline"
            size="sm"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            icon={Edit3}
          >
            {isEditingProfile ? 'Cancel' : 'Edit Profile'}
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="primary"
            size="sm"
            icon={PlusCircle}
          >
            Add Property
          </Button>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Edit Owner Profile Form */}
      {isEditingProfile && (
        <Card className="p-6 border-emerald-200 bg-emerald-50/20 animate-in fade-in duration-200">
          <h3 className="text-base font-bold text-slate-900 mb-4">Edit Owner Business Profile</h3>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">PG / Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Emergency Contact</label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Operating City</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button onClick={() => setIsEditingProfile(false)} variant="outline" size="sm">
                Cancel
              </Button>
              <Button type="submit" variant="emerald" size="sm" disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Live Occupancy & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">My Properties</span>
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{properties.length} Active</div>
          <span className="text-xs text-emerald-600 font-medium">Verified Listings Live</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Seat Occupancy</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {occupiedBeds} / {totalBeds} Beds
          </div>
          <span className="text-xs text-slate-500">
            {availableBeds > 0 ? `${availableBeds} Vacant Seats Available` : 'Fully Occupied'}
          </span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingBookings.length} Requests</div>
          <span className="text-xs text-amber-700 font-medium">Action Required</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Current Residents</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{residents.length} Verified</div>
          <span className="text-xs text-emerald-600 font-medium">Check-In Completed</span>
        </Card>
      </div>

      {/* Platform Overview (Aggregated Only - Privacy Protected) */}
      {platformOverview && (
        <Card className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl border border-slate-700 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  StayEasy Platform Overview
                </h4>
                <p className="text-[11px] text-slate-400">
                  Audited platform metrics across all verified PG, Hostel and Co-Living networks.
                </p>
              </div>
            </div>
            <Badge variant="emerald" size="sm" className="self-start sm:self-auto">
              ✓ Verified Ecosystem
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Users</span>
              <span className="text-lg font-black text-white">{(platformOverview.totalUsers || 0).toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Owners</span>
              <span className="text-lg font-black text-white">{(platformOverview.totalOwners || 0).toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Properties</span>
              <span className="text-lg font-black text-emerald-400">{(platformOverview.totalProperties || 0).toLocaleString()}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                {platformOverview.propertyTypeCounts?.PG || 0} PGs • {platformOverview.propertyTypeCounts?.HOSTEL || 0} Hostels
              </span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Beds</span>
              <span className="text-lg font-black text-white">{(platformOverview.platformBeds?.totalPlatformBeds || platformOverview.totalPlatformBeds || 0).toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Verified Reviews</span>
              <span className="text-lg font-black text-amber-400">{(platformOverview.totalVerifiedReviews || platformOverview.totalReviews || 0).toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Average Rating</span>
              <span className="text-lg font-black text-emerald-400">{platformOverview.averagePlatformRating || '4.8'} ★</span>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation Tabs (Listings vs Bookings vs Residents) */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('properties')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'properties'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Listed Accommodations ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Booking Inquiries ({bookings.length})
          {pendingBookings.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingBookings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('residents')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'residents'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Active Residents & Check-In ({residents.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Rent Ledger & Invoicing ({ledgerInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> Resident Reviews ({ownerReviews.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'maintenance'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4 text-brand-600" /> Maintenance & SLA ({ownerTickets.length})
          {ownerTickets.filter((t) => t.status === 'OPEN' || t.status === 'REOPENED').length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {ownerTickets.filter((t) => t.status === 'OPEN' || t.status === 'REOPENED').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Brain className="w-4 h-4 text-purple-600" /> AI Intelligence
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'finance'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-blue-600" /> Earnings & Payouts
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" /> Analytics & Insights
        </button>
      </div>

      {/* TAB Finance: Earnings & Payouts */}
      {activeTab === 'finance' && <OwnerFinance />}

      {/* TAB AI: Predictions & Intelligence */}
      {activeTab === 'ai' && <OwnerAIInsights />}

      {/* TAB 0: Analytics & Insights */}
      {activeTab === 'analytics' && <OwnerAnalytics properties={properties} />}


      {/* TAB 1: Listed Properties */}
      {activeTab === 'properties' && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">My Accommodation Listings</h3>
              <p className="text-xs text-slate-500">
                Full PG/Hostel inventory management, floor-by-floor room matrices, bed allocation, and photo galleries.
              </p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)} variant="primary" size="sm" icon={PlusCircle}>
              Add Property
            </Button>
          </div>

          {loadingData ? (
            <div className="py-12 flex justify-center items-center gap-2 text-slate-500 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> Loading properties...
            </div>
          ) : properties.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No properties listed yet</p>
              <Button onClick={() => setIsAddModalOpen(true)} variant="primary" size="sm">
                Create Listing Now
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((prop) => {
                let pTotalBeds = 0;
                let pAvailBeds = 0;
                if (prop.rooms && prop.rooms.length > 0) {
                  prop.rooms.forEach((r) => {
                    pTotalBeds += r.beds && r.beds.length > 0 ? r.beds.length : 1;
                    pAvailBeds +=
                      r.beds && r.beds.length > 0
                        ? r.beds.filter((b) => b.status === 'AVAILABLE').length
                        : 1;
                  });
                } else if (prop.roomConfigurations) {
                  prop.roomConfigurations.forEach((rc) => {
                    pTotalBeds += rc.totalBeds || 0;
                    pAvailBeds += rc.availableBeds || 0;
                  });
                }
                const pOccupiedBeds = Math.max(0, pTotalBeds - pAvailBeds);
                const pOccRate = pTotalBeds > 0 ? Math.round((pOccupiedBeds / pTotalBeds) * 100) : 0;
                const coverUrl =
                  prop.coverImage ||
                  prop.photos?.find((p) => p.isCover)?.url ||
                  prop.images?.[0] ||
                  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5';

                return (
                  <div
                    key={prop._id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-start sm:items-center gap-4">
                        <img
                          src={coverUrl}
                          alt={prop.title}
                          className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0 shadow-xs"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">{prop.title}</h4>
                            <Badge variant="brand" size="sm">
                              {prop.propertyType}
                            </Badge>
                            <Badge
                              variant={
                                prop.genderPreference === 'FEMALE'
                                  ? 'rose'
                                  : prop.genderPreference === 'MALE'
                                  ? 'blue'
                                  : 'purple'
                              }
                              size="sm"
                            >
                              {prop.genderPreference}
                            </Badge>
                            <Badge
                              variant={prop.verificationStatus === 'VERIFIED' ? 'emerald' : 'amber'}
                              size="sm"
                            >
                              {prop.verificationStatus}
                            </Badge>
                          </div>

                          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              {prop.address?.city}, {prop.address?.state}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-slate-800">
                              Rent: ₹{prop.rentRange?.min?.toLocaleString()} - ₹
                              {prop.rentRange?.max?.toLocaleString()}/mo
                            </span>
                            <span>•</span>
                            <span>{prop.rooms?.length || prop.roomConfigurations?.length || 0} Rooms</span>
                            <span>•</span>
                            <span>Trust Score: <strong>{prop.trustScore || 88}</strong>/100</span>
                          </p>

                          {/* Live Bed Occupancy Bar */}
                          <div className="flex items-center gap-3 pt-1">
                            <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className="bg-brand-600 h-full rounded-full transition-all"
                                style={{ width: `${pOccRate}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 font-mono">
                              {pOccRate}% Occupied ({pOccupiedBeds}/{pTotalBeds} Beds)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Buttons Group */}
                      <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                        <Button
                          to={`/properties/${prop._id}`}
                          variant="outline"
                          size="sm"
                          icon={Eye}
                        >
                          View
                        </Button>

                        <Button
                          onClick={() => setSelectedPropForRooms(prop)}
                          variant="outline"
                          size="sm"
                          icon={Layers}
                          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                          Rooms & Beds
                        </Button>

                        <Button
                          onClick={() => setSelectedPropForPhotos(prop)}
                          variant="outline"
                          size="sm"
                          icon={Camera}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          Photos ({prop.photos?.length || prop.images?.length || 0})
                        </Button>

                        <Button
                          onClick={() => setSelectedPropForStats(prop)}
                          variant="outline"
                          size="sm"
                          icon={BarChart3}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          Stats
                        </Button>

                        <Button
                          onClick={() => setSelectedPropForEdit(prop)}
                          variant="outline"
                          size="sm"
                          icon={Edit3}
                        >
                          Edit
                        </Button>

                        <Button
                          onClick={() => handleDeleteProperty(prop._id)}
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50"
                          icon={Trash2}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: Booking Inquiries & Management */}
      {activeTab === 'bookings' && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-1">Incoming Tenant Reservations</h3>
          <p className="text-xs text-slate-500 mb-4">Accept or reject pending student/professional booking requests.</p>

          {bookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No booking inquiries received yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map((bk) => (
                <div key={bk._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {bk.bookingReference}
                      </span>
                      <Badge
                        variant={
                          bk.status === 'ACCEPTED' || bk.status === 'CHECKED_IN' || bk.status === 'ACTIVE_STAY'
                            ? 'emerald'
                            : bk.status === 'REQUESTED'
                            ? 'amber'
                            : 'rose'
                        }
                        size="sm"
                      >
                        {bk.status}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      Applicant: {bk.tenantId?.name} ({bk.tenantId?.occupation || 'Student'})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Property: <strong>{bk.propertyId?.title}</strong> • Room: <strong>{bk.roomName}</strong>
                    </p>
                    <p className="text-xs text-slate-500">
                      Move-in Date: {new Date(bk.moveInDate).toLocaleDateString()} • Upfront: ₹{bk.costs?.totalUpfrontAmount?.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {bk.status === 'REQUESTED' && (
                      <>
                        <Button
                          onClick={() => handleUpdateBookingStatus(bk._id, 'ACCEPTED')}
                          variant="primary"
                          size="sm"
                          icon={Check}
                        >
                          Accept Booking
                        </Button>
                        <Button
                          onClick={() => handleUpdateBookingStatus(bk._id, 'REJECTED')}
                          variant="outline"
                          size="sm"
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {bk.status === 'ACCEPTED' && (
                      <Button
                        onClick={() => handleUpdateBookingStatus(bk._id, 'CHECKED_IN')}
                        variant="emerald"
                        size="sm"
                        icon={LogIn}
                      >
                        Complete Physical Check-In
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: Active Residents & Stay Lifecycle */}
      {activeTab === 'residents' && (
        <Card className="p-6">
          <div className="flex flex-col gap-4 mb-5 pb-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Residents & Occupancy Management</h3>
                <p className="text-xs text-slate-500">
                  Search and manage verified residents across your properties, track stay duration and KYC records.
                </p>
              </div>

              {/* Total Residents Counter Badge */}
              <Badge variant="emerald" size="sm" className="self-start sm:self-auto">
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                {residents.length} Property Resident{residents.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Comprehensive Search & Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, room, phone, email..."
                  value={residentSearch}
                  onChange={(e) => setResidentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Property Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={residentPropertyFilter}
                  onChange={(e) => setResidentPropertyFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">All Properties ({properties.length})</option>
                  {properties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={residentStatusFilter}
                onChange={(e) => setResidentStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="ALL">All Stay Statuses</option>
                <option value="ACTIVE">Currently Staying / Checked-In</option>
                <option value="UPCOMING">Upcoming (Accepted / Confirmed)</option>
                <option value="PAST">Past / Checked-Out</option>
              </select>

              {/* Verification Status Filter */}
              <select
                value={residentVerificationFilter}
                onChange={(e) => setResidentVerificationFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="ALL">All Verification Status</option>
                <option value="VERIFIED">Verified Residents Only</option>
                <option value="PENDING">Pending Check-In / Verification</option>
              </select>
            </div>
          </div>

          {(() => {
            let filteredResidents = residents;

            // Property filter
            if (residentPropertyFilter) {
              filteredResidents = filteredResidents.filter(
                (r) =>
                  r.propertyId?._id === residentPropertyFilter ||
                  r.propertyId === residentPropertyFilter
              );
            }

            // Search filter
            if (residentSearch.trim()) {
              const q = residentSearch.trim().toLowerCase();
              filteredResidents = filteredResidents.filter((r) => {
                const name = r.tenantId?.name?.toLowerCase() || '';
                const email = r.tenantId?.email?.toLowerCase() || '';
                const phone = r.tenantId?.phone?.toLowerCase() || '';
                const room = r.roomName?.toLowerCase() || '';
                const prop = r.propertyId?.title?.toLowerCase() || '';
                return name.includes(q) || email.includes(q) || phone.includes(q) || room.includes(q) || prop.includes(q);
              });
            }

            // Status filter
            if (residentStatusFilter === 'ACTIVE') {
              filteredResidents = filteredResidents.filter(
                (r) => r.status === 'CHECKED_IN' || r.status === 'ACTIVE_STAY'
              );
            } else if (residentStatusFilter === 'UPCOMING') {
              filteredResidents = filteredResidents.filter(
                (r) => r.status === 'ACCEPTED' || r.status === 'CONFIRMED' || r.status === 'REQUESTED'
              );
            } else if (residentStatusFilter === 'PAST') {
              filteredResidents = filteredResidents.filter((r) => r.status === 'CHECKED_OUT');
            }

            // Verification status filter
            if (residentVerificationFilter === 'VERIFIED') {
              filteredResidents = filteredResidents.filter((r) => r.isVerifiedResident);
            } else if (residentVerificationFilter === 'PENDING') {
              filteredResidents = filteredResidents.filter((r) => !r.isVerifiedResident);
            }

            return filteredResidents.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">No Residents Found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {residentSearch || residentPropertyFilter || residentStatusFilter !== 'ALL'
                    ? 'No resident records match your selected search terms or filters.'
                    : 'No active residents checked in yet. Incoming reservations will show here upon check-in.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredResidents.map((r) => (
                  <div
                    key={r._id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {r.tenantId?.name || 'Resident'}
                        </h4>
                        {r.isVerifiedResident ? (
                          <Badge variant="emerald" size="sm">
                            ✓ Verified Resident
                          </Badge>
                        ) : (
                          <Badge variant="amber" size="sm">
                            Pending Check-In
                          </Badge>
                        )}
                        <Badge variant="slate" size="sm">
                          {r.status}
                        </Badge>
                        {r.stayDurationText && (
                          <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-full">
                            📅 {r.stayDurationText}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {r.propertyId?.title || 'Property'}
                        </span>
                        <span>•</span>
                        <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          {r.roomName || 'Room'} ({r.roomType || 'SINGLE'})
                        </span>
                        <span>•</span>
                        <span>Rent: <strong>₹{r.costs?.monthlyRent?.toLocaleString()}/mo</strong></span>
                        <span>•</span>
                        <span>Deposit: ₹{r.costs?.securityDeposit?.toLocaleString()}</span>
                      </p>

                      <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                        <span>
                          Check-in:{' '}
                          {r.checkInDate
                            ? new Date(r.checkInDate).toLocaleDateString()
                            : r.moveInDate
                            ? new Date(r.moveInDate).toLocaleDateString()
                            : 'Pending'}
                        </span>
                        {r.checkOutDate && (
                          <span>• Check-out: {new Date(r.checkOutDate).toLocaleDateString()}</span>
                        )}
                        <span>• Phone: {r.tenantId?.phone || 'N/A'}</span>
                        <span>• Email: {r.tenantId?.email || 'N/A'}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                      <Button
                        onClick={() => setSelectedResidentForDetail(r)}
                        variant="outline"
                        size="sm"
                        icon={FileText}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        Profile & Stay Details
                      </Button>

                      {r.status !== 'CHECKED_IN' && r.status !== 'ACTIVE_STAY' ? (
                        <Button
                          onClick={() => handleUpdateBookingStatus(r._id, 'CHECKED_IN')}
                          variant="emerald"
                          size="sm"
                          icon={LogIn}
                        >
                          Check-In
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setSettleBookingModal(r);
                            setDamageDeduction(0);
                            setDamageDeduction(0);
                            setDeductionReason('');
                          }}
                          variant="outline"
                          size="sm"
                          className="text-slate-700 hover:bg-slate-50"
                          icon={LogOut}
                        >
                          Check-Out & Escrow
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>
      )}

      {/* TAB 4: Rent Ledger & Invoicing */}
      {activeTab === 'ledger' && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rent Ledger & Invoicing Control</h3>
              <p className="text-xs text-slate-500">Issue monthly rent invoices, record sub-meter power readings, and log cash payments.</p>
            </div>

            {residents.length > 0 && (
              <Button
                onClick={() => setIsGenerateInvoiceOpen(true)}
                variant="primary"
                size="sm"
                icon={PlusCircle}
              >
                Issue Rent Invoice
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Total Rent Collected</span>
              <div className="text-xl font-black text-emerald-700">
                ₹{(ledgerSummary?.totalCollectedRent || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-800">Pending Due Collections</span>
              <div className="text-xl font-black text-amber-700">
                ₹{(ledgerSummary?.pendingDueRent || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Total Issued Invoices</span>
              <div className="text-xl font-black text-slate-900">
                {ledgerInvoices.length} Invoices
              </div>
            </div>
          </div>

          {ledgerInvoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No rent invoices issued yet. Click "Issue Rent Invoice" to get started.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ledgerInvoices.map((inv) => (
                <div key={inv._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {inv.invoiceNumber}
                      </span>
                      <Badge
                        variant={inv.status === 'PAID' ? 'emerald' : inv.status === 'OVERDUE' ? 'rose' : 'amber'}
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                      <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                        {inv.billingMonth}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      Tenant: {inv.tenantId?.name} ({inv.tenantId?.phone || inv.tenantId?.email})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Property: {inv.propertyId?.title} • Base Rent: ₹{inv.breakdown?.baseRent?.toLocaleString()}
                      {inv.breakdown?.electricity?.amount > 0 && ` • Electricity: ₹${inv.breakdown.electricity.amount} (${inv.breakdown.electricity.unitsConsumed} kWh)`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    <div className="text-right mr-2">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Invoice Total</span>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{inv.totalAmount?.toLocaleString()}
                      </span>
                    </div>

                    {inv.status !== 'PAID' && (
                      <Button
                        onClick={() => handleMarkInvoicePaid(inv._id)}
                        variant="primary"
                        size="sm"
                        disabled={markingPaidId === inv._id}
                        icon={markingPaidId === inv._id ? Loader2 : CheckCircle2}
                      >
                        {markingPaidId === inv._id ? 'Saving...' : 'Mark Paid (Cash)'}
                      </Button>
                    )}

                    <Button
                      onClick={() => setSelectedReceiptId(inv._id)}
                      variant="outline"
                      size="sm"
                      icon={FileText}
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      Receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: Resident Reviews & SLA Feedback */}
      {activeTab === 'reviews' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Resident Reviews & Living Reality Ratings</h3>
              <p className="text-xs text-slate-500">
                Audited feedback from verified residents who have physically stayed across your accommodations.
              </p>
            </div>

            {/* Total verified count badge */}
            <Badge variant="emerald" size="sm" className="self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {ownerReviews.filter((r) => r.isVerifiedResident !== false).length} Verified Review{ownerReviews.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Reviews Scorecard & Star Distribution */}
          {ownerReviews.length > 0 && (() => {
            const total = ownerReviews.length;
            const avg = Number((ownerReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / total).toFixed(1));
            const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            ownerReviews.forEach((r) => {
              const star = Math.min(5, Math.max(1, Math.round(r.overallRating || 5)));
              starCounts[star] = (starCounts[star] || 0) + 1;
            });

            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200">
                {/* Score Summary */}
                <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-slate-200 md:pr-6 pb-4 md:pb-0 flex flex-col justify-center">
                  <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <span className="text-4xl font-black text-slate-900">{avg}</span>
                    <span className="text-sm font-bold text-slate-400">/ 5.0</span>
                  </div>
                  <div className="flex justify-center md:justify-start my-1.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">
                    Based on {total} resident feedback report{total !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Star Distribution Bars */}
                <div className="md:col-span-8 space-y-1.5 justify-center flex flex-col">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const count = starCounts[s] || 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={s} className="flex items-center text-xs gap-3">
                        <span className="w-12 font-bold text-slate-700">{s} Stars</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-slate-500 font-mono text-[11px]">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">Filter resident feedback:</span>

            <div className="flex flex-wrap items-center gap-2">
              {/* Property Filter Dropdown */}
              {properties.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={reviewPropertyFilter}
                    onChange={(e) => setReviewPropertyFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All Properties ({properties.length})</option>
                    {properties.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Rating Filter Dropdown */}
              <select
                value={reviewRatingFilter}
                onChange={(e) => setReviewRatingFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All Ratings</option>
                <option value="5">5 Stars Only</option>
                <option value="4">4 Stars Only</option>
                <option value="3">3 Stars Only</option>
                <option value="2">2 Stars Only</option>
                <option value="1">1 Star Only</option>
              </select>

              {/* Verified Filter Dropdown */}
              <select
                value={reviewVerifiedFilter}
                onChange={(e) => setReviewVerifiedFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All Reviews</option>
                <option value="VERIFIED">Verified Residents Only</option>
              </select>
            </div>
          </div>

          {(() => {
            let filteredReviews = ownerReviews;

            if (reviewPropertyFilter) {
              filteredReviews = filteredReviews.filter(
                (rev) =>
                  rev.propertyId?._id === reviewPropertyFilter ||
                  rev.propertyId === reviewPropertyFilter
              );
            }

            if (reviewRatingFilter !== 'ALL') {
              filteredReviews = filteredReviews.filter(
                (rev) => Math.round(rev.overallRating) === Number(reviewRatingFilter)
              );
            }

            if (reviewVerifiedFilter === 'VERIFIED') {
              filteredReviews = filteredReviews.filter((rev) => rev.isVerifiedResident !== false);
            }

            return filteredReviews.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
                <Star className="w-12 h-12 text-amber-300 mx-auto mb-2 opacity-60" />
                <p className="font-bold text-slate-700 text-sm">
                  {reviewPropertyFilter || reviewRatingFilter !== 'ALL' || reviewVerifiedFilter !== 'ALL'
                    ? 'No Reviews Match Selected Filters'
                    : 'No Resident Reviews Yet'}
                </p>
                <p className="mt-1 max-w-sm mx-auto">
                  {reviewPropertyFilter || reviewRatingFilter !== 'ALL' || reviewVerifiedFilter !== 'ALL'
                    ? 'Try resetting the filters to view all reviews.'
                    : 'Once residents check into your property and share their living experience, their audited reviews will appear here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((rev) => (
                  <div key={rev._id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase text-emerald-700">
                            {rev.propertyId?.title || 'Property Listing'}
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
                        <h4 className="font-bold text-sm text-slate-900">{rev.title}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-amber-400">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-slate-800">{rev.overallRating}.0 / 5.0</span>
                        </div>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                      "{rev.comment}"
                    </p>

                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">Food: {rev.foodQualityRating}★</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">Cleanliness: {rev.cleanlinessRating}★</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">Responsiveness: {rev.ownerResponsivenessRating}★</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">Billing: {rev.billingTransparencyRating}★</span>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-bold">Reality Match: {rev.promiseVsRealityScore}/10</span>
                    </div>

                    {/* Owner Response Display or Form */}
                    {rev.ownerResponse?.responseText ? (
                      <div className="p-3 bg-emerald-50/70 border-l-4 border-emerald-600 rounded-r-xl space-y-1 text-xs">
                        <div className="flex justify-between font-bold text-emerald-900">
                          <span>Your Published Response:</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(rev.ownerResponse.respondedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700 italic">"{rev.ownerResponse.responseText}"</p>
                      </div>
                    ) : replyingReviewId === rev._id ? (
                      <form onSubmit={handlePostOwnerResponse} className="p-3 bg-white border border-emerald-200 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-slate-800">
                          Write Official Landlord Response
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Thank the resident, clarify any issues, or outline improvements made..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setReplyingReviewId(null)}>
                            Cancel
                          </Button>
                          <Button type="submit" variant="primary" size="sm" disabled={submittingReply}>
                            {submittingReply ? 'Publishing...' : 'Publish Response'}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="pt-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyingReviewId(rev._id);
                            setResponseText('');
                          }}
                          icon={MessageSquare}
                          className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        >
                          Reply to Review
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>
      )}

      {/* TAB 6: Maintenance & SLA Management */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* SLA Performance Metrics Section */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-4 bg-slate-900 text-white border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Open Issues</span>
              <span className="text-2xl font-extrabold text-white font-mono">{slaSummary?.openTickets || 0}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting resolution</span>
            </Card>

            <Card className="p-4 bg-rose-50/50 border-rose-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-rose-700">Urgent</span>
                <Flame className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <span className="text-2xl font-extrabold text-rose-700 font-mono">{slaSummary?.urgentTickets || 0}</span>
              <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">2h SLA Window</span>
            </Card>

            <Card className="p-4 bg-amber-50/50 border-amber-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-amber-800">SLA Overdue</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="text-2xl font-extrabold text-amber-800 font-mono">{slaSummary?.overdueTickets || 0}</span>
              <span className="text-[10px] text-amber-700 block mt-0.5">Resolution breached</span>
            </Card>

            <Card className="p-4 bg-blue-50/50 border-blue-200">
              <span className="text-[10px] font-bold uppercase text-blue-700 block mb-1">Avg Response</span>
              <span className="text-2xl font-extrabold text-blue-800 font-mono">{slaSummary?.avgResponseHours || 0}h</span>
              <span className="text-[10px] text-blue-600 block mt-0.5">First acknowledgment</span>
            </Card>

            <Card className="p-4 bg-emerald-50/50 border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">Avg Fix Time</span>
              <span className="text-2xl font-extrabold text-emerald-800 font-mono">{slaSummary?.avgResolutionHours || 0}h</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Full resolution speed</span>
            </Card>

            <Card className="p-4 bg-indigo-50/50 border-indigo-200">
              <span className="text-[10px] font-bold uppercase text-indigo-700 block mb-1">On-Time SLA</span>
              <span className="text-2xl font-extrabold text-indigo-800 font-mono">
                {slaSummary?.totalTickets > 0 ? (100 - (slaSummary?.slaBreachRate || 0)).toFixed(0) : 100}%
              </span>
              <span className="text-[10px] text-indigo-600 block mt-0.5">Trust Score impact</span>
            </Card>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2 border-b border-slate-200 pb-3 text-xs font-semibold">
            {['ALL', 'URGENT', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'BREACHED'].map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTicketFilter(tabKey)}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  ticketFilter === tabKey
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {tabKey === 'ALL'
                  ? `All Complaints (${ownerTickets.length})`
                  : tabKey === 'URGENT'
                  ? `Urgent (${ownerTickets.filter((t) => t.priority === 'URGENT' && t.status !== 'CLOSED').length})`
                  : tabKey === 'OPEN'
                  ? `Pending Action (${ownerTickets.filter((t) => t.status === 'OPEN' || t.status === 'REOPENED').length})`
                  : tabKey === 'IN_PROGRESS'
                  ? `In Progress (${ownerTickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ACKNOWLEDGED').length})`
                  : tabKey === 'RESOLVED'
                  ? `Resolved (${ownerTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length})`
                  : `SLA Breached (${ownerTickets.filter((t) => t.responseBreached || t.resolutionBreached).length})`}
              </button>
            ))}
          </div>

          {/* Complaints List / Grid */}
          {ownerTickets.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No Complaints Received</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Your residents have not submitted any maintenance complaints. Any electrical, plumbing, or Wi-Fi reports will appear here with automated SLA tracking.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ownerTickets
                .filter((t) => {
                  if (ticketFilter === 'URGENT') return t.priority === 'URGENT' && t.status !== 'CLOSED';
                  if (ticketFilter === 'OPEN') return t.status === 'OPEN' || t.status === 'REOPENED';
                  if (ticketFilter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' || t.status === 'ACKNOWLEDGED';
                  if (ticketFilter === 'RESOLVED') return t.status === 'RESOLVED' || t.status === 'CLOSED';
                  if (ticketFilter === 'BREACHED') return t.responseBreached || t.resolutionBreached;
                  return true;
                })
                .map((ticket) => (
                  <MaintenanceTicketCard
                    key={ticket._id}
                    ticket={ticket}
                    isOwner={true}
                    onSelect={(t) => setSelectedTicketForDetail(t)}
                    onAcknowledge={(t) => setSelectedTicketForDetail(t)}
                    onStart={(t) => setSelectedTicketForDetail(t)}
                    onResolve={(t) => setSelectedTicketForDetail(t)}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicketForDetail && (
        <MaintenanceTicketDetail
          isOpen={!!selectedTicketForDetail}
          ticket={selectedTicketForDetail}
          onClose={() => setSelectedTicketForDetail(null)}
          onUpdate={(updated) => {
            setSelectedTicketForDetail(updated);
            fetchAllOwnerData();
            setSuccessMsg('Maintenance ticket updated successfully!');
          }}
          isOwner={true}
        />
      )}


      {/* Generate Invoice Modal */}
      {isGenerateInvoiceOpen && (
        <GenerateInvoiceModal
          residents={residents}
          onClose={() => setIsGenerateInvoiceOpen(false)}
          onSuccess={(msg) => {
            setSuccessMsg(msg);
            fetchAllOwnerData();
          }}
        />
      )}

      {/* Rent Receipt Modal */}
      {selectedReceiptId && (
        <RentReceiptModal
          invoiceId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}

      {/* Checkout & Escrow Settlement Modal */}
      {settleBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase text-brand-600">Checkout Inspection & Settlement</span>
                <h3 className="text-xl font-extrabold text-slate-900">Settle Security Deposit</h3>
              </div>
              <button
                onClick={() => setSettleBookingModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <p className="text-slate-700">
                Tenant: <strong>{settleBookingModal.tenantId?.name}</strong>
              </p>
              <p className="text-slate-700">
                Property: <strong>{settleBookingModal.propertyId?.title}</strong> ({settleBookingModal.roomName})
              </p>
              <p className="text-emerald-700 font-bold">
                Total Security Deposit Held: ₹{settleBookingModal.costs?.securityDeposit?.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleSettleEscrowSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Damage Deductions Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  max={settleBookingModal.costs?.securityDeposit || 0}
                  value={damageDeduction}
                  onChange={(e) => setDamageDeduction(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Enter 0 for 100% full refund to tenant. Maximum limit: ₹{settleBookingModal.costs?.securityDeposit?.toLocaleString()}.
                </span>
              </div>

              {damageDeduction > 0 && (
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Reason for Damage Deductions
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broken AC remote control, wall paint repair..."
                    value={deductionReason}
                    onChange={(e) => setDeductionReason(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {/* Live Calculation Preview */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Net Refund Released to Tenant:</span>
                  <strong className="text-emerald-700">
                    ₹{((settleBookingModal.costs?.securityDeposit || 0) - (Number(damageDeduction) || 0)).toLocaleString()}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Landlord Damage Payout:</span>
                  <strong className="text-slate-900">₹{(Number(damageDeduction) || 0).toLocaleString()}</strong>
                </div>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <Button onClick={() => setSettleBookingModal(null)} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={settlingEscrow}
                  icon={settlingEscrow ? Loader2 : CheckCircle2}
                >
                  {settlingEscrow ? 'Settling...' : 'Confirm Checkout & Release Deposit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Property Multi-Step Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase text-brand-600">Property Onboarding Wizard</span>
                <h3 className="text-xl font-extrabold text-slate-900">List New Accommodation</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProperty} className="space-y-5">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Property Details</h4>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Property Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Comfort Student Living"
                    value={newProp.title}
                    onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Property Type</label>
                    <select
                      value={newProp.propertyType}
                      onChange={(e) => setNewProp({ ...newProp, propertyType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50"
                    >
                      <option value="PG">PG (Paying Guest)</option>
                      <option value="HOSTEL">Hostel</option>
                      <option value="CO_LIVING">Co-Living</option>
                      <option value="FLAT">Flat / Apartment</option>
                      <option value="ROOM">Private Room</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Gender Preference</label>
                    <select
                      value={newProp.genderPreference}
                      onChange={(e) => setNewProp({ ...newProp, genderPreference: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50"
                    >
                      <option value="UNISEX">Unisex / Co-Ed</option>
                      <option value="MALE">Male Only</option>
                      <option value="FEMALE">Female Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    required
                    value={newProp.description}
                    onChange={(e) => setNewProp({ ...newProp, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Room Configurations Matrix */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    2. Room Sharing Options (1/2/3/4-seater)
                  </h4>
                  <button
                    type="button"
                    onClick={addRoomConfigRow}
                    className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Sharing Option
                  </button>
                </div>

                <div className="space-y-3">
                  {newProp.roomConfigurations.map((rc, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Option #{idx + 1}</span>
                        {newProp.roomConfigurations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRoomConfigRow(idx)}
                            className="text-rose-600 hover:underline text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Sharing Type</label>
                          <select
                            value={rc.type}
                            onChange={(e) => {
                              const updated = [...newProp.roomConfigurations];
                              updated[idx].type = e.target.value;
                              setNewProp({ ...newProp, roomConfigurations: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          >
                            <option value="SINGLE">Single (1-Seater)</option>
                            <option value="DOUBLE">Double (2-Seater)</option>
                            <option value="TRIPLE">Triple (3-Seater)</option>
                            <option value="FOUR_SEATER">4-Seater</option>
                            <option value="FLAT_FULL">Entire Flat</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Rent (₹/mo)</label>
                          <input
                            type="number"
                            required
                            value={rc.rent}
                            onChange={(e) => {
                              const updated = [...newProp.roomConfigurations];
                              updated[idx].rent = Number(e.target.value);
                              setNewProp({ ...newProp, roomConfigurations: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Deposit (₹)</label>
                          <input
                            type="number"
                            required
                            value={rc.deposit}
                            onChange={(e) => {
                              const updated = [...newProp.roomConfigurations];
                              updated[idx].deposit = Number(e.target.value);
                              setNewProp({ ...newProp, roomConfigurations: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Available Beds</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={rc.availableBeds}
                            onChange={(e) => {
                              const updated = [...newProp.roomConfigurations];
                              updated[idx].availableBeds = Number(e.target.value);
                              setNewProp({ ...newProp, roomConfigurations: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <Button onClick={() => setIsAddModalOpen(false)} variant="outline" size="md">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submittingProp}
                  icon={submittingProp ? Loader2 : CheckCircle2}
                >
                  {submittingProp ? 'Publishing...' : 'Publish Listing'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Property Details Modal */}
      {selectedPropForEdit && (
        <EditPropertyModal
          isOpen={!!selectedPropForEdit}
          property={selectedPropForEdit}
          onClose={() => setSelectedPropForEdit(null)}
          onSuccess={(msg) => {
            setSuccessMsg(msg);
            fetchAllOwnerData();
          }}
        />
      )}

      {/* Floor-by-Floor Rooms & Beds Matrix Modal */}
      {selectedPropForRooms && (
        <ManageRoomsModal
          isOpen={!!selectedPropForRooms}
          property={selectedPropForRooms}
          onClose={() => setSelectedPropForRooms(null)}
          onRefresh={() => fetchAllOwnerData()}
        />
      )}

      {/* Categorized Photos Modal */}
      {selectedPropForPhotos && (
        <ManagePhotosModal
          isOpen={!!selectedPropForPhotos}
          property={selectedPropForPhotos}
          onClose={() => setSelectedPropForPhotos(null)}
          onRefresh={() => fetchAllOwnerData()}
        />
      )}

      {/* Property-Level Scorecard / Stats Modal */}
      {selectedPropForStats && (
        <PropertyStatsModal
          isOpen={!!selectedPropForStats}
          property={selectedPropForStats}
          onClose={() => setSelectedPropForStats(null)}
        />
      )}

      {/* Resident Detail & Stay History Drawer */}
      {selectedResidentForDetail && (
        <ResidentDetailDrawer
          isOpen={!!selectedResidentForDetail}
          resident={selectedResidentForDetail}
          onClose={() => setSelectedResidentForDetail(null)}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
