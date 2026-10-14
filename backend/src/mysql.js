import mysql from "mysql2/promise";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = parseInt(process.env.DB_PORT || "3307", 10);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "retake_db";
const DB_SOCKET = process.env.DB_SOCKET || "/home/ghost/aiccm/backend/data/mysql.sock";

let pool = null;

/**
 * Ensures mariadbd daemon is running on port 3307 / socket
 */
export async function ensureMySQLDaemon() {
  const socketExists = existsSync(DB_SOCKET);
  if (!socketExists) {
    console.log("Starting MariaDB daemon...");
    try {
      const p = spawn("/usr/sbin/mariadbd", [
        `--datadir=${join(__dirname, "../data/mysql")}`,
        `--port=${DB_PORT}`,
        `--socket=${DB_SOCKET}`,
        `--pid-file=${join(__dirname, "../data/mysql.pid")}`,
      ], {
        detached: true,
        stdio: "ignore",
      });
      p.unref();
      // Wait up to 3 seconds for socket to appear
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 100));
        if (existsSync(DB_SOCKET)) break;
      }
    } catch (err) {
      console.warn("Could not auto-start MariaDB daemon:", err.message);
    }
  }
}

/**
 * Get or initialize connection pool
 */
export async function getPool() {
  if (pool) return pool;

  await ensureMySQLDaemon();

  // Create database if not exists
  const rootConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
  });
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await rootConn.end();

  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
  });

  return pool;
}

/**
 * Execute query with parameters
 */
export async function query(sql, params = []) {
  const p = await getPool();
  const [rows] = await p.query(sql, params);
  return rows;
}

/**
 * Execute prepared statement
 */
export async function execute(sql, params = []) {
  const p = await getPool();
  const [result] = await p.execute(sql, params);
  return result;
}

/**
 * Initialize all database tables and seed if empty
 */
