const prisma = require('../config/db');

// In-memory or database-backed active integrations list
const activeIntegrations = new Map();

// Initialize defaults
const DEFAULT_INTEGRATIONS = [
  { id: 'google_drive', name: 'Google Drive', category: 'cloud_storage', connected: false },
  { id: 'onedrive', name: 'OneDrive', category: 'cloud_storage', connected: false },
  { id: 'dropbox', name: 'Dropbox', category: 'cloud_storage', connected: false },
  { id: 'slack', name: 'Slack', category: 'collaboration', connected: false },
  { id: 'msteams', name: 'Microsoft Teams', category: 'collaboration', connected: false },
  { id: 'zoom', name: 'Zoom Video', category: 'meetings', connected: false },
  { id: 'github', name: 'GitHub', category: 'development', connected: false },
  { id: 'gitlab', name: 'GitLab', category: 'development', connected: false },
  { id: 'bitbucket', name: 'Bitbucket', category: 'development', connected: false },
  { id: 'google_calendar', name: 'Google Calendar', category: 'calendar', connected: false }
];

exports.getIntegrations = async (req, res) => {
  try {
    const list = DEFAULT_INTEGRATIONS.map(integ => {
      const isConnected = activeIntegrations.get(`${req.user.id}_${integ.id}`) || false;
      return { ...integ, connected: isConnected };
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.toggleIntegration = async (req, res) => {
  const { id } = req.params; // integration id
  const { connected } = req.body;

  try {
    const key = `${req.user.id}_${id}`;
    activeIntegrations.set(key, !!connected);

    // Logging this connection in AuditLogs
    await prisma.auditLog.create({
      data: {
        user_id: req.user.id,
        action: connected ? 'CONNECT_INTEGRATION' : 'DISCONNECT_INTEGRATION',
        details: `Third-party integration: ${id} connection state toggled to ${connected}.`
      }
    });

    res.json({ message: `Integration ${id} ${connected ? 'connected' : 'disconnected'} successfully.`, connected: !!connected });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.triggerMockWebhook = async (req, res) => {
  const { integration_id, action, project_id, details } = req.body;

  if (!integration_id || !action) {
    return res.status(400).json({ message: 'integration_id and action are required' });
  }

  try {
    // Create an audit log record
    const log = await prisma.auditLog.create({
      data: {
        user_id: req.user ? req.user.id : null,
        action: `WEBHOOK_${integration_id.toUpperCase()}`,
        details: `Webhook action '${action}' triggered. Description: ${details || 'No details provided.'}`
      }
    });

    // If Slack integration is connected, we simulate sending a message
    if (integration_id === 'slack') {
      console.log(`[Slack Simulation Webhook] Broadcasting action '${action}' to Slack workspace.`);
    }

    res.status(200).json({
      message: `Webhook from ${integration_id} simulated and registered in workspace audit logs.`,
      log
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};
