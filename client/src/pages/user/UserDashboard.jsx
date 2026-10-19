import React, { useState, useEffect } from 'react';
import {
  Home,
  Clock,
  Receipt,
  ShieldCheck,
  IndianRupee,
  User,
  Phone,
  Briefcase,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  X,
  Building2,
  Eye,
  AlertTriangle,
  Lock,
  CreditCard,
  FileText,
  ChevronRight,
  LogOut,
  Zap,
  Star,
  Wrench,
  PlusCircle,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { bookingService } from '../../services/bookingService';
import { ledgerService } from '../../services/ledgerService';
import { reviewService } from '../../services/reviewService';
import { maintenanceService } from '../../services/maintenanceService';
import { EscrowReceiptModal } from '../../components/ui/EscrowReceiptModal';
import { RentReceiptModal } from '../../components/ui/RentReceiptModal';
import { MoveOutNoticeModal } from '../../components/ui/MoveOutNoticeModal';
import { MaintenanceTicketCard } from '../../components/maintenance/MaintenanceTicketCard';
import { MaintenanceTicketModal } from '../../components/maintenance/MaintenanceTicketModal';
import { MaintenanceTicketDetail } from '../../components/maintenance/MaintenanceTicketDetail';
import { TenantAIInsights } from '../../components/ai/TenantAIInsights';
import { TenantFinance } from '../../components/payment/TenantFinance';
import { UserAnalytics } from '../../components/analytics/UserAnalytics';
import { BookingPaymentModal } from '../../components/booking/BookingPaymentModal';


export const UserDashboard = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('stay'); // 'stay' | 'ledger' | 'bookings' | 'reviews' | 'maintenance'
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);

  // Maintenance State
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState('ALL');
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState(null);

  // Ledger State
  const [ledgerInvoices, setLedgerInvoices] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [moveOutNoticeBooking, setMoveOutNoticeBooking] = useState(null);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cancellation Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Escrow Pay & Receipt Modal State
  const [payingEscrowId, setPayingEscrowId] = useState(null);
  const [escrowModalBookingId, setEscrowModalBookingId] = useState(null);

  const [myReviews, setMyReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fetchTenantBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await bookingService.getMyBookings();
      if (res.success && res.data) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.warn('Failed to load tenant bookings:', err.message);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchTenantLedger = async () => {
    setLoadingLedger(true);
    try {
      const res = await ledgerService.getTenantLedger();
      if (res.success && res.data) {
        setLedgerInvoices(res.data.invoices || []);
        setLedgerSummary(res.data.summary || null);
      }
    } catch (err) {
      console.warn('Failed to load tenant ledger:', err.message);
    } finally {
      setLoadingLedger(false);
    }
  };

  const fetchMyReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await reviewService.getMyTenantReviews();
      if (res.success && res.data) {
        setMyReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.warn('Failed to load tenant reviews:', err.message);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchTenantTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await maintenanceService.getMyTickets();
      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.warn('Failed to load tenant maintenance tickets:', err.message);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTenantBookings();
    fetchTenantLedger();
    fetchMyReviews();
    fetchTenantTickets();
  }, []);


  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await authService.updateProfile({
        name,
        phone,
        occupation,
        bio,
      });

      if (res.success && res.data?.user) {
        updateUser(res.data.user);
        setSuccessMsg('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelBooking = async (e) => {
    e.preventDefault();
    if (!cancelModalBooking) return;

    setCancelling(true);
    try {
      const res = await bookingService.cancelBooking(cancelModalBooking._id, cancelReason);
      if (res.success) {
        setSuccessMsg('Booking cancelled successfully and deposit release requested.');
        setCancelModalBooking(null);
        setCancelReason('');
        await fetchTenantBookings();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayEscrow = async (bookingId) => {
    setPayingEscrowId(bookingId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await bookingService.payEscrowDeposit(bookingId);
      if (res.success) {
        setSuccessMsg('Upfront rent and security deposit successfully deposited into StayEasy Escrow Protection!');
        await fetchTenantBookings();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to deposit into Escrow.');
    } finally {
      setPayingEscrowId(null);
    }
  };

  const handlePayRentInvoice = async (invoiceId) => {
    setPayingInvoiceId(invoiceId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await ledgerService.payRentInvoice(invoiceId, { paymentMethod: 'UPI' });
      if (res.success) {
        setSuccessMsg('Monthly rent invoice paid successfully! Digital receipt generated.');
        await fetchTenantLedger();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to pay rent invoice.');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  // Find active stay if any
  const activeStay = bookings.find(
    (b) =>
      b.status === 'CHECKED_IN' ||
      b.status === 'ACTIVE_STAY' ||
      b.status === 'ACCEPTED' ||
      b.status === 'CONFIRMED'
  );

  // Escrow balance total
  const totalEscrowHeld = bookings.reduce((sum, b) => {
    return b.escrowStatus === 'HELD_IN_ESCROW' ? sum + (b.costs?.totalUpfrontAmount || 0) : sum;
  }, 0);

  const pendingInvoices = ledgerInvoices.filter((inv) => inv.status === 'DUE' || inv.status === 'OVERDUE');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CHECKED_IN':
      case 'ACTIVE_STAY':
        return <Badge variant="emerald" size="sm">✓ Active Resident</Badge>;
      case 'ACCEPTED':
      case 'CONFIRMED':
        return <Badge variant="emerald" size="sm">Confirmed Reservation</Badge>;
      case 'REQUESTED':
        return <Badge variant="amber" size="sm">Request Pending Landlord Approval</Badge>;
      case 'CHECKED_OUT':
        return <Badge variant="slate" size="sm">Stay Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="rose" size="sm">Cancelled</Badge>;
      case 'REJECTED':
        return <Badge variant="rose" size="sm">Declined by Landlord</Badge>;
      default:
        return <Badge variant="slate" size="sm">{status}</Badge>;
    }
  };

  const getEscrowBadge = (escrowStatus) => {
    switch (escrowStatus) {
      case 'HELD_IN_ESCROW':
        return <Badge variant="emerald" size="sm" className="flex items-center gap-1"><Lock className="w-3 h-3" /> HELD IN ESCROW</Badge>;
      case 'REFUNDED_TO_TENANT':
        return <Badge variant="blue" size="sm">Deposit Refunded</Badge>;
      case 'PARTIALLY_REFUNDED':
        return <Badge variant="purple" size="sm">Partially Refunded</Badge>;
      case 'RELEASED_TO_OWNER':
        return <Badge variant="slate" size="sm">Settled to Host</Badge>;
      default:
        return <Badge variant="amber" size="sm">Payment Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center justify-center text-2xl font-black">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              {activeStay?.isVerifiedResident ? (
                <Badge variant="emerald" size="sm">
                  ✓ Verified Resident
                </Badge>
              ) : (
                <Badge variant="brand" size="sm">
                  Tenant
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>{user?.email}</span>
              {user?.phone && <span>• {user.phone}</span>}
              {user?.occupation && <span>• {user.occupation}</span>}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant="outline"
          size="sm"
          className="bg-white/10 text-white border-white/20 hover:bg-white/20 self-start md:self-auto"
          icon={Edit3}
        >
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </Button>
      </div>

      {/* Escrow Deposit Protection & Monthly Rent Due Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-5 rounded-3xl border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white">Escrow Protection Balance</h3>
              <p className="text-[11px] text-slate-300">100% Protected Security Deposit</p>
            </div>
          </div>
          <span className="text-xl font-extrabold text-emerald-400 font-mono">
            ₹{totalEscrowHeld.toLocaleString()}
          </span>
        </div>

        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-3xl border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white">Outstanding Monthly Rent Due</h3>
              <p className="text-[11px] text-slate-300">{pendingInvoices.length} Pending Invoices</p>
            </div>
          </div>
          <span className="text-xl font-extrabold text-amber-400 font-mono">
            ₹{(ledgerSummary?.totalOutstandingDue || 0).toLocaleString()}
          </span>
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

      {/* Edit Profile Form */}
      {isEditing && (
        <Card className="p-6 border-brand-200 bg-brand-50/20 animate-in fade-in duration-200">
          <h3 className="text-base font-bold text-slate-900 mb-4">Edit Your Tenant Profile</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">College / Occupation</label>
                <input
                  type="text"
                  placeholder="e.g. Student @ IIT Delhi / Software Engineer"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Bio / Preferences</label>
                <input
                  type="text"
                  placeholder="Looking for a clean 2-seater room near metro"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('stay')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'stay'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Active Accommodation
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" /> Digital Rent Ledger & Receipts ({ledgerInvoices.length})
          {pendingInvoices.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingInvoices.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" /> Booking History ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> My Reviews ({myReviews.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'maintenance'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4 text-brand-600" /> Maintenance & SLA ({tickets.length})
          {tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length}
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
          <Sparkles className="w-4 h-4 text-purple-600" /> AI Recommendations
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'finance'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-blue-600" /> Financial Ledger
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" /> Spending & Insights
        </button>
      </div>

      {/* TAB Finance: Wallet & Payment Ledger */}
      {activeTab === 'finance' && <TenantFinance />}

      {/* TAB AI: Recommendations */}
      {activeTab === 'ai' && <TenantAIInsights />}

      {/* TAB 0: Spending & Insights */}
      {activeTab === 'analytics' && <UserAnalytics />}


      {/* TAB 1: Active Stay */}
      {activeTab === 'stay' && (
        activeStay ? (
          <Card className="p-6 border-emerald-200 bg-emerald-50/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="emerald" size="sm">
                    Active Accommodation
                  </Badge>
                  {activeStay.isVerifiedResident && (
                    <Badge variant="emerald" size="sm">
                      ✓ Verified Resident Status Established
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{activeStay.propertyId?.title || 'Accommodation'}</h3>
                <p className="text-xs text-slate-600">
                  {activeStay.propertyId?.address?.city}, {activeStay.propertyId?.address?.state}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <Button
                  onClick={() => setMoveOutNoticeBooking(activeStay)}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-800 hover:bg-amber-50"
                  icon={LogOut}
                >
                  Serve Move-Out Notice
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <span className="text-slate-500 block">Room Configuration</span>
                <strong className="text-slate-900">{activeStay.roomName}</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <span className="text-slate-500 block">Move-in Date</span>
                <strong className="text-slate-900">
                  {new Date(activeStay.moveInDate).toLocaleDateString()}
                </strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <span className="text-slate-500 block">Protected Deposit</span>
                <strong className="text-emerald-700">₹{activeStay.costs?.securityDeposit?.toLocaleString()}</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <span className="text-slate-500 block">Escrow Status</span>
                {getEscrowBadge(activeStay.escrowStatus)}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center border-dashed border-slate-300">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No Active Stay</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
              You don't have an active PG or Hostel booking yet. Browse verified listings and reserve your seat today.
            </p>
            <Button to="/properties" variant="primary" size="sm">
              Browse Accommodations
            </Button>
          </Card>
        )
      )}

      {/* TAB 2: Digital Rent Ledger & Receipts */}
      {activeTab === 'ledger' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Digital Rent Ledger Statement</h3>
              <p className="text-xs text-slate-500">View monthly rent invoices, sub-meter power unit breakdowns, and download official receipts.</p>
            </div>
          </div>

          {loadingLedger ? (
            <div className="py-12 flex justify-center items-center gap-2 text-slate-500 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> Loading rent ledger...
            </div>
          ) : ledgerInvoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No monthly rent invoices issued yet.</div>
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

                    <h4 className="text-sm font-bold text-slate-900">{inv.propertyId?.title}</h4>
                    <p className="text-xs text-slate-500 flex flex-wrap gap-2">
                      <span>Base Rent: ₹{inv.breakdown?.baseRent?.toLocaleString()}</span>
                      {inv.breakdown?.electricity?.amount > 0 && (
                        <span>• Power: ₹{inv.breakdown.electricity.amount} ({inv.breakdown.electricity.unitsConsumed} kWh)</span>
                      )}
                      <span>• Due Date: {new Date(inv.dueDate).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    <div className="text-right mr-2">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Amount</span>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{inv.totalAmount?.toLocaleString()}
                      </span>
                    </div>

                    {inv.status !== 'PAID' && (
                      <Button
                        onClick={() => handlePayRentInvoice(inv._id)}
                        variant="primary"
                        size="sm"
                        disabled={payingInvoiceId === inv._id}
                        icon={payingInvoiceId === inv._id ? Loader2 : CreditCard}
                      >
                        {payingInvoiceId === inv._id ? 'Processing...' : 'Pay Rent Now'}
                      </Button>
                    )}

                    <Button
                      onClick={() => setSelectedReceiptId(inv._id)}
                      variant="outline"
                      size="sm"
                      icon={FileText}
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      View Receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: Bookings History */}
      {activeTab === 'bookings' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">My Bookings & Escrow Receipts</h3>
              <p className="text-xs text-slate-500">Track reservation status, deposit into escrow, and download receipts.</p>
            </div>
            <Button to="/properties" variant="primary" size="sm">
              Find More Rooms
            </Button>
          </div>

          {loadingBookings ? (
            <div className="py-12 flex justify-center items-center gap-2 text-slate-500 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> Loading your reservations...
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No booking history recorded.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map((bk) => (
                <div key={bk._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {bk.bookingReference}
                      </span>
                      {getStatusBadge(bk.status)}
                      {getEscrowBadge(bk.escrowStatus)}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{bk.propertyId?.title || 'Accommodation'}</h4>
                    <p className="text-xs text-slate-500 flex flex-wrap gap-2">
                      <span>Room: {bk.roomName}</span>
                      <span>• Move-in: {new Date(bk.moveInDate).toLocaleDateString()}</span>
                      <span>• Deposit: ₹{bk.costs?.securityDeposit?.toLocaleString()}</span>
                      <span>• Total Upfront: ₹{bk.costs?.totalUpfrontAmount?.toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    {/* Action 1: Pay Upfront into Escrow if pending */}
                    {bk.escrowStatus === 'PENDING_PAYMENT' && !['CANCELLED', 'REJECTED'].includes(bk.status) && (
                      <Button
                        onClick={() => setPaymentModalBooking(bk)}
                        variant="primary"
                        size="sm"
                        disabled={payingEscrowId === bk._id}
                        icon={CreditCard}
                      >
                        Pay Upfront into Escrow
                      </Button>
                    )}

                    {/* Action 2: View Escrow Receipt */}
                    {bk.escrowStatus !== 'PENDING_PAYMENT' && (
                      <Button
                        onClick={() => setEscrowModalBookingId(bk._id)}
                        variant="outline"
                        size="sm"
                        icon={FileText}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        Escrow Receipt
                      </Button>
                    )}

                    {bk.propertyId && (
                      <Button
                        to={`/properties/${bk.propertyId._id}`}
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                      >
                        Property
                      </Button>
                    )}

                    {['REQUESTED', 'ACCEPTED', 'CONFIRMED'].includes(bk.status) && (
                      <Button
                        onClick={() => setCancelModalBooking(bk)}
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: Tenant Reviews */}
      {activeTab === 'reviews' && (
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">My Verified Reviews</h3>
              <p className="text-xs text-slate-500">Reviews you have published across StayEasy properties</p>
            </div>
            <Badge variant="emerald" size="sm">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Verified Resident Reviews
            </Badge>
          </div>

          {loadingReviews ? (
            <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Loading your reviews...</span>
            </div>
          ) : myReviews.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <Star className="w-10 h-10 text-amber-300 mx-auto mb-2 opacity-60" />
              <p className="font-bold text-slate-700">No Reviews Published Yet</p>
              <p className="mt-1">Once you check into a PG, you can leave verified feedback directly on the property page.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myReviews.map((rev) => (
                <div key={rev._id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-emerald-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <Link
                        to={`/properties/${rev.propertyId?._id}`}
                        className="font-bold text-sm text-slate-900 hover:text-emerald-600 transition-colors"
                      >
                        {rev.propertyId?.title || 'StayEasy Property'}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verified Resident
                        </span>
                        {rev.stayDurationText && (
                          <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-full">
                            📅 {rev.stayDurationText}
                          </span>
                        )}
                        {rev.promiseVsRealityScore && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full border border-slate-200">
                            Reality: {rev.promiseVsRealityScore}/10
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-400 bg-amber-50 px-2.5 py-1 rounded-xl self-start sm:self-auto">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-slate-800">{rev.overallRating}.0</span>
                    </div>
                  </div>

                  <h4 className="font-bold text-xs text-slate-800">{rev.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{rev.comment}</p>

                  {rev.ownerResponse?.responseText && (
                    <div className="p-3 bg-slate-50 border-l-3 border-emerald-600 rounded-r-xl text-xs text-slate-700 space-y-0.5">
                      <span className="font-bold text-emerald-900 block text-[11px]">Landlord Response:</span>
                      <p className="italic">"{rev.ownerResponse.responseText}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>Published: {new Date(rev.createdAt).toLocaleDateString()}</span>
                    <Link
                      to={`/properties/${rev.propertyId?._id}`}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700"
                    >
                      View on Listing →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: Maintenance & Complaints */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Header & Raise Complaint Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-brand-600" />
                Maintenance & Complaint Management
              </h3>
              <p className="text-xs text-slate-500">
                Track real-time SLA deadlines, landlord responses, and repair milestones with zero delays.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={PlusCircle}
              onClick={() => setIsCreateTicketModalOpen(true)}
              disabled={bookings.length === 0}
            >
              Raise New Complaint
            </Button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Total Complaints</span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">{tickets.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Open / In Review</span>
              <span className="text-2xl font-extrabold text-blue-600 font-mono">
                {tickets.filter((t) => t.status === 'OPEN' || t.status === 'REOPENED' || t.status === 'ACKNOWLEDGED').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">In Progress</span>
              <span className="text-2xl font-extrabold text-purple-600 font-mono">
                {tickets.filter((t) => t.status === 'IN_PROGRESS').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Resolved / Closed</span>
              <span className="text-2xl font-extrabold text-emerald-600 font-mono">
                {tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length}
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 pt-2 border-b border-slate-200 pb-3 text-xs font-semibold">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((tabKey) => (
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
                  ? `All Tickets (${tickets.length})`
                  : tabKey === 'OPEN'
                  ? `Open (${tickets.filter((t) => t.status === 'OPEN' || t.status === 'REOPENED' || t.status === 'ACKNOWLEDGED').length})`
                  : tabKey === 'IN_PROGRESS'
                  ? `In Progress (${tickets.filter((t) => t.status === 'IN_PROGRESS').length})`
                  : tabKey === 'RESOLVED'
                  ? `Resolved (${tickets.filter((t) => t.status === 'RESOLVED').length})`
                  : `Closed (${tickets.filter((t) => t.status === 'CLOSED').length})`}
              </button>
            ))}
          </div>

          {/* Ticket Cards Grid */}
          {loadingTickets ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Loading maintenance tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No Complaints Logged</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Everything is smooth! If you face issues with Wi-Fi, plumbing, electricals, or cleaning, raise a ticket with SLA guarantees.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => setIsCreateTicketModalOpen(true)}
                disabled={bookings.length === 0}
              >
                Raise New Complaint
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets
                .filter((t) => {
                  if (ticketFilter === 'OPEN') return t.status === 'OPEN' || t.status === 'REOPENED' || t.status === 'ACKNOWLEDGED';
                  if (ticketFilter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
                  if (ticketFilter === 'RESOLVED') return t.status === 'RESOLVED';
                  if (ticketFilter === 'CLOSED') return t.status === 'CLOSED';
                  return true;
                })
                .map((ticket) => (
                  <MaintenanceTicketCard
                    key={ticket._id}
                    ticket={ticket}
                    isOwner={false}
                    onSelect={(t) => setSelectedTicketForDetail(t)}
                    onReopen={(t) => setSelectedTicketForDetail(t)}
                    onClose={async (t) => {
                      await maintenanceService.closeTicket(t._id);
                      fetchTenantTickets();
                      setSuccessMsg('Ticket verified and closed!');
                    }}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Maintenance Ticket Creation Modal */}
      {isCreateTicketModalOpen && (
        <MaintenanceTicketModal
          isOpen={isCreateTicketModalOpen}
          onClose={() => setIsCreateTicketModalOpen(false)}
          onSuccess={() => {
            fetchTenantTickets();
            setSuccessMsg('Maintenance complaint raised successfully! Landlord notified.');
          }}
          bookings={bookings.filter(
            (b) =>
              b.status === 'CHECKED_IN' ||
              b.status === 'ACTIVE_STAY' ||
              b.status === 'ACCEPTED' ||
              b.status === 'CONFIRMED' ||
              b.status === 'CHECKED_OUT'
          )}
        />
      )}

      {/* Maintenance Ticket Detail Modal */}
      {selectedTicketForDetail && (
        <MaintenanceTicketDetail
          isOpen={!!selectedTicketForDetail}
          ticket={selectedTicketForDetail}
          onClose={() => setSelectedTicketForDetail(null)}
          onUpdate={(updated) => {
            setSelectedTicketForDetail(updated);
            fetchTenantTickets();
            setSuccessMsg('Maintenance ticket updated successfully!');
          }}
          isOwner={false}
        />
      )}


      {/* Escrow Receipt Modal */}
      {escrowModalBookingId && (
        <EscrowReceiptModal
          bookingId={escrowModalBookingId}
          onClose={() => setEscrowModalBookingId(null)}
        />
      )}

      {/* Rent Receipt Modal */}
      {selectedReceiptId && (
        <RentReceiptModal
          invoiceId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}

      {/* Move Out Notice Modal */}
      {moveOutNoticeBooking && (
        <MoveOutNoticeModal
          booking={moveOutNoticeBooking}
          onClose={() => setMoveOutNoticeBooking(null)}
          onSuccess={(msg) => {
            setSuccessMsg(msg);
            fetchTenantBookings();
          }}
        />
      )}

      {/* Cancellation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>Cancel Reservation</span>
              </div>
              <button
                onClick={() => setCancelModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel booking <strong className="font-mono text-slate-900">{cancelModalBooking.bookingReference}</strong>? The reserved bed will be restored back to live property inventory.
            </p>

            <form onSubmit={handleCancelBooking} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Cancellation</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Change in college schedule, found alternative flat..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <Button onClick={() => setCancelModalBooking(null)} variant="outline" size="sm">
                  Keep Booking
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Payment Method Selection & Escrow Modal */}
      {paymentModalBooking && (
        <BookingPaymentModal
          existingBooking={paymentModalBooking}
          property={paymentModalBooking.propertyId}
          onClose={() => setPaymentModalBooking(null)}
          onBookingSuccess={async () => {
            setPaymentModalBooking(null);
            await fetchTenantBookings();
          }}
        />
      )}
    </div>
  );
};

export default UserDashboard;
