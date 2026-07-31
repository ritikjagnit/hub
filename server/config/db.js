const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, 'project.db');

// Ensure DATABASE_URL is set for Prisma's internal validation
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:" + dbPath;
}

const adapter = new PrismaBetterSqlite3({ url: "file:" + dbPath });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
