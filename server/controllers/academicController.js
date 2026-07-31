const prisma = require('../config/db');
const { v4: uuidv4 } = require('uuid'); // We can fallback to timestamp+rand if uuid isn't installed

const generateUUID = () => {
  try {
    return uuidv4();
  } catch (e) {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// THESIS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

exports.getThesisByStudent = async (req, res) => {
  const studentId = parseInt(req.params.studentId || req.user.id);
  
  try {
    const thesis = await prisma.thesis.findFirst({
      where: { student_id: studentId },
      include: {
        Guide: { select: { id: true, username: true, email: true } },
        Projects: true,
        Department: true,
        Versions: { orderBy: { version: 'desc' } },
        Comments: {
          include: { Users: { select: { username: true, role: true } } },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    res.json(thesis || null);
  } catch (err) {
    res.status(500).json({ message: 'Database error fetching thesis: ' + err.message });
  }
};

exports.saveThesisDraft = async (req, res) => {
  const {
    id, title, abstract, problem_statement, objectives, literature_review,
    methodology, architecture, implementation_details, testing_details,
    results, future_scope, references, keywords, project_id, guide_id, department_id
  } = req.body;

  const studentId = req.user.id;

  if (!title) {
    return res.status(400).json({ message: 'Thesis Title is required' });
  }

  try {
    let thesis;
    const data = {
      title,
      abstract,
      problem_statement,
      objectives,
      literature_review,
      methodology,
      architecture,
      implementation_details,
      testing_details,
      results,
      future_scope,
      references,
      keywords,
      project_id: project_id ? parseInt(project_id) : null,
      guide_id: guide_id ? parseInt(guide_id) : null,
      department_id: department_id ? parseInt(department_id) : null,
      student_id: studentId
    };

    if (id) {
      // Update existing
      thesis = await prisma.thesis.update({
        where: { id: parseInt(id) },
        data: {
          ...data,
          status: 'draft' // resets status to draft on edit save if desired, or keeps current
        }
      });
    } else {
      // Create new
      thesis = await prisma.thesis.create({
        data
      });
    }

    res.json({ message: 'Thesis draft saved successfully', thesis });
  } catch (err) {
    res.status(500).json({ message: 'Database error saving thesis: ' + err.message });
  }
};

exports.submitThesis = async (req, res) => {
  const { id, change_summary } = req.body;
  const file = req.file;

  if (!id) {
    return res.status(400).json({ message: 'Thesis ID is required' });
  }

  try {
    const existing = await prisma.thesis.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Thesis not found' });
    }

    // Determine next version number
    const lastVersion = await prisma.thesisVersion.findFirst({
      where: { thesis_id: parseInt(id) },
      orderBy: { version: 'desc' }
    });
    const nextVer = lastVersion ? lastVersion.version + 1 : 1;

    // Upload path
    const filePath = file ? '/uploads/' + file.filename : null;
    const fileName = file ? file.originalname : null;

    // Use transaction
    const [updatedThesis, newVersion] = await prisma.$transaction([
      prisma.thesis.update({
        where: { id: parseInt(id) },
        data: {
          status: 'submitted',
          submission_date: new Date()
        }
      }),
      prisma.thesisVersion.create({
        data: {
          thesis_id: parseInt(id),
          version: nextVer,
          title: existing.title,
          abstract: existing.abstract,
          status: 'submitted',
          file_path: filePath,
          file_name: fileName,
          updated_by: req.user.id,
          change_summary: change_summary || `Submitted Version ${nextVer}`
        }
      })
    ]);

    // Send notifications to Guide if exists
    if (updatedThesis.guide_id) {
      await prisma.notification.create({
        data: {
          user_id: updatedThesis.guide_id,
          title: 'Thesis Submitted',
          message: `Thesis "${updatedThesis.title}" has been submitted by student.`,
          type: 'thesis'
        }
      });
    }

    res.json({ message: 'Thesis submitted for review', thesis: updatedThesis, version: newVersion });
  } catch (err) {
    res.status(500).json({ message: 'Database error submitting thesis: ' + err.message });
  }
};

exports.updateThesisStatus = async (req, res) => {
  const { id, status, feedback } = req.body;

  if (!id || !status) {
    return res.status(400).json({ message: 'Thesis ID and status are required' });
  }

  try {
    const thesis = await prisma.thesis.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    // Create HOD/Guide comment if feedback is provided
    if (feedback) {
      await prisma.thesisComment.create({
        data: {
          thesis_id: thesis.id,
          user_id: req.user.id,
          content: feedback,
          section: 'Status Update Review'
        }
      });
    }

    // Notify Student
    if (thesis.student_id) {
      await prisma.notification.create({
        data: {
          user_id: thesis.student_id,
          title: `Thesis ${status.replace('_', ' ').toUpperCase()}`,
          message: `Your thesis status has been updated to ${status}. Guide feedback: "${feedback || 'None'}"`,
          type: 'thesis'
        }
      });
    }

    res.json({ message: 'Thesis review status updated successfully', thesis });
  } catch (err) {
    res.status(500).json({ message: 'Database error updating thesis review: ' + err.message });
  }
};

exports.addThesisComment = async (req, res) => {
  const { thesis_id, content, section } = req.body;

  if (!thesis_id || !content) {
    return res.status(400).json({ message: 'Thesis ID and content are required' });
  }

  try {
    const comment = await prisma.thesisComment.create({
      data: {
        thesis_id: parseInt(thesis_id),
        user_id: req.user.id,
        content,
        section
      },
      include: {
        Users: { select: { username: true, role: true } }
      }
    });

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Database error posting comment: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DAILY PROGRESS LOG
// ─────────────────────────────────────────────────────────────────────────────

exports.createDailyLog = async (req, res) => {
  const { project_id, today_work, hours_worked, github_link, problems_faced, tomorrow_plan } = req.body;
  const file = req.file;

  if (!today_work || !hours_worked) {
    return res.status(400).json({ message: "Today's work details and hours worked are required" });
  }

  try {
    const log = await prisma.dailyLog.create({
      data: {
        student_id: req.user.id,
        project_id: project_id ? parseInt(project_id) : null,
        today_work,
        hours_worked: parseFloat(hours_worked),
        github_link,
        problems_faced,
        tomorrow_plan,
        screenshot_path: file ? '/uploads/' + file.filename : null,
        status: 'pending'
      }
    });

    // Notify guide of student's log
    const project = project_id ? await prisma.projects.findUnique({ where: { id: parseInt(project_id) } }) : null;
    if (project && project.manager_id) {
      await prisma.notification.create({
        data: {
          user_id: project.manager_id,
          title: 'Daily Log Submitted',
          message: `Student ${req.user.username} submitted a daily progress log for project "${project.name}".`,
          type: 'dailylog'
        }
      });
    }

    res.status(201).json({ message: 'Daily log submitted successfully', log });
  } catch (err) {
    res.status(500).json({ message: 'Database error submitting daily log: ' + err.message });
  }
};

exports.getMyDailyLogs = async (req, res) => {
  try {
    const logs = await prisma.dailyLog.findMany({
      where: { student_id: req.user.id },
      include: { Projects: true },
      orderBy: { date: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.getStudentDailyLogs = async (req, res) => {
  const { studentId } = req.params;

  try {
    const logs = await prisma.dailyLog.findMany({
      where: { student_id: parseInt(studentId) },
      include: { Projects: true },
      orderBy: { date: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.reviewDailyLog = async (req, res) => {
  const { id, status, feedback } = req.body;

  if (!id || !status) {
    return res.status(400).json({ message: 'Log ID and status are required' });
  }

  try {
    const log = await prisma.dailyLog.update({
      where: { id: parseInt(id) },
      data: {
        status,
        feedback,
        reviewed_by: req.user.id,
        reviewed_at: new Date()
      }
    });

    // Notify Student
    await prisma.notification.create({
      data: {
        user_id: log.student_id,
        title: `Daily Log ${status.toUpperCase()}`,
        message: `Your daily log on ${new Date(log.date).toLocaleDateString()} has been ${status}. Feedback: "${feedback || 'None'}"`,
        type: 'dailylog'
      }
    });

    res.json({ message: 'Daily progress log reviewed', log });
  } catch (err) {
    res.status(500).json({ message: 'Database error updating progress log: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC TASK DETAILS EXTENSION
// ─────────────────────────────────────────────────────────────────────────────

exports.getAcademicTaskDetail = async (req, res) => {
  const { taskId } = req.params;

  try {
    const detail = await prisma.academicTaskDetail.findUnique({
      where: { task_id: parseInt(taskId) }
    });
    res.json(detail);
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.updateAcademicTaskDetail = async (req, res) => {
  const { task_id, task_type, marks, rubric, estimated_hours, actual_hours, progress_percent } = req.body;

  if (!task_id) {
    return res.status(400).json({ message: 'task_id is required' });
  }

  try {
    const data = {
      task_type,
      marks: marks ? parseFloat(marks) : null,
      rubric,
      estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
      actual_hours: actual_hours ? parseFloat(actual_hours) : null,
      progress_percent: progress_percent ? parseFloat(progress_percent) : 0.0
    };

    const log = await prisma.academicTaskDetail.upsert({
      where: { task_id: parseInt(task_id) },
      update: data,
      create: {
        task_id: parseInt(task_id),
        ...data
      }
    });

    res.json({ message: 'Academic task details updated', detail: log });
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MARKS & GRADES BOARD
// ─────────────────────────────────────────────────────────────────────────────

exports.submitMarks = async (req, res) => {
  const {
    student_id, project_id, guide_marks, presentation_marks,
    documentation_marks, coding_marks, attendance_marks, comments, rubric_evaluation
  } = req.body;

  if (!student_id) {
    return res.status(400).json({ message: 'Student ID is required' });
  }

  try {
    const gMarks = guide_marks ? parseFloat(guide_marks) : 0;
    const pMarks = presentation_marks ? parseFloat(presentation_marks) : 0;
    const dMarks = documentation_marks ? parseFloat(documentation_marks) : 0;
    const cMarks = coding_marks ? parseFloat(coding_marks) : 0;
    const aMarks = attendance_marks ? parseFloat(attendance_marks) : 0;
    
    // Sum final marks
    const finalMarks = gMarks + pMarks + dMarks + cMarks + aMarks;

    const grades = await prisma.evaluationMarks.create({
      data: {
        student_id: parseInt(student_id),
        project_id: project_id ? parseInt(project_id) : null,
        guide_marks: gMarks,
        presentation_marks: pMarks,
        documentation_marks: dMarks,
        coding_marks: cMarks,
        attendance_marks: aMarks,
        final_marks: finalMarks,
        comments,
        rubric_evaluation: rubric_evaluation ? JSON.stringify(rubric_evaluation) : null,
        graded_by: req.user.id
      }
    });

    // Notify Student
    await prisma.notification.create({
      data: {
        user_id: parseInt(student_id),
        title: 'Academic Marks Updated',
        message: `Your project evaluation marks have been published. Final Score: ${finalMarks}`,
        type: 'marks'
      }
    });

    res.status(201).json({ message: 'Academic marks published successfully', marks: grades });
  } catch (err) {
    res.status(500).json({ message: 'Database error publishing grades: ' + err.message });
  }
};

exports.getStudentMarks = async (req, res) => {
  const studentId = parseInt(req.params.studentId || req.user.id);

  try {
    const marksList = await prisma.evaluationMarks.findMany({
      where: { student_id: studentId },
      include: {
        Projects: true,
        Teacher: { select: { username: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(marksList);
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESEARCH PAPER REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

exports.uploadResearchPaper = async (req, res) => {
  const { title, authors, journal, year, category, abstract } = req.body;
  const file = req.file;

  if (!title || !file) {
    return res.status(400).json({ message: 'Title and file are required' });
  }

  try {
    const paper = await prisma.researchPaper.create({
      data: {
        title,
        authors,
        journal,
        year: year ? parseInt(year) : null,
        abstract,
        category: category || 'General',
        file_path: '/uploads/' + file.filename,
        uploaded_by: req.user.id,
        status: req.user.role === 'guide' || req.user.role === 'hod' ? 'approved' : 'pending'
      }
    });

    res.status(201).json({ message: 'Research paper uploaded successfully', paper });
  } catch (err) {
    res.status(500).json({ message: 'Database error saving research paper: ' + err.message });
  }
};

exports.getApprovedResearchPapers = async (req, res) => {
  const { query, category } = req.query;

  try {
    const whereClause = { status: 'approved' };
    if (category) {
      whereClause.category = category;
    }
    if (query) {
      whereClause.OR = [
        { title: { contains: query } },
        { authors: { contains: query } },
        { abstract: { contains: query } }
      ];
    }

    const papers = await prisma.researchPaper.findMany({
      where: whereClause,
      include: { Uploader: { select: { username: true } } },
      orderBy: { created_at: 'desc' }
    });

    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: 'Database error fetching papers: ' + err.message });
  }
};

exports.getMyUploadedPapers = async (req, res) => {
  try {
    const papers = await prisma.researchPaper.findMany({
      where: { uploaded_by: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.getPendingResearchPapers = async (req, res) => {
  try {
    const papers = await prisma.researchPaper.findMany({
      where: { status: 'pending' },
      include: { Uploader: { select: { username: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.reviewResearchPaper = async (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ message: 'Paper ID and status are required' });
  }

  try {
    const paper = await prisma.researchPaper.update({
      where: { id: parseInt(id) },
      data: {
        status,
        verified_by: req.user.id
      }
    });

    // Notify uploader
    await prisma.notification.create({
      data: {
        user_id: paper.uploaded_by,
        title: `Research Paper ${status.toUpperCase()}`,
        message: `Your paper "${paper.title}" has been reviewed and ${status}.`,
        type: 'research'
      }
    });

    res.json({ message: 'Research paper status updated', paper });
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.toggleBookmark = async (req, res) => {
  const { paper_id } = req.body;

  if (!paper_id) {
    return res.status(400).json({ message: 'paper_id is required' });
  }

  try {
    const existing = await prisma.researchBookmark.findFirst({
      where: {
        user_id: req.user.id,
        paper_id: parseInt(paper_id)
      }
    });

    if (existing) {
      await prisma.researchBookmark.delete({ where: { id: existing.id } });
      return res.json({ bookmarked: false, message: 'Bookmark removed' });
    } else {
      await prisma.researchBookmark.create({
        data: {
          user_id: req.user.id,
          paper_id: parseInt(paper_id)
        }
      });
      return res.json({ bookmarked: true, message: 'Paper bookmarked successfully' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.getBookmarkedPapers = async (req, res) => {
  try {
    const bookmarks = await prisma.researchBookmark.findMany({
      where: { user_id: req.user.id },
      include: {
        Paper: {
          include: { Uploader: { select: { username: true } } }
        }
      }
    });
    res.json(bookmarks.map(b => b.Paper));
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE GENERATION & QR VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

exports.generateCertificate = async (req, res) => {
  const { student_id, certificate_type } = req.body;

  if (!student_id || !certificate_type) {
    return res.status(400).json({ message: 'student_id and certificate_type are required' });
  }

  try {
    const uuid = generateUUID();
    const certificate = await prisma.academicCertificate.create({
      data: {
        student_id: parseInt(student_id),
        certificate_type,
        certificate_uuid: uuid
      }
    });

    res.status(201).json({ message: 'Certificate record issued successfully', certificate });
  } catch (err) {
    res.status(500).json({ message: 'Database error issuing certificate: ' + err.message });
  }
};

exports.getCertificates = async (req, res) => {
  const studentId = parseInt(req.params.studentId || req.user.id);

  try {
    const certs = await prisma.academicCertificate.findMany({
      where: { student_id: studentId },
      include: { Student: { select: { username: true, email: true } } },
      orderBy: { issue_date: 'desc' }
    });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

exports.verifyCertificate = async (req, res) => {
  const { uuid } = req.params;

  try {
    const certificate = await prisma.academicCertificate.findUnique({
      where: { certificate_uuid: uuid },
      include: {
        Student: {
          select: {
            username: true,
            email: true,
            Department: { select: { name: true } },
            Organization: { select: { name: true } }
          }
        }
      }
    });

    if (!certificate) {
      return res.status(404).json({ valid: false, message: 'Invalid certificate verification code.' });
    }

    res.json({
      valid: true,
      certificate: {
        uuid: certificate.certificate_uuid,
        type: certificate.certificate_type,
        issue_date: certificate.issue_date,
        student_name: certificate.Student?.username,
        department: certificate.Student?.Department?.name,
        organization: certificate.Student?.Organization?.name
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GUIDE & HOD DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

exports.getGuideOverview = async (req, res) => {
  const guideId = req.user.id;

  try {
    // Assigned students are project members where guide is manager/creator
    const projects = await prisma.projects.findMany({
      where: { manager_id: guideId },
      include: {
        ProjectMembers: {
          include: {
            Users: {
              select: { id: true, username: true, email: true, role: true }
            }
          }
        },
        Thesis: true
      }
    });

    // Unique students in these projects
    const studentMap = new Map();
    projects.forEach(p => {
      p.ProjectMembers.forEach(pm => {
        if (pm.Users && pm.Users.role === 'student') {
          studentMap.set(pm.Users.id, pm.Users);
        }
      });
    });
    const students = Array.from(studentMap.values());

    // Pending Daily Logs for these students
    const studentIds = students.map(s => s.id);
    const pendingLogs = await prisma.dailyLog.findMany({
      where: {
        student_id: { in: studentIds },
        status: 'pending'
      },
      include: { Student: { select: { username: true } }, Projects: true }
    });

    // Pending Thesis Review
    const pendingThesis = await prisma.thesis.findMany({
      where: {
        guide_id: guideId,
        status: 'submitted'
      },
      include: { Student: { select: { username: true } }, Projects: true }
    });

    res.json({
      projects_count: projects.length,
      students_count: students.length,
      students,
      pending_logs: pendingLogs,
      pending_thesis: pendingThesis
    });
  } catch (err) {
    res.status(500).json({ message: 'Database error fetching guide overview: ' + err.message });
  }
};

exports.getHodOverview = async (req, res) => {
  const deptId = req.user.department_id;

  if (!deptId) {
    return res.status(400).json({ message: 'User is not assigned to a department' });
  }

  try {
    // Total students in department
    const students = await prisma.users.count({
      where: { department_id: deptId, role: 'student' }
    });

    // Total guides in department
    const guides = await prisma.users.count({
      where: { department_id: deptId, role: 'guide' }
    });

    // Projects in department (managers belong to department)
    const projects = await prisma.projects.findMany({
      where: {
        Users: {
          department_id: deptId
        }
      },
      include: { Tasks: true }
    });

    const completedProjects = projects.filter(p => p.status === 'completed').length;
    
    // Delayed projects (has incomplete tasks past due)
    const now = new Date();
    const delayedProjects = projects.filter(p => {
      if (p.status === 'completed') return false;
      const delayedTasks = p.Tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed');
      return delayedTasks.length > 0;
    }).length;

    // Thesis status stats
    const thesisStats = await prisma.thesis.groupBy({
      by: ['status'],
      where: { department_id: deptId },
      _count: { id: true }
    });

    res.json({
      students_count: students,
      guides_count: guides,
      total_projects: projects.length,
      completed_projects: completedProjects,
      delayed_projects: delayedProjects,
      thesis_stats: thesisStats
    });
  } catch (err) {
    res.status(500).json({ message: 'Database error fetching HOD analytics: ' + err.message });
  }
};
