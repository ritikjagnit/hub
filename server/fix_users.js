const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'config/project.db');
const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const res = await prisma.users.updateMany({ where: { on_team: false }, data: { on_team: true } });
  console.log('Updated ' + res.count + ' users');
}
main().catch(console.error).finally(() => prisma.$disconnect());
