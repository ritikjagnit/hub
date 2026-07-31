const prisma = require('../config/db');
const { sendEmail } = require('../utils/mailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'projectmanagement_secure_jwt_token_secret_998877';

// ────────── Organizations ──────────

exports.createOrganization = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Organization name is required' });
  }

  try {
    const org = await prisma.organization.create({
      data: { name }
    });

    // Automatically set the admin's organization_id if they don't have one
    if (req.user.role === 'admin') {
      await prisma.users.update({
        where: { id: req.user.id },
        data: { organization_id: org.id }
      });
    }

    res.status(201).json({ message: 'Organization created successfully', organization: org });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getOrganizations = async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany();
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getMyOrganization = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      include: { Organization: true }
    });
    if (!user || !user.organization_id) {
      return res.status(404).json({ message: 'No organization linked to this account' });
    }
    res.json(user.Organization);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// ────────── Teams & Departments ──────────

exports.createTeam = async (req, res) => {
  const { name, organization_id } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Team name is required' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    const orgId = organization_id ? parseInt(organization_id) : user.organization_id;

    const team = await prisma.team.create({
      data: {
        name,
        organization_id: orgId
      }
    });

    res.status(201).json({ message: 'Team created successfully', team });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user.organization_id) {
      return res.json([]);
    }
    const teams = await prisma.team.findMany({
      where: { organization_id: user.organization_id },
      include: { Users: { select: { id: true, username: true, role: true } } }
    });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.createDepartment = async (req, res) => {
  const { name, organization_id } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    const orgId = organization_id ? parseInt(organization_id) : user.organization_id;

    const dept = await prisma.department.create({
      data: {
        name,
        organization_id: orgId
      }
    });

    res.status(201).json({ message: 'Department created successfully', department: dept });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user.organization_id) {
      return res.json([]);
    }
    const depts = await prisma.department.findMany({
      where: { organization_id: user.organization_id },
      include: { Users: { select: { id: true, username: true, role: true } } }
    });
    res.json(depts);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// ────────── Employee Management ──────────

exports.getEmployees = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    const where = {};
    if (user.organization_id) {
      where.organization_id = user.organization_id;
    }

    const employees = await prisma.users.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        on_team: true,
        created_at: true,
        phone: true,
        Team: { select: { id: true, name: true } },
        Department: { select: { id: true, name: true } }
      }
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.assignEmployeeDetails = async (req, res) => {
  const { employee_id, team_id, department_id, role, phone } = req.body;
  if (!employee_id) {
    return res.status(400).json({ message: 'employee_id is required' });
  }

  try {
    const updateData = {};
    if (team_id !== undefined) updateData.team_id = team_id ? parseInt(team_id) : null;
    if (department_id !== undefined) updateData.department_id = department_id ? parseInt(department_id) : null;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;

    const updated = await prisma.users.update({
      where: { id: parseInt(employee_id) },
      data: updateData
    });

    res.json({ message: 'Employee profile updated successfully', employee: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// ────────── Email Invites ──────────

exports.inviteMember = async (req, res) => {
  const { email, role } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  try {
    // Generate a unique token
    const token = jwt.sign({ email, role: role || 'member' }, JWT_SECRET, { expiresIn: '7d' });
    
    // Save token to DB
    const invite = await prisma.invite.create({
      data: {
        token,
        role: role || 'member',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Send email invitation link
    const origin = req.headers.origin || req.get('origin') || 'http://localhost:5173';
    const inviteUrl = `${origin}/invite/join/${token}`;
    
    console.log(`\n=============================================`);
    console.log(`[Email Invite Simulation] Sent to: ${email}`);
    console.log(`Link: ${inviteUrl}`);
    console.log(`=============================================\n`);

    await sendEmail({
      to: email,
      subject: 'Invitation to join Project Management Hub',
      html: `
        <h3>Invitation to join the team!</h3>
        <p>You have been invited to register on Project Management Hub as a <strong>${role || 'member'}</strong>.</p>
        <p>Click the link below to set up your account and join the organization:</p>
        <p><a href="${inviteUrl}" style="padding: 10px 20px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a></p>
        <p>If the button doesn't work, copy-paste the URL: ${inviteUrl}</p>
      `
    }).catch(err => console.error("Failed to send invite email", err));

    res.json({ message: 'Invitation email sent successfully', invite });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};
