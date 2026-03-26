import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

const DEFAULTS = {
  host: process.env.MYSQL_HOST ?? 'localhost',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE ?? 'numberly',
};

let pool;

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
    return null;
  }

  const separatorIndex = trimmed.indexOf('=');
  const key = trimmed.slice(0, separatorIndex).trim();
  const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
  return [key, value];
}

export async function loadEnvFile(envPath = path.resolve(process.cwd(), '.env')) {
  try {
    const raw = await fs.readFile(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) {
        continue;
      }
      const [key, value] = parsed;
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function getConfig() {
  return {
    host: process.env.MYSQL_HOST ?? DEFAULTS.host,
    port: Number(process.env.MYSQL_PORT ?? DEFAULTS.port),
    user: process.env.MYSQL_USER ?? DEFAULTS.user,
    password: process.env.MYSQL_PASSWORD ?? DEFAULTS.password,
    database: process.env.MYSQL_DATABASE ?? DEFAULTS.database,
  };
}

export function hashPassword(password) {
  return crypto.scryptSync(password, 'numberly-salt', 64).toString('hex');
}

export async function initializeDatabase() {
  if (pool) {
    return pool;
  }

  await loadEnvFile();
  const config = getConfig();

  let canCreateDatabase = true;

  try {
    const adminConnection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true,
    });

    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    await adminConnection.end();
  } catch (error) {
    canCreateDatabase = false;

    if (!['ER_DBACCESS_DENIED_ERROR', 'ER_ACCESS_DENIED_ERROR', 'ER_DB_CREATE_EXISTS'].includes(error.code)) {
      throw error;
    }
  }

  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    multipleStatements: true,
  });

  const schemaPath = path.resolve(process.cwd(), 'server', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');

  try {
    await pool.query(schema);
    await ensureUserMigrations(pool, config.database);
  } catch (error) {
    if (!canCreateDatabase && (error.code === 'ER_BAD_DB_ERROR' || error.code === 'ER_DBACCESS_DENIED_ERROR')) {
      throw new Error(
        `The MySQL user can connect, but it cannot create or access the database "${config.database}". Create that database manually and run server/bootstrap.sql, or grant this user privileges to it.`,
      );
    }

    throw error;
  }

  return pool;
}

async function ensureUserMigrations(pool, databaseName) {
  const [columns] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('last_lesson_on', 'role')`,
    [databaseName],
  );

  const columnNames = new Set((columns ?? []).map((column) => column.COLUMN_NAME));

  if (!columnNames.has('last_lesson_on')) {
    await pool.query(`ALTER TABLE users ADD COLUMN last_lesson_on DATE NULL AFTER streak_days`);
  }

  if (!columnNames.has('role')) {
    await pool.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user' AFTER password_hash`);
  }
}

export async function getPool() {
  return initializeDatabase();
}

export async function sanitizeUser(row) {
  if (!row) {
    return null;
  }

  const progressPool = await getPool();
  const [progressRows] = await progressPool.query(
    `SELECT level_id AS levelId, best_score AS bestScore, stars_earned AS starsEarned, times_completed AS timesCompleted, last_accuracy AS lastAccuracy
     FROM level_progress
     WHERE user_id = ?
     ORDER BY updated_at DESC`,
    [row.id],
  );

  const [settingsRows] = await progressPool.query(
    `SELECT sound_enabled AS soundEnabled, high_contrast AS highContrast, routine_mode AS routineMode, preferred_voice AS preferredVoice
     FROM user_settings
     WHERE user_id = ?`,
    [row.id],
  );

  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    role: row.role ?? 'user',
    avatarColor: row.avatar_color,
    ageGroup: row.age_group,
    totalXp: row.total_xp,
    streakDays: row.streak_days,
    hearts: row.hearts,
    dailyGoal: row.daily_goal,
    progress: progressRows,
    settings: settingsRows[0] ?? {
      soundEnabled: true,
      highContrast: false,
      routineMode: true,
      preferredVoice: 'gentle',
    },
  };
}
