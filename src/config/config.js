const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Parse DATABASE_URL / MYSQL_URL if provided by cloud platforms (Render, Railway, Heroku, Aiven, TiDB, etc.)
let dbHost = process.env.DB_HOST || 'localhost';
let dbPort = parseInt(process.env.DB_PORT, 10) || 3306;
let dbUser = process.env.DB_USER || 'root';
let dbPassword = process.env.DB_PASSWORD || '';
let dbName = process.env.DB_NAME || 'pg_hostel_db';
let dbSsl = process.env.DB_SSL === 'true';

const connUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
if (connUrl) {
  try {
    const parsed = new URL(connUrl);
    dbHost = parsed.hostname || dbHost;
    dbPort = parsed.port ? parseInt(parsed.port, 10) : dbPort;
    dbUser = decodeURIComponent(parsed.username || dbUser);
    dbPassword = decodeURIComponent(parsed.password || dbPassword);
    dbName = parsed.pathname ? parsed.pathname.replace(/^\//, '') : dbName;
    if (parsed.searchParams.has('ssl') || parsed.searchParams.get('sslmode') === 'require') {
      dbSsl = true;
    }
  } catch (err) {
    console.warn('[Config] Failed to parse DATABASE_URL string, falling back to individual DB_* env vars.', err.message);
  }
}

// Auto-enable SSL for non-local MySQL hosts (cloud providers usually require TLS)
if (dbHost && dbHost !== 'localhost' && dbHost !== '127.0.0.1' && process.env.DB_CLIENT !== 'sqlite') {
  if (process.env.DB_SSL !== 'false') {
    dbSsl = true;
  }
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'pg_hostel_secret_jwt_key_2026_super_secure_college_portal',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    client: process.env.DB_CLIENT || (connUrl ? 'mysql' : 'mysql'),
    url: connUrl || null,
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    ssl: dbSsl,
    sqlitePath: path.join(__dirname, '../database/hostel.sqlite')
  },
  hostel: {
    name: process.env.HOSTEL_NAME || 'SRI RAM PG',
    defaultMonthlyFee: parseFloat(process.env.DEFAULT_MONTHLY_FEE) || 7000.00,
    totalFloors: parseInt(process.env.TOTAL_FLOORS, 10) || 5,
    roomsPerFloor: parseInt(process.env.ROOMS_PER_FLOOR, 10) || 10,
    bedsPerRoom: parseInt(process.env.BEDS_PER_ROOM, 10) || 5
  }
};
