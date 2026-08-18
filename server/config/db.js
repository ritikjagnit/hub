const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config();

// Ensure single authoritative path to server/project.db
const dbPath = path.resolve(__dirname, '../project.db');
process.env.DATABASE_URL = "file:" + dbPath;

let prisma;
try {
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
  prisma = new PrismaClient({ adapter });
} catch (err) {
  console.warn('[DB Config] Fallback to standard PrismaClient:', err.message);
  prisma = new PrismaClient();
}

module.exports = prisma;
