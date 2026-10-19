import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  Zap,
  Utensils,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { propertyService } from '../../services/propertyService';

const AVAILABLE_AMENITIES = [
  'High-Speed WiFi',
  'Daily Housekeeping',
  'CCTV 24/7',
  'Power Backup',
  'Attached Washroom',
  'Washing Machine',
  'Air Conditioner',
  'Refrigerator',
  'Gym & Fitness Area',
  'RO Drinking Water',
  'Elevator / Lift',
  'Covered Parking',
  'Warden Security',
  'Biometric Access',
];

export const EditPropertyModal = ({ isOpen, property, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    description: '',
    propertyType: 'PG',
    genderPreference: 'UNISEX',
    targetOccupants: 'ANY',
    contactPhone: '',
    contactEmail: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
    },
    amenities: [],
    houseRules: [],
    noticePeriodDays: 30,
    depositRefundPolicy: '',
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
  });

  const [rulesText, setRulesText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        tagline: property.tagline || '',
        description: property.description || '',
        propertyType: property.propertyType || 'PG',
        genderPreference: property.genderPreference || 'UNISEX',
        targetOccupants: property.targetOccupants || 'ANY',
        contactPhone: property.contactPhone || '',
        contactEmail: property.contactEmail || '',
        address: {
          street: property.address?.street || '',
          city: property.address?.city || '',
          state: property.address?.state || '',
          pincode: property.address?.pincode || '',
          landmark: property.address?.landmark || '',
        },
        amenities: property.amenities || [],
        houseRules: property.houseRules || [],
        noticePeriodDays: property.noticePeriodDays || 30,
        depositRefundPolicy: property.depositRefundPolicy || '',
        expenses: {
          electricity: {
            type: property.expenses?.electricity?.type || 'PER_UNIT',
            rate: property.expenses?.electricity?.rate || 8,
            description: property.expenses?.electricity?.description || 'Sub-metered billing',
          },
          water: {
            type: property.expenses?.water?.type || 'INCLUDED',
            amount: property.expenses?.water?.amount || 0,
          },
          maintenance: {
            type: property.expenses?.maintenance?.type || 'INCLUDED',
            amount: property.expenses?.maintenance?.amount || 0,
          },
          food: {
            available: property.expenses?.food?.available ?? true,
            includedInRent: property.expenses?.food?.includedInRent ?? true,
            extraCost: property.expenses?.food?.extraCost || 0,
            foodType: property.expenses?.food?.foodType || 'BOTH',
            mealSchedule: property.expenses?.food?.mealSchedule || ['Breakfast', 'Dinner'],
          },
        },
      });

      setRulesText(property.houseRules ? property.houseRules.join('\n') : '');
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const toggleAmenity = (amenity) => {
    if (formData.amenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: formData.amenities.filter((a) => a !== amenity),
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenity],
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const parsedRules = rulesText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        houseRules: parsedRules,
      };

      const res = await propertyService.updateProperty(property._id, payload);
      if (res.success) {
        if (onSuccess) onSuccess('Property details updated successfully!');
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase text-brand-600">Property Management</span>
            <h3 className="text-xl font-extrabold text-slate-900">Edit Property Details</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Basic Information
            </h4>

            <div>
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                Property Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                Tagline / Highlight
              </label>
              <input
                type="text"
                placeholder="e.g. Luxury PG near Tech Parks with 3 Meals & Gym"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Property Type
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="PG">PG (Paying Guest)</option>
                  <option value="HOSTEL">Hostel</option>
                  <option value="CO_LIVING">Co-Living Space</option>
                  <option value="FLAT">Flat / Apartment</option>
                  <option value="ROOM">Private Room</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Gender Preference
                </label>
                <select
                  value={formData.genderPreference}
                  onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="UNISEX">Unisex / Co-Ed</option>
                  <option value="MALE">Gents Only</option>
                  <option value="FEMALE">Ladies Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Target Occupants
                </label>
                <select
                  value={formData.targetOccupants}
                  onChange={(e) => setFormData({ ...formData, targetOccupants: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="ANY">Any (Students & Professionals)</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="WORKING_PROFESSIONALS">Working Professionals Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                Description
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Contact & Address
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Manager Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Manager Contact Email
                </label>
                <input
                  type="email"
                  placeholder="contact@property.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  placeholder="Near Tech Park Gate 2"
                  value={formData.address.landmark}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, landmark: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  State
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, pincode: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Amenities Selection */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Amenities & Facilities
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_AMENITIES.map((amenity) => {
                const isChecked = formData.amenities.includes(amenity);
                return (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left flex items-center gap-2 transition-all ${
                      isChecked
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                        isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isChecked && '✓'}
                    </div>
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Rules & Policies */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              4. Rules & Policies
            </h4>

            <div>
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                House Rules (Enter one rule per line)
              </label>
              <textarea
                rows={3}
                placeholder="Gate closes at 10:30 PM&#10;Quiet hours after 11:00 PM&#10;No smoking inside rooms"
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Notice Period (Days)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.noticePeriodDays}
                  onChange={(e) =>
                    setFormData({ ...formData, noticePeriodDays: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Deposit Refund Policy
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full refund within 7 days of checkout inspection"
                  value={formData.depositRefundPolicy}
                  onChange={(e) =>
                    setFormData({ ...formData, depositRefundPolicy: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
            <Button onClick={onClose} variant="outline" size="md">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              icon={loading ? Loader2 : CheckCircle2}
            >
              {loading ? 'Saving Changes...' : 'Save Property Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;
