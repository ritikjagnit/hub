const prisma = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalProjects = await prisma.projects.count();

    const activeProjects = await prisma.projects.count({ 
      where: { 
        status: 'in_progress'
      } 
    });
    
    const totalTasks = await prisma.tasks.count();

    const completedTasks = await prisma.tasks.count({ 
      where: { 
        status: 'completed'
      } 
    });

    const totalMembers = await prisma.users.count({
      where: {
        on_team: true
      }
    });

    // Recent activity (Last 5 time logs)
    const recentActivity = await prisma.timeLogs.findMany({
      take: 5,
      orderBy: { logged_at: 'desc' },
      include: {
        Users: { select: { username: true } },
        Projects: { select: { name: true } },
        Tasks: { select: { title: true } }
      }
    });

    res.json({
      projects: { total: totalProjects, active: activeProjects },
      tasks: { total: totalTasks, completed: completedTasks },
      members: totalMembers,
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        user: log.Users?.username,
        project: log.Projects?.name,
        task: log.Tasks?.title,
        duration: log.duration_seconds,
        date: log.logged_at
      }))
    });
  } catch (err) {
    console.error("Analytics Error", err);
    res.status(500).json({ message: 'Database error fetching analytics' });
  }
};
