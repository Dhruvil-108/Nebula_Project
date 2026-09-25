/**
 * Automated end-to-end verification script for CRM and HRMS Submodules.
 */
require('dotenv').config();
const http = require('http');

const PORT = 5000;
const BASE_HOST = '127.0.0.1';

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('STARTING FULL CRM & HRMS SUBMODULE VERIFICATION');
  console.log('====================================================\n');

  // Step 1: Generate valid access token for Dhruvil Soni (super_admin)
  console.log('[1] Generating access token for Dhruvil Soni (super_admin)...');
  const { signAccessToken } = require('./utils/jwt');
  const User = require('./models/User');
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nebula');
  const dhruvil = await User.findOne({ email: 'd24cs108@charusat.edu.in' });
  if (!dhruvil) {
    console.error('Dhruvil Soni not found in DB!');
    process.exit(1);
  }
  const token = signAccessToken({
    userId: dhruvil._id,
    orgId: dhruvil.organizationId,
    role: dhruvil.role,
  });
  console.log('Access token generated successfully!\n');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // ─────────────────────────────────────────────────────────
  // CRM: Summary
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING CRM SUMMARY ---');
  const crmSummaryRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/crm/summary',
    method: 'GET',
    headers: authHeaders,
  });
  assert(crmSummaryRes.status === 200, 'CRM summary returns 200');
  assert(crmSummaryRes.data?.pipelineValue > 0, `Total Pipeline Value is positive ($${crmSummaryRes.data?.pipelineValue?.toLocaleString()})`);
  assert(crmSummaryRes.data?.wonThisMonth > 0, `Won this month deals recorded (${crmSummaryRes.data?.wonThisMonth})`);
  assert(crmSummaryRes.data?.activeLeads > 0, `Active leads counted (${crmSummaryRes.data?.activeLeads})`);

  // ─────────────────────────────────────────────────────────
  // CRM: Leads
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING CRM LEADS ---');
  const leadsRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/crm/leads',
    method: 'GET',
    headers: authHeaders,
  });
  assert(leadsRes.status === 200, 'GET /crm/leads returns 200');
  assert(Array.isArray(leadsRes.data) && leadsRes.data.length >= 10, `Found ${leadsRes.data?.length} leads`);

  // Filter leads by status
  const qualLeadsRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/crm/leads?status=qualified',
    method: 'GET',
    headers: authHeaders,
  });
  assert(qualLeadsRes.status === 200 && qualLeadsRes.data.every(l => l.status === 'qualified'), 'Filter leads by status works');

  // Create, Update, Convert & Delete a Test Lead
  const createLeadRes = await request(
    {
      hostname: BASE_HOST,
      port: PORT,
      path: '/api/v1/crm/leads',
      method: 'POST',
      headers: authHeaders,
    },
    {
      leadName: 'Test Automation Lead',
      company: 'Future Dynamics Inc',
      email: 'lead.test@futuredynamics.com',
      phone: '+1 555-0199',
      source: 'website',
      industry: 'AI & Robotics',
      status: 'new',
      notes: 'Automated test lead creation.',
    }
  );
  assert(createLeadRes.status === 201, 'POST /crm/leads created test lead');
  const testLeadId = createLeadRes.data?._id;

  const patchLeadRes = await request(
    {
      hostname: BASE_HOST,
      port: PORT,
      path: `/api/v1/crm/leads/${testLeadId}`,
      method: 'PATCH',
      headers: authHeaders,
    },
    { status: 'qualified', notes: 'Lead successfully qualified in verification test.' }
  );
  assert(patchLeadRes.status === 200 && patchLeadRes.data?.status === 'qualified', 'PATCH /crm/leads/:id updated status');

  const convertRes = await request(
    {
      hostname: BASE_HOST,
      port: PORT,
      path: `/api/v1/crm/leads/${testLeadId}/convert`,
      method: 'POST',
      headers: authHeaders,
    },
    { dealAmount: 85000 }
  );
  assert(convertRes.status === 200, 'POST /crm/leads/:id/convert successfully converted to Contact + Deal');
  assert(convertRes.data?.deal?.amount === 85000, 'Converted deal created with amount 85000');
  assert(convertRes.data?.contact?.fullName === 'Test Automation Lead', 'Converted contact created');

  // Clean up converted deal, contact, company, and lead
  if (convertRes.data?.deal?._id) {
    await request({ hostname: BASE_HOST, port: PORT, path: `/api/v1/crm/deals/${convertRes.data.deal._id}`, method: 'DELETE', headers: authHeaders });
  }
  if (convertRes.data?.contact?._id) {
    await request({ hostname: BASE_HOST, port: PORT, path: `/api/v1/crm/contacts/${convertRes.data.contact._id}`, method: 'DELETE', headers: authHeaders });
  }
  if (convertRes.data?.deal?.companyId) {
    await request({ hostname: BASE_HOST, port: PORT, path: `/api/v1/crm/companies/${convertRes.data.deal.companyId}`, method: 'DELETE', headers: authHeaders });
  }
  await request({ hostname: BASE_HOST, port: PORT, path: `/api/v1/crm/leads/${testLeadId}`, method: 'DELETE', headers: authHeaders });

  // ─────────────────────────────────────────────────────────
  // CRM: Deals & Pipeline Kanban
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING CRM DEALS & KANBAN PIPELINE ---');
  const pipelineRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/crm/deals/pipeline',
    method: 'GET',
    headers: authHeaders,
  });
  assert(pipelineRes.status === 200, 'GET /crm/deals/pipeline returns 200');
  const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  const allStagesPresent = stages.every(s => Array.isArray(pipelineRes.data?.[s]));
  assert(allStagesPresent, 'Kanban board groups deals by all 7 pipeline stages');

  const totalBoardDeals = Object.values(pipelineRes.data || {}).reduce((acc, arr) => acc + (arr?.length || 0), 0);
  assert(totalBoardDeals >= 14, `Kanban board contains ${totalBoardDeals} populated deals across stages`);

  // Test stage drag & drop (PATCH /crm/deals/:id)
  const firstDeal = pipelineRes.data?.new?.[0];
  if (firstDeal) {
    const moveStageRes = await request(
      {
        hostname: BASE_HOST,
        port: PORT,
        path: `/api/v1/crm/deals/${firstDeal._id}`,
        method: 'PATCH',
        headers: authHeaders,
      },
      { stage: 'contacted' }
    );
    assert(moveStageRes.status === 200 && moveStageRes.data?.stage === 'contacted', 'PATCH /crm/deals/:id transitions stage');

    // Move it back to 'new'
    await request(
      {
        hostname: BASE_HOST,
        port: PORT,
        path: `/api/v1/crm/deals/${firstDeal._id}`,
        method: 'PATCH',
        headers: authHeaders,
      },
      { stage: 'new' }
    );
  }

  // ─────────────────────────────────────────────────────────
  // CRM: Companies & Contacts
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING CRM COMPANIES & CONTACTS ---');
  const companiesRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/crm/companies',
    method: 'GET',
    headers: authHeaders,
  });
  assert(companiesRes.status === 200, 'GET /crm/companies returns 200');
  assert(companiesRes.data?.length >= 6, `Found ${companiesRes.data?.length} companies with contactCount & dealCount`);

  const contactsRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/crm/contacts',
    method: 'GET',
    headers: authHeaders,
  });
  assert(contactsRes.status === 200, 'GET /crm/contacts returns 200');
  assert(contactsRes.data?.length >= 8, `Found ${contactsRes.data?.length} contacts linked to companies`);

  // ─────────────────────────────────────────────────────────
  // CRM: Activities
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING CRM ACTIVITIES ---');
  const sampleCompId = companiesRes.data?.[0]?._id;
  const activitiesRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: `/api/v1/crm/activities?relatedToType=company&relatedToId=${sampleCompId}`,
    method: 'GET',
    headers: authHeaders,
  });
  assert(activitiesRes.status === 200, 'GET /crm/activities returns 200');

  // Create an activity
  const actRes = await request(
    {
      hostname: BASE_HOST,
      port: PORT,
      path: '/api/v1/crm/activities',
      method: 'POST',
      headers: authHeaders,
    },
    {
      type: 'note',
      relatedToType: 'company',
      relatedToId: sampleCompId,
      content: 'Automated test note logged during verification check.',
    }
  );
  assert(actRes.status === 201, 'POST /crm/activities logged note successfully');
  if (actRes.data?._id) {
    await request({ hostname: BASE_HOST, port: PORT, path: `/api/v1/crm/activities/${actRes.data._id}`, method: 'DELETE', headers: authHeaders });
  }

  // ─────────────────────────────────────────────────────────
  // HRMS: Summary
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING HRMS SUMMARY ---');
  const hrSummaryRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/hr/summary',
    method: 'GET',
    headers: authHeaders,
  });
  assert(hrSummaryRes.status === 200, 'GET /hr/summary returns 200');
  assert(hrSummaryRes.data?.headcount >= 10, `Employee headcount tracked (${hrSummaryRes.data?.headcount})`);
  assert(hrSummaryRes.data?.presentToday > 0, `Present today tracked (${hrSummaryRes.data?.presentToday})`);
  assert(hrSummaryRes.data?.pendingLeaveRequests > 0, `Pending leaves for approvals tracked (${hrSummaryRes.data?.pendingLeaveRequests})`);

  // ─────────────────────────────────────────────────────────
  // HRMS: Employees
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING HRMS EMPLOYEES ---');
  const empsRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/hr/employees',
    method: 'GET',
    headers: authHeaders,
  });
  assert(empsRes.status === 200, 'GET /hr/employees returns 200');
  assert(empsRes.data?.length >= 10, `Found ${empsRes.data?.length} employees populated`);
  assert(empsRes.data?.some(e => e.departmentId?.name === 'Engineering'), 'Populated departmentId name exists');
  assert(empsRes.data?.some(e => e.skills && e.skills.length > 0), 'Skills tags populated for employees');

  // Search employee
  const searchEmpRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/hr/employees?search=Dhruvil',
    method: 'GET',
    headers: authHeaders,
  });
  assert(searchEmpRes.status === 200 && searchEmpRes.data?.length === 1, 'Search employee by name works');

  // ─────────────────────────────────────────────────────────
  // HRMS: Departments
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING HRMS DEPARTMENTS ---');
  const deptsRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/hr/departments',
    method: 'GET',
    headers: authHeaders,
  });
  assert(deptsRes.status === 200, 'GET /hr/departments returns 200');
  assert(deptsRes.data?.length === 5, 'Found 5 core departments');
  assert(deptsRes.data?.every(d => d.headId && d.headcount > 0), 'Every department has a designated Head and headcount');

  // ─────────────────────────────────────────────────────────
  // HRMS: Employee Documents
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING HRMS DOCUMENTS ---');
  const firstEmpId = empsRes.data?.[0]?._id;
  const docsRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: `/api/v1/hr/employees/${firstEmpId}/documents`,
    method: 'GET',
    headers: authHeaders,
  });
  assert(docsRes.status === 200, 'GET /hr/employees/:id/documents returns 200');
  assert(Array.isArray(docsRes.data) && docsRes.data.length > 0, `Documents found for employee (${docsRes.data?.length} files)`);

  // Upload and delete test document
  const uploadDocRes = await request(
    {
      hostname: BASE_HOST,
      port: PORT,
      path: `/api/v1/hr/employees/${firstEmpId}/documents`,
      method: 'POST',
      headers: authHeaders,
    },
    {
      docType: 'certificate',
      fileName: 'Test_Verification_Cert.pdf',
      fileUrl: 'https://example.com/test-cert.pdf',
    }
  );
  assert(uploadDocRes.status === 201, 'POST /hr/employees/:id/documents uploads document');
  if (uploadDocRes.data?._id) {
    const delDocRes = await request({
      hostname: BASE_HOST,
      port: PORT,
      path: `/api/v1/hr/documents/${uploadDocRes.data._id}`,
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(delDocRes.status === 200, 'DELETE /hr/documents/:id removes document');
  }

  // ─────────────────────────────────────────────────────────
  // HRMS: Attendance (Today, Roster & Monthly Summary)
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING HRMS ATTENDANCE ---');
  const attTodayRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/hr/attendance/today',
    method: 'GET',
    headers: authHeaders,
  });
  assert(attTodayRes.status === 200, 'GET /hr/attendance/today returns 200');
  assert(attTodayRes.data?.currentStatus === 'checked_in', `Dhruvil current status is "${attTodayRes.data?.currentStatus}"`);

  // Check Team Roster
  const rosterRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/hr/attendance/roster',
    method: 'GET',
    headers: authHeaders,
  });
  assert(rosterRes.status === 200, 'GET /hr/attendance/roster returns 200');
  assert(rosterRes.data?.roster?.length >= 8, `Team roster contains ${rosterRes.data?.roster?.length} team members`);
  const checkedInCount = rosterRes.data?.roster?.filter(r => r.status === 'checked_in' || r.status === 'checked_out' || r.status === 'on_break').length;
  assert(checkedInCount > 0, `Team members active today: ${checkedInCount}`);

  // Check Monthly Summary
  const attSummaryRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/hr/attendance/summary?year=2026&month=9',
    method: 'GET',
    headers: authHeaders,
  });
  assert(attSummaryRes.status === 200, 'GET /hr/attendance/summary returns 200');
  assert(attSummaryRes.data?.totalPresentDays > 0, `Monthly attendance history contains ${attSummaryRes.data?.totalPresentDays} present days`);
  assert(attSummaryRes.data?.dailyBreakdown?.length === 30, 'Daily calendar breakdown contains all 30 days of September');

  // ─────────────────────────────────────────────────────────
  // HRMS: Leaves & Balances & Approvals
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING HRMS LEAVES & APPROVALS ---');
  const leaveTypesRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/hr/leaves/types',
    method: 'GET',
    headers: authHeaders,
  });
  assert(leaveTypesRes.status === 200, 'GET /hr/leaves/types returns 200');
  assert(leaveTypesRes.data?.length >= 4, `Leave types configured (${leaveTypesRes.data?.map(t => t.name).join(', ')})`);

  const leaveBalanceRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/hr/leaves/balance',
    method: 'GET',
    headers: authHeaders,
  });
  assert(leaveBalanceRes.status === 200, 'GET /hr/leaves/balance returns 200');
  assert(leaveBalanceRes.data?.length >= 4, `Leave balances allocated for user (${leaveBalanceRes.data?.length} categories)`);

  // Check Team Approvals requests
  const pendingRequestsRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/hr/leaves/requests?status=pending',
    method: 'GET',
    headers: authHeaders,
  });
  assert(pendingRequestsRes.status === 200, 'GET /hr/leaves/requests?status=pending returns 200');
  assert(pendingRequestsRes.data?.length >= 1, `Pending leave requests waiting in Team Approvals (${pendingRequestsRes.data?.length} requests)`);

  // Review (approve) one of the pending requests
  const reqToReview = pendingRequestsRes.data?.[0];
  if (reqToReview) {
    const reviewRes = await request(
      {
        hostname: BASE_HOST,
        port: PORT,
        path: `/api/v1/hr/leaves/requests/${reqToReview._id}/approve`,
        method: 'PATCH',
        headers: authHeaders,
      }
    );
    assert(reviewRes.status === 200 && reviewRes.data?.leaveRequest?.status === 'approved', 'PATCH /hr/leaves/requests/:id/approve approves request');
  }

  // ─────────────────────────────────────────────────────────
  // HRMS: Holidays
  // ─────────────────────────────────────────────────────────
  console.log('\n--- VERIFYING HRMS HOLIDAYS ---');
  const holidaysRes = await request({
    hostname: BASE_HOST,
    port: PORT,
    path: '/api/v1/hr/holidays?year=2026',
    method: 'GET',
    headers: authHeaders,
  });
  assert(holidaysRes.status === 200, 'GET /hr/holidays returns 200');
  assert(holidaysRes.data?.length >= 14, `Found ${holidaysRes.data?.length} holidays configured for 2026`);

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
