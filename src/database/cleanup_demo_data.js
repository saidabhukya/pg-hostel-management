const db = require('../config/db');

async function cleanupDemoData() {
  console.log('[Cleanup] Starting removal of demo data...');

  const keptStudentIds = [368, 369, 370, 371];
  const keptUserIds = [4, 6, 7, 8, 9];

  const studentIn = keptStudentIds.join(',');
  const userIn = keptUserIds.join(',');

  try {
    // 1. Delete demo complaints & leaves
    await db.query(`DELETE FROM complaints WHERE student_id NOT IN (${studentIn})`);
    await db.query(`DELETE FROM leave_requests WHERE student_id NOT IN (${studentIn})`);

    // 2. Delete demo payments & fee cycles
    await db.query(`DELETE FROM payments WHERE student_id NOT IN (${studentIn})`);
    await db.query(`DELETE FROM fee_cycles WHERE student_id NOT IN (${studentIn})`);

    // 3. Delete demo allocations
    await db.query(`DELETE FROM allocations WHERE student_id NOT IN (${studentIn})`);

    // 4. Delete demo students
    await db.query(`DELETE FROM students WHERE id NOT IN (${studentIn})`);

    // 5. Delete demo users (keeping admin and the 4 kept students)
    await db.query(`DELETE FROM users WHERE id NOT IN (${userIn})`);

    // 6. Delete demo activity records
    await db.query(`DELETE FROM visitors`);
    await db.query(`DELETE FROM expenses`);
    await db.query(`DELETE FROM announcements`);
    await db.query(`DELETE FROM notifications WHERE user_id NOT IN (${userIn})`);

    // 7. Reset all beds to available, then re-mark the 3 currently active beds as occupied
    await db.query(`UPDATE beds SET status = 'available'`);
    await db.query(`
      UPDATE beds 
      SET status = 'occupied' 
      WHERE id IN (
        SELECT bed_id FROM allocations 
        WHERE status = 'active' AND student_id IN (${studentIn})
      )
    `);

    console.log('[Cleanup] Demo data successfully removed!');

    // Print summary counts
    const sCount = await db.query('SELECT COUNT(*) as count FROM students');
    const uCount = await db.query('SELECT COUNT(*) as count FROM users');
    const bCount = await db.query('SELECT status, COUNT(*) as count FROM beds GROUP BY status');
    const pCount = await db.query('SELECT COUNT(*) as count FROM payments');
    const fCount = await db.query('SELECT COUNT(*) as count FROM fee_cycles');

    console.log('Students remaining:', sCount[0].count);
    console.log('Users remaining:', uCount[0].count);
    console.log('Beds summary:', bCount);
    console.log('Payments remaining:', pCount[0].count);
    console.log('Fee cycles remaining:', fCount[0].count);

    process.exit(0);
  } catch (err) {
    console.error('[Cleanup Error]', err);
    process.exit(1);
  }
}

setTimeout(cleanupDemoData, 500);
