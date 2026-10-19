import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  Zap,
  Utensils,
  Filter,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  RefreshCw,
  Loader2,
  X,
  Calculator,
  UserCheck,
  Wind,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { propertyService } from '../../services/propertyService';
import { TransparentCostCalculator } from '../../components/ui/TransparentCostCalculator';

export const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Dynamic Filter Options Metadata State
  const [filterMeta, setFilterMeta] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Cost Calculator Modal Preview State
  const [selectedCalcProperty, setSelectedCalcProperty] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedTargetOccupants, setSelectedTargetOccupants] = useState('ALL');
  const [selectedRoomType, setSelectedRoomType] = useState('ALL');
  const [hasACOnly, setHasACOnly] = useState(false);
  const [foodAvailableOnly, setFoodAvailableOnly] = useState(false);
  const [electricityTypeFilter, setElectricityTypeFilter] = useState('ALL');
  const [maxRent, setMaxRent] = useState('');
  const [maxTotalCost, setMaxTotalCost] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState('trust');

  // Load dynamic filter metadata on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await propertyService.getFilterMeta();
        if (res.success && res.data) {
          setFilterMeta(res.data);
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMeta();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCity !== 'ALL') params.city = selectedCity;
      if (selectedType !== 'ALL') params.propertyType = selectedType;
      if (selectedGender !== 'ALL') params.genderPreference = selectedGender;
      if (selectedTargetOccupants !== 'ALL') params.targetOccupants = selectedTargetOccupants;
      if (selectedRoomType !== 'ALL') params.roomType = selectedRoomType;
      if (hasACOnly) params.hasAC = 'true';
      if (foodAvailableOnly) params.foodAvailable = 'true';
      if (electricityTypeFilter !== 'ALL') params.electricityType = electricityTypeFilter;
      if (maxRent) params.maxRent = maxRent;
      if (maxTotalCost) params.maxTotalCost = maxTotalCost;
      if (selectedAmenities.length > 0) params.amenities = selectedAmenities.join(',');
      if (sortBy) params.sort = sortBy;

      const res = await propertyService.getProperties(params);
      if (res.success && res.data) {
        setProperties(res.data.properties || []);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [
    selectedCity,
    selectedType,
    selectedGender,
    selectedTargetOccupants,
    selectedRoomType,
    hasACOnly,
    foodAvailableOnly,
    electricityTypeFilter,
    maxRent,
    maxTotalCost,
    selectedAmenities,
    sortBy,
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleToggleAmenity = (amenityName) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityName) ? prev.filter((a) => a !== amenityName) : [...prev, amenityName]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('ALL');
    setSelectedType('ALL');
    setSelectedGender('ALL');
    setSelectedTargetOccupants('ALL');
    setSelectedRoomType('ALL');
    setHasACOnly(false);
    setFoodAvailableOnly(false);
    setElectricityTypeFilter('ALL');
    setMaxRent('');
    setMaxTotalCost('');
    setSelectedAmenities([]);
    setSortBy('trust');
  };

  const CITIES = filterMeta?.cities?.length
    ? ['ALL', ...filterMeta.cities]
    : ['ALL', 'Bengaluru', 'Delhi', 'Hyderabad', 'Pune', 'Mumbai'];

  const PROPERTY_TYPES = [
    { label: 'All Types', value: 'ALL' },
    { label: 'PG / Co-Living', value: 'PG' },
    { label: 'Hostel', value: 'HOSTEL' },
    { label: 'Flat / Apartment', value: 'FLAT' },
    { label: 'Private Room', value: 'ROOM' },
  ];

  const activeFiltersCount =
    (selectedCity !== 'ALL' ? 1 : 0) +
    (selectedType !== 'ALL' ? 1 : 0) +
    (selectedGender !== 'ALL' ? 1 : 0) +
    (selectedTargetOccupants !== 'ALL' ? 1 : 0) +
    (selectedRoomType !== 'ALL' ? 1 : 0) +
    (hasACOnly ? 1 : 0) +
    (foodAvailableOnly ? 1 : 0) +
    (electricityTypeFilter !== 'ALL' ? 1 : 0) +
    (maxRent ? 1 : 0) +
    (maxTotalCost ? 1 : 0) +
    selectedAmenities.length;

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <Container>
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="brand" size="sm" className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Search & Living Cost Engine
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Verified Property Atlas</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Discover Verified PGs, Hostels & Flats
          </h1>
          <p className="text-slate-600 text-sm max-w-3xl">
            Filter by true total monthly outlay, sub-metered power rates, AC amenities, and food meal plans before you book. Zero hidden fees.
          </p>
        </div>

        {/* Live Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by PG name, landmark, college (e.g. Christ University, Madhapur, HSR Layout)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="primary" size="md" icon={Search}>
            Search
          </Button>
        </form>

        {/* Multi-Facet Filter Controls Box */}
        <div className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 space-y-4">
          {/* Row 1: City Pills & Sort Selector */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600" /> City:
              </span>
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedCity === city
                      ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {city === 'ALL' ? 'All Cities' : city}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 focus:ring-2 focus:ring-brand-500"
              >
                <option value="trust">StayEasy Trust Score (Highest)</option>
                <option value="cost_asc">Total Living Cost: Low to High</option>
                <option value="cost_desc">Total Living Cost: High to Low</option>
                <option value="rent_asc">Rent: Low to High</option>
                <option value="rent_desc">Rent: High to Low</option>
                <option value="newest">Newly Listed</option>
              </select>
            </div>
          </div>

          {/* Row 2: Property Type & Gender Filters */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Type:
              </span>
              {PROPERTY_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  onClick={() => setSelectedType(pt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedType === pt.value
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>

            {/* Gender Filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">Gender:</span>
              {['ALL', 'MALE', 'FEMALE', 'UNISEX'].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedGender === g
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g === 'ALL' ? 'All' : g === 'MALE' ? '👨 Male' : g === 'FEMALE' ? '👩 Female' : '👥 Unisex'}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Transparent Living Cost Filters & Advanced Drawer Toggle */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Sharing:</span>
                <select
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700"
                >
                  <option value="ALL">Any Sharing</option>
                  <option value="SINGLE">Single (1-Seater)</option>
                  <option value="DOUBLE">2-Seater</option>
                  <option value="TRIPLE">3-Seater</option>
                  <option value="FOUR_SEATER">4-Seater</option>
                </select>
              </div>

              {/* Quick Feature Toggles */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={hasACOnly}
                  onChange={(e) => setHasACOnly(e.target.checked)}
                  className="w-3.5 h-3.5 text-brand-600 rounded"
                />
                <span className="flex items-center gap-1 text-slate-800">
                  <Wind className="w-3.5 h-3.5 text-blue-500" /> AC Rooms Only
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={foodAvailableOnly}
                  onChange={(e) => setFoodAvailableOnly(e.target.checked)}
                  className="w-3.5 h-3.5 text-brand-600 rounded"
                />
                <span className="flex items-center gap-1 text-slate-800">
                  <Utensils className="w-3.5 h-3.5 text-emerald-500" /> Food Included
                </span>
              </label>

              {/* Advanced Filter Drawer Toggle Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  showAdvancedFilters || activeFiltersCount > 0
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" />
                <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-medium">
                Found <strong>{totalCount}</strong> verified options
              </span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>
          </div>

          {/* Advanced Multi-Facet Filter Drawer */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t border-slate-200 space-y-4 bg-slate-50/70 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Max Advertised Rent */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Base Rent (₹/mo)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>

                {/* Max Total Monthly Living Cost */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Total Outlay (₹/mo)</label>
                  <input
                    type="number"
                    placeholder="e.g. 18000 (Incl. power/food)"
                    value={maxTotalCost}
                    onChange={(e) => setMaxTotalCost(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>

                {/* Target Occupants */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Resident Profile</label>
                  <select
                    value={selectedTargetOccupants}
                    onChange={(e) => setSelectedTargetOccupants(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
                  >
                    <option value="ALL">Any Profile</option>
                    <option value="STUDENTS">🎓 Students Only</option>
                    <option value="WORKING_PROFESSIONALS">💻 Working Professionals</option>
                  </select>
                </div>

                {/* Power Billing Type */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Electricity Metering</label>
                  <select
                    value={electricityTypeFilter}
                    onChange={(e) => setElectricityTypeFilter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
                  >
                    <option value="ALL">All Meter Types</option>
                    <option value="PER_UNIT">⚡ Sub-metered (Per Unit)</option>
                    <option value="FIXED">Fixed Monthly Rate</option>
                    <option value="INCLUDED">Included in Rent</option>
                  </select>
                </div>
              </div>

              {/* Amenity Checkboxes Grid */}
              {filterMeta?.amenities?.length > 0 && (
                <div className="pt-3 border-t border-slate-200/80 space-y-2">
                  <span className="font-bold text-slate-700 text-xs block">Filter by Amenities & Facilities:</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {filterMeta.amenities.map((item) => {
                      const isChecked = selectedAmenities.includes(item.name);
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleToggleAmenity(item.name)}
                          className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
                            isChecked
                              ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isChecked ? '✓ ' : '+ '}
                          {item.name} ({item.count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Querying verified listings & total cost estimates...</p>
          </div>
        ) : properties.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Accommodations Found</h3>
            <p className="text-xs text-slate-600">
              We couldn't find any properties matching your current filter criteria. Try adjusting your city, sharing options, or price range.
            </p>
            <Button onClick={handleResetFilters} variant="primary" size="sm">
              Clear All Filters
            </Button>
          </div>
        ) : (
          /* Live Listings Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => {
              const minRent = property.rentRange?.min || 0;
              const estTotalMonthly = property.totalEstimatedMonthlyCost || minRent;

              return (
                <Card key={property._id} className="overflow-hidden flex flex-col justify-between hover:shadow-card transition-shadow">
                  <div>
                    {/* Cover Photo */}
                    <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                      <img
                        src={property.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="bg-slate-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur">
                          {property.propertyType}
                        </span>
                        <span className="bg-white/90 text-slate-900 text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur">
                          {property.genderPreference === 'FEMALE'
                            ? '👩 Female'
                            : property.genderPreference === 'MALE'
                            ? '👨 Male'
                            : '👥 Unisex'}
                        </span>
                      </div>

                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900">
                          Trust {property.trustScore || 90}/100
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {property.address?.city}, {property.address?.state}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1">{property.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {property.address?.landmark ? `Near ${property.address.landmark}` : property.tagline}
                        </p>
                      </div>

                      {/* Room Sharing Configurations Matrix */}
                      <div className="flex flex-wrap gap-1.5">
                        {property.roomConfigurations?.map((rc, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            {rc.hasAC && '❄️'} {rc.type?.replace('_', ' ')} • ₹{rc.rent?.toLocaleString()}
                          </span>
                        ))}
                      </div>

                      {/* Transparent Living Cost Breakdown Box */}
                      <div className="bg-brand-50/60 rounded-2xl p-3.5 border border-brand-100 space-y-2 text-xs">
                        <div className="font-semibold text-brand-900 flex items-center justify-between">
                          <span className="flex items-center gap-1 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> True Monthly Outlay:
                          </span>
                          <span className="text-brand-700 font-black text-sm">
                            ~ ₹{estTotalMonthly.toLocaleString()} / mo
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-slate-700">
                          <div>
                            • Power: <strong>{property.expenses?.electricity?.description || 'Sub-metered'}</strong>
                          </div>
                          <div>
                            • Food: <strong>{property.expenses?.food?.available ? 'Available (3 Meals)' : 'Self/Tiffin'}</strong>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-brand-200/60 flex items-center justify-between">
                          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Deposit: {property.depositRefundPolicy}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedCalcProperty(property)}
                            className="text-[11px] font-bold text-brand-700 hover:text-brand-900 underline flex items-center gap-0.5"
                          >
                            <Calculator className="w-3.5 h-3.5 inline" /> Calculator
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price & View Details Action */}
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Starting Rent</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        ₹{minRent.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 font-normal"> /mo</span>
                    </div>

                    <Button
                      to={`/properties/${property._id}`}
                      variant="primary"
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      View Breakdown
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>

      {/* Quick Calculator Modal Preview */}
      {selectedCalcProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full my-8 animate-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setSelectedCalcProperty(null)}
              className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full font-bold"
            >
              ✕
            </button>
            <TransparentCostCalculator property={selectedCalcProperty} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPage;
