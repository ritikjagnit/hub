const prisma = require('../config/db');

exports.getAllProjects = async (req, res) => {
  const { id, role } = req.user;

  try {
    let where = {};

    if (role === 'team_member' || role === 'client') {
      where = {
        OR: [
          { ProjectMembers: { some: { user_id: id } } },
          { manager_id: id }
        ]
      };
    }

    const projects = await prisma.projects.findMany({
      where,
      include: {
        Users: { select: { username: true } },
        ProjectMembers: {
          include: {
            Users: { select: { id: true, username: true, role: true } }
          }
        },
        Documents: {
          include: {
            Users: { select: { username: true } }
          }
        },
        Tasks: {
          include: {
            Users: { select: { username: true } }
          }
        }
      }
    });

    const formatted = projects.map(p => ({
      ...p,
      manager_name: p.Users?.username,
      members: p.ProjectMembers.map(pm => ({
        project_id: p.id,
        user_id: pm.Users?.id,
        username: pm.Users?.username,
        role: pm.Users?.role
      })),
      documents: p.Documents.map(d => ({
        ...d,
        uploader_name: d.Users?.username
      })),
      tasks: p.Tasks.map(t => ({
        ...t,
        assigned_to_name: t.Users?.username
      }))
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(id) },
      include: {
        Users: { select: { username: true, email: true } },
        ProjectMembers: {
          include: {
            Users: { select: { id: true, username: true, email: true, role: true } }
          }
        },
        Documents: {
          include: {
            Users: { select: { username: true } }
          }
        },
        Tasks: {
          include: {
            Users: { select: { username: true } }
          }
        }
      }
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Validate project access: Admin/PM or assigned manager or project member
    const { id: userId, role } = req.user;
    const isManager = project.manager_id === userId;
    const isMember = project.ProjectMembers.some(pm => pm.user_id === userId);
    const isAdminOrPM = role === 'admin' || role === 'project_manager';

    if (!isAdminOrPM && !isManager && !isMember) {
      return res.status(403).json({ message: 'Access denied to this workspace project.' });
    }

    const formatted = {
      ...project,
      manager_name: project.Users?.username,
      members: project.ProjectMembers.map(pm => ({
        id: pm.Users?.id,
        username: pm.Users?.username,
        email: pm.Users?.email,
        role: pm.Users?.role
      })),
      documents: project.Documents.map(d => ({
        ...d,
        uploader_name: d.Users?.username
      })),
      tasks: project.Tasks.map(t => ({
        ...t,
        assigned_to_name: t.Users?.username
      }))
    };

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.createProject = async (req, res) => {
  const { name, description, status, deadline, manager_id } = req.body;

  if (!name || !deadline) {
    return res.status(400).json({ message: 'Project name and deadline are required' });
  }

  try {
    const project = await prisma.projects.create({
      data: {
        name,
        description,
        status: status || 'pending',
        completed_at: status === 'completed' ? new Date() : null,
        deadline: new Date(deadline),
        manager_id: manager_id || req.user.id
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('project_created', project);
    }

    res.status(201).json({
      message: 'Project created successfully',
      projectId: project.id
    });
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description, status, deadline, manager_id } = req.body;

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date();
      } else {
        updateData.completed_at = null;
      }
    }
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (manager_id !== undefined) updateData.manager_id = manager_id ? parseInt(manager_id) : null;

    await prisma.projects.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Database error' });
  }
};

exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.projects.delete({ where: { id: parseInt(id) } });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('project_deleted', { id: parseInt(id) });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Database error' });
  }
};

const { sendEmail } = require('../utils/mailer');

exports.assignTeam = async (req, res) => {
  const { id } = req.params; // project_id
  const { user_ids } = req.body; // array of user IDs

  if (!Array.isArray(user_ids)) {
    return res.status(400).json({ message: 'user_ids must be an array' });
  }

  const cleanUserIds = user_ids.map(uid => parseInt(uid)).filter(uid => !isNaN(uid));

  try {
    // Delete existing members using transaction
    await prisma.$transaction(async (tx) => {
      await tx.projectMembers.deleteMany({
        where: { project_id: parseInt(id) }
      });

      if (cleanUserIds.length > 0) {
        await tx.projectMembers.createMany({
          data: cleanUserIds.map(uid => ({
            project_id: parseInt(id),
            user_id: uid
          }))
        });
      }
    });

    // Send email notification to assigned project members
    if (cleanUserIds.length > 0) {
      const project = await prisma.projects.findUnique({ where: { id: parseInt(id) } });
      const assignedUsers = await prisma.users.findMany({
        where: { id: { in: cleanUserIds } },
        select: { username: true, email: true }
      });
      const origin = req.headers.origin || req.get('origin') || 'https://hub.pages.dev';

      for (const u of assignedUsers) {
        if (u.email) {
          sendEmail({
            to: u.email,
            subject: `Assigned to Project: ${project?.name || 'Project'}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 24px; border-radius: 8px; background-color: #ffffff; color: #333333;">
                <h2 style="color: #06b6d4; margin-top: 0;">Project Assignment</h2>
                <p>Hi <strong>${u.username}</strong>,</p>
                <p>You have been assigned as a team member to project <strong>${project?.name || 'N/A'}</strong>.</p>
                <div style="margin: 20px 0;">
                  <a href="${origin}/projects" style="background-color: #06b6d4; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Project</a>
                </div>
                <hr style="border: none; border-top: 1px solid #f1f3f4; margin: 24px 0;" />
                <p style="color: #666666; font-size: 12px;">This is an automated notification from the Project Management System.</p>
              </div>
            `
          }).catch(err => console.error("Failed sending project assignment email", err));
        }
      }
    }

    res.json({ message: 'Project team assigned successfully. Notification emails sent!' });
  } catch (err) {
    res.status(500).json({ message: 'Database error assigning team: ' + err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  const { id } = req.params; 
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileName = req.file.originalname;
  const filePath = '/uploads/' + req.file.filename; // Local upload URL
  const { folder_name } = req.body;

  try {
    const doc = await prisma.documents.create({
      data: {
        project_id: parseInt(id),
        file_name: fileName,
        file_path: filePath,
        folder_name: folder_name || 'General',
        uploaded_by: req.user.id
      }
    });
    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: doc.id,
        project_id: doc.project_id,
        file_name: doc.file_name,
        file_path: doc.file_path,
        folder_name: doc.folder_name,
        uploaded_by: doc.uploaded_by
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Database error saving document info: ' + err.message });
  }
};
