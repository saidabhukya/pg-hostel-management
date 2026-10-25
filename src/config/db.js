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
    try {
      // First try connecting to MySQL server (without database selected to ensure DB exists)
      const testConn = await mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        connectTimeout: 2000
      });
      await testConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await testConn.end();

      // Create pool with database selected
      pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true
      });

      // Quick sanity check
      await pool.query('SELECT 1');
      activeClient = 'mysql';
      console.log(`[Database] Connected to MySQL database "${config.db.database}" on ${config.db.host}:${config.db.port}`);
      return;
    } catch (err) {
      console.warn(`[Database] MySQL connection failed (${err.code || err.message}).`);
      console.log(`[Database] Automatically falling back to embedded SQLite database for seamless out-of-the-box operation.`);
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
  console.log(`[Database] SQLite active at: ${config.db.sqlitePath}`);
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
    const isSelect = /^(SELECT|PRAGMA|WITH)/i.test(trimmed);

    // Replace MySQL-specific syntax if any
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
    // Convert MySQL schema statements to SQLite compatible if running raw script
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
