const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function createTables() {
  await db.initDatabase();
  const client = db.getActiveClient();

  console.log(`[InitDB] Initializing database tables using client: ${client}...`);

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
        // Table or index may already exist
      }
    }

    // Ensure newly added columns exist if tables already existed
    try {
      await db.query("ALTER TABLE `students` ADD COLUMN `mother_name` VARCHAR(150) NULL");
    } catch (e) {}
    try {
      await db.query("ALTER TABLE `students` ADD COLUMN `mother_phone` VARCHAR(25) NULL");
    } catch (e) {}

    console.log(`[InitDB] MySQL tables verified successfully.`);
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
        mother_name TEXT,
        mother_phone TEXT,
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

      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'present',
        remarks TEXT,
        marked_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, date),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
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

  // Ensure essential baseline data exists (Admin, Floors 1-5, Rooms 1-50, Beds 1-250, Mess Menu)
  await ensureEssentialData();
}

/**
 * Ensures baseline infrastructure records exist in the database.
 * Does NOT overwrite existing records or delete student accounts.
 */
async function ensureEssentialData() {
  try {
    // 1. Check & Seed Default Admin
    const adminUser = await db.getOne("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!adminUser) {
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      await db.query(
        `INSERT INTO users (username, email, password_hash, role, name, phone, avatar)
         VALUES (?, ?, ?, 'admin', ?, ?, ?)`,
        ['admin', 'admin@srirampg.in', adminPasswordHash, 'Hostel Chief Warden', '+91 98111 22334', '/assets/images/default-avatar.png']
      );
      console.log('[InitDB] Created default admin user: admin / admin123');
    }

    // 2. Check & Seed Floors (5 Floors: 1 to 5)
    const floorCount = await db.getOne('SELECT COUNT(*) as count FROM floors');
    if (Number(floorCount?.count || 0) === 0) {
      console.log('[InitDB] Seeding 5 floors, 50 rooms, and 250 beds...');
      const floorIds = {};

      for (let f = 1; f <= 5; f++) {
        const floorRes = await db.query(
          `INSERT INTO floors (floor_number, name, description) VALUES (?, ?, ?)`,
          [f, `Floor ${f}`, `${f}th Floor - Residential Wing`]
        );
        floorIds[f] = floorRes.insertId;
      }

      // 50 Rooms (10 per floor, e.g. 101 to 110, 201 to 210...)
      for (let f = 1; f <= 5; f++) {
        const fId = floorIds[f];
        for (let r = 1; r <= 10; r++) {
          const roomNum = `${f}${String(r).padStart(2, '0')}`;
          const roomRes = await db.query(
            `INSERT INTO rooms (floor_id, room_number, capacity, type, status) VALUES (?, ?, 5, 'Standard 5-Bed', 'active')`,
            [fId, roomNum]
          );
          const roomId = roomRes.insertId;

          // 5 Beds per room => 250 Beds
          const bedLabels = ['Bed-A (Window)', 'Bed-B', 'Bed-C', 'Bed-D', 'Bed-E (Door)'];
          for (let b = 1; b <= 5; b++) {
            await db.query(
              `INSERT INTO beds (room_id, bed_number, bed_label, status) VALUES (?, ?, ?, 'available')`,
              [roomId, b, bedLabels[b - 1]]
            );
          }
        }
      }
      console.log('[InitDB] Successfully seeded 5 floors, 50 rooms, and 250 beds.');
    }

    // 3. Check & Seed 7-Day Mess Menu
    const messCount = await db.getOne('SELECT COUNT(*) as count FROM mess_menu');
    if (Number(messCount?.count || 0) === 0) {
      console.log('[InitDB] Seeding weekly mess routine...');
      const weeklyMenu = [
        {
          day: 'Monday',
          breakfast: 'Idly, Vada, Pongal, Chutney, Sambar, Allam Chutney, Milk, Coffee',
          lunch: 'Dal, Sweet (ChakkarPongal / Halwa), Chutney, Sambar, Boiled Egg, Onion Tomato Curry, Rice, Rasam, Curd',
          dinner: 'Rice, Phulka, Pappu, Potato Curry, Dosakai Tomato, Seasonal Fruits, Rasam, Curd',
          special: 'Monday Sweet & Evening Mirchi Bajji'
        },
        {
          day: 'Tuesday',
          breakfast: 'Idly, Chapathi with Pappu, Upma, Chutney, Pudina Chutney, Milk, Coffee',
          lunch: 'Dal, Pulihora / Kichadi, Chutney, Akukura Pappu, Cabbage Tomato, Sambar, Rice, Rasam, Curd',
          dinner: 'Rice, Phulka Gravy, Egg Fried Rice, Veg Fried Rice, Bendakaya Fry, Rasam, Curd',
          special: 'Pulihora Lunch & Egg/Veg Fried Rice Dinner'
        },
        {
          day: 'Wednesday',
          breakfast: 'Idly, Plain Dosa, Chutney, Coriander Chutney, Upma, Milk, Coffee',
          lunch: 'Dal, Tomato Pappu, Benda Iguru, Seasonal Curry, Chutney, Papad, Sambar, Rasam, Curd, Rice',
          dinner: 'Rice, Phulka, Chicken Curry / Paneer Butter Masala, Veg Biryani, Raita, Gongura Chutney, Rasam, Curd',
          special: 'Wednesday Feast: Chicken Curry & Biryani'
        },
        {
          day: 'Thursday',
          breakfast: 'Idly, Utappam, Upma, Chutney, Allam Chutney, Milk, Coffee',
          lunch: 'Dal, Chutney, Seasonal Curry, Seasonal Fry, Dosakaya Pappu, Rasam, Sambar, Curd, Rice',
          dinner: 'Boiled Egg, Rice, Phulka Pappu, Cauliflower Curry, Seasonal Fruits, Rasam, Curd',
          special: 'Hot Punugulu & Boiled Egg Dinner'
        },
        {
          day: 'Friday',
          breakfast: 'Idly, Chapathi, Chutney, Tomato Bath, Pudina Chutney, Kurma, Milk, Coffee',
          lunch: 'Dal, Akukura Pappu, Chutney, Seasonal Curry, Appadalu, Rasam, Sambar, Curd, Rice',
          dinner: 'Rice, Phulka Kurma, Hyderabadi Biryani, Crispy Chicken Fry / Paneer Tikka, Veg Curries, Rasam, Curd',
          special: 'Friday Special Biryani & Crispy Chicken Fry'
        },
        {
          day: 'Saturday',
          breakfast: 'Idly, Masala Dosa, Upma, Coriander Chutney, Milk, Coffee',
          lunch: 'Dal, Dondakai Iguru, Drumstick Tomato, Chutney, Rasam, Sambar, Curd, Rice',
          dinner: 'Rice, Phulka, Mixed Veg Kurma, Pappu Charu, Sweet (Badusha / Jalebi), Rasam, Curd',
          special: 'Saturday Evening Sweet & Masala Dosa'
        },
        {
          day: 'Sunday',
          breakfast: 'Puri with Potato Kurma, Idly, Sambar, Chutney, Milk, Coffee',
          lunch: 'Special Dum Biryani, Chicken Gravy / Paneer Masala, Raitha, Onion Salad, White Rice, Dal, Curd',
          dinner: 'Phulka, Rice, Dal Makhani, Aloo Gobi, Seasonal Fruits, Milk, Curd',
          special: 'Sunday Grand Lunch Biryani Feast'
        }
      ];

      for (const m of weeklyMenu) {
        await db.query(
          `INSERT INTO mess_menu (day_of_week, breakfast, lunch, dinner, special_notes)
           VALUES (?, ?, ?, ?, ?)`,
          [m.day, m.breakfast, m.lunch, m.dinner, m.special]
        );
      }
      console.log('[InitDB] Mess menu seeded successfully.');
    }

    // 4. Check & Seed Settings
    const settingsCount = await db.getOne('SELECT COUNT(*) as count FROM settings');
    if (Number(settingsCount?.count || 0) === 0) {
      const defaultSettings = [
        { key: 'hostel_name', value: 'SRI RAM PG', desc: 'Hostel Name' },
        { key: 'hostel_address', value: 'Near Vignan University Campus, Vadlamudi, Guntur - 522213', desc: 'Physical Address' },
        { key: 'contact_phone', value: '+91 98111 22334', desc: 'Hostel Reception / Helpline' },
        { key: 'contact_email', value: 'help@srirampg.in', desc: 'Contact Email' },
        { key: 'curfew_time', value: '22:00', desc: 'Night Curfew Time' },
        { key: 'default_monthly_fee', value: '7000', desc: 'Default Monthly Fee per Student' }
      ];

      for (const s of defaultSettings) {
        await db.query(
          `INSERT INTO settings (key_name, value, description) VALUES (?, ?, ?)`,
          [s.key, s.value, s.desc]
        );
      }
      console.log('[InitDB] Default hostel settings seeded.');
    }
  } catch (err) {
    console.error('[InitDB] Error in ensureEssentialData:', err.message);
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
