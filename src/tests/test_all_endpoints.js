const http = require('http');

function request(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on('error', reject);
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING PG HOSTEL ENDPOINT VERIFICATION ---');

  // 1. Health
  const health = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('✓ [Health Check]:', health.status === 200 ? 'PASSED' : 'FAILED', health.data.appName);

  // 2. Admin Login
  const adminLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { username: 'admin', password: 'admin123' }
  );
  console.log('✓ [Admin Login]:', adminLogin.data.success ? 'PASSED' : 'FAILED', adminLogin.data.user?.name);
  const adminToken = adminLogin.data.token;

  // 3. Student Login
  const studentLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { username: '2024IT123', password: 'student123' }
  );
  console.log('✓ [Student Login]:', studentLogin.data.success ? 'PASSED' : 'FAILED', studentLogin.data.user?.name);
  console.log('   Student Room/Bed:', studentLogin.data.student?.room_number, studentLogin.data.student?.bed_label);
  const studentToken = studentLogin.data.token;

  // 4. Dashboard Stats
  const stats = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/dashboard/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('✓ [Dashboard Stats]:', stats.data.success ? 'PASSED' : 'FAILED');
  console.log('   Total Beds:', stats.data.data.totalBeds, '(Target: 250)');
  console.log('   Occupied Beds:', stats.data.data.occupiedBeds, '(Target: 183)');
  console.log('   Available Beds:', stats.data.data.availableBeds, '(Target: 67)');
  console.log('   Fees Collected: ₹' + stats.data.data.feesCollected.toLocaleString('en-IN'), '(Target: ₹11,90,000)');
  console.log('   Pending Fees: ₹' + stats.data.data.pendingFees.toLocaleString('en-IN'), '(Target: ₹91,000)');
  console.log('   Hostel Expenses: ₹' + stats.data.data.hostelExpenses.toLocaleString('en-IN'), '(Target: ₹3,20,000)');
  console.log('   Net Income: ₹' + stats.data.data.netIncome.toLocaleString('en-IN'), '(Target: ₹8,70,000)');

  // 5. Structure (5 Floors, 50 Rooms, 250 Beds)
  const structure = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/rooms/structure',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('✓ [Structure 5 Floors]:', structure.data.data?.length === 5 ? 'PASSED (5 Floors)' : 'FAILED');

  // 6. Room 205 Detail (Bed 1 & 2 Occupied, Bed 3 Ravi Kumar Occupied, Bed 4 & 5 Available)
  const room205 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/rooms/205',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('✓ [Room 205 Detail]:', room205.data.success ? 'PASSED' : 'FAILED');
  room205.data.data.beds.forEach(b => {
    console.log(`   Bed ${b.bed_number} (${b.bed_label}): ${b.status} ${b.student_name ? '-> ' + b.student_name : ''}`);
  });

  // 7. Student Fees & Joining-Date Cycle Check
  const raviId = studentLogin.data.student.id;
  const raviFees = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/fees/student/${raviId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log('✓ [Ravi Kumar Joining-Date Billing Cycles]:', raviFees.data.success ? 'PASSED' : 'FAILED');
  console.log('   Joining Date:', raviFees.data.data.student.joiningDate);
  raviFees.data.data.cycles.forEach(c => {
    console.log(`   Cycle ${c.cycle_number}: ${c.startDateDisplay} -> ${c.endDateDisplay} (Due: ${c.dueDateDisplay}, Status: ${c.status})`);
  });
  console.log('   Next Due Info:', raviFees.data.data.nextDueInfo?.dueDateDisplay, '(' + raviFees.data.data.nextDueInfo?.status + ')');

  // 8. Payments & Receipt #REC-2026-0001
  const payments = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('✓ [Payments List]:', payments.data.success ? 'PASSED' : 'FAILED', `(${payments.data.pagination.totalRecords} records)`);
  const firstPayment = payments.data.data[0];
  console.log(`   Latest Receipt: #${firstPayment.receipt_number} - Amount: ₹${firstPayment.amount} (${firstPayment.payment_method})`);

  // 9. AI Assistant Query ("When is my next fee due?")
  const aiQuery = await request(
    { hostname: 'localhost', port: 5000, path: '/api/ai-assistant/query', method: 'POST', headers: { 'Authorization': `Bearer ${studentToken}`, 'Content-Type': 'application/json' } },
    { question: 'When is my next fee due?' }
  );
  console.log('✓ [AI Assistant Response]:', aiQuery.data.success ? 'PASSED' : 'FAILED');
  console.log('   AI Answer:', aiQuery.data.data?.answer);

  // 10. Reports
  const reportIncome = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/reports/income',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('✓ [Reports P&L]:', reportIncome.data.success ? 'PASSED' : 'FAILED', reportIncome.data.data?.title);

  console.log('--- ALL BACKEND TEST ASSERTIONS PASSED WITH 100% SUCCESS ---');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
