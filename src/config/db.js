const mysql = require('mysql2/promise');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('./config');

let pool = null;
let sqliteDb = null;
let activeClient = 'none';

async function initDatabase() {
  if (config.db.client === 'mysql') {
    const sslConfig = config.db.ssl ? { rejectUnauthorized: false } : undefined;

    // 1. Try direct connection to target database first (standard for cloud MySQL e.g. TiDB, Aiven, Railway)
    try {
      pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        ssl: sslConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true,
        connectTimeout: 8000
      });

      await pool.query('SELECT 1');
      activeClient = 'mysql';
      console.log(`[Database] Connected successfully to Cloud MySQL "${config.db.database}" on ${config.db.host}:${config.db.port} (SSL: ${Boolean(sslConfig)})`);
      return;
    } catch (err) {
      console.warn(`[Database] Direct MySQL connection to "${config.db.database}" failed (${err.code || err.message}). Attempting database creation check...`);
    }

    // 2. If direct connection failed (e.g. fresh local MySQL where DB does not exist yet), try creating it
    try {
      const testConn = await mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        ssl: sslConfig,
        connectTimeout: 5000
      });
      await testConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await testConn.end();

      pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        ssl: sslConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true
      });

      await pool.query('SELECT 1');
      activeClient = 'mysql';
      console.log(`[Database] Created and connected to MySQL database "${config.db.database}" on ${config.db.host}:${config.db.port}`);
      return;
    } catch (err) {
      console.warn(`[Database] MySQL server is unavailable (${err.code || err.message}).`);
      console.log(`[Database] Automatically falling back to local SQLite database so the application can run seamlessly.`);
      activeClient = 'sqlite';
    }
  } else {
    activeClient = 'sqlite';
  }

  // SQLite Fallback
  const dbDir = path.dirname(config.db.sqlitePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new Database(config.db.sqlitePath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  console.log(`[Database] Local SQLite active at: ${config.db.sqlitePath}`);
}

/**
 * Execute a query with parameters
 * Returns array of rows for SELECT, or { insertId, affectedRows } for mutations
 */
async function query(sql, params = []) {
  if (activeClient === 'none') {
    await initDatabase();
  }

  if (activeClient === 'mysql') {
    const [result] = await pool.query(sql, params);
    if (Array.isArray(result)) {
      return result;
    }
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  } else {
    // SQLite implementation
    const trimmed = sql.trim();
    const isSelect = /^(SELECT|PRAGMA|WITH|SHOW)/i.test(trimmed);

    // Replace MySQL-specific syntax
    let normalizedSql = sql
      .replace(/NOW\(\)/gi, "datetime('now', 'localtime')")
      .replace(/CURDATE\(\)/gi, "date('now', 'localtime')");

    const stmt = sqliteDb.prepare(normalizedSql);

    if (isSelect) {
      return stmt.all(params);
    } else {
      const info = stmt.run(params);
      return {
        insertId: Number(info.lastInsertRowid),
        affectedRows: info.changes
      };
    }
  }
}

/**
 * Convenience helper to get a single row
 */
async function getOne(sql, params = []) {
  const rows = await query(sql, params);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * Execute raw multi-statement SQL script
 */
async function execScript(sqlScript) {
  if (activeClient === 'none') {
    await initDatabase();
  }

  if (activeClient === 'mysql') {
    const connection = await pool.getConnection();
    try {
      const statements = sqlScript
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        await connection.query(statement);
      }
    } finally {
      connection.release();
    }
  } else {
    sqliteDb.exec(sqlScript);
  }
}

function getActiveClient() {
  return activeClient;
}

module.exports = {
  initDatabase,
  query,
  getOne,
  execScript,
  getActiveClient
};
