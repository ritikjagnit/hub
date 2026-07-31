const prisma = require('../config/db');
const { sendEmail } = require('../utils/mailer');

exports.createMeeting = async (req, res) => {
  const { title, agenda, notes, action_items, start_time, end_time, project_id, attendee_ids } = req.body;

  if (!title || !start_time || !end_time) {
    return res.status(400).json({ message: 'Title, start time, and end time are required' });
  }

  try {
    const meeting = await prisma.meeting.create({
      data: {
        title,
        agenda,
        notes,
        action_items,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        project_id: project_id ? parseInt(project_id) : null,
        created_by: req.user.id
      }
    });

    if (Array.isArray(attendee_ids) && attendee_ids.length > 0) {
      await prisma.meetingAttendee.createMany({
        data: attendee_ids.map(uid => ({
          meeting_id: meeting.id,
          user_id: parseInt(uid)
        }))
      });
    }

    // Fetch project details for context if project_id is provided
    let project = null;
    if (project_id) {
      project = await prisma.projects.findUnique({
        where: { id: parseInt(project_id) }
      });
    }

    // Fetch attendee email addresses
    const attendees = [];
    if (Array.isArray(attendee_ids) && attendee_ids.length > 0) {
      const dbAttendees = await prisma.users.findMany({
        where: { id: { in: attendee_ids.map(id => parseInt(id)) } },
        select: { username: true, email: true }
      });
      attendees.push(...dbAttendees);
    }

    // Fetch meeting creator info
    const creator = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: { username: true }
    });
    const creatorName = creator ? creator.username : 'Workspace Admin';

    // Send emails in background
    for (const attendee of attendees) {
      if (attendee.email) {
        sendEmail({
          to: attendee.email,
          subject: `Meeting Invitation: ${title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 24px; border-radius: 8px; background-color: #ffffff; color: #333333;">
              <h2 style="color: #06b6d4; margin-top: 0; border-bottom: 2px solid #06b6d4; padding-bottom: 8px;">Meeting Scheduled</h2>
              <p>Hi <strong>${attendee.username}</strong>,</p>
              <p>You have been invited to a meeting scheduled by <strong>${creatorName}</strong>.</p>
              <div style="background-color: #f8f9fa; border: 1px solid #f1f3f4; border-radius: 6px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Title:</strong> ${title}</p>
                ${project ? `<p style="margin: 4px 0;"><strong>Project:</strong> ${project.name}</p>` : ''}
                <p style="margin: 4px 0;"><strong>Start Time:</strong> ${new Date(start_time).toLocaleString()}</p>
                <p style="margin: 4px 0;"><strong>End Time:</strong> ${new Date(end_time).toLocaleString()}</p>
                ${agenda ? `<p style="margin: 8px 0 4px 0;"><strong>Agenda:</strong><br/>${agenda}</p>` : ''}
              </div>
              <p>Login to your dashboard to sync this event or view details.</p>
              <hr style="border: none; border-top: 1px solid #f1f3f4; margin: 24px 0;" />
              <p style="color: #666666; font-size: 12px; text-align: center;">This is an automated notification from the Project Management System.</p>
            </div>
          `
        }).catch(err => console.error(`Failed to send meeting invitation email to ${attendee.email}:`, err.message));
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('meeting_created', meeting);
    }

    res.status(201).json({ message: 'Meeting scheduled successfully', meeting });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getMeetings = async (req, res) => {
  const { project_id } = req.query;

  try {
    const where = {};
    if (project_id) {
      where.project_id = parseInt(project_id);
    } else {
      // Return meetings where user is creator or attendee
      where.OR = [
        { created_by: req.user.id },
        { Attendees: { some: { user_id: req.user.id } } }
      ];
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        Projects: { select: { name: true } },
        Users: { select: { username: true, email: true } },
        Attendees: {
          include: {
            Users: { select: { id: true, username: true, email: true } }
          }
        }
      },
      orderBy: { start_time: 'asc' }
    });

    const formatted = meetings.map(m => ({
      ...m,
      creator_name: m.Users?.username,
      project_name: m.Projects?.name,
      attendees: m.Attendees.map(a => ({
        id: a.Users?.id,
        username: a.Users?.username,
        email: a.Users?.email
      }))
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.updateMeeting = async (req, res) => {
  const { id } = req.params;
  const { title, agenda, notes, action_items, start_time, end_time, project_id, attendee_ids } = req.body;

  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (agenda !== undefined) updateData.agenda = agenda;
    if (notes !== undefined) updateData.notes = notes;
    if (action_items !== undefined) updateData.action_items = action_items;
    if (start_time !== undefined) updateData.start_time = new Date(start_time);
    if (end_time !== undefined) updateData.end_time = new Date(end_time);
    if (project_id !== undefined) updateData.project_id = project_id ? parseInt(project_id) : null;

    await prisma.meeting.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    if (Array.isArray(attendee_ids)) {
      // Re-populate attendees
      await prisma.meetingAttendee.deleteMany({ where: { meeting_id: parseInt(id) } });
      if (attendee_ids.length > 0) {
        await prisma.meetingAttendee.createMany({
          data: attendee_ids.map(uid => ({
            meeting_id: parseInt(id),
            user_id: parseInt(uid)
          }))
        });
      }
    }

    res.json({ message: 'Meeting updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.meeting.delete({ where: { id: parseInt(id) } });

    const io = req.app.get('io');
    if (io) {
      io.emit('meeting_deleted', { id: parseInt(id) });
    }

    res.json({ message: 'Meeting deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};
