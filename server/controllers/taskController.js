const prisma = require('../config/db');
const { sendEmail } = require('../utils/mailer');

exports.getAllTasks = async (req, res) => {
  const { id, role } = req.user;
  const { project_id } = req.query;

  try {
    let where = {};

    if (project_id) {
      where.project_id = parseInt(project_id);
    }

    if (role === 'team_member' || role === 'member') {
      where.OR = [
        { assigned_to: id },
        { Projects: { ProjectMembers: { some: { user_id: id } } } },
        { Projects: { manager_id: id } }
      ];
    } else if (role === 'client') {
      // Clients can view tasks in all projects they are related to (or all)
    }

    const tasks = await prisma.tasks.findMany({
      where,
      include: {
        Projects: { select: { name: true, status: true } },
        Users: { select: { username: true } }
      }
    });

    const formatted = tasks.map(t => ({
      ...t,
      project_name: t.Projects?.name,
      project_status: t.Projects?.status,
      assigned_to_name: t.Users?.username
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.getTaskById = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await prisma.tasks.findUnique({
      where: { id: parseInt(id) },
      include: {
        Projects: { select: { name: true, status: true } },
        Users: { select: { username: true } },
        Comments: {
          include: {
            Users: { select: { username: true, role: true } }
          },
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const formatted = {
      ...task,
      project_name: task.Projects?.name,
      project_status: task.Projects?.status,
      assigned_to_name: task.Users?.username,
      comments: task.Comments.map(c => ({
        ...c,
        username: c.Users?.username,
        role: c.Users?.role
      }))
    };

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Database error' });
  }
};

exports.createTask = async (req, res) => {
  const { title, description, priority, status, due_date, assigned_to, project_id } = req.body;

  if (!title || !project_id) {
    return res.status(400).json({ message: 'Task title and project_id are required' });
  }

  try {
    const task = await prisma.tasks.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        status: status || 'pending',
        completed_at: status === 'completed' ? new Date() : null,
        due_date: due_date ? new Date(due_date) : null,
        assigned_to: assigned_to ? parseInt(assigned_to) : null,
        project_id: parseInt(project_id)
      },
      include: {
        Users: true,
        Projects: true
      }
    });

    if (task.Users && task.Users.email) {
      await sendEmail({
        to: task.Users.email,
        subject: `New Task Assigned: ${task.title}`,
        html: `
          <h3>Hello ${task.Users.username},</h3>
          <p>You have been assigned a new task in project <strong>${task.Projects?.name || 'N/A'}</strong>.</p>
          <p><strong>Task:</strong> ${task.title}</p>
          <p><strong>Priority:</strong> ${task.priority}</p>
          <p><strong>Due Date:</strong> ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None'}</p>
          <br/>
          <p>Please log in to the Project Management System to view details.</p>
        `
      }).catch(err => console.error("Failed to send assignment email", err));
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('task_created', task);
    }

    res.status(201).json({
      message: 'Task created successfully',
      taskId: task.id
    });
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, due_date, assigned_to, subtasks } = req.body;

  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date();
      } else {
        updateData.completed_at = null;
      }
    }
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to ? parseInt(assigned_to) : null;
    if (subtasks !== undefined) updateData.subtasks = subtasks;

    const oldTask = await prisma.tasks.findUnique({
      where: { id: parseInt(id) }
    });

    if (!oldTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updatedTask = await prisma.tasks.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        Users: true,
        Projects: true
      }
    });

    // If assigned user changed, send email notification
    if (assigned_to !== undefined && assigned_to !== null && parseInt(assigned_to) !== oldTask.assigned_to) {
      if (updatedTask.Users && updatedTask.Users.email) {
        sendEmail({
          to: updatedTask.Users.email,
          subject: `Task Assigned: ${updatedTask.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 24px; border-radius: 8px; background-color: #ffffff; color: #333333;">
              <h2 style="color: #06b6d4; margin-top: 0;">Task Assigned</h2>
              <p>Hi <strong>${updatedTask.Users.username}</strong>,</p>
              <p>You have been assigned the task <strong>${updatedTask.title}</strong> in project <strong>${updatedTask.Projects?.name || 'N/A'}</strong>.</p>
              <div style="background-color: #f8f9fa; border: 1px solid #f1f3f4; border-radius: 6px; padding: 12px 16px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Priority:</strong> ${updatedTask.priority}</p>
                <p style="margin: 4px 0;"><strong>Due Date:</strong> ${updatedTask.due_date ? new Date(updatedTask.due_date).toLocaleDateString() : 'None'}</p>
              </div>
              <p>Please log in to the Project Management System to view details.</p>
              <hr style="border: none; border-top: 1px solid #f1f3f4; margin: 24px 0;" />
              <p style="color: #666666; font-size: 12px;">This is an automated notification from the Project Management System.</p>
            </div>
          `
        }).catch(err => console.error("Failed to send assignment update email", err));
      }
    }

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.tasks.delete({ where: { id: parseInt(id) } });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('task_deleted', { id: parseInt(id) });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Database error' });
  }
};

exports.addTaskComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  try {
    const comment = await prisma.comments.create({
      data: {
        task_id: parseInt(id),
        user_id: req.user.id,
        content
      }
    });
    res.status(201).json({
      message: 'Comment added successfully',
      commentId: comment.id
    });
  } catch (err) {
    res.status(500).json({ message: 'Database error adding comment' });
  }
};
