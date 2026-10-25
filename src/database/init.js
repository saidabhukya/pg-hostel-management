const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function createTables() {
  await db.initDatabase();
  const client = db.getActiveClient();

  console.log(`[InitDB] Creating tables using client: ${client}...`);

  if (client === 'mysql') {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

    for (const sql of statements) {
      try {
        await db.query(sql);
      } catch (err) {
        console.error(`[InitDB] Error executing statement:`, err.message);
      }
    }
    console.log(`[InitDB] MySQL tables initialized successfully.`);
  } else {
    // SQLite Tables Creation
    const sqliteTables = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        name TEXT NOT NULL,
        phone TEXT,
        avatar TEXT DEFAULT '/assets/images/default-avatar.png',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS floors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        floor_number INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT DEFAULT 'Hostel Floor Block',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        floor_id INTEGER NOT NULL,
        room_number TEXT NOT NULL UNIQUE,
        capacity INTEGER NOT NULL DEFAULT 5,
        type TEXT DEFAULT 'Standard 5-Bed',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS beds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        bed_number INTEGER NOT NULL,
        bed_label TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (room_id, bed_number),
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        reg_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        college TEXT NOT NULL,
        course TEXT NOT NULL,
        year TEXT NOT NULL,
        gender TEXT DEFAULT 'Male',
        parent_name TEXT NOT NULL,
        parent_phone TEXT NOT NULL,
        address TEXT NOT NULL,
        photo_url TEXT DEFAULT '/assets/images/default-student.png',
        id_proof_url TEXT,
        joining_date TEXT NOT NULL,
        monthly_fee REAL NOT NULL DEFAULT 7000.00,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        bed_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        status TEXT DEFAULT 'active',
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS fee_cycles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        cycle_number INTEGER NOT NULL DEFAULT 1,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 7000.00,
        paid_amount REAL NOT NULL DEFAULT 0.00,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        fee_cycle_id INTEGER,
        receipt_number TEXT NOT NULL UNIQUE,
        amount REAL NOT NULL,
        payment_date TEXT NOT NULL,
        cycle_start_date TEXT NOT NULL,
        cycle_end_date TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        transaction_id TEXT,
        status TEXT DEFAULT 'PAID',
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (fee_cycle_id) REFERENCES fee_cycles(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        photo_url TEXT,
        status TEXT DEFAULT 'Pending',
        admin_notes TEXT,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        visitor_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        relation TEXT DEFAULT 'Parent/Relative',
        purpose TEXT NOT NULL,
        entry_time TEXT NOT NULL,
        exit_time TEXT,
        status TEXT DEFAULT 'in_hostel',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS mess_menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_of_week TEXT NOT NULL UNIQUE,
        breakfast TEXT NOT NULL,
        breakfast_timing TEXT DEFAULT '7:30 AM - 9:30 AM',
        lunch TEXT NOT NULL,
        lunch_timing TEXT DEFAULT '12:30 PM - 2:30 PM',
        dinner TEXT NOT NULL,
        dinner_timing TEXT DEFAULT '7:30 PM - 9:30 PM',
        special_notes TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        expense_date TEXT NOT NULL,
        description TEXT NOT NULL,
        receipt_ref TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        priority TEXT DEFAULT 'Medium',
        audience TEXT DEFAULT 'all',
        published_date TEXT NOT NULL,
        expires_at TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        link TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        emergency_contact TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        admin_remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_name TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    db.execScript(sqliteTables);
    console.log(`[InitDB] SQLite tables initialized successfully.`);
  }
}

if (require.main === module) {
  createTables().then(() => {
    console.log('[InitDB] Database initialization complete.');
    process.exit(0);
  }).catch(err => {
    console.error('[InitDB] Failed to initialize database:', err);
    process.exit(1);
  });
}

module.exports = { createTables };
