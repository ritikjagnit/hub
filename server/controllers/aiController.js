const prisma = require('../config/db');

// Helper to simulate smart AI responses in case no API key is provided
const generateMockAIResponse = async (type, context) => {
  switch (type) {
    case 'task_generator':
      return [
        { title: `Initialize ${context.project_name} codebase`, description: 'Setup React client, Express server and Prisma schema.', priority: 'high', due_days: 3 },
        { title: 'Database schema implementation', description: 'Create SQLite tables and run migrations.', priority: 'high', due_days: 5 },
        { title: 'Setup Authentication Flow', description: 'Implement JWT login, signup and JWT role validation.', priority: 'medium', due_days: 7 },
        { title: 'Design Dashboard UI', description: 'Create responsive glassmorphic widgets for charts and task progression.', priority: 'medium', due_days: 10 },
        { title: 'Unit & integration testing', description: 'Write unit tests for routers and run validation tests.', priority: 'low', due_days: 14 }
      ];

    case 'project_planning':
      return {
        phases: [
          { phase: 'Planning & Requirements', duration: '1 week', milestones: ['Project Charter approved', 'Initial mockups completed'] },
          { phase: 'Core Backend Development', duration: '2 weeks', milestones: ['Database migration completed', 'Core REST APIs tested'] },
          { phase: 'Frontend Layout Design', duration: '2 weeks', milestones: ['Responsive components styled', 'State management integrated'] },
          { phase: 'Integration & Testing', duration: '1 week', milestones: ['E2E testing passed', 'Performance audit optimized'] },
          { phase: 'Release & Handover', duration: '1 week', milestones: ['Client portal demo approved', 'Production bundle built'] }
        ],
        critical_path: ['Planning & Requirements', 'Core Backend Development', 'Integration & Testing', 'Release & Handover']
      };

    case 'risk_detection':
      const delayedTasksCount = context.delayed_tasks || 0;
      const budgetOverrun = context.budget_overrun || false;
      const risks = [];

      if (delayedTasksCount > 0) {
        risks.push({
          level: 'high',
          title: 'Schedule Slippage Risk',
          desc: `The project has ${delayedTasksCount} tasks past their due date. This may delay the final milestone.`
        });
      }
      if (budgetOverrun) {
        risks.push({
          level: 'critical',
          title: 'Budget Deficit Risk',
          desc: 'Total logged expenses and labour costs have exceeded the allocated project budget limit.'
        });
      } else {
        risks.push({
          level: 'low',
          title: 'Under-allocation Risk',
          desc: 'Team members have logged fewer hours than expected. Progress might be slower than the timeline demands.'
        });
      }
      risks.push({
        level: 'medium',
        title: 'Dependency Bottleneck',
        desc: 'Multiple critical tasks depend on database migrations. A delay there will block downstream development.'
      });

      return risks;

    case 'meeting_summary':
      return {
        summary: `The team aligned on the key milestones for the upcoming release. Discussed resolving SQLite schema updates and designing custom widgets.`,
        action_items: [
          'Setup new organization, team and department routers (Assigned to Manager)',
          'Update CSS stylesheet variables for the Gantt view (Assigned to frontend lead)',
          'Finalize invoice templates for payment history page (Assigned to client client)'
        ]
      };

    case 'chat_assistant':
      return `Hello! I'm your Ascent AI Assistant. I see you are working on project "${context.project_name || 'N/A'}". You currently have ${context.total_tasks || 0} tasks total, with ${context.pending_tasks || 0} pending. You can ask me to generate tasks, outline timelines, or scan for delivery risks. How can I help you today?`;

    case 'report_generation':
      return `
# Executive Summary: ${context.project_name}
Prepared by Ascent AI Core.

### 1. Delivery Progression
- Total tasks: ${context.total_tasks}
- Completed tasks: ${context.completed_tasks}
- Tasks completion rate: ${context.total_tasks > 0 ? Math.round((context.completed_tasks / context.total_tasks) * 100) : 0}%

### 2. Time Allocation
- Total hours logged: ${context.hours_logged} hours
- Billable hours: ${context.billable_hours} hours

### 3. Cost Assessment
- Project Budget: $${context.budget || 0}
- Current Expenses: $${context.expenses || 0}
- Current Labour Cost: $${context.labour_cost || 0}
- Net Balance: $${context.balance || 0}

*AI Recommendation:* Ensure delayed tasks are re-assigned to employees with open bandwidth in the Team view.
      `;

    case 'thesis_reviewer':
      return `### Thesis Structural Review
- **Abstract**: Clear and concise, but could benefit from a stronger statement on the methodology.
- **Problem Statement**: Strong. Clearly defines the scope.
- **Literature Review**: Needs more recent citations (2024-2026).
- **Methodology**: Solid. The flow diagram explanation is well-written.
- **Formatting**: Double-check the margin alignment and font hierarchy (IEEE format requires Times New Roman 10pt for body text).`;

    case 'grammar_checker':
      return `### Grammar & Syntax Corrections
- **Original**: "We has did the implementation using node and sqlite database which gives fast results."
- **Corrected**: "We implemented the system using Node.js and an SQLite database, which yields optimal performance."
- **Improvement**: Replaced passive voice and corrected subject-verb agreement.`;

    case 'formatting_suggestions':
      return `### Academic Formatting Suggestions
- **Margin Alignments**: Ensure all margins are set to 1 inch (2.54 cm) on all sides.
- **Citation Style**: Change inline citations to follow standard APA 7th edition formatting, e.g., (Smith, 2024) instead of Smith [2024].
- **Heading Hierarchies**: Ensure Section headers are Bold, size 14, and centered.`;

    case 'reference_suggestions':
      return `### Recommended References & Citations
1. Smith, J., & Doe, A. (2025). *Modern Project Architecture in Academic Administration*. Journal of Software Engineering, 12(3), 145-158.
2. Kumar, R. (2024). *Performance Optimization techniques in SQLite-driven systems*. ACM Transactions on Database Systems, 49(1), 22-35.
3. Lee, H. (2026). *Evaluating Agile methodologies in Senior Capstone Projects*. IEEE Software, 43(2), 78-85.`;

    case 'chapter_summary':
      return `### Chapter Summary
This chapter introduces the design paradigms and core architecture of the proposed system. It outlines the entity-relationship diagrams (ERD) defining relationships between students, guides, and departments. Additionally, it details the selection of SQLite for local persistence and highlights performance characteristics under low-resource environments.`;

    case 'weekly_report_generator':
      return `### Student Progress Report (Weekly)
**Week Range:** 24 June 2026 - 30 June 2026
- **Progress Percentage:** 85%
- **Tasks Completed:** 4 tasks (Chapter 1 Writing, Database Seeding, Git repository setup).
- **Key Achievements:** Configured Prisma client with new relation rules and validated DB connection.
- **Next Steps:** Complete the methodology outline and submit Chapter 2 to the Guide.`;

    case 'project_documentation_generator':
      return `# Project Documentation: Academic Thesis System

## 1. System Overview
A multi-tenant system connecting Students, Guides, HODs, and Examiners.

## 2. Technical Stack
- Frontend: React (Vite)
- Backend: Express (Node.js)
- Database: SQLite via Prisma ORM

## 3. Core Models
- Thesis drafts with version history.
- Evaluation board using custom grading rubrics.`;

    case 'viva_question_generator':
      return `### Mock Viva / Defense Questions
1. *How does SQLite handle concurrency under multiple write operations from different students?*
2. *Why did you choose a relation-based Prisma schema over a document-based schema (MongoDB) for thesis tracking?*
3. *What is the role of the ThesisVersion model and how does it prevent data loss on draft updates?*
4. *How does the system enforce Role-Based Access Control (RBAC) securely on the client vs backend?*`;

    case 'resume_builder':
      return `### Recommended Resume Layout (Academic Highlight)
- **Name**: Student User
- **Title**: Full Stack Developer / Academic Researcher
- **Project Highlight**: Developed an "Academic Project & Thesis Management System" using Node.js, React, SQLite, and Prisma. Implemented RBAC, daily logging workflows, and automated marks auditing.
- **Core Skills**: JavaScript, React.js, Express, SQLite, Prisma ORM, REST APIs, Git.`;

    case 'task_breakdown':
      return `### AI Task Breakdown
1. **Requirement Analysis**: Gather rubric specs and mark distribution rules. (Est: 4h)
2. **Prisma Schema Expansion**: Add relation fields for grades and log review status. (Est: 3h)
3. **Controller API Design**: Implement CRUD for evaluation reports and daily log validations. (Est: 6h)
4. **Frontend Dashboard Components**: Build guide and HOD tracking widgets. (Est: 8h)`;

    case 'progress_analysis':
      return `### Student Performance & Progress Analysis
- **Velocity**: Consistent. Logging an average of 6.5 hours of daily development.
- **Completion Rate**: 90% of assigned tasks are completed before the due date.
- **Risk Factors**: High dependency on guide feedback for Chapter 3.
- **Grading Projection**: Excellent (A+) based on current rubric performance.`;

    default:
      return 'AI Operation not found';
  }
};

