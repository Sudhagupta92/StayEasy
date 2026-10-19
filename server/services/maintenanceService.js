import mongoose from 'mongoose';
import { MaintenanceTicket, Property, Booking, User, OwnerProfile } from '../models/index.js';
import { notificationService } from './notificationService.js';
import {
  ROLES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  SLA_CONFIG,
  BOOKING_STATUS,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
} from '../constants/roles.js';
import {
  validateCreateTicketInput,
  validateAcknowledgeInput,
  validateStartTicketInput,
  validateResolveTicketInput,
  validateReopenTicketInput,
} from '../validators/maintenance.validator.js';

export const maintenanceService = {
  /**
   * Create a new maintenance ticket (Resident Tenant)
   */
  createTicket: async (tenantUser, data) => {
    const { isValid, errors } = validateCreateTicketInput(data);
    if (!isValid) {
      const err = new Error(errors.join('. '));
      err.statusCode = 400;
      throw err;
    }

    const { propertyId, bookingId, category, title, description, priority, attachments } = data;

    // Check Property existence
    const property = await Property.findById(propertyId);
    if (!property) {
      const err = new Error('Target property not found');
      err.statusCode = 404;
      throw err;
    }

    // Verify Tenant's Stay/Booking Eligibility
    let booking = null;
    const validBookingStatuses = [
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.CHECKED_IN,
      BOOKING_STATUS.ACTIVE_STAY,
      BOOKING_STATUS.CHECKED_OUT,
    ];

    if (bookingId) {
      booking = await Booking.findOne({
        _id: bookingId,
        tenantId: tenantUser._id,
        propertyId: property._id,
      });

      if (!booking || !validBookingStatuses.includes(booking.status)) {
        const err = new Error(
          'You can only submit maintenance complaints for properties where you have a confirmed or active booking'
        );
        err.statusCode = 403;
        throw err;
      }
    } else {
      // Find latest valid booking
      booking = await Booking.findOne({
        tenantId: tenantUser._id,
        propertyId: property._id,
        status: { $in: validBookingStatuses },
      }).sort({ createdAt: -1 });

      if (!booking) {
        const err = new Error(
          'You do not have an active or confirmed stay record for this property. Maintenance ticket submission is restricted to verified residents.'
        );
        err.statusCode = 403;
        throw err;
      }
    }

    const ticketPriority = priority || TICKET_PRIORITIES.MEDIUM;
    const sla = SLA_CONFIG[ticketPriority] || SLA_CONFIG.MEDIUM;
    const now = new Date();
    const responseDeadline = new Date(now.getTime() + sla.responseHours * 60 * 60 * 1000);
    const resolutionDeadline = new Date(now.getTime() + sla.resolutionHours * 60 * 60 * 1000);

    const ticket = await MaintenanceTicket.create({
      tenantId: tenantUser._id,
      ownerId: property.ownerId,
      propertyId: property._id,
      bookingId: booking._id,
      category,
      title: title.trim(),
      description: description.trim(),
      priority: ticketPriority,
      attachments: attachments || [],
      responseDeadline,
      resolutionDeadline,
      timeline: [
        {
          status: TICKET_STATUSES.OPEN,
          actionBy: tenantUser._id,
          actionByName: tenantUser.name,
          actionRole: tenantUser.role,
          notes: 'Maintenance ticket created by resident',
          timestamp: now,
        },
      ],
    });

    // Notify Landlord (Owner)
    await notificationService.notifyUser({
      userId: property.ownerId,
      type: NOTIFICATION_TYPES.MAINTENANCE_TICKET_CREATED,
      title: `[${ticketPriority}] New Complaint: ${ticket.title}`,
      message: `Resident ${tenantUser.name} logged a ${ticketPriority} ${category} ticket for "${property.title}". SLA response deadline: ${responseDeadline.toLocaleDateString()} ${responseDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      relatedEntity: {
        entityType: 'MAINTENANCE_TICKET',
        entityId: ticket._id,
      },
      actionUrl: '/owner/dashboard',
      priority:
        ticketPriority === TICKET_PRIORITIES.URGENT || ticketPriority === TICKET_PRIORITIES.HIGH
          ? NOTIFICATION_PRIORITY.HIGH
          : NOTIFICATION_PRIORITY.MEDIUM,
    });

    return ticket;
  },

  /**
   * Get all maintenance tickets submitted by the current tenant
   */
  getMyTickets: async (tenantId, params = {}) => {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { tenantId };

    if (params.status && Object.values(TICKET_STATUSES).includes(params.status)) {
      filter.status = params.status;
    }

    if (params.category && Object.values(TICKET_CATEGORIES).includes(params.category)) {
      filter.category = params.category;
    }

    if (params.priority && Object.values(TICKET_PRIORITIES).includes(params.priority)) {
      filter.priority = params.priority;
    }

    if (params.search) {
      const searchRegex = new RegExp(params.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { ticketReference: searchRegex },
      ];
    }

    const tickets = await MaintenanceTicket.find(filter)
      .populate('propertyId', 'title address images')
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MaintenanceTicket.countDocuments(filter);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Get tickets for properties owned by landlord
   */
  getOwnerTickets: async (ownerId, params = {}) => {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { ownerId };

    if (params.propertyId && mongoose.Types.ObjectId.isValid(params.propertyId)) {
      filter.propertyId = params.propertyId;
    }

    if (params.status && Object.values(TICKET_STATUSES).includes(params.status)) {
      filter.status = params.status;
    }

    if (params.category && Object.values(TICKET_CATEGORIES).includes(params.category)) {
      filter.category = params.category;
    }

    if (params.priority && Object.values(TICKET_PRIORITIES).includes(params.priority)) {
      filter.priority = params.priority;
    }

    if (params.search) {
      const searchRegex = new RegExp(params.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { ticketReference: searchRegex },
      ];
    }

    const tickets = await MaintenanceTicket.find(filter)
      .populate('propertyId', 'title address images')
      .populate('tenantId', 'name email phone occupation avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MaintenanceTicket.countDocuments(filter);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Get single maintenance ticket details with security guards
   */
  getTicketById: async (ticketId, user) => {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      const err = new Error('Invalid ticket ID');
      err.statusCode = 400;
      throw err;
    }

    const ticket = await MaintenanceTicket.findById(ticketId)
      .populate('propertyId', 'title address images propertyType')
      .populate('tenantId', 'name email phone occupation avatar')
      .populate('ownerId', 'name email phone')
      .populate('bookingId', 'bookingReference roomName roomType moveInDate isVerifiedResident');

    if (!ticket) {
      const err = new Error('Maintenance ticket not found');
      err.statusCode = 404;
      throw err;
    }

    // Role-Based Access Guard
    if (user.role === ROLES.USER && ticket.tenantId._id.toString() !== user._id.toString()) {
      const err = new Error('You are not authorized to view this ticket');
      err.statusCode = 403;
      throw err;
    }

    if (user.role === ROLES.OWNER && ticket.ownerId._id.toString() !== user._id.toString()) {
      const err = new Error('You are not authorized to view another owner’s maintenance ticket');
      err.statusCode = 403;
      throw err;
    }

    return ticket;
  },

  /**
   * Owner acknowledges a complaint (OPEN / REOPENED -> ACKNOWLEDGED)
   */
  acknowledgeTicket: async (ticketId, ownerUser, payload = {}) => {
    const { isValid, errors } = validateAcknowledgeInput(payload);
    if (!isValid) {
      const err = new Error(errors.join('. '));
      err.statusCode = 400;
      throw err;
    }

    const ticket = await MaintenanceTicket.findById(ticketId);
    if (!ticket) {
      const err = new Error('Maintenance ticket not found');
      err.statusCode = 404;
      throw err;
    }

    if (
      ownerUser.role !== ROLES.ADMIN &&
      ticket.ownerId.toString() !== ownerUser._id.toString()
    ) {
      const err = new Error('You are not authorized to acknowledge this ticket');
      err.statusCode = 403;
      throw err;
    }

    if (
      ticket.status !== TICKET_STATUSES.OPEN &&
      ticket.status !== TICKET_STATUSES.REOPENED
    ) {
      const err = new Error(
        `Cannot acknowledge ticket in current status '${ticket.status}'. Must be OPEN or REOPENED.`
      );
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    ticket.status = TICKET_STATUSES.ACKNOWLEDGED;
    ticket.acknowledgedAt = now;

    if (payload.ownerResponse) {
      ticket.ownerResponse = payload.ownerResponse.trim();
    }

    // SLA response check
    const diffHours = (now.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
    ticket.responseDurationHours = parseFloat(diffHours.toFixed(2));
    if (now > ticket.responseDeadline) {
      ticket.responseBreached = true;
    }

    ticket.timeline.push({
      status: TICKET_STATUSES.ACKNOWLEDGED,
      actionBy: ownerUser._id,
      actionByName: ownerUser.name,
      actionRole: ownerUser.role,
      notes: payload.ownerResponse || 'Ticket acknowledged by landlord',
      timestamp: now,
    });

    await ticket.save();

    // Notify Tenant
    await notificationService.notifyUser({
      userId: ticket.tenantId,
      type: NOTIFICATION_TYPES.MAINTENANCE_TICKET_ACKNOWLEDGED,
      title: `Complaint Acknowledged: ${ticket.title}`,
      message: `Your landlord has acknowledged ticket #${ticket.ticketReference}.${ticket.ownerResponse ? ` Response: "${ticket.ownerResponse}"` : ''}`,
      relatedEntity: {
        entityType: 'MAINTENANCE_TICKET',
        entityId: ticket._id,
      },
      actionUrl: '/user/dashboard',
      priority: NOTIFICATION_PRIORITY.MEDIUM,
    });

    return ticket;
  },

  /**
   * Owner starts work on the ticket (ACKNOWLEDGED / OPEN / REOPENED -> IN_PROGRESS)
   */
  startTicket: async (ticketId, ownerUser, payload = {}) => {
    const { isValid, errors } = validateStartTicketInput(payload);
    if (!isValid) {
      const err = new Error(errors.join('. '));
      err.statusCode = 400;
      throw err;
    }

    const ticket = await MaintenanceTicket.findById(ticketId);
    if (!ticket) {
      const err = new Error('Maintenance ticket not found');
      err.statusCode = 404;
      throw err;
    }

    if (
      ownerUser.role !== ROLES.ADMIN &&
      ticket.ownerId.toString() !== ownerUser._id.toString()
    ) {
      const err = new Error('You are not authorized to update this ticket');
      err.statusCode = 403;
      throw err;
    }

    if (
      ticket.status === TICKET_STATUSES.RESOLVED ||
      ticket.status === TICKET_STATUSES.CLOSED
    ) {
      const err = new Error(`Cannot start work on a '${ticket.status}' ticket`);
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    ticket.status = TICKET_STATUSES.IN_PROGRESS;
    if (!ticket.startedAt) {
      ticket.startedAt = now;
    }
    if (!ticket.acknowledgedAt) {
      ticket.acknowledgedAt = now;
      const diffHours = (now.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
      ticket.responseDurationHours = parseFloat(diffHours.toFixed(2));
      if (now > ticket.responseDeadline) ticket.responseBreached = true;
    }

    if (payload.assignedTo) {
      ticket.assignedTo = payload.assignedTo.trim();
    }

    ticket.timeline.push({
      status: TICKET_STATUSES.IN_PROGRESS,
      actionBy: ownerUser._id,
      actionByName: ownerUser.name,
      actionRole: ownerUser.role,
      notes: payload.notes || `Work in progress${payload.assignedTo ? ` (Assigned: ${payload.assignedTo})` : ''}`,
      timestamp: now,
    });

    await ticket.save();

    // Notify Tenant
    await notificationService.notifyUser({
      userId: ticket.tenantId,
      type: NOTIFICATION_TYPES.MAINTENANCE_TICKET_STARTED,
      title: `Maintenance in Progress: ${ticket.title}`,
      message: `Technician assigned / repair work has commenced on ticket #${ticket.ticketReference}.${ticket.assignedTo ? ` Lead: ${ticket.assignedTo}.` : ''}`,
      relatedEntity: {
        entityType: 'MAINTENANCE_TICKET',
        entityId: ticket._id,
      },
      actionUrl: '/user/dashboard',
      priority: NOTIFICATION_PRIORITY.MEDIUM,
    });

    return ticket;
  },

  /**
   * Owner resolves the complaint (IN_PROGRESS / ACKNOWLEDGED -> RESOLVED)
   */
  resolveTicket: async (ticketId, ownerUser, payload = {}) => {
    const { isValid, errors } = validateResolveTicketInput(payload);
    if (!isValid) {
      const err = new Error(errors.join('. '));
      err.statusCode = 400;
      throw err;
    }

    const ticket = await MaintenanceTicket.findById(ticketId);
    if (!ticket) {
      const err = new Error('Maintenance ticket not found');
      err.statusCode = 404;
      throw err;
    }

    if (
      ownerUser.role !== ROLES.ADMIN &&
      ticket.ownerId.toString() !== ownerUser._id.toString()
    ) {
      const err = new Error('You are not authorized to resolve this ticket');
      err.statusCode = 403;
      throw err;
    }

    if (ticket.status === TICKET_STATUSES.CLOSED) {
      const err = new Error('Cannot resolve an already closed ticket');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    ticket.status = TICKET_STATUSES.RESOLVED;
    ticket.resolvedAt = now;
    ticket.resolutionNotes = payload.resolutionNotes.trim();

    // SLA resolution duration check
    const diffHours = (now.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
    ticket.resolutionDurationHours = parseFloat(diffHours.toFixed(2));
    if (now > ticket.resolutionDeadline) {
      ticket.resolutionBreached = true;
    }

    ticket.timeline.push({
      status: TICKET_STATUSES.RESOLVED,
      actionBy: ownerUser._id,
      actionByName: ownerUser.name,
      actionRole: ownerUser.role,
      notes: `Issue resolved. Notes: ${ticket.resolutionNotes}`,
      timestamp: now,
    });

    await ticket.save();

    // Notify Tenant
    await notificationService.notifyUser({
      userId: ticket.tenantId,
      type: NOTIFICATION_TYPES.MAINTENANCE_TICKET_RESOLVED,
      title: `Complaint Resolved: ${ticket.title}`,
      message: `Your maintenance ticket #${ticket.ticketReference} has been marked as RESOLVED. Notes: "${ticket.resolutionNotes}". Please close the ticket or reopen if the issue persists.`,
      relatedEntity: {
        entityType: 'MAINTENANCE_TICKET',
        entityId: ticket._id,
      },
      actionUrl: '/user/dashboard',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    return ticket;
  },

  /**
   * Close a resolved ticket (Tenant or Landlord)
   */
  closeTicket: async (ticketId, user, payload = {}) => {
    const ticket = await MaintenanceTicket.findById(ticketId);
    if (!ticket) {
      const err = new Error('Maintenance ticket not found');
      err.statusCode = 404;
      throw err;
    }

    const isTenant = ticket.tenantId.toString() === user._id.toString();
    const isOwner = ticket.ownerId.toString() === user._id.toString();
    const isAdmin = user.role === ROLES.ADMIN;

    if (!isTenant && !isOwner && !isAdmin) {
      const err = new Error('You are not authorized to close this ticket');
      err.statusCode = 403;
      throw err;
    }

    if (ticket.status === TICKET_STATUSES.CLOSED) {
      const err = new Error('Ticket is already closed');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    ticket.status = TICKET_STATUSES.CLOSED;
    ticket.closedAt = now;

    ticket.timeline.push({
      status: TICKET_STATUSES.CLOSED,
      actionBy: user._id,
      actionByName: user.name,
      actionRole: user.role,
      notes: payload.feedback || `Ticket verified and closed by ${user.role}`,
      timestamp: now,
    });

    await ticket.save();

    // Notify counterpart
    const notifyTargetId = isTenant ? ticket.ownerId : ticket.tenantId;
    await notificationService.notifyUser({
      userId: notifyTargetId,
      type: NOTIFICATION_TYPES.MAINTENANCE_TICKET_CLOSED,
      title: `Ticket Closed: #${ticket.ticketReference}`,
      message: `Maintenance ticket "${ticket.title}" has been formally closed by ${user.name}.`,
      relatedEntity: {
        entityType: 'MAINTENANCE_TICKET',
        entityId: ticket._id,
      },
      actionUrl: isTenant ? '/owner/dashboard' : '/user/dashboard',
      priority: NOTIFICATION_PRIORITY.LOW,
    });

    return ticket;
  },

  /**
   * Tenant reopens an unresolved ticket
   */
  reopenTicket: async (ticketId, tenantUser, payload = {}) => {
    const { isValid, errors } = validateReopenTicketInput(payload);
    if (!isValid) {
      const err = new Error(errors.join('. '));
      err.statusCode = 400;
      throw err;
    }

    const ticket = await MaintenanceTicket.findById(ticketId);
    if (!ticket) {
      const err = new Error('Maintenance ticket not found');
      err.statusCode = 404;
      throw err;
    }

    if (
      tenantUser.role !== ROLES.ADMIN &&
      ticket.tenantId.toString() !== tenantUser._id.toString()
    ) {
      const err = new Error('Only the ticket creator can reopen this complaint');
      err.statusCode = 403;
      throw err;
    }

    if (
      ticket.status !== TICKET_STATUSES.RESOLVED &&
      ticket.status !== TICKET_STATUSES.CLOSED
    ) {
      const err = new Error(
        `Ticket is already active (status: '${ticket.status}'). Only resolved or closed tickets can be reopened.`
      );
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    ticket.status = TICKET_STATUSES.REOPENED;
    ticket.reopenedAt = now;

    ticket.timeline.push({
      status: TICKET_STATUSES.REOPENED,
      actionBy: tenantUser._id,
      actionByName: tenantUser.name,
      actionRole: tenantUser.role,
      notes: `Ticket reopened by resident. Reason: ${payload.reason.trim()}`,
      timestamp: now,
    });

    await ticket.save();

    // High priority notification to Landlord
    await notificationService.notifyUser({
      userId: ticket.ownerId,
      type: NOTIFICATION_TYPES.MAINTENANCE_TICKET_REOPENED,
      title: `[REOPENED] Issue Persists: ${ticket.title}`,
      message: `Resident ${tenantUser.name} has reopened ticket #${ticket.ticketReference}. Reason: "${payload.reason.trim()}". Immediate resolution required.`,
      relatedEntity: {
        entityType: 'MAINTENANCE_TICKET',
        entityId: ticket._id,
      },
      actionUrl: '/owner/dashboard',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    return ticket;
  },

  /**
   * SLA Metrics Summary for Owner or Property
   */
  getSLASummary: async (ownerId, propertyId = null) => {
    const filter = {};
    if (ownerId) filter.ownerId = ownerId;
    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
      filter.propertyId = propertyId;
    }

    const allTickets = await MaintenanceTicket.find(filter);
    const now = new Date();

    let totalTickets = allTickets.length;
    let openTickets = 0;
    let inProgressTickets = 0;
    let acknowledgedTickets = 0;
    let resolvedTickets = 0;
    let closedTickets = 0;
    let reopenedTickets = 0;
    let urgentTickets = 0;
    let overdueTickets = 0;
    let responseBreachedCount = 0;
    let resolutionBreachedCount = 0;

    let totalResponseDuration = 0;
    let countResponded = 0;

    let totalResolutionDuration = 0;
    let countResolved = 0;

    const byPriority = {
      [TICKET_PRIORITIES.LOW]: 0,
      [TICKET_PRIORITIES.MEDIUM]: 0,
      [TICKET_PRIORITIES.HIGH]: 0,
      [TICKET_PRIORITIES.URGENT]: 0,
    };

    const byCategory = {
      [TICKET_CATEGORIES.ELECTRICAL]: 0,
      [TICKET_CATEGORIES.PLUMBING]: 0,
      [TICKET_CATEGORIES.INTERNET]: 0,
      [TICKET_CATEGORIES.CLEANING]: 0,
      [TICKET_CATEGORIES.APPLIANCE]: 0,
      [TICKET_CATEGORIES.FURNITURE]: 0,
      [TICKET_CATEGORIES.WATER]: 0,
      [TICKET_CATEGORIES.SECURITY]: 0,
      [TICKET_CATEGORIES.OTHER]: 0,
    };

    for (const t of allTickets) {
      if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;
      if (byCategory[t.category] !== undefined) byCategory[t.category]++;

      if (t.priority === TICKET_PRIORITIES.URGENT && t.status !== TICKET_STATUSES.RESOLVED && t.status !== TICKET_STATUSES.CLOSED) {
        urgentTickets++;
      }

      if (t.status === TICKET_STATUSES.OPEN) openTickets++;
      else if (t.status === TICKET_STATUSES.ACKNOWLEDGED) acknowledgedTickets++;
      else if (t.status === TICKET_STATUSES.IN_PROGRESS) inProgressTickets++;
      else if (t.status === TICKET_STATUSES.RESOLVED) resolvedTickets++;
      else if (t.status === TICKET_STATUSES.CLOSED) closedTickets++;
      else if (t.status === TICKET_STATUSES.REOPENED) reopenedTickets++;

      // Response SLA calculation
      let isRespBreached = t.responseBreached;
      if (!isRespBreached && !t.acknowledgedAt && t.status === TICKET_STATUSES.OPEN && now > t.responseDeadline) {
        isRespBreached = true;
      }
      if (isRespBreached) responseBreachedCount++;

      if (t.responseDurationHours != null) {
        totalResponseDuration += t.responseDurationHours;
        countResponded++;
      }

      // Resolution SLA calculation
      let isResBreached = t.resolutionBreached;
      if (
        !isResBreached &&
        !t.resolvedAt &&
        t.status !== TICKET_STATUSES.RESOLVED &&
        t.status !== TICKET_STATUSES.CLOSED &&
        now > t.resolutionDeadline
      ) {
        isResBreached = true;
      }
      if (isResBreached) resolutionBreachedCount++;

      if (t.resolutionDurationHours != null) {
        totalResolutionDuration += t.resolutionDurationHours;
        countResolved++;
      }

      // Overdue definition
      if (
        (t.status !== TICKET_STATUSES.RESOLVED && t.status !== TICKET_STATUSES.CLOSED && now > t.resolutionDeadline) ||
        (t.status === TICKET_STATUSES.OPEN && now > t.responseDeadline)
      ) {
        overdueTickets++;
      }
    }

    const activeTickets = openTickets + acknowledgedTickets + inProgressTickets + reopenedTickets;
    const totalBreached = responseBreachedCount + resolutionBreachedCount;
    const slaBreachRate = totalTickets > 0 ? parseFloat(((resolutionBreachedCount / totalTickets) * 100).toFixed(1)) : 0;
    const avgResponseHours = countResponded > 0 ? parseFloat((totalResponseDuration / countResponded).toFixed(1)) : 0;
    const avgResolutionHours = countResolved > 0 ? parseFloat((totalResolutionDuration / countResolved).toFixed(1)) : 0;

    return {
      totalTickets,
      activeTickets,
      openTickets,
      acknowledgedTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      reopenedTickets,
      urgentTickets,
      overdueTickets,
      responseBreachedCount,
      resolutionBreachedCount,
      slaBreachRate,
      avgResponseHours,
      avgResolutionHours,
      byPriority,
      byCategory,
    };
  },

  /**
   * Admin Platform Maintenance Monitoring Overview
   */
  getAdminOverview: async (params = {}) => {
    const summary = await maintenanceService.getSLASummary(null);

    // Performance by Landlord / Owner
    const ownerAggregation = await MaintenanceTicket.aggregate([
      {
        $group: {
          _id: '$ownerId',
          total: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [
                { $in: ['$status', [TICKET_STATUSES.RESOLVED, TICKET_STATUSES.CLOSED]] },
                1,
                0,
              ],
            },
          },
          breaches: {
            $sum: {
              $cond: [
                { $or: ['$responseBreached', '$resolutionBreached'] },
                1,
                0,
              ],
            },
          },
          avgResolutionHours: { $avg: '$resolutionDurationHours' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    const ownerPerformance = await Promise.all(
      ownerAggregation.map(async (row) => {
        const ownerUser = await User.findById(row._id).select('name email phone');
        const ownerProf = await OwnerProfile.findOne({ userId: row._id }).select('businessName');
        return {
          ownerId: row._id,
          name: ownerUser?.name || 'Unknown Landlord',
          email: ownerUser?.email || '',
          businessName: ownerProf?.businessName || 'Independent Landlord',
          totalTickets: row.total,
          resolvedCount: row.resolved,
          breachCount: row.breaches,
          avgResolutionHours: row.avgResolutionHours ? parseFloat(row.avgResolutionHours.toFixed(1)) : 0,
        };
      })
    );

    // Performance by Property
    const propertyAggregation = await MaintenanceTicket.aggregate([
      {
        $group: {
          _id: '$propertyId',
          total: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [
                { $in: ['$status', [TICKET_STATUSES.RESOLVED, TICKET_STATUSES.CLOSED]] },
                1,
                0,
              ],
            },
          },
          breaches: {
            $sum: {
              $cond: [
                { $or: ['$responseBreached', '$resolutionBreached'] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    const propertyPerformance = await Promise.all(
      propertyAggregation.map(async (row) => {
        const prop = await Property.findById(row._id).select('title address');
        return {
          propertyId: row._id,
          title: prop?.title || 'Unknown Property',
          city: prop?.address?.city || 'Bengaluru',
          totalTickets: row.total,
          resolvedCount: row.resolved,
          breachCount: row.breaches,
        };
      })
    );

    return {
      ...summary,
      ownerPerformance,
      propertyPerformance,
    };
  },
};

export default maintenanceService;
