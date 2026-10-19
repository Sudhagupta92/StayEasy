import mongoose from 'mongoose';
import { Property } from '../models/Property.js';
import { Booking } from '../models/Booking.js';
import { RentLedger } from '../models/RentLedger.js';
import { Review } from '../models/Review.js';
import { MaintenanceTicket } from '../models/MaintenanceTicket.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { OwnerProfile } from '../models/OwnerProfile.js';
import { ROLES, BOOKING_STATUS } from '../constants/roles.js';

/**
 * Validates and converts period string into a Date range
 * Allowed: '7d', '30d', '90d', '12m' (or default: null / 12m)
 */
export const parsePeriodFilter = (period, defaultPeriod = '12m') => {
  const selectedPeriod = period || defaultPeriod;
  if (!selectedPeriod) return { startDate: null, period: null };

  const validPeriods = ['7d', '30d', '90d', '12m'];
  if (!validPeriods.includes(selectedPeriod)) {
    const error = new Error('Invalid period filter. Allowed values: 7d, 30d, 90d, 12m');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  let startDate;

  switch (selectedPeriod) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '12m':
    default:
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  return { startDate, period: selectedPeriod };
};

/**
 * Validates optional property ID format
 */
export const validatePropertyIdFormat = (propertyId) => {
  if (!propertyId) return null;
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    const error = new Error('Invalid property ID format');
    error.statusCode = 400;
    throw error;
  }
  return new mongoose.Types.ObjectId(propertyId);
};

/**
 * Generates an array of the last N months formatted as YYYY-MM
 */
export const generateLastNMonths = (n = 12) => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toISOString().slice(0, 7); // "YYYY-MM"
    const monthName = d.toLocaleString('en-US', { month: 'short', year: 'numeric' }); // "Mar 2026"
    months.push({ monthKey, monthName, year: d.getFullYear(), monthNum: d.getMonth() + 1 });
  }
  return months;
};

