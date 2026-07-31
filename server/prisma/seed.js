/**
 * Database Seed Script
 * Creates demo users (admin, project manager, team member, client)
 * and sample projects + tasks for demonstration purposes.
 */

const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../config/project.db');
const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // ── 1. Create Demo Users ────────────────────────────────────────────────────
  const salt = await bcrypt.genSalt(10);

  // 1. Create or Update Admin User
  const adminEmail = 'support@stufflas.com';
  const adminPasswordHash = await bcrypt.hash('Stufflas@123', salt);
  
  let admin = await prisma.users.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const oldAdmin = await prisma.users.findUnique({ where: { email: 'admin@pms.com' } });
    if (oldAdmin) {
      admin = await prisma.users.update({
        where: { id: oldAdmin.id },
        data: {
          email: adminEmail,
          password: adminPasswordHash,
          username: 'Admin User',
          role: 'admin'
        }
      });
      console.log(`  ✅ Updated existing admin account (admin@pms.com -> ${adminEmail})`);
    } else {
      admin = await prisma.users.create({
        data: {
          username: 'Admin User',
          email: adminEmail,
          password: adminPasswordHash,
          role: 'admin'
        }
      });
      console.log(`  ✅ Created new admin account: ${adminEmail}`);
    }
  } else {
    admin = await prisma.users.update({
      where: { id: admin.id },
      data: {
        password: adminPasswordHash,
        username: 'Admin User',
        role: 'admin'
      }
    });
    console.log(`  ✅ Updated admin password: ${adminEmail}`);
  }

  const users = [
    { username: 'Project Manager',  email: 'pm@pms.com',         password: await bcrypt.hash('pm123',      salt), role: 'project_manager' },
    { username: 'John Developer',   email: 'john@pms.com',       password: await bcrypt.hash('john123',    salt), role: 'team_member'     },
    { username: 'Sarah Designer',   email: 'sarah@pms.com',      password: await bcrypt.hash('sarah123',   salt), role: 'team_member'     },
    { username: 'Client Viewer',    email: 'client@pms.com',     password: await bcrypt.hash('client123',  salt), role: 'client'          },
  ];

  const createdUsers = [admin];
  for (const userData of users) {
    const existing = await prisma.users.findUnique({ where: { email: userData.email } });
    if (!existing) {
      const u = await prisma.users.create({ data: userData });
      createdUsers.push(u);
      console.log(`  ✅ Created user: ${userData.email} (${userData.role})`);
    } else {
      createdUsers.push(existing);
      console.log(`  ⚠️  User already exists: ${userData.email}`);
    }
  }

  const [_, pm, john, sarah, client] = createdUsers;

  // ── 2. Create Sample Projects ───────────────────────────────────────────────
  const projectsData = [
    {
      name: 'Alpha Website Redesign',
      description: 'Full redesign of the company website including new branding, UI overhaul, and performance optimization.',
      status: 'in_progress',
      deadline: new Date('2025-09-30'),
      manager_id: pm.id,
    },
    {
      name: 'Mobile App Development',
      description: 'React Native mobile application for iOS and Android with offline-first architecture.',
      status: 'pending',
      deadline: new Date('2025-12-15'),
      manager_id: pm.id,
    },
    {
      name: 'Database Migration',
      description: 'Migrate legacy MySQL database to PostgreSQL with zero-downtime deployment strategy.',
      status: 'testing',
      deadline: new Date('2025-08-01'),
      manager_id: admin.id,
    },
  ];

  const createdProjects = [];
  for (const projData of projectsData) {
    const existing = await prisma.projects.findFirst({ where: { name: projData.name } });
    if (!existing) {
      const p = await prisma.projects.create({ data: projData });
      createdProjects.push(p);
      console.log(`  ✅ Created project: "${projData.name}"`);
    } else {
      createdProjects.push(existing);
      console.log(`  ⚠️  Project already exists: "${projData.name}"`);
    }
  }

  const [proj1, proj2, proj3] = createdProjects;

  // ── 3. Assign Team Members to Projects ─────────────────────────────────────
  const memberAssignments = [
    { project_id: proj1.id, user_id: john.id  },
    { project_id: proj1.id, user_id: sarah.id },
    { project_id: proj1.id, user_id: pm.id    },
    { project_id: proj2.id, user_id: john.id  },
    { project_id: proj2.id, user_id: pm.id    },
    { project_id: proj3.id, user_id: sarah.id },
    { project_id: proj3.id, user_id: john.id  },
  ];

  for (const assignment of memberAssignments) {
    await prisma.projectMembers.upsert({
      where: { project_id_user_id: { project_id: assignment.project_id, user_id: assignment.user_id } },
      update: {},
      create: assignment,
    });
  }
  console.log(`  ✅ Project member assignments complete`);

  // ── 4. Create Sample Tasks ──────────────────────────────────────────────────
  const tasksData = [
    // Project 1 tasks
    { title: 'Design System Setup',     description: 'Create global CSS tokens, typography, and component library.',    priority: 'high',   status: 'completed',   due_date: new Date('2025-07-15'), assigned_to: sarah.id, project_id: proj1.id },
    { title: 'Homepage UI Rebuild',     description: 'Rebuild the homepage with new hero section and service cards.',    priority: 'high',   status: 'in_progress', due_date: new Date('2025-08-20'), assigned_to: sarah.id, project_id: proj1.id },
    { title: 'Performance Audit',       description: 'Run Lighthouse audits and fix Core Web Vitals issues.',            priority: 'medium', status: 'pending',     due_date: new Date('2025-09-01'), assigned_to: john.id,  project_id: proj1.id },
    { title: 'Backend API Integration', description: 'Connect new frontend to REST API endpoints.',                      priority: 'medium', status: 'in_progress', due_date: new Date('2025-08-30'), assigned_to: john.id,  project_id: proj1.id },
    // Project 2 tasks
    { title: 'App Architecture Design', description: 'Define navigation flow, state management (Redux/Zustand).',        priority: 'high',   status: 'pending',     due_date: new Date('2025-09-15'), assigned_to: john.id,  project_id: proj2.id },
    { title: 'Authentication Module',   description: 'Build login, registration, and token refresh flows.',              priority: 'high',   status: 'pending',     due_date: new Date('2025-10-01'), assigned_to: john.id,  project_id: proj2.id },
    // Project 3 tasks
    { title: 'Schema Analysis',         description: 'Document all legacy MySQL tables, foreign keys, and indexes.',     priority: 'high',   status: 'completed',   due_date: new Date('2025-07-20'), assigned_to: john.id,  project_id: proj3.id },
    { title: 'Migration Script',        description: 'Write and test ETL scripts for data migration with rollback.',     priority: 'high',   status: 'testing',     due_date: new Date('2025-07-28'), assigned_to: sarah.id, project_id: proj3.id },
    { title: 'Validation & QA',         description: 'Verify row counts and data integrity after migration.',            priority: 'medium', status: 'pending',     due_date: new Date('2025-07-31'), assigned_to: john.id,  project_id: proj3.id },
  ];

  for (const taskData of tasksData) {
    const existing = await prisma.tasks.findFirst({
      where: { title: taskData.title, project_id: taskData.project_id }
    });
    if (!existing) {
      await prisma.tasks.create({ data: taskData });
      console.log(`  ✅ Created task: "${taskData.title}"`);
    } else {
      console.log(`  ⚠️  Task already exists: "${taskData.title}"`);
    }
  }

  // ── 5. Create Sample Chat Messages ─────────────────────────────────────────
  const messages = [
    { sender_id: admin.id, project_id: null,    content: 'Welcome to the team workspace! Please complete your profile setup.' },
    { sender_id: pm.id,    project_id: null,    content: 'All projects are now active. Please check your assigned tasks.' },
    { sender_id: john.id,  project_id: proj1.id, content: 'Homepage rebuild is 60% complete. Aiming to push the branch tomorrow.' },
    { sender_id: sarah.id, project_id: proj1.id, content: 'Design system tokens are ready for review. Link in the PR.' },
  ];

  const existingMessages = await prisma.messages.count();
  if (existingMessages === 0) {
    for (const msg of messages) {
      await prisma.messages.create({ data: msg });
    }
    console.log(`  ✅ Sample chat messages created`);
  } else {
    console.log(`  ⚠️  Chat messages already exist, skipping`);
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo Login Credentials:');
  console.log('  Admin:           support@stufflas.com  / Stufflas@123');
  console.log('  Project Manager: pm@pms.com     / pm123');
  console.log('  Developer:       john@pms.com   / john123');
  console.log('  Designer:        sarah@pms.com  / sarah123');
  console.log('  Client:          client@pms.com / client123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
