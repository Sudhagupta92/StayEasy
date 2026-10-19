import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Utensils,
  Droplets,
  Wrench,
  Info,
  Calculator,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const TransparentCostCalculator = ({ property, selectedRoomConfig, onSelectRoom }) => {
  if (!property) return null;

  const roomConfigs = property.roomConfigurations || [];
  const activeRoom = selectedRoomConfig || roomConfigs[0] || {};

  // Calculator Inputs State
  const electricityType = property.expenses?.electricity?.type || 'PER_UNIT';
  const elecRate = property.expenses?.electricity?.rate || 8;
  const [powerUnits, setPowerUnits] = useState(60); // Average 60 kWh/mo

  const foodAvailable = property.expenses?.food?.available ?? false;
  const foodIncludedInRent = property.expenses?.food?.includedInRent ?? true;
  const foodExtraCost = property.expenses?.food?.extraCost || 0;
  const [includeFoodPlan, setIncludeFoodPlan] = useState(!foodIncludedInRent && foodAvailable);

  const waterExtra = property.expenses?.water?.type === 'EXTRA' ? property.expenses.water.amount || 0 : 0;
  const maintenanceExtra =
    property.expenses?.maintenance?.type === 'EXTRA' ? property.expenses.maintenance.amount || 0 : 0;

  // Calculation Math
  const baseRent = activeRoom.rent || property.rentRange?.min || 0;
  const deposit = activeRoom.deposit || 0;

  let calculatedElectricity = 0;
  if (electricityType === 'PER_UNIT') {
    calculatedElectricity = Math.round(powerUnits * elecRate);
  } else if (electricityType === 'FIXED') {
    calculatedElectricity = elecRate;
  }

  let calculatedFood = 0;
  if (foodAvailable) {
    if (foodIncludedInRent) {
      calculatedFood = 0;
    } else if (includeFoodPlan) {
      calculatedFood = foodExtraCost;
    }
  }

  const totalMonthlyOutlay = baseRent + calculatedElectricity + calculatedFood + waterExtra + maintenanceExtra;
  const totalUpfrontMoveIn = baseRent + deposit;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Transparent Cost Estimator Engine
            </h3>
            <p className="text-xs text-slate-400">
              Simulate actual monthly expenses before signing lease agreements
            </p>
          </div>
        </div>

        <Badge variant="emerald" size="sm" className="self-start sm:self-auto flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> 100% Zero Hidden Spikes
        </Badge>
      </div>

      {/* Room Sharing Option Selector */}
      {roomConfigs.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            1. Select Room Sharing Configuration:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {roomConfigs.map((rc) => {
              const isSelected = activeRoom._id === rc._id || activeRoom.name === rc.name;
              return (
                <button
                  key={rc._id || rc.name}
                  type="button"
                  onClick={() => onSelectRoom && onSelectRoom(rc)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-brand-600/30 border-brand-500 text-white shadow-sm ring-2 ring-brand-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    {rc.type?.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-white block line-clamp-1">{rc.name}</span>
                  <span className="text-sm font-extrabold text-emerald-400 block mt-1">
                    ₹{rc.rent?.toLocaleString()}/mo
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Power Usage Slider */}
      {electricityType === 'PER_UNIT' && (
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>2. Electricity Consumption (Sub-meter Rate: ₹{elecRate}/kWh)</span>
            </div>
            <span className="text-xs font-bold text-amber-400 font-mono">
              {powerUnits} kWh/mo (~ ₹{calculatedElectricity})
            </span>
          </div>

          <input
            type="range"
            min="20"
            max="250"
            step="5"
            value={powerUnits}
            onChange={(e) => setPowerUnits(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>20 kWh (Low Fan/Light)</span>
            <span>60 kWh (Avg AC 3h/day)</span>
            <span>150+ kWh (Heavy AC 8h/day)</span>
          </div>
        </div>
      )}

      {/* Food Plan Choice if Optional */}
      {foodAvailable && !foodIncludedInRent && (
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Utensils className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-semibold block">Optional Food Meal Plan</span>
              <span className="text-slate-400 text-[11px]">3 Nutritious Daily Meals (Breakfast, Lunch, Dinner)</span>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-400">
            <input
              type="checkbox"
              checked={includeFoodPlan}
              onChange={(e) => setIncludeFoodPlan(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
            />
            <span>+ ₹{foodExtraCost.toLocaleString()}/mo</span>
          </label>
        </div>
      )}

      {/* Cost Breakdown Grid */}
      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 divide-y divide-slate-800/80 text-xs space-y-2.5">
        <div className="flex items-center justify-between text-slate-300 pt-1">
          <span>Base Room Rent ({activeRoom.name || 'Selected Room'})</span>
          <span className="font-bold text-white">₹{baseRent.toLocaleString()} / mo</span>
        </div>

        <div className="flex items-center justify-between text-slate-300 pt-2.5">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Electricity Charges:
          </span>
          <span className="font-bold text-white">
            {electricityType === 'INCLUDED'
              ? 'Included in Rent'
              : electricityType === 'FIXED'
              ? `₹${elecRate} / mo Fixed`
              : `₹${calculatedElectricity.toLocaleString()} / mo (${powerUnits} kWh @ ₹${elecRate})`}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300 pt-2.5">
          <span className="flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Food & Meals:
          </span>
          <span className="font-bold text-white">
            {!foodAvailable
              ? 'Self Cooking / Tiffin'
              : foodIncludedInRent
              ? 'Included in Rent (3 Meals)'
              : includeFoodPlan
              ? `+ ₹${foodExtraCost.toLocaleString()} / mo`
              : 'Opted Out'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300 pt-2.5">
          <span className="flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-blue-400" /> Water & RO Purifier:
          </span>
          <span className="font-bold text-white">
            {waterExtra > 0 ? `+ ₹${waterExtra} / mo` : 'Included'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300 pt-2.5">
          <span className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-slate-400" /> Building Maintenance & WiFi:
          </span>
          <span className="font-bold text-white">
            {maintenanceExtra > 0 ? `+ ₹${maintenanceExtra} / mo` : 'Included'}
          </span>
        </div>

        {/* Final Result Highlight */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-brand-500/40">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Estimated Monthly Outlay
            </span>
            <span className="text-2xl font-black text-emerald-400">
              ~ ₹{totalMonthlyOutlay.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">/ month</span>
            </span>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
            <span className="text-[11px] text-slate-400 block font-medium">Upfront Move-In Cost</span>
            <span className="text-sm font-bold text-white">
              ₹{totalUpfrontMoveIn.toLocaleString()}{' '}
              <span className="text-[10px] text-slate-400 font-normal">(Rent + Refundable Deposit)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Security Deposit Terms Callout */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold block">Deposit Refund Terms & Security:</span>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            {property.depositRefundPolicy || 'Full deposit refunded within 7 days of checkout inspection.'} Notice Period: {property.noticePeriodDays || 30} Days.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransparentCostCalculator;