export const analyticsService = {
  // ==========================================
  // PART 1: OWNER ANALYTICS
  // ==========================================

  /**
   * High-level Owner KPI Overview
   */
  getOwnerOverview: async (ownerId, { period, propertyId } = {}) => {
    const { startDate } = parsePeriodFilter(period);
    const propObjId = validatePropertyIdFormat(propertyId);
    const ownerObjId = new mongoose.Types.ObjectId(ownerId);

    // 1. Fetch properties owned by owner
    const propFilter = { ownerId: ownerObjId };
    if (propObjId) {
      propFilter._id = propObjId;
    }
    const properties = await Property.find(propFilter).lean();

    if (propObjId && properties.length === 0) {
      const error = new Error('Property not found or does not belong to this owner');
      error.statusCode = 404;
      throw error;
    }

    const propertyIds = properties.map((p) => p._id);

    // Compute Bed & Room counts
    let totalRooms = 0;
    let totalBeds = 0;
    let availableBeds = 0;

    properties.forEach((prop) => {
      if (prop.roomConfigurations && Array.isArray(prop.roomConfigurations)) {
        totalRooms += prop.roomConfigurations.length;
        prop.roomConfigurations.forEach((rc) => {
          totalBeds += rc.totalBeds || 0;
          availableBeds += rc.availableBeds || 0;
        });
      }
    });

    const occupiedBeds = Math.max(0, totalBeds - availableBeds);
    const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // 2. Booking metrics
    const bookingFilter = { ownerId: ownerObjId };
    if (propObjId) bookingFilter.propertyId = propObjId;
    if (startDate) bookingFilter.createdAt = { $gte: startDate };

    const bookings = await Booking.find(bookingFilter).lean();
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter((b) => b.status === 'REQUESTED').length;
    const completedBookings = bookings.filter((b) => b.status === 'CHECKED_OUT').length;
    const totalActiveResidents = bookings.filter(
      (b) => b.status === 'CHECKED_IN' || b.status === 'ACTIVE_STAY'
    ).length;

    // 3. Rent & Revenue metrics from RentLedger
    const ledgerFilter = { ownerId: ownerObjId };
    if (propObjId) ledgerFilter.propertyId = propObjId;
    if (startDate) ledgerFilter.createdAt = { $gte: startDate };

    const invoices = await RentLedger.find(ledgerFilter).lean();

    let totalRevenue = 0;
    let pendingRent = 0;
    let monthlyRentCollected = 0;

    const currentMonthPrefix = new Date().toISOString().slice(0, 7);

    invoices.forEach((inv) => {
      if (inv.status === 'PAID') {
        totalRevenue += inv.amountPaid || 0;
        if (inv.billingMonth && inv.billingMonth.startsWith(currentMonthPrefix)) {
          monthlyRentCollected += inv.amountPaid || 0;
        }
      } else if (inv.status === 'DUE' || inv.status === 'OVERDUE' || inv.status === 'PARTIALLY_PAID') {
        pendingRent += inv.balanceDue || 0;
        totalRevenue += inv.amountPaid || 0;
      }
    });

    // If monthlyRentCollected is 0 (e.g. no current month invoice yet), use the latest 30-day paid revenue
    if (monthlyRentCollected === 0 && totalRevenue > 0) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      invoices.forEach((inv) => {
        if (inv.paidAt && new Date(inv.paidAt) >= thirtyDaysAgo) {
          monthlyRentCollected += inv.amountPaid || 0;
        }
      });
      if (monthlyRentCollected === 0) monthlyRentCollected = totalRevenue;
    }

    // 4. Review & Rating metrics
    const reviewFilter = { ownerId: ownerObjId };
    if (propObjId) reviewFilter.propertyId = propObjId;
    const reviews = await Review.find(reviewFilter).lean();
    const totalReviews = reviews.length;
    const averagePropertyRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((acc, r) => acc + (r.overallRating || 0), 0) / totalReviews
            ).toFixed(1)
          )
        : properties.length > 0 && properties[0].ratings?.overallAverage > 0
        ? Number(
            (
              properties.reduce((acc, p) => acc + (p.ratings?.overallAverage || 0), 0) /
              properties.length
            ).toFixed(1)
          )
        : 0;

    // 5. Maintenance & SLA metrics
    const ticketFilter = { ownerId: ownerObjId };
    if (propObjId) ticketFilter.propertyId = propObjId;
    if (startDate) ticketFilter.createdAt = { $gte: startDate };

    const tickets = await MaintenanceTicket.find(ticketFilter).lean();
    const totalMaintenanceTickets = tickets.length;
    const openMaintenanceTickets = tickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'REOPENED' || t.status === 'ACKNOWLEDGED' || t.status === 'IN_PROGRESS'
    ).length;
    const urgentMaintenanceTickets = tickets.filter(
      (t) => t.priority === 'URGENT' && t.status !== 'CLOSED'
    ).length;

    let totalRespDuration = 0;
    let respCount = 0;
    let totalResDuration = 0;
    let resCount = 0;
    let breachedCount = 0;

    tickets.forEach((t) => {
      if (t.responseDurationHours != null) {
        totalRespDuration += t.responseDurationHours;
        respCount++;
      }
      if (t.resolutionDurationHours != null) {
        totalResDuration += t.resolutionDurationHours;
        resCount++;
      }
      if (t.responseBreached || t.resolutionBreached) {
        breachedCount++;
      }
    });

    const averageMaintenanceResponseTime =
      respCount > 0 ? Number((totalRespDuration / respCount).toFixed(1)) : 0;
    const averageMaintenanceResolutionTime =
      resCount > 0 ? Number((totalResDuration / resCount).toFixed(1)) : 0;
    const slaCompliancePercentage =
      totalMaintenanceTickets > 0
        ? Math.round(((totalMaintenanceTickets - breachedCount) / totalMaintenanceTickets) * 100)
        : 100;

    const propertiesSummary = await Promise.all(
      properties.map(async (p) => {
        let pTotalBeds = 0;
        let pAvailBeds = 0;
        if (p.rooms && p.rooms.length > 0) {
          p.rooms.forEach((r) => {
            pTotalBeds += r.beds && r.beds.length > 0 ? r.beds.length : 1;
            pAvailBeds +=
              r.beds && r.beds.length > 0
                ? r.beds.filter((b) => b.status === 'AVAILABLE').length
                : 1;
          });
        } else if (p.roomConfigurations) {
          p.roomConfigurations.forEach((rc) => {
            pTotalBeds += rc.totalBeds || 0;
            pAvailBeds += rc.availableBeds || 0;
          });
        }
        const pOccupiedBeds = Math.max(0, pTotalBeds - pAvailBeds);
        const pOccupancyRate =
          pTotalBeds > 0 ? Math.round((pOccupiedBeds / pTotalBeds) * 100) : 0;

        const pActiveResidents = await Booking.countDocuments({
          propertyId: p._id,
          status: { $in: ['CHECKED_IN', 'ACTIVE_STAY'] },
        });

        const pInvoices = await RentLedger.find({ propertyId: p._id }).lean();
        const pRevenue = pInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
        const pPending = pInvoices.reduce(
          (sum, inv) => (inv.status !== 'PAID' ? sum + (inv.balanceDue || 0) : sum),
          0
        );

        return {
          propertyId: p._id,
          title: p.title,
          propertyType: p.propertyType,
          city: p.address?.city || '',
          state: p.address?.state || '',
          coverImage: p.coverImage || (p.images && p.images[0]) || '',
          verificationStatus: p.verificationStatus,
          totalBeds: pTotalBeds,
          occupiedBeds: pOccupiedBeds,
          availableBeds: pAvailBeds,
          occupancyRate: pOccupancyRate,
          activeResidents: pActiveResidents,
          revenue: pRevenue,
          pendingRent: pPending,
          rating: p.ratings?.overallAverage || 0,
          reviews: p.ratings?.totalReviews || 0,
        };
      })
    );

    return {
      totalProperties: properties.length,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyPercentage,
      totalActiveResidents,
      totalBookings,
      pendingBookings,
      completedBookings,
      monthlyRentCollected,
      pendingRent,
      totalRevenue,
      averagePropertyRating,
      totalReviews,
      totalMaintenanceTickets,
      openMaintenanceTickets,
      urgentMaintenanceTickets,
      averageMaintenanceResponseTime,
      averageMaintenanceResolutionTime,
      slaCompliancePercentage,
      propertiesSummary,
    };
  },

  /**
   * Monthly Revenue Trends for Owner (last 12 months)
   */
  getOwnerRevenue: async (ownerId, { period = '12m', propertyId } = {}) => {
    const { startDate } = parsePeriodFilter(period, '12m');
    const propObjId = validatePropertyIdFormat(propertyId);
    const ownerObjId = new mongoose.Types.ObjectId(ownerId);

    const matchStage = {
      ownerId: ownerObjId,
    };
    if (propObjId) {
      const propExists = await Property.findOne({ _id: propObjId, ownerId: ownerObjId });
      if (!propExists) {
        const error = new Error('Property not found or does not belong to this owner');
        error.statusCode = 404;
        throw error;
      }
      matchStage.propertyId = propObjId;
    }
    if (startDate) matchStage.createdAt = { $gte: startDate };

    const revenueAggregation = await RentLedger.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $cond: [
              { $and: [{ $ne: ['$billingMonth', null] }, { $gte: [{ $strLenCP: '$billingMonth' }, 7] }] },
              { $substrCP: ['$billingMonth', 0, 7] },
              { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            ],
          },
          rentCollected: {
            $sum: {
              $cond: [{ $in: ['$status', ['PAID', 'PARTIALLY_PAID']] }, '$amountPaid', 0],
            },
          },
          pendingRent: {
            $sum: {
              $cond: [{ $in: ['$status', ['DUE', 'OVERDUE', 'PARTIALLY_PAID']] }, '$balanceDue', 0],
            },
          },
          totalRevenue: {
            $sum: '$amountPaid',
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revMap = new Map();
    revenueAggregation.forEach((item) => {
      revMap.set(item._id, item);
    });

    const months = generateLastNMonths(period === '7d' ? 2 : period === '30d' ? 3 : period === '90d' ? 4 : 12);
    const revenueData = months.map((m) => {
      const agg = revMap.get(m.monthKey) || {};
      return {
        month: m.monthName,
        monthKey: m.monthKey,
        rentCollected: agg.rentCollected || 0,
        pendingRent: agg.pendingRent || 0,
        totalRevenue: agg.totalRevenue || 0,
      };
    });

    return revenueData;
  },

  /**
   * Monthly Occupancy Trends for Owner
   */
  getOwnerOccupancy: async (ownerId, { period = '12m', propertyId } = {}) => {
    const propObjId = validatePropertyIdFormat(propertyId);
    const ownerObjId = new mongoose.Types.ObjectId(ownerId);

    const propFilter = { ownerId: ownerObjId };
    if (propObjId) propFilter._id = propObjId;

    const properties = await Property.find(propFilter).lean();
    if (propObjId && properties.length === 0) {
      const error = new Error('Property not found or does not belong to this owner');
      error.statusCode = 404;
      throw error;
    }

    let totalBeds = 0;
    properties.forEach((p) => {
      p.roomConfigurations?.forEach((rc) => {
        totalBeds += rc.totalBeds || 0;
      });
    });

    const bookingFilter = { ownerId: ownerObjId };
    if (propObjId) bookingFilter.propertyId = propObjId;
    const bookings = await Booking.find(bookingFilter).lean();

    const months = generateLastNMonths(period === '7d' ? 2 : period === '30d' ? 3 : period === '90d' ? 4 : 12);

    const occupancyData = months.map((m) => {
      const monthStart = new Date(m.year, m.monthNum - 1, 1);
      const monthEnd = new Date(m.year, m.monthNum, 0, 23, 59, 59);

      const activeInMonth = bookings.filter((b) => {
        const moveIn = new Date(b.moveInDate || b.createdAt);
        const checkOut = b.checkOutDate ? new Date(b.checkOutDate) : null;
        const isActiveStatus = [
          'ACCEPTED',
          'CONFIRMED',
          'CHECKED_IN',
          'ACTIVE_STAY',
          'CHECKED_OUT',
        ].includes(b.status);

        if (!isActiveStatus) return false;
        if (moveIn > monthEnd) return false;
        if (checkOut && checkOut < monthStart) return false;
        return true;
      }).length;

      const occupied = Math.min(totalBeds, activeInMonth);
      const available = Math.max(0, totalBeds - occupied);
      const rate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;

      return {
        month: m.monthName,
        monthKey: m.monthKey,
        totalBeds,
        occupiedBeds: occupied,
        availableBeds: available,
        occupancyRate: rate,
      };
    });

    return occupancyData;
  },

  /**
   * Property-wise Performance Breakdown for Owner
   */
  getOwnerProperties: async (ownerId, { period, propertyId } = {}) => {
    const { startDate } = parsePeriodFilter(period);
    const propObjId = validatePropertyIdFormat(propertyId);
    const ownerObjId = new mongoose.Types.ObjectId(ownerId);

    const propFilter = { ownerId: ownerObjId };
    if (propObjId) propFilter._id = propObjId;

    const properties = await Property.find(propFilter).lean();
    if (propObjId && properties.length === 0) {
      const error = new Error('Property not found or does not belong to this owner');
      error.statusCode = 404;
      throw error;
    }

    const propertyPerformanceList = await Promise.all(
      properties.map(async (prop) => {
        let totalBeds = 0;
        let availableBeds = 0;
        prop.roomConfigurations?.forEach((rc) => {
          totalBeds += rc.totalBeds || 0;
          availableBeds += rc.availableBeds || 0;
        });
        const occupiedBeds = Math.max(0, totalBeds - availableBeds);
        const occupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

        // Revenue
        const ledgerQuery = { propertyId: prop._id };
        if (startDate) ledgerQuery.createdAt = { $gte: startDate };
        const invoices = await RentLedger.find(ledgerQuery).lean();
        const revenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
        const pendingRent = invoices.reduce(
          (sum, inv) => (inv.status !== 'PAID' ? sum + (inv.balanceDue || 0) : sum),
          0
        );

        // Active Residents
        const bookingQuery = {
          propertyId: prop._id,
          status: { $in: ['CHECKED_IN', 'ACTIVE_STAY'] },
        };
        const activeResidents = await Booking.countDocuments(bookingQuery);

        // Maintenance & SLA
        const ticketQuery = { propertyId: prop._id };
        if (startDate) ticketQuery.createdAt = { $gte: startDate };
        const tickets = await MaintenanceTicket.find(ticketQuery).lean();
        const totalTickets = tickets.length;
        const openTickets = tickets.filter(
          (t) => t.status === 'OPEN' || t.status === 'REOPENED' || t.status === 'ACKNOWLEDGED' || t.status === 'IN_PROGRESS'
        ).length;
        const breachedTickets = tickets.filter((t) => t.responseBreached || t.resolutionBreached).length;
        const slaCompliance =
          totalTickets > 0 ? Math.round(((totalTickets - breachedTickets) / totalTickets) * 100) : 100;

        return {
          propertyId: prop._id,
          propertyName: prop.title,
          propertyType: prop.propertyType,
          city: prop.address?.city || '',
          trustScore: prop.trustScore || 88,
          totalBeds,
          occupiedBeds,
          availableBeds,
          occupancy,
          revenue,
          pendingRent,
          rating: prop.ratings?.overallAverage || 0,
          reviews: prop.ratings?.totalReviews || 0,
          activeResidents,
          maintenanceTickets: totalTickets,
          openMaintenanceTickets: openTickets,
          slaCompliance,
        };
      })
    );

    return propertyPerformanceList;
  },

  /**
   * Detailed Maintenance & SLA Metrics for Owner
   */
  getOwnerMaintenance: async (ownerId, { period, propertyId } = {}) => {
    const { startDate } = parsePeriodFilter(period);
    const propObjId = validatePropertyIdFormat(propertyId);
    const ownerObjId = new mongoose.Types.ObjectId(ownerId);

    if (propObjId) {
      const propExists = await Property.findOne({ _id: propObjId, ownerId: ownerObjId });
      if (!propExists) {
        const error = new Error('Property not found or does not belong to this owner');
        error.statusCode = 404;
        throw error;
      }
    }

    const ticketFilter = { ownerId: ownerObjId };
    if (propObjId) ticketFilter.propertyId = propObjId;
    if (startDate) ticketFilter.createdAt = { $gte: startDate };

    const tickets = await MaintenanceTicket.find(ticketFilter).lean();

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'REOPENED' || t.status === 'ACKNOWLEDGED' || t.status === 'IN_PROGRESS'
    ).length;
    const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const overdueTickets = tickets.filter((t) => t.responseBreached || t.resolutionBreached).length;

    let totalRespHours = 0;
    let respCount = 0;
    let totalResHours = 0;
    let resCount = 0;

    const categoryMap = {};
    const priorityMap = {};

    tickets.forEach((t) => {
      if (t.responseDurationHours != null) {
        totalRespHours += t.responseDurationHours;
        respCount++;
      }
      if (t.resolutionDurationHours != null) {
        totalResHours += t.resolutionDurationHours;
        resCount++;
      }

      // Category breakdown
      const cat = t.category || 'OTHER';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, breached: 0 };
      categoryMap[cat].count++;
      if (t.responseBreached || t.resolutionBreached) categoryMap[cat].breached++;

      // Priority breakdown
      const prio = t.priority || 'MEDIUM';
      if (!priorityMap[prio]) priorityMap[prio] = { count: 0, totalRes: 0, resCount: 0 };
      priorityMap[prio].count++;
      if (t.resolutionDurationHours != null) {
        priorityMap[prio].totalRes += t.resolutionDurationHours;
        priorityMap[prio].resCount++;
      }
    });

    const averageResponseTime = respCount > 0 ? Number((totalRespHours / respCount).toFixed(1)) : 0;
    const averageResolutionTime = resCount > 0 ? Number((totalResHours / resCount).toFixed(1)) : 0;
    const slaCompliancePercentage =
      totalTickets > 0 ? Math.round(((totalTickets - overdueTickets) / totalTickets) * 100) : 100;

    const byCategory = Object.entries(categoryMap).map(([category, val]) => ({
      category,
      count: val.count,
      breachedCount: val.breached,
      percentage: totalTickets > 0 ? Math.round((val.count / totalTickets) * 100) : 0,
    }));

    const byPriority = Object.entries(priorityMap).map(([priority, val]) => ({
      priority,
      count: val.count,
      avgResolutionHours: val.resCount > 0 ? Number((val.totalRes / val.resCount).toFixed(1)) : 0,
      percentage: totalTickets > 0 ? Math.round((val.count / totalTickets) * 100) : 0,
    }));

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      overdueTickets,
      averageResponseTime,
      averageResolutionTime,
      slaCompliancePercentage,
      byCategory,
      byPriority,
    };
  },

  // ==========================================
  // PART 2: TENANT / USER ANALYTICS
  // ==========================================

  /**
   * High-level Tenant Spending & Stay Overview
   */
  getUserOverview: async (userId, { period } = {}) => {
    const { startDate } = parsePeriodFilter(period);
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Bookings
    const bookingQuery = { tenantId: userObjId };
    if (startDate) bookingQuery.createdAt = { $gte: startDate };
    const bookings = await Booking.find(bookingQuery).populate('propertyId', 'title address images').lean();
    const totalBookings = bookings.length;

    // Active stay
    const activeStayBooking =
      bookings.find(
        (b) =>
          b.status === 'CHECKED_IN' ||
          b.status === 'ACTIVE_STAY' ||
          b.status === 'ACCEPTED' ||
          b.status === 'CONFIRMED'
      ) || null;

    const activeStay = activeStayBooking
      ? {
          bookingId: activeStayBooking._id,
          bookingReference: activeStayBooking.bookingReference,
          propertyTitle: activeStayBooking.propertyId?.title || 'Accommodation',
          propertyAddress: activeStayBooking.propertyId?.address?.city || '',
          roomName: activeStayBooking.roomName,
          roomType: activeStayBooking.roomType,
          moveInDate: activeStayBooking.moveInDate,
          monthlyRent: activeStayBooking.costs?.monthlyRent || 0,
          status: activeStayBooking.status,
          escrowStatus: activeStayBooking.escrowStatus,
        }
      : null;

    // Rent & Spending metrics from RentLedger
    const ledgerQuery = { tenantId: userObjId };
    if (startDate) ledgerQuery.createdAt = { $gte: startDate };
    const invoices = await RentLedger.find(ledgerQuery).lean();

    let totalRentPaid = 0;
    let pendingRent = 0;
    let totalElectricityCost = 0;

    invoices.forEach((inv) => {
      if (inv.status === 'PAID') {
        totalRentPaid += inv.amountPaid || 0;
        totalElectricityCost += inv.breakdown?.electricity?.amount || 0;
      } else if (inv.status === 'DUE' || inv.status === 'OVERDUE' || inv.status === 'PARTIALLY_PAID') {
        pendingRent += inv.balanceDue || 0;
        totalRentPaid += inv.amountPaid || 0;
      }
    });

    // Maintenance tickets
    const ticketQuery = { tenantId: userObjId };
    if (startDate) ticketQuery.createdAt = { $gte: startDate };
    const tickets = await MaintenanceTicket.find(ticketQuery).lean();
    const totalMaintenanceTickets = tickets.length;
    const resolvedMaintenanceTickets = tickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
    ).length;

    // Reviews given
    const reviews = await Review.find({ tenantId: userObjId }).lean();
    const totalReviews = reviews.length;
    const averageReviewRatingGiven =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / totalReviews
            ).toFixed(1)
          )
        : 0;

    return {
      totalBookings,
      activeStay,
      totalRentPaid,
      pendingRent,
      totalElectricityCost,
      totalMaintenanceTickets,
      resolvedMaintenanceTickets,
      averageReviewRatingGiven,
      totalReviews,
      currentProperty: activeStayBooking?.propertyId?.title || null,
      currentRoom: activeStayBooking ? `${activeStayBooking.roomName} (${activeStayBooking.roomType})` : null,
    };
  },

  /**
   * Monthly Spending Breakdown for Tenant (Rent, Electricity, Total)
   */
  getUserSpending: async (userId, { period = '12m' } = {}) => {
    const { startDate } = parsePeriodFilter(period, '12m');
    const userObjId = new mongoose.Types.ObjectId(userId);

    const matchStage = { tenantId: userObjId };
    if (startDate) matchStage.createdAt = { $gte: startDate };

    const spendingAggregation = await RentLedger.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $cond: [
              { $and: [{ $ne: ['$billingMonth', null] }, { $gte: [{ $strLenCP: '$billingMonth' }, 7] }] },
              { $substrCP: ['$billingMonth', 0, 7] },
              { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            ],
          },
          rent: { $sum: { $ifNull: ['$breakdown.baseRent', 0] } },
          electricity: { $sum: { $ifNull: ['$breakdown.electricity.amount', 0] } },
          otherCharges: {
            $sum: {
              $add: [
                { $ifNull: ['$breakdown.waterCharges', 0] },
                { $ifNull: ['$breakdown.maintenanceCharges', 0] },
                { $ifNull: ['$breakdown.foodCharges', 0] },
                { $ifNull: ['$breakdown.otherCharges', 0] },
                { $ifNull: ['$breakdown.lateFee', 0] },
              ],
            },
          },
          total: { $sum: '$totalAmount' },
          amountPaid: { $sum: '$amountPaid' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const spendMap = new Map();
    spendingAggregation.forEach((item) => {
      spendMap.set(item._id, item);
    });

    const months = generateLastNMonths(period === '7d' ? 2 : period === '30d' ? 3 : period === '90d' ? 4 : 12);
    const spendingData = months.map((m) => {
      const agg = spendMap.get(m.monthKey) || {};
      return {
        month: m.monthName,
        monthKey: m.monthKey,
        rent: agg.rent || 0,
        electricity: agg.electricity || 0,
        otherCharges: agg.otherCharges || 0,
        total: agg.amountPaid != null && agg.amountPaid > 0 ? agg.amountPaid : agg.total || 0,
      };
    });

    return spendingData;
  },

  /**
   * Tenant Maintenance Complaints & SLA Telemetry
   */
  getUserMaintenance: async (userId, { period } = {}) => {
    const { startDate } = parsePeriodFilter(period);
    const userObjId = new mongoose.Types.ObjectId(userId);

    const ticketQuery = { tenantId: userObjId };
    if (startDate) ticketQuery.createdAt = { $gte: startDate };

    const tickets = await MaintenanceTicket.find(ticketQuery)
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    const totalTickets = tickets.length;
    const open = tickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'REOPENED' || t.status === 'ACKNOWLEDGED' || t.status === 'IN_PROGRESS'
    ).length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    let totalResHours = 0;
    let resCount = 0;
    let breachedCount = 0;

    const categoryMap = {};

    tickets.forEach((t) => {
      if (t.resolutionDurationHours != null) {
        totalResHours += t.resolutionDurationHours;
        resCount++;
      }
      if (t.responseBreached || t.resolutionBreached) {
        breachedCount++;
      }

      const cat = t.category || 'OTHER';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const averageResolutionTime = resCount > 0 ? Number((totalResHours / resCount).toFixed(1)) : 0;
    const metCount = Math.max(0, totalTickets - breachedCount);
    const complianceRate = totalTickets > 0 ? Math.round((metCount / totalTickets) * 100) : 100;

    const byCategory = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));

    return {
      totalTickets,
      open,
      resolved,
      averageResolutionTime,
      slaStatus: {
        metCount,
        breachedCount,
        complianceRate,
      },
      byCategory,
      recentTickets: tickets.slice(0, 5),
    };
  },

  // ==========================================
  // PART 3: ADMIN PLATFORM ANALYTICS
  // ==========================================

  /**
   * Platform-Wide Administrative KPI Overview
   */
  getAdminOverview: async ({ period } = {}) => {
    const { startDate } = parsePeriodFilter(period);

    const userFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const propFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const bookingFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const ledgerFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const reviewFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const ticketFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const notifFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    const [
      totalUsers,
      totalOwners,
      totalProperties,
      verifiedProperties,
      pendingPropertyVerification,
      totalBookings,
      activeStays,
      invoices,
      reviews,
      tickets,
      totalNotifications,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.USER, ...userFilter }),
      User.countDocuments({ role: ROLES.OWNER, ...userFilter }),
      Property.countDocuments(propFilter),
      Property.countDocuments({ verificationStatus: 'VERIFIED', ...propFilter }),
      Property.countDocuments({ verificationStatus: 'PENDING', ...propFilter }),
      Booking.countDocuments(bookingFilter),
      Booking.countDocuments({
        status: { $in: ['CHECKED_IN', 'ACTIVE_STAY'] },
        ...bookingFilter,
      }),
      RentLedger.find(ledgerFilter).lean(),
      Review.find(reviewFilter).lean(),
      MaintenanceTicket.find(ticketFilter).lean(),
      Notification.countDocuments(notifFilter),
    ]);

    let totalRevenue = 0;
    let totalPendingRent = 0;

    invoices.forEach((inv) => {
      totalRevenue += inv.amountPaid || 0;
      if (inv.status !== 'PAID') {
        totalPendingRent += inv.balanceDue || 0;
      }
    });

    const totalReviews = reviews.length;
    const averagePlatformRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / totalReviews
            ).toFixed(1)
          )
        : 0;

    const totalMaintenanceTickets = tickets.length;
    const openMaintenanceTickets = tickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'REOPENED' || t.status === 'ACKNOWLEDGED' || t.status === 'IN_PROGRESS'
    ).length;
    const breachedTickets = tickets.filter((t) => t.responseBreached || t.resolutionBreached).length;
    const slaCompliance =
      totalMaintenanceTickets > 0
        ? Math.round(((totalMaintenanceTickets - breachedTickets) / totalMaintenanceTickets) * 100)
        : 100;

    const propertiesAll = await Property.find(propFilter).lean();
    const propertyTypeCounts = {
      PG: 0,
      HOSTEL: 0,
      CO_LIVING: 0,
      FLAT: 0,
      ROOM: 0,
    };
    let totalPlatformBeds = 0;
    let availablePlatformBeds = 0;

    propertiesAll.forEach((p) => {
      const pType = p.propertyType || 'PG';
      propertyTypeCounts[pType] = (propertyTypeCounts[pType] || 0) + 1;

      if (p.rooms && p.rooms.length > 0) {
        p.rooms.forEach((r) => {
          totalPlatformBeds += r.beds && r.beds.length > 0 ? r.beds.length : 1;
          availablePlatformBeds +=
            r.beds && r.beds.length > 0
              ? r.beds.filter((b) => b.status === 'AVAILABLE').length
              : 1;
        });
      } else if (p.roomConfigurations) {
        p.roomConfigurations.forEach((rc) => {
          totalPlatformBeds += rc.totalBeds || 0;
          availablePlatformBeds += rc.availableBeds || 0;
        });
      }
    });

    const totalProps = propertiesAll.length;
    const propertyTypeDistribution = Object.entries(propertyTypeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: totalProps > 0 ? Math.round((count / totalProps) * 100) : 0,
    }));

    const occupiedPlatformBeds = Math.max(0, totalPlatformBeds - availablePlatformBeds);
    const platformOccupancyRate =
      totalPlatformBeds > 0
        ? Math.round((occupiedPlatformBeds / totalPlatformBeds) * 100)
        : 0;

    const allBookings = await Booking.find(bookingFilter).lean();
    const bookingGMV = allBookings.reduce(
      (sum, b) => sum + (b.costs?.totalUpfrontAmount || 0),
      0
    );
    const ledgerGMV = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const grossMerchandiseValue = bookingGMV + ledgerGMV;

    const escrowHeld = allBookings
      .filter((b) => b.escrowStatus === 'HELD_IN_ESCROW')
      .reduce((sum, b) => sum + (b.costs?.securityDeposit || 0), 0);

    const verifiedReviewsCount = reviews.filter((r) => r.isVerifiedResident !== false).length;
    const verifiedResidentsCount = await Booking.countDocuments({
      $or: [
        { status: { $in: ['CHECKED_IN', 'ACTIVE_STAY', 'CHECKED_OUT'] } },
        { isVerifiedResident: true },
      ],
      ...bookingFilter,
    });
    const reviewedPropertyIds = new Set(reviews.map((r) => r.propertyId?.toString()));
    const propertiesWithVerifiedReviews = reviewedPropertyIds.size;

    return {
      totalUsers,
      totalOwners,
      totalProperties,
      verifiedProperties,
      pendingPropertyVerification,
      totalBookings,
      activeStays,
      totalRevenue,
      totalPendingRent,
      grossMerchandiseValue,
      escrowHeld,
      totalReviews,
      totalVerifiedReviews: verifiedReviewsCount,
      totalVerifiedResidents: verifiedResidentsCount,
      propertiesWithVerifiedReviews,
      averagePlatformRating,
      totalMaintenanceTickets,
      openMaintenanceTickets,
      slaCompliance,
      totalNotifications,
      propertyTypeDistribution,
      propertyTypeCounts,
      platformBeds: {
        totalBeds: totalPlatformBeds,
        totalPlatformBeds,
        occupiedBeds: occupiedPlatformBeds,
        occupiedPlatformBeds,
        availableBeds: availablePlatformBeds,
        availablePlatformBeds,
        occupancyRate: platformOccupancyRate,
        platformOccupancyRate,
      },
    };
  },

  /**
   * Platform-Wide Growth and Monthly Trends for Admin (Last 12 Months)
   */
  getAdminTrends: async ({ period = '12m' } = {}) => {
    const { startDate } = parsePeriodFilter(period, '12m');
    const matchStage = startDate ? { createdAt: { $gte: startDate } } : {};

    const [userAgg, ownerAgg, propAgg, bkAgg, revAgg, reviewAgg, ticketAgg] = await Promise.all([
      // New Tenants
      User.aggregate([
        { $match: { role: ROLES.USER, ...matchStage } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      // New Landlords
      User.aggregate([
        { $match: { role: ROLES.OWNER, ...matchStage } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      // New Properties
      Property.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      // Bookings
      Booking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      // Revenue
      RentLedger.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              $cond: [
                { $and: [{ $ne: ['$billingMonth', null] }, { $gte: [{ $strLenCP: '$billingMonth' }, 7] }] },
                { $substrCP: ['$billingMonth', 0, 7] },
                { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              ],
            },
            revenue: { $sum: '$amountPaid' },
          },
        },
      ]),
      // Reviews
      Review.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      // Maintenance Tickets
      MaintenanceTicket.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const toMap = (arr, valKey = 'count') => {
      const map = new Map();
      arr.forEach((i) => map.set(i._id, i[valKey]));
      return map;
    };

    const userMap = toMap(userAgg);
    const ownerMap = toMap(ownerAgg);
    const propMap = toMap(propAgg);
    const bkMap = toMap(bkAgg);
    const revMap = toMap(revAgg, 'revenue');
    const reviewMap = toMap(reviewAgg);
    const ticketMap = toMap(ticketAgg);

    const months = generateLastNMonths(period === '7d' ? 2 : period === '30d' ? 3 : period === '90d' ? 4 : 12);

    const trends = months.map((m) => ({
      month: m.monthName,
      monthKey: m.monthKey,
      newUsers: userMap.get(m.monthKey) || 0,
      newOwners: ownerMap.get(m.monthKey) || 0,
      newProperties: propMap.get(m.monthKey) || 0,
      bookings: bkMap.get(m.monthKey) || 0,
      revenue: revMap.get(m.monthKey) || 0,
      reviews: reviewMap.get(m.monthKey) || 0,
      maintenanceTickets: ticketMap.get(m.monthKey) || 0,
    }));

    return trends;
  },

  /**
   * Top Performing Properties on Platform
   */
  getAdminTopProperties: async ({ limit = 10, period } = {}) => {
    const { startDate } = parsePeriodFilter(period);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));

    const properties = await Property.find({})
      .populate('ownerId', 'name email phone')
      .lean();

    const topList = await Promise.all(
      properties.map(async (prop) => {
        let totalBeds = 0;
        let availableBeds = 0;
        prop.roomConfigurations?.forEach((rc) => {
          totalBeds += rc.totalBeds || 0;
          availableBeds += rc.availableBeds || 0;
        });
        const occupiedBeds = Math.max(0, totalBeds - availableBeds);
        const occupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

        const ledgerFilter = { propertyId: prop._id };
        if (startDate) ledgerFilter.createdAt = { $gte: startDate };
        const invoices = await RentLedger.find(ledgerFilter).lean();
        const revenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

        const bookingFilter = {
          propertyId: prop._id,
          status: { $in: ['CHECKED_IN', 'ACTIVE_STAY'] },
        };
        const activeResidents = await Booking.countDocuments(bookingFilter);

        return {
          propertyId: prop._id,
          propertyName: prop.title,
          propertyType: prop.propertyType,
          city: prop.address?.city || '',
          ownerName: prop.ownerId?.name || 'Owner',
          ownerEmail: prop.ownerId?.email || '',
          occupancy,
          totalBeds,
          occupiedBeds,
          availableBeds,
          rating: prop.ratings?.overallAverage || 0,
          reviews: prop.ratings?.totalReviews || 0,
          revenue,
          activeResidents,
          trustScore: prop.trustScore || 88,
          verificationStatus: prop.verificationStatus,
        };
      })
    );

    // Sort by composite performance (occupancy desc, rating desc, revenue desc)
    topList.sort((a, b) => {
      if (b.occupancy !== a.occupancy) return b.occupancy - a.occupancy;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.revenue - a.revenue;
    });

    return topList.slice(0, limitNum);
  },

  /**
   * Platform-Wide Maintenance Telemetry & Landlord SLA Ranking
   */
  getAdminMaintenance: async ({ period } = {}) => {
    const { startDate } = parsePeriodFilter(period);
    const matchFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    const [tickets, owners, properties] = await Promise.all([
      MaintenanceTicket.find(matchFilter).populate('ownerId', 'name email').lean(),
      User.find({ role: ROLES.OWNER }).lean(),
      Property.find({}).lean(),
    ]);

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'REOPENED' || t.status === 'ACKNOWLEDGED' || t.status === 'IN_PROGRESS'
    ).length;
    const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const breachedTickets = tickets.filter((t) => t.responseBreached || t.resolutionBreached).length;

    let totalRespHours = 0;
    let respCount = 0;
    let totalResHours = 0;
    let resCount = 0;

    const categoryMap = {};
    const priorityMap = {};
    const statusMap = {};
    const ownerMap = {};

    tickets.forEach((t) => {
      if (t.responseDurationHours != null) {
        totalRespHours += t.responseDurationHours;
        respCount++;
      }
      if (t.resolutionDurationHours != null) {
        totalResHours += t.resolutionDurationHours;
        resCount++;
      }

      // Category
      const cat = t.category || 'OTHER';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, breached: 0 };
      categoryMap[cat].count++;
      if (t.responseBreached || t.resolutionBreached) categoryMap[cat].breached++;

      // Priority
      const prio = t.priority || 'MEDIUM';
      if (!priorityMap[prio]) priorityMap[prio] = { count: 0, totalRes: 0, resCount: 0 };
      priorityMap[prio].count++;
      if (t.resolutionDurationHours != null) {
        priorityMap[prio].totalRes += t.resolutionDurationHours;
        priorityMap[prio].resCount++;
      }

      // Status
      const st = t.status || 'OPEN';
      statusMap[st] = (statusMap[st] || 0) + 1;

      // Owner performance
      const oId = t.ownerId?._id?.toString() || t.ownerId?.toString();
      if (oId) {
        if (!ownerMap[oId]) {
          ownerMap[oId] = {
            ownerId: oId,
            ownerName: t.ownerId?.name || 'Owner',
            ownerEmail: t.ownerId?.email || '',
            totalTickets: 0,
            breachedCount: 0,
            totalResHours: 0,
            resCount: 0,
          };
        }
        ownerMap[oId].totalTickets++;
        if (t.responseBreached || t.resolutionBreached) ownerMap[oId].breachedCount++;
        if (t.resolutionDurationHours != null) {
          ownerMap[oId].totalResHours += t.resolutionDurationHours;
          ownerMap[oId].resCount++;
        }
      }
    });

    const averageResponseTime = respCount > 0 ? Number((totalRespHours / respCount).toFixed(1)) : 0;
    const averageResolutionTime = resCount > 0 ? Number((totalResHours / resCount).toFixed(1)) : 0;
    const slaBreachRate =
      totalTickets > 0 ? Math.round((breachedTickets / totalTickets) * 100) : 0;

    const categoryDistribution = Object.entries(categoryMap).map(([category, val]) => ({
      category,
      count: val.count,
      breachedCount: val.breached,
      percentage: totalTickets > 0 ? Math.round((val.count / totalTickets) * 100) : 0,
    }));

    const priorityDistribution = Object.entries(priorityMap).map(([priority, val]) => ({
      priority,
      count: val.count,
      avgResolutionHours: val.resCount > 0 ? Number((val.totalRes / val.resCount).toFixed(1)) : 0,
      percentage: totalTickets > 0 ? Math.round((val.count / totalTickets) * 100) : 0,
    }));

    const ticketStatusDistribution = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      percentage: totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0,
    }));

    // Owner compliance ranking
    const ownerComplianceRanking = Object.values(ownerMap).map((o) => {
      const propCount = properties.filter((p) => p.ownerId?.toString() === o.ownerId).length;
      const breachRate =
        o.totalTickets > 0 ? Math.round((o.breachedCount / o.totalTickets) * 100) : 0;
      const complianceRate = 100 - breachRate;
      const avgRes =
        o.resCount > 0 ? Number((o.totalResHours / o.resCount).toFixed(1)) : 0;

      return {
        ownerId: o.ownerId,
        ownerName: o.ownerName,
        ownerEmail: o.ownerEmail,
        propertiesCount: propCount,
        totalTickets: o.totalTickets,
        breachedCount: o.breachedCount,
        breachRate,
        complianceRate,
        avgResolutionHours: avgRes,
      };
    });

    // Sort by best compliance (lowest breach rate, highest ticket volume)
    ownerComplianceRanking.sort((a, b) => {
      if (a.breachRate !== b.breachRate) return a.breachRate - b.breachRate;
      return b.totalTickets - a.totalTickets;
    });

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      breachedTickets,
      averageResponseTime,
      averageResolutionTime,
      slaBreachRate,
      categoryDistribution,
      priorityDistribution,
      ticketStatusDistribution,
      ownerComplianceRanking,
    };
  },

  /**
   * Platform-Wide Aggregate Overview for Landlords (Zero PII - Aggregated Only)
   */
  getPlatformOverview: async () => {
    const [
      totalUsers,
      totalTenants,
      totalOwners,
      totalProperties,
      totalReviews,
      totalVerifiedReviews,
      totalVerifiedResidents,
      propertiesAll,
      reviewsAll,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: ROLES.USER }),
      User.countDocuments({ role: ROLES.OWNER }),
      Property.countDocuments(),
      Review.countDocuments(),
      Review.countDocuments({ isVerifiedResident: true }),
      Booking.countDocuments({
        $or: [
          { status: { $in: ['CHECKED_IN', 'ACTIVE_STAY', 'CHECKED_OUT'] } },
          { isVerifiedResident: true },
        ],
      }),
      Property.find().select('propertyType rooms roomConfigurations').lean(),
      Review.find({ isVerifiedResident: true }).select('overallRating').lean(),
    ]);

    const propertyTypeCounts = {
      PG: 0,
      HOSTEL: 0,
      CO_LIVING: 0,
      FLAT: 0,
      ROOM: 0,
    };
    let totalPlatformBeds = 0;
    let availablePlatformBeds = 0;

    propertiesAll.forEach((p) => {
      const pType = p.propertyType || 'PG';
      propertyTypeCounts[pType] = (propertyTypeCounts[pType] || 0) + 1;

      if (p.rooms && p.rooms.length > 0) {
        p.rooms.forEach((r) => {
          totalPlatformBeds += r.beds && r.beds.length > 0 ? r.beds.length : 1;
          availablePlatformBeds +=
            r.beds && r.beds.length > 0
              ? r.beds.filter((b) => b.status === 'AVAILABLE').length
              : 1;
        });
      } else if (p.roomConfigurations) {
        p.roomConfigurations.forEach((rc) => {
          totalPlatformBeds += rc.totalBeds || 0;
          availablePlatformBeds += rc.availableBeds || 0;
        });
      }
    });

    const totalProps = propertiesAll.length;
    const propertyTypeDistribution = Object.entries(propertyTypeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: totalProps > 0 ? Math.round((count / totalProps) * 100) : 0,
    }));

    const avgRating =
      reviewsAll.length > 0
        ? Number(
            (
              reviewsAll.reduce((sum, r) => sum + (r.overallRating || 0), 0) /
              reviewsAll.length
            ).toFixed(1)
          )
        : 4.8;

    return {
      totalUsers,
      totalTenants,
      totalOwners,
      totalProperties,
      propertyTypeCounts,
      byType: propertyTypeCounts,
      propertyTypeDistribution,
      platformBeds: {
        totalBeds: totalPlatformBeds,
        totalPlatformBeds,
        occupiedBeds: Math.max(0, totalPlatformBeds - availablePlatformBeds),
        occupiedPlatformBeds: Math.max(0, totalPlatformBeds - availablePlatformBeds),
        availableBeds: availablePlatformBeds,
        availablePlatformBeds,
        occupancyRate: totalPlatformBeds > 0 ? Math.round(((totalPlatformBeds - availablePlatformBeds) / totalPlatformBeds) * 100) : 0,
      },
      totalReviews,
      totalVerifiedReviews,
      totalVerifiedResidents,
      averageRating: avgRating,
      averagePlatformRating: avgRating,
    };
  },
};

export default analyticsService;
