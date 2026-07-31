const prisma = require('../config/db');

exports.getMessages = async (req, res) => {
  const { project_id } = req.query;

  try {
    const messages = await prisma.messages.findMany({
      where: {
        project_id: project_id ? parseInt(project_id) : null,
      },
      include: {
        Users: {
          select: { username: true, role: true }
        }
      },
      orderBy: {
        created_at: 'asc'
      },
      take: 100
    });
    
    const formatted = messages.map(m => ({
      ...m,
      username: m.Users?.username,
      role: m.Users?.role
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error fetching chat logs' });
  }
};

exports.sendMessage = async (req, res) => {
  const { project_id, content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Message content is required' });
  }

  try {
    const newMessage = await prisma.messages.create({
      data: {
        sender_id: req.user.id,
        project_id: project_id ? parseInt(project_id) : null,
        content
      },
      include: {
        Users: {
          select: { username: true, role: true }
        }
      }
    });

    const formatted = {
      ...newMessage,
      username: newMessage.Users?.username,
      role: newMessage.Users?.role
    };

    res.status(201).json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error posting message: ' + err.message });
  }
};

// Edit a message — only the sender can edit their own message
exports.editMessage = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Content cannot be empty' });
  }

  try {
    const existing = await prisma.messages.findUnique({ where: { id: parseInt(id) } });

    if (!existing) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (existing.sender_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    const updated = await prisma.messages.update({
      where: { id: parseInt(id) },
      data: { content: content.trim() },
      include: { Users: { select: { username: true, role: true } } }
    });

    res.json({ ...updated, username: updated.Users?.username, role: updated.Users?.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error editing message' });
  }
};

// Delete a message — only the sender can delete their own message
exports.deleteMessage = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.messages.findUnique({ where: { id: parseInt(id) } });

    if (!existing) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (existing.sender_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await prisma.messages.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting message' });
  }
};