// ────────── Endpoints ──────────

exports.generateTasks = async (req, res) => {
  const { project_id, description } = req.body;
  if (!project_id) {
    return res.status(400).json({ message: 'project_id is required' });
  }

  try {
    const project = await prisma.projects.findUnique({ where: { id: parseInt(project_id) } });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Call mock AI generator
    const tasks = await generateMockAIResponse('task_generator', { project_name: project.name, description });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.generateProjectPlan = async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) {
    return res.status(400).json({ message: 'project_id is required' });
  }

  try {
    const project = await prisma.projects.findUnique({ where: { id: parseInt(project_id) } });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const plan = await generateMockAIResponse('project_planning', { project_name: project.name });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.detectRisks = async (req, res) => {
  const { project_id } = req.params;

  try {
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(project_id) },
      include: { Tasks: true }
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Count tasks past due date and not completed
    const now = new Date();
    const delayedTasks = project.Tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length;

    // Check budget
    const expensesAgg = await prisma.expense.aggregate({
      where: { project_id: parseInt(project_id) },
      _sum: { amount: true }
    });
    const totalExpenses = expensesAgg._sum.amount || 0;

    const timeLogs = await prisma.timeLogs.findMany({ where: { project_id: parseInt(project_id) } });
    let totalLabourCost = 0;
    timeLogs.forEach(log => {
      totalLabourCost += (log.duration_seconds / 3600) * (log.billing_rate || 50);
    });

    const budgetOverrun = project.budget ? (totalExpenses + totalLabourCost > project.budget) : false;

    const risks = await generateMockAIResponse('risk_detection', {
      project_name: project.name,
      delayed_tasks: delayedTasks,
      budget_overrun: budgetOverrun
    });

    res.json({ risks });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.summarizeMeeting = async (req, res) => {
  const { notes } = req.body;
  if (!notes) {
    return res.status(400).json({ message: 'Meeting notes/minutes are required to summarize' });
  }

  try {
    const summary = await generateMockAIResponse('meeting_summary', { notes });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.chatAssistant = async (req, res) => {
  const { message, project_id } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Message content is required' });
  }

  try {
    let context = { project_name: 'General Workspace' };
    if (project_id) {
      const project = await prisma.projects.findUnique({
        where: { id: parseInt(project_id) },
        include: { Tasks: true }
      });
      if (project) {
        const total = project.Tasks.length;
        const pending = project.Tasks.filter(t => t.status !== 'completed').length;
        context = {
          project_name: project.name,
          total_tasks: total,
          pending_tasks: pending
        };
      }
    }

    const reply = await generateMockAIResponse('chat_assistant', context);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.generateReport = async (req, res) => {
  const { project_id } = req.params;

  try {
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(project_id) },
      include: { Tasks: true }
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Aggregate statistics
    const totalTasks = project.Tasks.length;
    const completedTasks = project.Tasks.filter(t => t.status === 'completed').length;

    const timeLogs = await prisma.timeLogs.findMany({ where: { project_id: parseInt(project_id) } });
    let totalSeconds = 0;
    let billableSeconds = 0;
    let labourCost = 0;

    timeLogs.forEach(log => {
      totalSeconds += log.duration_seconds;
      if (log.billable) {
        billableSeconds += log.duration_seconds;
      }
      labourCost += (log.duration_seconds / 3600) * (log.billing_rate || 50);
    });

    const expensesAgg = await prisma.expense.aggregate({
      where: { project_id: parseInt(project_id) },
      _sum: { amount: true }
    });
    const totalExpenses = expensesAgg._sum.amount || 0;

    const totalCost = totalExpenses + labourCost;
    const balance = project.budget ? (project.budget - totalCost) : 0;

    const report = await generateMockAIResponse('report_generation', {
      project_name: project.name,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      hours_logged: parseFloat((totalSeconds / 3600).toFixed(1)),
      billable_hours: parseFloat((billableSeconds / 3600).toFixed(1)),
      budget: project.budget,
      expenses: totalExpenses,
      labour_cost: parseFloat(labourCost.toFixed(2)),
      balance: parseFloat(balance.toFixed(2))
    });

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.academicAssistant = async (req, res) => {
  const { operation, text, context } = req.body;
  if (!operation) {
    return res.status(400).json({ message: 'AI Academic operation is required' });
  }

  try {
    const response = await generateMockAIResponse(operation, { text, ...context });
    res.json({ response });
  } catch (err) {
    res.status(500).json({ message: 'Server error in AI Assistant: ' + err.message });
  }
};
