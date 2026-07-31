const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../config/project.db');
const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting academic database seed...');
  const salt = await bcrypt.genSalt(10);

  // 1. Create or Find Organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Vite University' }
    });
    console.log(`  ✅ Created Organization: ${org.name}`);
  }

  // 2. Create or Find Department
  let dept = await prisma.department.findFirst({
    where: { name: 'Computer Science & Engineering' }
  });
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: 'Computer Science & Engineering',
        organization_id: org.id
      }
    });
    console.log(`  ✅ Created Department: ${dept.name}`);
  }

  // 3. Create Academic Users
  const academicUsers = [
    { username: 'Dr. Albus HOD', email: 'hod@pms.com', password: await bcrypt.hash('hod123', salt), role: 'hod', organization_id: org.id, department_id: dept.id },
    { username: 'Prof. Severus Guide', email: 'guide@pms.com', password: await bcrypt.hash('guide123', salt), role: 'guide', organization_id: org.id, department_id: dept.id },
    { username: 'Harry Student', email: 'student@pms.com', password: await bcrypt.hash('student123', salt), role: 'student', organization_id: org.id, department_id: dept.id },
  ];

  const createdUsers = {};
  for (const user of academicUsers) {
    let existing = await prisma.users.findUnique({ where: { email: user.email } });
    if (!existing) {
      existing = await prisma.users.create({ data: user });
      console.log(`  ✅ Created user: ${user.email} (${user.role})`);
    } else {
      existing = await prisma.users.update({
        where: { id: existing.id },
        data: {
          role: user.role,
          department_id: dept.id,
          organization_id: org.id
        }
      });
      console.log(`  ⚠️  User already existed, updated role to: ${user.role}`);
    }
    createdUsers[user.role] = existing;
  }

  const guide = createdUsers['guide'];
  const student = createdUsers['student'];

  // 4. Create Academic Project
  let project = await prisma.projects.findFirst({
    where: { name: 'AI Powered Capstone Scheduler' }
  });
  if (!project) {
    project = await prisma.projects.create({
      data: {
        name: 'AI Powered Capstone Scheduler',
        description: 'An advanced system utilizing Large Language Models to automate milestones and generate grading rubrics.',
        status: 'in_progress',
        deadline: new Date('2026-12-31'),
        manager_id: guide.id,
        organization_id: org.id,
        budget: 5000,
        priority: 'high',
        start_date: new Date()
      }
    });
    console.log(`  ✅ Created Project: "${project.name}"`);
  }

  // Assign student to project
  await prisma.projectMembers.upsert({
    where: { project_id_user_id: { project_id: project.id, user_id: student.id } },
    update: {},
    create: {
      project_id: project.id,
      user_id: student.id
    }
  });
  console.log(`  ✅ Assigned student to project`);

  // 5. Create Academic Tasks with extended fields
  const academicTasks = [
    { title: 'Chapter 1: Literature Review Draft', description: 'Compile primary academic references on capstone automation.', priority: 'high', status: 'completed', due_date: new Date('2026-07-15'), assigned_to: student.id, project_id: project.id },
    { title: 'Chapter 2: System Architecture Flowchart', description: 'Design clean layout for database and microservices integrations.', priority: 'medium', status: 'in_progress', due_date: new Date('2026-08-30'), assigned_to: student.id, project_id: project.id }
  ];

  for (const taskData of academicTasks) {
    let task = await prisma.tasks.findFirst({
      where: { title: taskData.title, project_id: project.id }
    });
    if (!task) {
      task = await prisma.tasks.create({ data: taskData });
      console.log(`  ✅ Created task: "${task.title}"`);
    }

    // Attach academic details
    await prisma.academicTaskDetail.upsert({
      where: { task_id: task.id },
      update: {},
      create: {
        task_id: task.id,
        task_type: taskData.title.includes('Literature') ? 'Research' : 'Documentation',
        marks: 10,
        rubric: 'Clear description of sources, robust methodology validation.',
        estimated_hours: 8,
        actual_hours: 6,
        progress_percent: taskData.status === 'completed' ? 100 : 35
      }
    });
  }

  // 6. Create Thesis Record
  let thesis = await prisma.thesis.findFirst({
    where: { student_id: student.id }
  });
  if (!thesis) {
    thesis = await prisma.thesis.create({
      data: {
        title: 'Deep Learning for Automated Thesis Validation',
        abstract: 'This thesis proposes a transformer-based language model to evaluate systemic formatting rules and automatically check grammar for capstone reports.',
        problem_statement: 'Manual thesis checking is tedious and error-prone for academic advisors.',
        objectives: 'Build an automated web application utilizing semantic search and style guide prompts.',
        literature_review: 'Prior work has largely focused on general citation checkers rather than semantic quality checks.',
        methodology: 'Applying fine-tuned BERT models over standardized LaTeX university templates.',
        status: 'draft',
        student_id: student.id,
        guide_id: guide.id,
        project_id: project.id,
        department_id: dept.id
      }
    });
    console.log(`  ✅ Created Thesis: "${thesis.title}"`);
  }

  // 7. Create Daily progress logs
  const logsCount = await prisma.dailyLog.count({ where: { student_id: student.id } });
  if (logsCount === 0) {
    await prisma.dailyLog.createMany({
      data: [
        {
          student_id: student.id,
          project_id: project.id,
          today_work: 'Drafted Literature Review chapter and formatted index section.',
          hours_worked: 6.5,
          github_link: 'https://github.com/student/thesis-project',
          problems_faced: 'Faced small latency issues while running local NLP checks.',
          tomorrow_plan: 'Design full entity flowchart in draw.io.',
          status: 'approved',
          feedback: 'Excellent progress, Harry.',
          reviewed_by: guide.id,
          reviewed_at: new Date()
        },
        {
          student_id: student.id,
          project_id: project.id,
          today_work: 'Integrated express routers with schema validation.',
          hours_worked: 4,
          github_link: 'https://github.com/student/thesis-project',
          problems_faced: 'None',
          tomorrow_plan: 'Connect to SQLite client.',
          status: 'pending'
        }
      ]
    });
    console.log(`  ✅ Added sample daily logs`);
  }

  // 8. Create Research Papers
  const papersCount = await prisma.researchPaper.count();
  if (papersCount === 0) {
    await prisma.researchPaper.create({
      data: {
        title: 'Transformer Networks in Capstone Grading Systems',
        authors: 'H. Potter, A. Dumbledore',
        journal: 'International Journal of Academic Systems',
        year: 2025,
        abstract: 'This paper documents the design metrics for applying attention networks to automate university scoring panels.',
        file_path: '/uploads/sample-paper.pdf',
        uploaded_by: student.id,
        status: 'approved',
        verified_by: guide.id
      }
    });
    console.log(`  ✅ Added sample research papers`);
  }

  // 9. Create Mock Certificate
  const certCount = await prisma.academicCertificate.count({ where: { student_id: student.id } });
  if (certCount === 0) {
    await prisma.academicCertificate.create({
      data: {
        student_id: student.id,
        certificate_type: 'completion',
        certificate_uuid: 'vite-university-cert-2026-xyz987',
        file_path: '/uploads/cert.pdf'
      }
    });
    console.log(`  ✅ Added sample Completion Certificate`);
  }

  console.log('\n🎉 Academic Seed complete!\n');
  console.log('Demo Academic Login Credentials:');
  console.log('  HOD:     hod@pms.com     / hod123');
  console.log('  Guide:   guide@pms.com   / guide123');
  console.log('  Student: student@pms.com / student123');
}

main()
  .catch((e) => {
    console.error('Academic Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