export async function initMySQLTables(seedData = null) {
  const p = await getPool();

  console.log("🔧 Initializing MySQL tables in retake_db...");

  // 1. Users table
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      role VARCHAR(32) NOT NULL,
      balance_inr INT NOT NULL DEFAULT 0,
      credits INT NOT NULL DEFAULT 0,
      created_at VARCHAR(64),
      raw_data JSON,
      INDEX idx_users_email (email),
      INDEX idx_users_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Creators table
  await p.query(`
    CREATE TABLE IF NOT EXISTS creators (
      id VARCHAR(64) PRIMARY KEY,
      handle VARCHAR(64) UNIQUE NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      headline TEXT,
      bio TEXT,
      location VARCHAR(100),
      avatar_url TEXT,
      hero_image_url TEXT,
      created_at VARCHAR(64),
      raw_data JSON,
      INDEX idx_creators_handle (handle)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Briefs table
  await p.query(`
    CREATE TABLE IF NOT EXISTS briefs (
      id VARCHAR(64) PRIMARY KEY,
      brand_id VARCHAR(64) NOT NULL,
      brand_name VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      objective TEXT NOT NULL,
      requirements TEXT,
      content_type VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'open',
      budget_inr JSON,
      created_at VARCHAR(64),
      raw_data JSON,
      INDEX idx_briefs_brand (brand_id),
      INDEX idx_briefs_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Communication Requests
  await p.query(`
    CREATE TABLE IF NOT EXISTS communication_requests (
      id VARCHAR(64) PRIMARY KEY,
      creator_id VARCHAR(64),
      brand_id VARCHAR(64),
      status VARCHAR(32),
      created_at VARCHAR(64),
      raw_data JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. Threads & Messages
  await p.query(`
    CREATE TABLE IF NOT EXISTS threads (
      id VARCHAR(64) PRIMARY KEY,
      creator_id VARCHAR(64),
      brand_id VARCHAR(64),
      created_at VARCHAR(64),
      raw_data JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 6. Transactions
  await p.query(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      type VARCHAR(32),
      amount_inr INT,
      status VARCHAR(32),
      created_at VARCHAR(64),
      raw_data JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 7. Trackers (Production Workflow)
  await p.query(`
    CREATE TABLE IF NOT EXISTS trackers (
      id VARCHAR(64) PRIMARY KEY,
      brief_id VARCHAR(64),
      created_at VARCHAR(64),
      raw_data JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 8. Rights Certificates
  await p.query(`
    CREATE TABLE IF NOT EXISTS rights_certificates (
      id VARCHAR(64) PRIMARY KEY,
      brief_id VARCHAR(64),
      created_at VARCHAR(64),
      raw_data JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 9. Audit Logs
  await p.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      tag VARCHAR(32),
      actor VARCHAR(64),
      severity VARCHAR(32),
      created_at VARCHAR(64),
      raw_data JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 10. Applications & Proposals
  await p.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id VARCHAR(64) PRIMARY KEY,
      brief_id VARCHAR(64),
      creator_id VARCHAR(64),
      status VARCHAR(32),
      created_at VARCHAR(64),
      raw_data JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 11. Verifications
  await p.query(`
    CREATE TABLE IF NOT EXISTS verifications (
      id VARCHAR(64) PRIMARY KEY,
      creator_id VARCHAR(64),
      status VARCHAR(32),
      created_at VARCHAR(64),
      raw_data JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 12. Saved Creators
  await p.query(`
    CREATE TABLE IF NOT EXISTS saved_creators (
      id VARCHAR(64) PRIMARY KEY,
      raw_data JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 13. Reports
  await p.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(64) PRIMARY KEY,
      status VARCHAR(32),
      created_at VARCHAR(64),
      raw_data JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 14. Categories
  await p.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      raw_data JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("✅ All MySQL tables verified in retake_db.");

  // Check if seeding is needed
  const [userCountRows] = await p.query("SELECT COUNT(*) AS count FROM users");
  const count = userCountRows[0].count;

  if (count === 0 && seedData) {
    console.log("🌱 Seeding MySQL database from golden records...");
    await seedMySQL(seedData);
  }
}

/**
 * Seed all collections into MySQL
 */
export async function seedMySQL(data) {
  const p = await getPool();

  // Users
  if (data.users && data.users.length) {
    for (const u of data.users) {
      await p.query(
        `INSERT INTO users (id, email, password_hash, name, company, role, balance_inr, credits, created_at, raw_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), balance_inr=VALUES(balance_inr), credits=VALUES(credits), raw_data=VALUES(raw_data)`,
        [
          u.id,
          u.email,
          u.passwordHash || u.password_hash || "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
          u.name,
          u.company || null,
          u.role,
          u.balanceInr || u.balance_inr || 0,
          u.credits || 0,
          u.createdAt || new Date().toISOString(),
          JSON.stringify(u),
        ]
      );
    }
  }

  // Creators
  if (data.creators && data.creators.length) {
    for (const c of data.creators) {
      await p.query(
        `INSERT INTO creators (id, handle, display_name, headline, bio, location, avatar_url, hero_image_url, created_at, raw_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), raw_data=VALUES(raw_data)`,
        [
          c.id,
          c.handle,
          c.displayName || c.name || c.handle,
          c.headline || "",
          c.bio || "",
          c.location || "India",
          c.avatarUrl || null,
          c.heroImageUrl || null,
          c.createdAt || new Date().toISOString(),
          JSON.stringify(c),
        ]
      );
    }
  }

  // Briefs
  if (data.briefs && data.briefs.length) {
    for (const b of data.briefs) {
      await p.query(
        `INSERT INTO briefs (id, brand_id, brand_name, title, objective, requirements, content_type, status, budget_inr, created_at, raw_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title=VALUES(title), status=VALUES(status), raw_data=VALUES(raw_data)`,
        [
          b.id,
          b.brandId || b.brand_id || "client-vikram",
          b.brandName || b.brand_name || "Zomato Studios",
          b.title,
          b.objective || "",
          b.requirements || "",
          b.contentType || b.content_type || "video",
          b.status || "open",
          JSON.stringify(b.budgetInr || b.budget_inr || null),
          b.createdAt || new Date().toISOString(),
          JSON.stringify(b),
        ]
      );
    }
  }

  // Communication Requests
  if (data.communicationRequests && data.communicationRequests.length) {
    for (const req of data.communicationRequests) {
      await p.query(
        `INSERT INTO communication_requests (id, creator_id, brand_id, status, created_at, raw_data)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), raw_data=VALUES(raw_data)`,
        [
          req.id,
          req.creatorId || null,
          req.brandId || null,
          req.status || "pending",
          req.createdAt || new Date().toISOString(),
          JSON.stringify(req),
        ]
      );
    }
  }

  // Threads
  if (data.threads && data.threads.length) {
    for (const th of data.threads) {
      await p.query(
        `INSERT INTO threads (id, creator_id, brand_id, created_at, raw_data)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE raw_data=VALUES(raw_data)`,
        [
          th.id,
          th.creatorId || null,
          th.brandId || null,
          th.createdAt || new Date().toISOString(),
          JSON.stringify(th),
        ]
      );
    }
  }

  // Transactions
  if (data.transactions && data.transactions.length) {
    for (const tx of data.transactions) {
      await p.query(
        `INSERT INTO wallet_transactions (id, user_id, type, amount_inr, status, created_at, raw_data)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE raw_data=VALUES(raw_data)`,
        [
          tx.id,
          tx.userId || null,
          tx.type || "deposit",
          tx.amountInr || 0,
          tx.status || "completed",
          tx.createdAt || new Date().toISOString(),
          JSON.stringify(tx),
        ]
      );
    }
  }

  // Trackers
  if (data.trackers && data.trackers.length) {
    for (const tr of data.trackers) {
      await p.query(
        `INSERT INTO trackers (id, brief_id, created_at, raw_data)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE raw_data=VALUES(raw_data)`,
        [
          tr.id,
          tr.briefId || null,
          tr.createdAt || new Date().toISOString(),
          JSON.stringify(tr),
        ]
      );
    }
  }

  // Rights Certificates
  if (data.rightsCertificates && data.rightsCertificates.length) {
    for (const rc of data.rightsCertificates) {
      await p.query(
        `INSERT INTO rights_certificates (id, brief_id, created_at, raw_data)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE raw_data=VALUES(raw_data)`,
        [
          rc.id,
          rc.briefId || null,
          rc.createdAt || new Date().toISOString(),
          JSON.stringify(rc),
        ]
      );
    }
  }

  // Audit Logs
  if (data.auditLogs && data.auditLogs.length) {
    for (const al of data.auditLogs) {
      await p.query(
        `INSERT INTO audit_logs (id, tag, actor, severity, created_at, raw_data)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE raw_data=VALUES(raw_data)`,
        [
          al.id,
          al.tag || "SYSTEM",
          al.actor || "system",
          al.severity || "info",
          al.timestamp || al.createdAt || new Date().toISOString(),
          JSON.stringify(al),
        ]
      );
    }
  }

  // Applications
  if (data.applications && data.applications.length) {
    for (const app of data.applications) {
      await p.query(
        `INSERT INTO applications (id, brief_id, creator_id, status, created_at, raw_data)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), raw_data=VALUES(raw_data)`,
        [
          app.id,
          app.briefId || null,
          app.creatorId || null,
          app.status || "submitted",
          app.createdAt || new Date().toISOString(),
          JSON.stringify(app),
        ]
      );
    }
  }

  // Verifications
  if (data.verifications && data.verifications.length) {
    for (const v of data.verifications) {
      await p.query(
        `INSERT INTO verifications (id, creator_id, status, created_at, raw_data)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), raw_data=VALUES(raw_data)`,
        [
          v.id,
          v.creatorId || null,
          v.status || "pending",
          v.createdAt || new Date().toISOString(),
          JSON.stringify(v),
        ]
      );
    }
  }

  // Categories
  if (data.categories && data.categories.length) {
    for (const cat of data.categories) {
      await p.query(
        `INSERT INTO categories (id, raw_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE raw_data=VALUES(raw_data)`,
        [cat.id || cat.slug || String(Math.random()), JSON.stringify(cat)]
      );
    }
  }

  console.log("🌱 MySQL database seeding complete!");
}

/**
 * Fetch all records for a collection from MySQL
 */
export async function fetchCollectionFromMySQL(tableName) {
  const p = await getPool();
  const [rows] = await p.query(`SELECT raw_data FROM \`${tableName}\``);
  return rows.map((r) => (typeof r.raw_data === "string" ? JSON.parse(r.raw_data) : r.raw_data));
}

/**
 * Direct sync functions for real-time MySQL persistence on mutations
 */
export async function syncBriefToMySQL(brief) {
  const p = await getPool();
  await p.query(
    `INSERT INTO briefs (id, brand_id, brand_name, title, objective, requirements, content_type, status, budget_inr, created_at, raw_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       title=VALUES(title),
       objective=VALUES(objective),
       requirements=VALUES(requirements),
       status=VALUES(status),
       budget_inr=VALUES(budget_inr),
       raw_data=VALUES(raw_data)`,
    [
      brief.id,
      brief.brandId || "unknown",
      brief.brandName || "Brand",
      brief.title,
      brief.objective || "",
      brief.requirements || "",
      brief.contentType || "video",
      brief.status || "open",
      JSON.stringify(brief.budgetInr || null),
      brief.createdAt || new Date().toISOString(),
      JSON.stringify(brief),
    ]
  );
}

export async function syncUserToMySQL(user) {
  const p = await getPool();
  await p.query(
    `INSERT INTO users (id, email, password_hash, name, company, role, balance_inr, credits, created_at, raw_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name=VALUES(name),
       company=VALUES(company),
       role=VALUES(role),
       balance_inr=VALUES(balance_inr),
       credits=VALUES(credits),
       raw_data=VALUES(raw_data)`,
    [
      user.id,
      user.email,
      user.passwordHash || "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
      user.name,
      user.company || null,
      user.role,
      user.balanceInr || 0,
      user.credits || 0,
      user.createdAt || new Date().toISOString(),
      JSON.stringify(user),
    ]
  );
}

export async function syncCreatorToMySQL(creator) {
  const p = await getPool();
  await p.query(
    `INSERT INTO creators (id, handle, display_name, headline, bio, location, avatar_url, hero_image_url, created_at, raw_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       display_name=VALUES(display_name),
       headline=VALUES(headline),
       bio=VALUES(bio),
       raw_data=VALUES(raw_data)`,
    [
      creator.id,
      creator.handle,
      creator.displayName || creator.name || creator.handle,
      creator.headline || "",
      creator.bio || "",
      creator.location || "India",
      creator.avatarUrl || null,
      creator.heroImageUrl || null,
      creator.createdAt || new Date().toISOString(),
      JSON.stringify(creator),
    ]
  );
}

export async function syncApplicationToMySQL(app) {
  const p = await getPool();
  await p.query(
    `INSERT INTO applications (id, brief_id, creator_id, status, created_at, raw_data)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status=VALUES(status), raw_data=VALUES(raw_data)`,
    [
      app.id,
      app.briefId || null,
      app.creatorId || null,
      app.status || "submitted",
      app.createdAt || new Date().toISOString(),
      JSON.stringify(app),
    ]
  );
}

export async function syncTransactionToMySQL(tx) {
  const p = await getPool();
  await p.query(
    `INSERT INTO wallet_transactions (id, user_id, type, amount_inr, status, created_at, raw_data)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status=VALUES(status), raw_data=VALUES(raw_data)`,
    [
      tx.id,
      tx.userId || null,
      tx.type || "deposit",
      tx.amountInr || 0,
      tx.status || "completed",
      tx.createdAt || new Date().toISOString(),
      JSON.stringify(tx),
    ]
  );
}

export async function syncAuditLogToMySQL(log) {
  const p = await getPool();
  await p.query(
    `INSERT INTO audit_logs (id, tag, actor, severity, created_at, raw_data)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE raw_data=VALUES(raw_data)`,
    [
      log.id || `log_${Date.now()}`,
      log.tag || "SYSTEM",
      log.actor || "system",
      log.severity || "info",
      log.timestamp || new Date().toISOString(),
      JSON.stringify(log),
    ]
  );
}
