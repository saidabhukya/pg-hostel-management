const db = require('../config/db');

async function cleanupDemoData() {
  console.log('[Cleanup] Starting complete removal of sample/demo data...');

  try {
    await db.initDatabase();

    // 1. Delete all student activity records
    await db.query(`DELETE FROM complaints`);
    await db.query(`DELETE FROM leave_requests`);
    await db.query(`DELETE FROM payments`);
    await db.query(`DELETE FROM fee_cycles`);
    await db.query(`DELETE FROM allocations`);
    await db.query(`DELETE FROM visitors`);
    await db.query(`DELETE FROM expenses`);
    await db.query(`DELETE FROM announcements`);

    // 2. Delete all students
    await db.query(`DELETE FROM students`);

    // 3. Delete non-admin users (preserving chief warden admin account)
    await db.query(`DELETE FROM users WHERE role != 'admin'`);

    // 4. Delete notifications for non-admins
    await db.query(`DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin')`);

    // 5. Reset all 250 beds to 'available'
    await db.query(`UPDATE beds SET status = 'available'`);

    console.log('[Cleanup] All sample data successfully removed!');

    // Print summary counts
    const sCount = await db.query('SELECT COUNT(*) as count FROM students');
    const uCount = await db.query('SELECT COUNT(*) as count FROM users');
    const bCount = await db.query('SELECT status, COUNT(*) as count FROM beds GROUP BY status');
    const pCount = await db.query('SELECT COUNT(*) as count FROM payments');

    console.log('Students remaining:', sCount[0]?.count || 0);
    console.log('Users remaining (Admin only):', uCount[0]?.count || 0);
    console.log('Beds summary (All available):', bCount);
    console.log('Payments remaining:', pCount[0]?.count || 0);

    process.exit(0);
  } catch (err) {
    console.error('[Cleanup Error]', err);
    process.exit(1);
  }
}

setTimeout(cleanupDemoData, 500);
