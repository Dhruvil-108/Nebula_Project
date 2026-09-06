require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');

async function runTests() {
  console.log('--- STARTING ATTENDANCE & LEAVES TEST SUITE ---');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nebula_dev';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`✓ Test server running on ${baseUrl}`);

  async function request(method, path, body = null, token = null) {
    const url = new URL(`${baseUrl}${path}`);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  try {
    // 1. Signup / Login test user
    const testEmail = `test_${Date.now()}@nebula.io`;
    const signupRes = await request('POST', '/auth/signup', {
      fullName: 'Dhruvil Patel',
      email: testEmail,
      password: 'Password123!',
      organizationName: 'Nebula Labs',
    });

    if (signupRes.status !== 201) {
      throw new Error(`Signup failed: ${JSON.stringify(signupRes.data)}`);
    }
    const token = signupRes.data.accessToken;
    console.log('✓ 1. Auth Signup & Token generation succeeded');

    // 2. GET /api/v1/attendance/today
    const todayRes1 = await request('GET', '/attendance/today', null, token);
    console.log('✓ 2. GET /attendance/today before check-in:', todayRes1.status, todayRes1.data.currentStatus);
    if (todayRes1.data.currentStatus !== 'not_checked_in') {
      throw new Error('Expected not_checked_in before checkin');
    }

    // 3. POST /api/v1/attendance/check-in
    const checkInRes = await request('POST', '/attendance/check-in', {}, token);
    console.log('✓ 3. POST /attendance/check-in:', checkInRes.status, checkInRes.data.message);
    if (checkInRes.status !== 200 || checkInRes.data.currentStatus !== 'checked_in') {
      throw new Error('Check in failed');
    }

    // Duplicate check-in should reject
    const duplicateCheckIn = await request('POST', '/attendance/check-in', {}, token);
    console.log('✓ 4. Reject duplicate check-in:', duplicateCheckIn.status, duplicateCheckIn.data.error);
    if (duplicateCheckIn.status !== 400) {
      throw new Error('Duplicate check in was not rejected');
    }

    // 5. POST /api/v1/attendance/break-in
    const breakInRes = await request('POST', '/attendance/break-in', {}, token);
    console.log('✓ 5. POST /attendance/break-in:', breakInRes.status, breakInRes.data.currentStatus);
    if (breakInRes.status !== 200 || breakInRes.data.currentStatus !== 'on_break') {
      throw new Error('Break in failed');
    }

    // 6. POST /api/v1/attendance/break-out
    const breakOutRes = await request('POST', '/attendance/break-out', {}, token);
    console.log('✓ 6. POST /attendance/break-out:', breakOutRes.status, breakOutRes.data.currentStatus);
    if (breakOutRes.status !== 200 || breakOutRes.data.currentStatus !== 'checked_in') {
      throw new Error('Break out failed');
    }

    // 7. POST /api/v1/attendance/check-out
    const checkOutRes = await request('POST', '/attendance/check-out', {}, token);
    console.log('✓ 7. POST /attendance/check-out:', checkOutRes.status, checkOutRes.data.currentStatus);
    if (checkOutRes.status !== 200 || checkOutRes.data.currentStatus !== 'checked_out') {
      throw new Error('Check out failed');
    }

    // 8. GET /api/v1/attendance/summary
    const summaryRes = await request('GET', '/attendance/summary', null, token);
    console.log('✓ 8. GET /attendance/summary: Present days =', summaryRes.data.totalPresentDays, 'Expected days =', summaryRes.data.expectedWorkingDays);
    if (summaryRes.status !== 200 || summaryRes.data.totalPresentDays < 1) {
      throw new Error('Summary computation failed');
    }

    // 9. GET /api/v1/leaves/balance
    const balanceRes = await request('GET', '/leaves/balance', null, token);
    console.log('✓ 9. GET /leaves/balance:', balanceRes.status, `Loaded ${balanceRes.data.length} leave types`);
    if (balanceRes.status !== 200 || balanceRes.data.length === 0) {
      throw new Error('Leave balances fetch failed');
    }

    // 10. POST /api/v1/leaves/requests
    const casualLeave = balanceRes.data.find((b) => b.leaveType === 'Casual Leave') || balanceRes.data[0];
    const leaveReqRes = await request('POST', '/leaves/requests', {
      leaveTypeId: casualLeave.leaveTypeId,
      startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      reason: 'Personal leave for family event',
    }, token);
    console.log('✓ 10. POST /leaves/requests:', leaveReqRes.status, leaveReqRes.data.message);
    if (leaveReqRes.status !== 201) {
      throw new Error('Leave request creation failed');
    }

    // 11. PATCH /api/v1/leaves/requests/:id/approve
    const leaveId = leaveReqRes.data.leaveRequest._id;
    const approveRes = await request('PATCH', `/leaves/requests/${leaveId}/approve`, {}, token);
    console.log('✓ 11. PATCH /leaves/requests/:id/approve:', approveRes.status, approveRes.data.message);
    if (approveRes.status !== 200) {
      throw new Error('Leave request approval failed');
    }

    // 12. GET /api/v1/holidays/upcoming
    const holidayRes = await request('GET', '/holidays/upcoming?limit=5', null, token);
    console.log('✓ 12. GET /holidays/upcoming:', holidayRes.status, `Loaded ${holidayRes.data.length} holidays`);
    if (holidayRes.status !== 200 || holidayRes.data.length === 0) {
      throw new Error('Holiday upcoming fetch failed');
    }

    console.log('\n=========================================');
    console.log('ALL 12 BACKEND INTEGRATION TESTS PASSED!');
    console.log('=========================================');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests();
