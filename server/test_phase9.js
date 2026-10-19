import http from 'http';

const API_BASE = 'http://localhost:5000/api/v1';

const request = (url, options = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runPhase9Tests() {
  console.log('================================================================');
  console.log('🚀 Starting StayEasy Phase 9: Maintenance Tickets & SLA Tests');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, extraInfo = '') => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} (${extraInfo})`);
      failed++;
    }
  };

  try {
    const timestamp = Date.now();
    const owner1Email = `owner1_p9_${timestamp}@stayeasy.local`;
    const owner2Email = `owner2_p9_${timestamp}@stayeasy.local`;
    const tenant1Email = `tenant1_p9_${timestamp}@stayeasy.local`;
    const tenant2Email = `tenant2_p9_${timestamp}@stayeasy.local`;
    const adminEmail = `admin_p9_${timestamp}@stayeasy.local`;
    const password = 'Password123!';

    // 1. Register Accounts
    const owner1Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P9 Landlord One',
      email: owner1Email,
      password,
      role: 'OWNER',
      phone: '9876590001',
      businessName: 'P9 Elite Hostels',
    });
    assert(owner1Res.status === 201 && owner1Res.body.success, '1. Register Owner 1 Account');
    const owner1Token = owner1Res.body.data?.token;
    const owner1Id = owner1Res.body.data?.user?._id || owner1Res.body.data?.user?.id;

    const owner2Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P9 Landlord Two',
      email: owner2Email,
      password,
      role: 'OWNER',
      phone: '9876590002',
      businessName: 'P9 Horizon Stays',
    });
    assert(owner2Res.status === 201 && owner2Res.body.success, '2. Register Owner 2 Account');
    const owner2Token = owner2Res.body.data?.token;

    const tenant1Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P9 Resident Tenant',
      email: tenant1Email,
      password,
      role: 'USER',
      phone: '9876590003',
    });
    assert(tenant1Res.status === 201 && tenant1Res.body.success, '3. Register Resident Tenant 1');
    const tenant1Token = tenant1Res.body.data?.token;
    const tenant1Id = tenant1Res.body.data?.user?._id || tenant1Res.body.data?.user?.id;

    const tenant2Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P9 Other Tenant',
      email: tenant2Email,
      password,
      role: 'USER',
      phone: '9876590004',
    });
    assert(tenant2Res.status === 201 && tenant2Res.body.success, '4. Register Tenant 2 (No Stay)');
    const tenant2Token = tenant2Res.body.data?.token;

    const adminRes = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P9 Platform Admin',
      email: adminEmail,
      password,
      role: 'ADMIN',
      phone: '9876590005',
    });
    assert(adminRes.status === 201 && adminRes.body.success, '5. Register Admin Account');
    const adminToken = adminRes.body.data?.token;

    // 2. Create and Verify Property for Owner 1
    const propRes = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, {
      title: 'P9 Tech Residency PG',
      tagline: 'High Speed WiFi with 24/7 Power Backup',
      description: 'Dedicated student & working professional living facility with SLA guaranteed maintenance.',
      propertyType: 'PG',
      genderPreference: 'UNISEX',
      address: {
        street: '100 Feet Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        landmark: 'Near Metro',
      },
      images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
      roomConfigurations: [
        {
          type: 'SINGLE',
          name: 'Private Deluxe AC',
          rent: 14000,
          deposit: 20000,
          totalBeds: 5,
          availableBeds: 3,
        },
      ],
      pricing: {
        electricityBilling: 'PER_UNIT',
        electricityRatePerUnit: 10,
        securityDepositMonths: 2,
      },
    });
    assert(propRes.status === 201 && propRes.body.success, '6. Create Property Listing for Owner 1');
    const propertyId = propRes.body.data?.property?._id;
    const roomConfigId = propRes.body.data?.property?.roomConfigurations[0]?._id;

    // Verify property via Admin
    await request(`${API_BASE}/properties/${propertyId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, { status: 'VERIFIED', auditNotes: 'Verified for P9' });

    // 3. Security: Block Unauthorized Tenant (No Stay) from Creating Ticket
    const unauthTicketRes = await request(`${API_BASE}/maintenance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant2Token}` },
    }, {
      propertyId,
      category: 'PLUMBING',
      title: 'Leaking bathroom tap',
      description: 'The tap has been leaking continuous water since morning.',
      priority: 'HIGH',
    });
    assert(
      unauthTicketRes.status === 403,
      '7. Security: Block unverified user with no stay from submitting ticket (HTTP 403)',
      unauthTicketRes.body?.message
    );

    // 4. Create Active Stay / Checked-In Booking for Tenant 1
    const bookingRes = await request(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    }, {
      propertyId,
      roomConfigId,
      moveInDate: new Date(Date.now() + 86400000).toISOString(),
      durationMonths: 3,
    });
    assert(bookingRes.status === 201 && bookingRes.body.success, '8. Tenant 1 reserves bed/room');
    const bookingId = bookingRes.body.data?.booking?._id;

    // Landlord accepts & checks in Tenant 1
    await request(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, { status: 'ACCEPTED' });

    await request(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, { status: 'CHECKED_IN' });

    // 5. Valid Tenant Creates Maintenance Ticket
    const validTicketRes = await request(`${API_BASE}/maintenance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    }, {
      propertyId,
      bookingId,
      category: 'ELECTRICAL',
      title: 'Geyser not heating in Room 204',
      description: 'Water heater power light is blinking but water remains cold. Urgent repair needed before winter morning.',
      priority: 'HIGH',
      attachments: ['https://images.unsplash.com/photo-example-geyser.jpg'],
    });
    assert(
      validTicketRes.status === 201 &&
        validTicketRes.body.success &&
        validTicketRes.body.data?.ticket?.priority === 'HIGH' &&
        validTicketRes.body.data?.ticket?.status === 'OPEN' &&
        validTicketRes.body.data?.ticket?.responseDeadline != null &&
        validTicketRes.body.data?.ticket?.resolutionDeadline != null,
      '9. Valid Resident submits HIGH priority maintenance ticket with SLA deadlines'
    );
    const ticketId = validTicketRes.body.data?.ticket?._id;
    const ticketRef = validTicketRes.body.data?.ticket?.ticketReference;

    // 6. Verify SLA Deadlines calculation for HIGH priority (8h response, 24h resolution)
    const createdAt = new Date(validTicketRes.body.data?.ticket?.createdAt).getTime();
    const respDeadline = new Date(validTicketRes.body.data?.ticket?.responseDeadline).getTime();
    const resDeadline = new Date(validTicketRes.body.data?.ticket?.resolutionDeadline).getTime();
    const diffRespHours = Math.round((respDeadline - createdAt) / (1000 * 60 * 60));
    const diffResHours = Math.round((resDeadline - createdAt) / (1000 * 60 * 60));
    assert(
      diffRespHours === 8 && diffResHours === 24,
      '10. SLA deadlines generated accurately for HIGH priority (8h response / 24h resolution)'
    );

    // 7. Owner 1 Receives MAINTENANCE_TICKET_CREATED Notification
    const owner1Notifs = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const createdNotif = owner1Notifs.body.data?.notifications?.find(
      (n) => n.type === 'MAINTENANCE_TICKET_CREATED'
    );
    assert(
      createdNotif != null && createdNotif.title?.includes('Geyser not heating'),
      '11. Owner 1 receives MAINTENANCE_TICKET_CREATED notification'
    );

    // 8. Security Guard: Owner 2 cannot access Owner 1's ticket
    const owner2AccessTicket = await request(`${API_BASE}/maintenance/${ticketId}`, {
      headers: { Authorization: `Bearer ${owner2Token}` },
    });
    assert(
      owner2AccessTicket.status === 403,
      '12. RBAC Guard: Owner 2 forbidden from accessing Owner 1 maintenance ticket (HTTP 403)'
    );

    // 9. Security Guard: Tenant 2 cannot access Tenant 1's ticket
    const tenant2AccessTicket = await request(`${API_BASE}/maintenance/${ticketId}`, {
      headers: { Authorization: `Bearer ${tenant2Token}` },
    });
    assert(
      tenant2AccessTicket.status === 403,
      '13. RBAC Guard: Tenant 2 forbidden from accessing Tenant 1 maintenance ticket (HTTP 403)'
    );

    // 10. Owner Acknowledges Ticket (OPEN -> ACKNOWLEDGED)
    const ackRes = await request(`${API_BASE}/maintenance/${ticketId}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, {
      ownerResponse: 'Electrician has been contacted and will visit today by 2 PM.',
    });
    assert(
      ackRes.status === 200 &&
        ackRes.body.success &&
        ackRes.body.data?.ticket?.status === 'ACKNOWLEDGED' &&
        ackRes.body.data?.ticket?.acknowledgedAt != null &&
        ackRes.body.data?.ticket?.ownerResponse?.includes('Electrician has been contacted'),
      '14. Owner 1 acknowledges ticket with response note'
    );

    // 11. Tenant 1 Receives MAINTENANCE_TICKET_ACKNOWLEDGED Notification
    const tenant1Notifs = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    const ackNotif = tenant1Notifs.body.data?.notifications?.find(
      (n) => n.type === 'MAINTENANCE_TICKET_ACKNOWLEDGED'
    );
    assert(
      ackNotif != null && ackNotif.message?.includes('Electrician has been contacted'),
      '15. Tenant 1 receives MAINTENANCE_TICKET_ACKNOWLEDGED notification'
    );

    // 12. Owner Starts Work (ACKNOWLEDGED -> IN_PROGRESS)
    const startRes = await request(`${API_BASE}/maintenance/${ticketId}/start`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, {
      assignedTo: 'Ramesh Sharma (Senior Electrician, 9845012345)',
      notes: 'Inspecting heating element and thermostat wiring.',
    });
    assert(
      startRes.status === 200 &&
        startRes.body.success &&
        startRes.body.data?.ticket?.status === 'IN_PROGRESS' &&
        startRes.body.data?.ticket?.startedAt != null &&
        startRes.body.data?.ticket?.assignedTo?.includes('Ramesh Sharma'),
      '16. Owner 1 transitions ticket to IN_PROGRESS and assigns technician'
    );

    // 13. Tenant 1 Receives MAINTENANCE_TICKET_STARTED Notification
    const tenant1NotifsAfterStart = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    const startNotif = tenant1NotifsAfterStart.body.data?.notifications?.find(
      (n) => n.type === 'MAINTENANCE_TICKET_STARTED'
    );
    assert(
      startNotif != null && startNotif.message?.includes('Ramesh Sharma'),
      '17. Tenant 1 receives MAINTENANCE_TICKET_STARTED notification'
    );

    // 14. Owner Resolves Complaint (IN_PROGRESS -> RESOLVED)
    const resolveRes = await request(`${API_BASE}/maintenance/${ticketId}/resolve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, {
      resolutionNotes: 'Replaced thermostat coil and tested hot water delivery. Temperature normalized at 55°C.',
    });
    assert(
      resolveRes.status === 200 &&
        resolveRes.body.success &&
        resolveRes.body.data?.ticket?.status === 'RESOLVED' &&
        resolveRes.body.data?.ticket?.resolvedAt != null &&
        resolveRes.body.data?.ticket?.resolutionDurationHours != null,
      '18. Owner 1 marks ticket as RESOLVED with resolution notes'
    );

    // 15. Tenant 1 Receives MAINTENANCE_TICKET_RESOLVED Notification
    const tenant1NotifsAfterResolve = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    const resolveNotif = tenant1NotifsAfterResolve.body.data?.notifications?.find(
      (n) => n.type === 'MAINTENANCE_TICKET_RESOLVED'
    );
    assert(
      resolveNotif != null && resolveNotif.message?.includes('Replaced thermostat coil'),
      '19. Tenant 1 receives MAINTENANCE_TICKET_RESOLVED notification'
    );

    // 16. Tenant Reopens Ticket (RESOLVED -> REOPENED)
    const reopenRes = await request(`${API_BASE}/maintenance/${ticketId}/reopen`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    }, {
      reason: 'Water tripped the main circuit breaker after 10 minutes of operation. Still defective.',
    });
    assert(
      reopenRes.status === 200 &&
        reopenRes.body.success &&
        reopenRes.body.data?.ticket?.status === 'REOPENED' &&
        reopenRes.body.data?.ticket?.reopenedAt != null,
      '20. Tenant 1 reopens ticket with reason (RESOLVED -> REOPENED)'
    );

    // 17. Owner 1 Receives MAINTENANCE_TICKET_REOPENED Notification
    const owner1NotifsAfterReopen = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const reopenNotif = owner1NotifsAfterReopen.body.data?.notifications?.find(
      (n) => n.type === 'MAINTENANCE_TICKET_REOPENED'
    );
    assert(
      reopenNotif != null && reopenNotif.message?.includes('tripped the main circuit breaker'),
      '21. Owner 1 receives MAINTENANCE_TICKET_REOPENED high-priority alert'
    );

    // 18. Re-resolve and Close Ticket (REOPENED -> IN_PROGRESS -> RESOLVED -> CLOSED)
    await request(`${API_BASE}/maintenance/${ticketId}/start`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, { notes: 'Fixed short circuit in secondary breaker.' });

    await request(`${API_BASE}/maintenance/${ticketId}/resolve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, { resolutionNotes: 'Replaced wiring and circuit breaker. Fully certified safe.' });

    const closeRes = await request(`${API_BASE}/maintenance/${ticketId}/close`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    }, { feedback: 'Working perfectly now. Verified!' });
    assert(
      closeRes.status === 200 &&
        closeRes.body.success &&
        closeRes.body.data?.ticket?.status === 'CLOSED' &&
        closeRes.body.data?.ticket?.closedAt != null,
      '22. Tenant 1 formally closes the verified ticket (RESOLVED -> CLOSED)'
    );

    // 19. Security: Block resolving already closed ticket
    const invalidResolveRes = await request(`${API_BASE}/maintenance/${ticketId}/resolve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, { resolutionNotes: 'Attempting invalid resolution' });
    assert(
      invalidResolveRes.status === 400,
      '23. Invalid Status Transition: Block resolving an already closed ticket (HTTP 400)'
    );

    // 20. Tenant Queries my-tickets
    const myTicketsRes = await request(`${API_BASE}/maintenance/my-tickets`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      myTicketsRes.status === 200 &&
        myTicketsRes.body.success &&
        myTicketsRes.body.data?.tickets?.length >= 1 &&
        myTicketsRes.body.data?.tickets[0]?.ticketReference === ticketRef,
      '24. GET /api/v1/maintenance/my-tickets returns tenant ticket history & status'
    );

    // 21. Owner Queries owner-tickets
    const ownerTicketsRes = await request(`${API_BASE}/maintenance/owner-tickets`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(
      ownerTicketsRes.status === 200 &&
        ownerTicketsRes.body.success &&
        ownerTicketsRes.body.data?.tickets?.length >= 1,
      '25. GET /api/v1/maintenance/owner-tickets returns tickets for Landlord'
    );

    // 22. SLA Summary API (Landlord metrics)
    const slaSummaryRes = await request(`${API_BASE}/maintenance/sla-summary`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(
      slaSummaryRes.status === 200 &&
        slaSummaryRes.body.success &&
        typeof slaSummaryRes.body.data?.summary?.totalTickets === 'number' &&
        typeof slaSummaryRes.body.data?.summary?.resolvedTickets === 'number' &&
        typeof slaSummaryRes.body.data?.summary?.slaBreachRate === 'number' &&
        typeof slaSummaryRes.body.data?.summary?.avgResolutionHours === 'number',
      '26. GET /api/v1/maintenance/sla-summary computes accurate turnaround & breach rates'
    );

    // 23. Admin Overview API (Platform maintenance monitoring)
    const adminOverviewRes = await request(`${API_BASE}/maintenance/admin-overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminOverviewRes.status === 200 &&
        adminOverviewRes.body.success &&
        typeof adminOverviewRes.body.data?.overview?.totalTickets === 'number' &&
        Array.isArray(adminOverviewRes.body.data?.overview?.ownerPerformance) &&
        Array.isArray(adminOverviewRes.body.data?.overview?.propertyPerformance),
      '27. GET /api/v1/maintenance/admin-overview returns system audit & performance breakdown'
    );

    // 24. SLA Priorities Deadlines Verification across LOW, MEDIUM, HIGH, URGENT
    const priorityChecks = [
      { p: 'LOW', expectedResp: 48, expectedRes: 120 },
      { p: 'MEDIUM', expectedResp: 24, expectedRes: 72 },
      { p: 'URGENT', expectedResp: 2, expectedRes: 8 },
    ];

    for (const pc of priorityChecks) {
      const pTicket = await request(`${API_BASE}/maintenance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tenant1Token}` },
      }, {
        propertyId,
        bookingId,
        category: 'INTERNET',
        title: `Test ${pc.p} Priority WiFi Connectivity issue`,
        description: 'Router is frequently disconnecting every five minutes.',
        priority: pc.p,
      });
      const tCreated = new Date(pTicket.body.data?.ticket?.createdAt).getTime();
      const tResp = new Date(pTicket.body.data?.ticket?.responseDeadline).getTime();
      const tRes = new Date(pTicket.body.data?.ticket?.resolutionDeadline).getTime();
      const actualResp = Math.round((tResp - tCreated) / (1000 * 60 * 60));
      const actualRes = Math.round((tRes - tCreated) / (1000 * 60 * 60));
      assert(
        actualResp === pc.expectedResp && actualRes === pc.expectedRes,
        `28-${pc.p}. SLA calculation verified for ${pc.p} Priority (${pc.expectedResp}h response / ${pc.expectedRes}h resolution)`
      );
    }

    // 25. Isolation: Tenant 2 should not see Tenant 1 notifications
    const tenant2Notifs = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tenant2Token}` },
    });
    const leakNotif = tenant2Notifs.body.data?.notifications?.find(
      (n) => n.message?.includes('Geyser not heating') || n.message?.includes('Ramesh Sharma')
    );
    assert(
      leakNotif == null,
      '29. Notification user isolation: Tenant 2 has 0 notification leak from Tenant 1'
    );

    // 26. Health Check verifies Phase
    const health = await request(`${API_BASE}/health`);
    assert(
      health.status === 200 &&
        health.body.data?.phase?.includes('Phase'),
      '30. GET /api/v1/health reports active StayEasy Phase'
    );

    console.log('\n================================================================');
    console.log(`📊 Phase 9 Test Suite Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error in Phase 9 tests:', error);
    process.exit(1);
  }
}

runPhase9Tests();
