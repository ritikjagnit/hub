const prisma = require('../config/db'); // trigger restart
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/mailer');

const sendTeamAddedEmail = async (email, username, role, plainPassword = null, origin = 'http://localhost:5173') => {
  try {
    const roleName = role === 'admin' ? 'Admin' : (role === 'member' ? 'Member' : role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    const loginLink = `${origin}/login`;

    const passwordContent = plainPassword 
      ? `<p style="margin: 6px 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 1.1rem; color: #06b6d4; font-weight: bold; background: #e0f2fe; padding: 2px 8px; border-radius: 4px;">${plainPassword}</span></p>`
      : `<p style="margin: 6px 0;"><strong>Password:</strong> Use your existing account password.<br/><span style="font-size: 12px; color: #666;">(If you forgot your password, click "Forgot Password" on the login page to reset it).</span></p>`;

    await sendEmail({
      to: email,
      subject: 'You have been added to the Project Hub Team',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 28px; border-radius: 10px; background-color: #ffffff; color: #333333;">
          <h2 style="color: #06b6d4; margin-top: 0; font-size: 22px;">Welcome to Project Hub</h2>
          <p style="font-size: 15px;">Hi <strong>${username}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5;">You have been added to the <strong>ISPE Team</strong> workspace as a <strong>${roleName}</strong>.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #0f172a; font-size: 15px;">🔑 Your Login Information:</h4>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Login Email:</strong> ${email}</p>
            ${passwordContent}
          </div>

          <p style="font-size: 14px;">Click the button below to log in to your dashboard:</p>
          <div style="text-align: center; margin: 26px 0;">
            <a href="${loginLink}" style="background-color: #06b6d4; color: #ffffff; padding: 13px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">Login to Dashboard</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your browser:<br/><a href="${loginLink}" style="color: #06b6d4;">${loginLink}</a></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">This is an automated notification from the Project Management System.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Failed to send team addition email notification:', err.message);
  }
};

const sendRoleChangedEmail = async (email, username, newRole) => {
  try {
    const roleName = newRole === 'admin' ? 'Admin' : (newRole === 'member' ? 'Member' : newRole.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    await sendEmail({
      to: email,
      subject: 'Your team role has been updated',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 24px; border-radius: 8px; background-color: #ffffff; color: #333333;">
          <h2 style="color: #f59e0b; margin-top: 0;">Role Updated</h2>
          <p>Hi <strong>${username}</strong>,</p>
          <p>Your role in the <strong>ISPE Team</strong> has been updated.</p>
          <div style="background-color: #f8f9fa; border: 1px solid #f1f3f4; border-radius: 6px; padding: 12px 16px; margin: 16px 0;">
            <strong>New Role:</strong> ${roleName}
          </div>
          <p>Login to your dashboard to see your updated permissions.</p>
          <hr style="border: none; border-top: 1px solid #f1f3f4; margin: 24px 0;" />
          <p style="color: #666666; font-size: 12px;">This is an automated notification from the Project Management System.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Failed to send role change email:', err.message);
  }
};

const sendRemovedFromTeamEmail = async (email, username) => {
  try {
    await sendEmail({
      to: email,
      subject: 'You have been removed from the team',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 24px; border-radius: 8px; background-color: #ffffff; color: #333333;">
          <h2 style="color: #ef4444; margin-top: 0;">Removed from Team</h2>
          <p>Hi <strong>${username}</strong>,</p>
          <p>You have been removed from the <strong>ISPE Team</strong>.</p>
          <p>If you believe this was a mistake, please contact your team administrator.</p>
          <hr style="border: none; border-top: 1px solid #f1f3f4; margin: 24px 0;" />
          <p style="color: #666666; font-size: 12px;">This is an automated notification from the Project Management System.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Failed to send removal email:', err.message);
  }
};


exports.getTeamList = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      where: {
        on_team: true
      },
      select: { id: true, username: true, email: true, role: true, created_at: true },
      orderBy: [
        { role: 'asc' },
        { username: 'asc' }
      ]
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
};


exports.updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const targetId = parseInt(userId);

  const validRoles = ['admin', 'project_manager', 'team_member', 'client', 'member'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role selection. Only admin, project_manager, team_member, client or member are allowed.' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { id: targetId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await prisma.users.update({
      where: { id: targetId },
      data: { role },
      select: { email: true, username: true }
    });

    // Fire email asynchronously — never blocks the API response
    sendRoleChangedEmail(updated.email, updated.username, role);

    res.json({ message: 'User role updated successfully', emailSent: true });
  } catch (err) {
    res.status(500).json({ message: 'Database error updating role' });
  }
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  const targetId = parseInt(userId);

  if (req.user.id === targetId) {
    return res.status(400).json({ message: 'You cannot remove your own account from the team.' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'project_manager' && req.user.role !== 'team_member' && req.user.role !== 'member') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    const target = await prisma.users.findUnique({ where: { id: targetId } });
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (target.role === 'admin') {
      const adminCount = await prisma.users.count({ where: { role: 'admin', on_team: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the last active admin from the team.' });
      }
    }

    await prisma.users.update({
      where: { id: targetId },
      data: { on_team: false }
    });

    // Fire removal email asynchronously
    sendRemovedFromTeamEmail(target.email, target.username);

    res.json({ message: `User "${target.username}" removed from team successfully.`, username: target.username, emailSent: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.searchUsers = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json([]);
  }

  try {
    const users = await prisma.users.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { email: { contains: q } }
        ]
      },
      select: { id: true, username: true, email: true, role: true, on_team: true },
      take: 10
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error searching users' });
  }
};

exports.searchActiveMembers = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.json([]);
  }

  try {
    const users = await prisma.users.findMany({
      where: {
        on_team: true,
        OR: [
          { username: { contains: query } },
          { email: { contains: query } }
        ]
      },
      select: { id: true, username: true, email: true, role: true, created_at: true },
      orderBy: [
        { role: 'asc' },
        { username: 'asc' }
      ]
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error searching active members' });
  }
};

exports.addTeamMember = async (req, res) => {
  const { userId, email, username, role } = req.body;
  if (!userId && !email && !username) {
    return res.status(400).json({ message: 'User ID, Email, or Username is required' });
  }

  try {
    let user;
    if (userId) {
      user = await prisma.users.findUnique({ where: { id: parseInt(userId) } });
    } else if (email) {
      user = await prisma.users.findUnique({ where: { email: email.trim().toLowerCase() } });
    } else if (username) {
      user = await prisma.users.findFirst({ where: { username: { contains: username.trim() } } });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found. Make sure they have registered an account first.' });
    }

    const targetRole = role || user.role || 'member';

    // Set user on_team = true directly and update role
    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: { on_team: true, role: targetRole },
      select: { id: true, username: true, email: true, role: true }
    });

    const origin = req.headers.origin || req.get('origin') || 'http://localhost:5173';

    // Fire email notification
    await sendTeamAddedEmail(updatedUser.email, updatedUser.username, updatedUser.role, null, origin);

    res.json({
      message: `Member ${updatedUser.username} (${updatedUser.email}) added to team successfully. Notification email sent!`,
      user: updatedUser,
      alreadyOnTeam: user.on_team
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error adding team member' });
  }
};

exports.addMemberByEmail = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const targetRole = role || 'member';
  const targetUsername = (username && username.trim()) ? username.trim() : cleanEmail.split('@')[0];
  const plainPassword = password || ('Pass@' + Math.floor(100000 + Math.random() * 900000));

  try {
    const user = await prisma.users.findUnique({ where: { email: cleanEmail } });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const origin = req.headers.origin || req.get('origin') || 'http://localhost:5173';

    if (user) {
      const updatedUser = await prisma.users.update({
        where: { email: cleanEmail },
        data: {
          username: targetUsername,
          password: password ? hashedPassword : user.password,
          role: targetRole,
          on_team: true
        },
        select: { id: true, username: true, email: true, role: true }
      });

      await sendTeamAddedEmail(cleanEmail, updatedUser.username, targetRole, password ? plainPassword : null, origin);

      return res.status(200).json({
        message: `${updatedUser.username} (${cleanEmail}) added to team successfully. Email notification sent!`,
        user: updatedUser
      });
    }

    // Create new user and set on_team = true
    const newUser = await prisma.users.create({
      data: {
        username: targetUsername,
        email: cleanEmail,
        password: hashedPassword,
        role: targetRole,
        on_team: true
      },
      select: { id: true, username: true, email: true, role: true }
    });

    await sendTeamAddedEmail(cleanEmail, newUser.username, targetRole, plainPassword, origin);

    return res.status(200).json({
      message: `User ${cleanEmail} added to team successfully. Credentials emailed!`,
      user: newUser
    });

  } catch (err) {
    console.error('Error in addMemberByEmail:', err);
    res.status(500).json({ message: 'Database error adding team member: ' + err.message });
  }
};

exports.createInvite = async (req, res) => {
  const { role } = req.body;
  const targetRole = role || 'member';

  const validRoles = ['admin', 'project_manager', 'team_member', 'client', 'member'];
  if (!validRoles.includes(targetRole)) {
    return res.status(400).json({ message: 'Invalid role selection' });
  }

  try {
    const token = crypto.randomBytes(16).toString('hex');
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const invite = await prisma.invite.create({
      data: {
        token,
        role: targetRole,
        expires_at
      }
    });

    res.status(201).json(invite);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error creating invite: ' + err.message });
  }
};

exports.validateInvite = async (req, res) => {
  const { token } = req.params;
  try {
    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) {
      return res.status(404).json({ message: 'Invite link not found. It may have been deleted.' });
    }
    if (invite.used) {
      return res.status(400).json({ message: 'This invite link has already been used.' });
    }
    if (new Date() > invite.expires_at) {
      return res.status(400).json({ message: 'This invite link has expired (valid for 24 hours).' });
    }
    // Return safe info — no sensitive data
    res.json({
      valid: true,
      role: invite.role,
      expires_at: invite.expires_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error validating invite' });
  }
};

exports.joinInvite = async (req, res) => {

  const { token } = req.params;

  try {
    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) {
      return res.status(404).json({ message: 'Invite token not found' });
    }

    if (invite.used) {
      return res.status(400).json({ message: 'Invite link has already been used' });
    }

    if (new Date() > invite.expires_at) {
      return res.status(400).json({ message: 'Invite link has expired' });
    }

    const userId = req.user.id;
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Authenticated user not found' });
    }

    if (user.on_team) {
      return res.status(400).json({ message: 'You are already a member of the team' });
    }

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        on_team: true,
        role: invite.role
      },
      select: { id: true, username: true, email: true, role: true }
    });

    await prisma.invite.update({
      where: { id: invite.id },
      data: { used: true }
    });

    sendTeamAddedEmail(updatedUser.email, updatedUser.username, updatedUser.role);

    res.json({ message: 'Joined team successfully', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error joining team: ' + err.message });
  }
};



exports.logAttendance = async (req, res) => {
  const { id } = req.user;
  const { action } = req.body;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDate = new Date(`${todayStr}T00:00:00.000Z`);
  const nowTime = new Date().toLocaleTimeString();

  try {
    if (action === 'check_in') {
      const existing = await prisma.attendance.findFirst({
        where: { user_id: id, date: todayDate }
      });
      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { check_in: nowTime }
        });
      } else {
        await prisma.attendance.create({
          data: {
            user_id: id,
            date: todayDate,
            check_in: nowTime,
            status: 'present'
          }
        });
      }
      res.json({ message: 'Checked in successfully', check_in: nowTime });
    } else if (action === 'check_out') {
      const existing = await prisma.attendance.findFirst({
        where: { user_id: id, date: todayDate }
      });
      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { check_out: nowTime }
        });
      }
      res.json({ message: 'Checked out successfully', check_out: nowTime });
    } else {
      res.status(400).json({ message: 'Invalid attendance action' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error during attendance' });
  }
};

exports.getAttendance = async (req, res) => {
  const { id, role } = req.user;

  try {
    const where = (role !== 'admin' && role !== 'project_manager') 
      ? { user_id: id } 
      : {};

    const logs = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        Users: {
          select: { username: true, email: true }
        }
      }
    });

    const formatted = logs.map(l => ({
      ...l,
      username: l.Users?.username,
      email: l.Users?.email
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Database error fetching attendance' });
  }
};

exports.logTime = async (req, res) => {
  const { task_id, project_id, duration_seconds, description } = req.body;

  if (!duration_seconds || !project_id) {
    return res.status(400).json({ message: 'duration_seconds and project_id are required' });
  }

  try {
    const log = await prisma.timeLogs.create({
      data: {
        user_id: req.user.id,
        task_id: task_id ? parseInt(task_id) : null,
        project_id: parseInt(project_id),
        duration_seconds: parseInt(duration_seconds),
        description: description || ''
      }
    });
    res.status(201).json({
      message: 'Work hours logged successfully',
      logId: log.id
    });
  } catch (err) {
    res.status(500).json({ message: 'Database error logging work hours: ' + err.message });
  }
};

exports.getTimeLogs = async (req, res) => {
  const { id, role } = req.user;
  const userDomain = req.user.email.split('@')[1];

  try {
    const where = (role !== 'admin' && role !== 'project_manager') 
      ? { user_id: id } 
      : {
          Users: {
            email: {
              endsWith: `@${userDomain}`
            }
          }
        };

    const logs = await prisma.timeLogs.findMany({
      where,
      orderBy: { logged_at: 'desc' },
      include: {
        Users: { select: { username: true } },
        Projects: { select: { name: true } },
        Tasks: { select: { title: true } }
      }
    });

    const formatted = logs.map(l => ({
      ...l,
      username: l.Users?.username,
      project_name: l.Projects?.name,
      task_title: l.Tasks?.title
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Database error fetching time logs' });
  }
};

exports.resetDatabase = async (req, res) => {
  res.json({ message: 'Reset disabled in Prisma mode' });
};
