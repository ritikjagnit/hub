const prisma = require('../config/db');

// ────────── Invoices ──────────

exports.createInvoice = async (req, res) => {
  const { invoice_number, project_id, client_id, amount, status, issue_date, due_date } = req.body;

  if (!invoice_number || !amount || !issue_date || !due_date) {
    return res.status(400).json({ message: 'Invoice number, amount, issue date, and due date are required' });
  }

  try {
    const invoice = await prisma.invoice.create({
      data: {
        invoice_number,
        project_id: project_id ? parseInt(project_id) : null,
        client_id: client_id ? parseInt(client_id) : null,
        amount: parseFloat(amount),
        status: status || 'unpaid',
        issue_date: new Date(issue_date),
        due_date: new Date(due_date)
      }
    });

    res.status(201).json({ message: 'Invoice generated successfully', invoice });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getInvoices = async (req, res) => {
  const { project_id, client_id } = req.query;

  try {
    const where = {};
    if (project_id) where.project_id = parseInt(project_id);
    if (client_id) where.client_id = parseInt(client_id);

    // Clients see only their invoices
    if (req.user.role === 'client') {
      where.client_id = req.user.id;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        Projects: { select: { name: true } },
        Client: { select: { username: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = invoices.map(inv => ({
      ...inv,
      project_name: inv.Projects?.name,
      client_name: inv.Client?.username,
      client_email: inv.Client?.email
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.updateInvoice = async (req, res) => {
  const { id } = req.params;
  const { status, amount, due_date } = req.body;

  try {
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (due_date !== undefined) updateData.due_date = new Date(due_date);

    await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ message: 'Invoice updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.invoice.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// ────────── Expense Management ──────────

exports.createExpense = async (req, res) => {
  const { project_id, amount, description, category, logged_at } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'Expense amount is required' });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        project_id: project_id ? parseInt(project_id) : null,
        user_id: req.user.id,
        amount: parseFloat(amount),
        description,
        category,
        logged_at: logged_at ? new Date(logged_at) : new Date()
      }
    });

    res.status(201).json({ message: 'Expense logged successfully', expense });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getExpenses = async (req, res) => {
  const { project_id } = req.query;

  try {
    const where = {};
    if (project_id) where.project_id = parseInt(project_id);

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        Projects: { select: { name: true } },
        Users: { select: { username: true } }
      },
      orderBy: { logged_at: 'desc' }
    });

    const formatted = expenses.map(exp => ({
      ...exp,
      project_name: exp.Projects?.name,
      logged_by_name: exp.Users?.username
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// ────────── Project Cost Tracking ──────────

exports.getProjectCostSummary = async (req, res) => {
  const { id } = req.params; // project_id

  try {
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(id) },
      select: { name: true, budget: true }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Sum expenses
    const expensesAgg = await prisma.expense.aggregate({
      where: { project_id: parseInt(id) },
      _sum: { amount: true }
    });
    const totalExpenses = expensesAgg._sum.amount || 0;

    // Sum time logs cost (using billing_rate * duration_hours)
    const timeLogs = await prisma.timeLogs.findMany({
      where: { project_id: parseInt(id) }
    });

    let totalLabourCost = 0;
    timeLogs.forEach(log => {
      const hours = log.duration_seconds / 3600;
      const rate = log.billing_rate || 50; // default rate $50/hr
      totalLabourCost += hours * rate;
    });

    const totalCost = totalExpenses + totalLabourCost;
    const remainingBudget = project.budget ? (project.budget - totalCost) : null;

    res.json({
      project_id: parseInt(id),
      project_name: project.name,
      budget: project.budget,
      total_expenses: totalExpenses,
      total_labour_cost: parseFloat(totalLabourCost.toFixed(2)),
      total_cost: parseFloat(totalCost.toFixed(2)),
      remaining_budget: remainingBudget !== null ? parseFloat(remainingBudget.toFixed(2)) : null
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};
