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

async function runPhase8Tests() {
  console.log('====================================================');
  console.log('🚀 Starting StayEasy Phase 8: Notifications System Tests');
  console.log('====================================================\n');

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
    const ownerEmail = `owner_p8_${timestamp}@stayeasy.local`;
    const tenant1Email = `tenant1_p8_${timestamp}@stayeasy.local`;
    const tenant2Email = `tenant2_p8_${timestamp}@stayeasy.local`;
    const adminEmail = `admin_p8_${timestamp}@stayeasy.local`;
    const password = 'Password123!';

    // 1. Register Accounts
    const ownerRes = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P8 Landlord',
      email: ownerEmail,
      password,
      role: 'OWNER',
      phone: '9876500001',
    });
    assert(ownerRes.status === 201 && ownerRes.body.success, 'Register Owner Account');
    const ownerToken = ownerRes.body.data?.token;
    const ownerId = ownerRes.body.data?.user?._id;

    const tenant1Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P8 Resident Tenant',
      email: tenant1Email,
      password,
      role: 'USER',
      phone: '9876500002',
    });
    assert(tenant1Res.status === 201 && tenant1Res.body.success, 'Register Tenant 1');
    const tenant1Token = tenant1Res.body.data?.token;

    const tenant2Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P8 Other Tenant',
      email: tenant2Email,
      password,
      role: 'USER',
      phone: '9876500003',
    });
    assert(tenant2Res.status === 201 && tenant2Res.body.success, 'Register Tenant 2 (Security Check)');
    const tenant2Token = tenant2Res.body.data?.token;

    const adminRes = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P8 Platform Admin',
      email: adminEmail,
      password,
      role: 'ADMIN',
      phone: '9876500004',
    });
    assert(adminRes.status === 201 && adminRes.body.success, 'Register Admin Account');
    const adminToken = adminRes.body.data?.token;

    // 2. Create Property
    const propRes = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, {
      title: `P8 Notification Residency PG ${timestamp}`,
      description: 'Luxury PG accommodation for Phase 8 notification test suite.',
      propertyType: 'PG',
      genderPreference: 'UNISEX',
      address: {
        street: '100 Feet Road',
        locality: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
      roomConfigurations: [

        { name: 'Single Deluxe', type: 'SINGLE', rent: 14000, deposit: 20000, capacity: 1, totalBeds: 5, availableBeds: 5 },
      ],
      amenities: ['WiFi', 'Power Backup'],
      rules: { noticePeriodDays: 30 },

    });
    assert(propRes.status === 201 && propRes.body.success, 'Create Property Listing', JSON.stringify(propRes.body));

    const propertyId = propRes.body.data?.property?._id;
    const roomConfigId = propRes.body.data?.property?.roomConfigurations[0]?._id;

    // 3. Admin verifies property -> Triggers PROPERTY_VERIFICATION notification for Owner
    const verifyRes = await request(`${API_BASE}/properties/${propertyId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, { status: 'VERIFIED', trustScore: 92 });
    assert(verifyRes.status === 200 && verifyRes.body.success, 'Admin verifies property listing');

    // Verify Owner receives PROPERTY_VERIFICATION notification
    const ownerNotif1 = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      ownerNotif1.status === 200 &&
      ownerNotif1.body.data?.notifications?.some((n) => n.type === 'PROPERTY_VERIFICATION'),
      'Trigger: Owner received PROPERTY_VERIFICATION notification'
    );

    // 4. Tenant 1 creates booking -> Triggers BOOKING_REQUESTED notification for Owner
    const bookingRes = await request(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    }, {
      propertyId,
      roomConfigId,
      moveInDate: '2026-09-01',
      durationMonths: 6,
    });
    assert(bookingRes.status === 201 && bookingRes.body.success, 'Tenant 1 creates booking request');
    const bookingId = bookingRes.body.data?.booking?._id;

    const ownerNotif2 = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      ownerNotif2.body.data?.notifications?.some((n) => n.type === 'BOOKING_REQUESTED'),
      'Trigger: Owner received BOOKING_REQUESTED notification'
    );

    // 5. Landlord accepts booking -> Triggers BOOKING_ACCEPTED notification for Tenant 1
    const acceptRes = await request(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, { status: 'ACCEPTED' });
    assert(acceptRes.status === 200 && acceptRes.body.success, 'Landlord accepts booking request');

    const tenant1Notif1 = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      tenant1Notif1.body.data?.notifications?.some((n) => n.type === 'BOOKING_ACCEPTED'),
      'Trigger: Tenant 1 received BOOKING_ACCEPTED notification'
    );

    // 6. Tenant 1 pays Escrow deposit -> Triggers ESCROW_PAYMENT_SUCCESS notification for Tenant 1 & Owner
    const escrowRes = await request(`${API_BASE}/bookings/${bookingId}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(escrowRes.status === 200 && escrowRes.body.success, 'Tenant 1 deposits funds into Escrow');

    const tenant1Notif2 = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      tenant1Notif2.body.data?.notifications?.some((n) => n.type === 'ESCROW_PAYMENT_SUCCESS'),
      'Trigger: Tenant 1 received ESCROW_PAYMENT_SUCCESS notification'
    );

    // 7. Landlord checks in Tenant 1 -> Triggers CHECKIN_CONFIRMED notification for Tenant 1
    const checkinRes = await request(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, { status: 'CHECKED_IN' });
    assert(checkinRes.status === 200 && checkinRes.body.success, 'Landlord checks in Tenant 1');

    const tenant1Notif3 = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      tenant1Notif3.body.data?.notifications?.some((n) => n.type === 'CHECKIN_CONFIRMED'),
      'Trigger: Tenant 1 received CHECKIN_CONFIRMED notification'
    );

    // 8. Landlord generates Rent Invoice -> Triggers RENT_INVOICE_GENERATED notification for Tenant 1
    const invoiceRes = await request(`${API_BASE}/ledger/invoice`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, {
      bookingId,
      billingMonth: 'September 2026',
      dueDate: '2026-09-05',
      previousMeterReading: 100,
      currentMeterReading: 160,
    });
    assert(invoiceRes.status === 201 && invoiceRes.body.success, 'Landlord generates rent invoice');
    const invoiceId = invoiceRes.body.data?.invoice?._id;

    const tenant1Notif4 = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      tenant1Notif4.body.data?.notifications?.some((n) => n.type === 'RENT_INVOICE_GENERATED'),
      'Trigger: Tenant 1 received RENT_INVOICE_GENERATED notification'
    );

    // 9. Tenant 1 pays Rent Invoice -> Triggers RENT_PAYMENT_SUCCESS notification
    const payInvoiceRes = await request(`${API_BASE}/ledger/${invoiceId}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    }, { paymentMethod: 'UPI' });
    assert(payInvoiceRes.status === 200 && payInvoiceRes.body.success, 'Tenant 1 pays rent invoice');

    const tenant1Notif5 = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      tenant1Notif5.body.data?.notifications?.some((n) => n.type === 'RENT_PAYMENT_SUCCESS'),
      'Trigger: Tenant 1 received RENT_PAYMENT_SUCCESS notification'
    );

    // 10. Tenant 1 submits Verified Review -> Triggers REVIEW_SUBMITTED notification for Owner
    const reviewRes = await request(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    }, {
      propertyId,
      bookingId,
      overallRating: 5,
      foodQualityRating: 5,
      cleanlinessRating: 4,
      ownerResponsivenessRating: 5,
      billingTransparencyRating: 5,
      amenitiesRating: 5,
      title: 'P8 Test Review for Notifications',
      comment: 'Excellent food quality and prompt complaint resolution.',
    });
    assert(reviewRes.status === 201 && reviewRes.body.success, 'Tenant 1 submits resident review');
    const reviewId = reviewRes.body.data?.review?._id;

    const ownerNotif3 = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      ownerNotif3.body.data?.notifications?.some((n) => n.type === 'REVIEW_SUBMITTED'),
      'Trigger: Owner received REVIEW_SUBMITTED notification'
    );

    // 11. Landlord responds to review -> Triggers REVIEW_RESPONSE notification for Tenant 1
    const respondRes = await request(`${API_BASE}/reviews/${reviewId}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
    }, { responseText: 'Thank you for your review!' });
    assert(respondRes.status === 200 && respondRes.body.success, 'Landlord responds to review');

    const tenant1Notif6 = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      tenant1Notif6.body.data?.notifications?.some((n) => n.type === 'REVIEW_RESPONSE'),
      'Trigger: Tenant 1 received REVIEW_RESPONSE notification'
    );

    // 12. Tenant 1 serves Move-Out Notice -> Triggers MOVEOUT_NOTICE_SERVED notification for Owner
    const validNoticeDate = new Date();
    validNoticeDate.setDate(validNoticeDate.getDate() + 35);
    const noticeRes = await request(`${API_BASE}/ledger/notice`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    }, {
      bookingId,
      intendedCheckoutDate: validNoticeDate.toISOString().split('T')[0],
      reason: 'Course completed',
    });
    assert(noticeRes.status === 200 && noticeRes.body.success, 'Tenant 1 serves move-out notice');

    const ownerNotif4 = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      ownerNotif4.body.data?.notifications?.some((n) => n.type === 'MOVEOUT_NOTICE_SERVED'),
      'Trigger: Owner received MOVEOUT_NOTICE_SERVED notification'
    );

    // 13. Test GET /unread-count
    const unreadRes = await request(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      unreadRes.status === 200 && typeof unreadRes.body.data?.unreadCount === 'number',
      'API: GET /notifications/unread-count returns unread count'
    );
    const targetNotifId = tenant1Notif6.body.data?.notifications[0]?._id;

    // 14. Test PATCH /:id/read
    if (targetNotifId) {
      const readRes = await request(`${API_BASE}/notifications/${targetNotifId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tenant1Token}` },
      });
      assert(readRes.status === 200 && readRes.body.data?.notification?.isRead === true, 'API: PATCH /notifications/:id/read marks notification as read');
    }

    // 15. Test PATCH /read-all
    const readAllRes = await request(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(readAllRes.status === 200 && readAllRes.body.success, 'API: PATCH /notifications/read-all marks all notifications read');

    const postReadAllUnread = await request(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(postReadAllUnread.body.data?.unreadCount === 0, 'Verification: Unread count becomes 0 after markAllAsRead');

    // 16. Security Test: Tenant 2 attempts to delete Tenant 1's notification
    if (targetNotifId) {
      const secDeleteRes = await request(`${API_BASE}/notifications/${targetNotifId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tenant2Token}` },
      });
      assert(secDeleteRes.status === 404, 'Security: Tenant 2 blocked from deleting Tenant 1 notification (HTTP 404)');

      // Tenant 1 deletes own notification
      const deleteRes = await request(`${API_BASE}/notifications/${targetNotifId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tenant1Token}` },
      });
      assert(deleteRes.status === 200 && deleteRes.body.success, 'API: Tenant 1 successfully deletes own notification');
    }

  } catch (err) {
    console.error('❌ Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 8 Test Suite Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runPhase8Tests();
