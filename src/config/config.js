const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'pg_hostel_secret_jwt_key_2026_super_secure_college_portal',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    client: process.env.DB_CLIENT || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pg_hostel_db',
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
