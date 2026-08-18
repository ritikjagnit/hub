const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const resolveDbPath = () => {
  const p1 = path.resolve(__dirname, '../project.db');
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve(__dirname, 'project.db');
  if (fs.existsSync(p2)) return p2;
  return p1;
};

const dbPath = resolveDbPath();
process.env.DATABASE_URL = "file:" + dbPath;

let prisma;
try {
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
  prisma = new PrismaClient({ adapter });
} catch (err) {
  console.warn('[DB Config] Adapter fallback to standard PrismaClient:', err.message);
  prisma = new PrismaClient();
}

module.exports = prisma;
