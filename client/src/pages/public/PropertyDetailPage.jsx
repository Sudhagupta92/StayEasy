import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  MapPin,
  ShieldCheck,
  Zap,
  Utensils,
  Droplets,
  Wrench,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Share2,
  Heart,
  ChevronRight,
  Bed,
  Users,
  Clock,
  Sparkles,
  Info,
  Phone,
  Mail,
  User,
  ShieldAlert,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { propertyService } from '../../services/propertyService';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import { TransparentCostCalculator } from '../../components/ui/TransparentCostCalculator';
import ReviewList from '../../components/reviews/ReviewList';
import { BookingPaymentModal } from '../../components/booking/BookingPaymentModal';


export const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, role } = useAuth();

  const [property, setProperty] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedRoomConfig, setSelectedRoomConfig] = useState(null);

  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await propertyService.getPropertyById(id);
        if (isMounted && res.success && res.data?.property) {
          const prop = res.data.property;
          setProperty(prop);
          setOwnerProfile(res.data.ownerProfile);
          const configs = prop.roomConfigurations?.length > 0
            ? prop.roomConfigurations
            : (prop.rooms || []).map((r, idx) => ({
                _id: r._id || `room_${idx}`,
                name: `${r.sharingType || r.roomType || 'Standard'} Room (${r.roomNumber})`,
                type: r.roomType || r.sharingType || 'SINGLE',
                rent: r.rent,
                deposit: r.deposit || 0,
                totalBeds: r.beds?.length || 1,
                availableBeds: r.beds ? r.beds.filter((b) => b.status === 'AVAILABLE').length : 1,
              }));
          const firstWithBeds = configs.find((rc) => (Number(rc.availableBeds) || 0) > 0);
          setSelectedRoomConfig(firstWithBeds || configs[0] || null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load property details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleOpenBooking = (roomConfig = null) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    console.log('[PropertyDetailPage Debug] handleOpenBooking called with:', {
      passedRoomConfig: roomConfig,
      currentSelected: selectedRoomConfig,
      propertyConfigurationsCount: property?.roomConfigurations?.length,
    });

    if (roomConfig && (roomConfig._id || roomConfig.id)) {
      setSelectedRoomConfig(roomConfig);
    } else if (!selectedRoomConfig || (Number(selectedRoomConfig.availableBeds) || 0) <= 0) {
      const configs = property?.roomConfigurations?.length > 0 ? property.roomConfigurations : [];
      const firstWithBeds = configs.find((rc) => (Number(rc.availableBeds) || 0) > 0);
      if (firstWithBeds) {
        setSelectedRoomConfig(firstWithBeds);
      } else if (configs.length > 0) {
        setSelectedRoomConfig(configs[0]);
      }
    }
    setIsBookModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
        <span className="text-sm font-medium text-slate-600">Loading verified property details...</span>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 py-12">
        <Container>
          <div className="max-w-md mx-auto text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Property Not Found</h2>
            <p className="text-sm text-slate-600">{error || 'The requested accommodation listing does not exist.'}</p>
            <Button to="/properties" variant="primary" size="md" icon={ArrowLeft}>
              Back to All Properties
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const baseMinRent = Number(selectedRoomConfig?.rent ?? property.rentRange?.min ?? property.roomConfigurations?.[0]?.rent ?? 0);
  const depositAmount = Number(selectedRoomConfig?.deposit ?? property.roomConfigurations?.[0]?.deposit ?? 0);

  // Compute total monthly true living cost
  let extraMonthly = 0;
  if (property.expenses?.water?.type === 'EXTRA') extraMonthly += Number(property.expenses.water.amount || 0);
  if (property.expenses?.maintenance?.type === 'EXTRA') extraMonthly += Number(property.expenses.maintenance.amount || 0);
  if (property.expenses?.food?.available && !property.expenses.food?.includedInRent) {
    extraMonthly += Number(property.expenses.food.extraCost || 0);
  }
  if (property.expenses?.electricity?.type === 'PER_UNIT') {
    extraMonthly += Number(property.expenses.electricity.rate || 8) * 60; // 60 units estimate
  } else if (property.expenses?.electricity?.type === 'FIXED') {
    extraMonthly += Number(property.expenses.electricity.rate || 0);
  }

  const totalMonthlyCost = baseMinRent + extraMonthly;
  const totalUpfront = baseMinRent + depositAmount;

  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <Container>
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/properties"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Search Listings
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {property.address?.city} <ChevronRight className="w-3 h-3 inline" /> {property.propertyType}
            </span>
          </div>
        </div>

        {/* Title & Trust Header */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand" size="md">
                  {property.propertyType}
                </Badge>
                <Badge
                  variant={
                    property.genderPreference === 'FEMALE'
                      ? 'rose'
                      : property.genderPreference === 'MALE'
                      ? 'blue'
                      : 'purple'
                  }
                  size="md"
                >
                  {property.genderPreference === 'FEMALE'
                    ? '👩 Female Only'
                    : property.genderPreference === 'MALE'
                    ? '👨 Male Only'
                    : '👥 Unisex Co-living'}
                </Badge>
                <Badge variant="emerald" size="md" className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Physically Audited
                </Badge>
                {property.verificationStatus === 'VERIFIED' && (
                  <Badge variant="emerald" size="md">
                    ✓ Verified Listing
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                {property.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-medium text-slate-800">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  {property.address?.street ? `${property.address.street}, ` : ''}
                  {property.address?.city}, {property.address?.state} - {property.address?.pincode}
                </span>
                {property.address?.landmark && (
                  <span className="text-slate-500">• Landmark: {property.address.landmark}</span>
                )}
              </div>
            </div>

            {/* StayEasy Trust Score Box */}
            <div className="flex items-center gap-4 bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 self-start lg:self-auto">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-400/30 flex items-center justify-center text-xl font-black">
                {property.trustScore || 90}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> StayEasy Trust Score
                </div>
                <p className="text-[11px] text-slate-400">Zero Brokerage & Verified Metering</p>
              </div>
            </div>
          </div>

          {/* Photo Gallery with Category Filters */}
          <div className="mt-6 space-y-3">
            {/* Category Filter Pills (if categorized photos exist) */}
            {property.photos && property.photos.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 mr-1">Photo Categories:</span>
                {['ALL', 'COVER', 'ROOM', 'COMMON_AREA', 'KITCHEN', 'BATHROOM', 'GALLERY'].map((cat) => {
                  const count = cat === 'ALL'
                    ? property.photos.length
                    : property.photos.filter((p) => p.category === cat).length;
                  if (cat !== 'ALL' && count === 0) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        const targetIdx = cat === 'ALL'
                          ? 0
                          : (property.photos || []).findIndex((p) => p.category === cat);
                        if (targetIdx !== -1) setActiveImageIdx(targetIdx);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors"
                    >
                      {cat.replace('_', ' ')} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3 aspect-[16/9] sm:aspect-[16/8] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                <img
                  src={
                    (property.photos && property.photos[activeImageIdx]?.url) ||
                    property.images?.[activeImageIdx] ||
                    property.coverImage ||
                    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5'
                  }
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                {property.photos && property.photos[activeImageIdx]?.category && (
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-700">
                    Category: {property.photos[activeImageIdx].category.replace('_', ' ')}
                    {property.photos[activeImageIdx].caption ? ` • ${property.photos[activeImageIdx].caption}` : ''}
                  </div>
                )}
              </div>

              <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto max-h-[360px]">
                {(property.photos && property.photos.length > 0
                  ? property.photos.map((p) => p.url)
                  : property.images || []
                ).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative flex-shrink-0 w-24 lg:w-full h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIdx === idx ? 'border-brand-600 scale-[0.98]' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content & Sticky Booking Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Details & Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3">About this Accommodation</h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{property.description}</p>
            </Card>

            {/* Room Configurations Matrix (1/2/3/4-seater options) */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Room Sharing & Bed Inventory</h2>
                  <p className="text-xs text-slate-500">Select a sharing option to calculate rent & deposits</p>
                </div>
                <Badge variant="brand" size="sm">
                  {property.roomConfigurations?.length} Configurations
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {property.roomConfigurations?.map((rc) => {
                  const isSelected =
                    selectedRoomConfig &&
                    ((selectedRoomConfig._id && rc._id && String(selectedRoomConfig._id) === String(rc._id)) ||
                      (selectedRoomConfig.id && rc.id && String(selectedRoomConfig.id) === String(rc.id)) ||
                      selectedRoomConfig.name === rc.name);
                  const avail =
                    rc.availableBeds !== undefined && rc.availableBeds !== null
                      ? Number(rc.availableBeds)
                      : Number(rc.totalBeds) || 0;
                  return (
                    <button
                      key={rc._id || rc.id || rc.name}
                      onClick={() => setSelectedRoomConfig(rc)}
                      className={`p-4 rounded-2xl text-left border-2 transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          {rc.type.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            avail > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {avail > 0 ? `${avail} beds left` : 'Occupied'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mb-1">{rc.name}</h3>

                      <div className="flex items-baseline gap-1 text-slate-900 mb-2">
                        <span className="text-xl font-black text-brand-600">₹{Number(rc.rent || 0).toLocaleString()}</span>
                        <span className="text-xs text-slate-500">/ month / bed</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                        <div className="flex flex-wrap gap-1.5">
                          {rc.hasAC && <span className="bg-slate-100 px-2 py-0.5 rounded-md">❄️ AC</span>}
                          {rc.attachedWashroom && <span className="bg-slate-100 px-2 py-0.5 rounded-md">🚿 Attached Bath</span>}
                          {rc.hasBalcony && <span className="bg-slate-100 px-2 py-0.5 rounded-md">🌿 Balcony</span>}
                        </div>
                        {avail > 0 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBooking(rc);
                            }}
                            className="font-bold text-brand-600 hover:text-brand-700 underline text-xs cursor-pointer ml-auto"
                          >
                            Book Bed →
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Interactive Phase 4 Transparent Living Cost Engine */}
            <TransparentCostCalculator
              property={property}
              selectedRoomConfig={selectedRoomConfig}
              onSelectRoom={(rc) => setSelectedRoomConfig(rc)}
            />

            {/* Amenities Grid */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Amenities & Facilities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities?.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* House Rules */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">House Rules & Timings</h2>
              <ul className="space-y-2 text-xs text-slate-700">
                {property.houseRules?.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 flex-shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Verified Resident Reviews Component */}
            <ReviewList propertyId={property._id} propertyTitle={property.title} />

          </div>

          {/* Right Col: Sticky Booking Action Card */}
          <div className="space-y-6">
            <Card className="p-6 sticky top-28 shadow-card border-slate-200 space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Monthly Rent ({selectedRoomConfig?.type?.replace('_', ' ') || 'Room'})
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900">₹{Number(baseMinRent || 0).toLocaleString()}</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold block">
                  ✓ Est. Total with Power & Food: ~ ₹{Number(totalMonthlyCost || 0).toLocaleString()}/mo
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Security Deposit</span>
                  <span className="font-bold text-slate-900">₹{Number(depositAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Available Beds</span>
                  <span className="font-bold text-emerald-700">
                    {selectedRoomConfig ? `${selectedRoomConfig.availableBeds} beds` : `${property.totalAvailableBeds || 'Multiple'} beds`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Brokerage</span>
                  <span className="font-bold text-emerald-700">₹0 (Direct Landlord)</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <Button
                  onClick={() => handleOpenBooking()}
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-lg shadow-brand-500/20"
                >
                  Reserve Bed / Schedule Move-In
                </Button>
                <p className="text-[11px] text-slate-500 text-center">
                  100% Escrow deposit protection & verified check-in
                </p>
              </div>

              {/* Host Profile Info */}
              <div className="pt-5 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold uppercase text-slate-500 block">Verified Property Host</span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                    {property.ownerId?.name ? property.ownerId.name.charAt(0).toUpperCase() : 'H'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{property.ownerId?.name || 'Verified Host'}</h4>
                    <p className="text-[11px] text-slate-500">{ownerProfile?.businessName || 'StayEasy Partner Landlord'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>

      {/* Interactive Reserve Bed & Escrow Payment Modal */}
      {isBookModalOpen && (
        <BookingPaymentModal
          property={property}
          initialRoomConfig={selectedRoomConfig}
          onClose={() => setIsBookModalOpen(false)}
          onBookingSuccess={async () => {
            try {
              const res = await propertyService.getPropertyById(id);
              if (res.success && res.data?.property) {
                setProperty(res.data.property);
              }
            } catch (err) {
              console.error('Failed to refresh property details:', err);
            }
          }}
        />
      )}
    </div>
  );
};

export default PropertyDetailPage;
