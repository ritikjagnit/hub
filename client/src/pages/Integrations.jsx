import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ToggleLeft, ToggleRight, Link2, HelpCircle, Terminal } from 'lucide-react';

const Integrations = () => {
  const { token } = useAuth();
  const [integrations, setIntegrations] = useState([]);
  
  // Webhook simulator states
  const [targetIntegration, setTargetIntegration] = useState('slack');
  const [webhookAction, setWebhookAction] = useState('notify_channel');
  const [webhookDetails, setWebhookDetails] = useState('');
  const [webhookResponse, setWebhookResponse] = useState(null);

  useEffect(() => {
    if (token) {
      fetchIntegrations();
    }
  }, [token]);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setIntegrations(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const toggleConnection = async (id, currentConnected) => {
    try {
      const res = await fetch(`/api/integrations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ connected: !currentConnected })
      });

      if (res.ok) {
        fetchIntegrations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerMockWebhook = async (e) => {
    e.preventDefault();
    setWebhookResponse(null);

    try {
      const res = await fetch('/api/integrations/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          integration_id: targetIntegration,
          action: webhookAction,
          details: webhookDetails || `Simulated action on ${targetIntegration}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setWebhookResponse(data);
        setWebhookDetails('');
      } else {
        setWebhookResponse({ error: 'Failed to simulate webhook.' });
      }
    } catch (err) {
      console.error(err);
      setWebhookResponse({ error: err.message });
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Third-Party Integrations</h1>
        <p className="page-subtitle">Sync your workspace deliverables with external communications, source controls, and storage servers.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {integrations.map(integ => (
          <div key={integ.id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>{integ.name}</h3>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Category: {integ.category.replace('_', ' ')}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: integ.connected ? 'hsl(var(--status-complete))' : 'hsl(var(--text-muted))' }} />
                <span style={{ fontSize: '0.7rem', color: integ.connected ? 'hsl(var(--status-complete))' : 'hsl(var(--text-muted))', fontWeight: '700' }}>
                  {integ.connected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => toggleConnection(integ.id, integ.connected)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: integ.connected ? 'hsl(var(--status-complete))' : 'hsl(var(--text-muted))',
                padding: '4px',
                transition: 'color 0.2s'
              }}
            >
              {integ.connected ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        ))}
      </div>

      {/* Webhook simulator */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Terminal size={18} style={{ color: 'hsl(var(--accent-cyan))' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>Developer Tools: Webhook Simulator</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginBottom: '16px' }}>
          Simulate inbound trigger hooks from connected repositories or messaging tools to test event audits.
        </p>

        <form onSubmit={triggerMockWebhook} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="form-label">Integration Source</label>
            <select value={targetIntegration} onChange={(e) => setTargetIntegration(e.target.value)}>
              <option value="slack">Slack</option>
              <option value="github">GitHub</option>
              <option value="zoom">Zoom Video</option>
              <option value="google_calendar">Google Calendar</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Inbound Action Event</label>
            <select value={webhookAction} onChange={(e) => setWebhookAction(e.target.value)}>
              <option value="push_commit">push_commit (GitHub)</option>
              <option value="pull_request">pull_request_opened (GitHub)</option>
              <option value="notify_channel">post_channel_message (Slack)</option>
              <option value="meeting_start">meeting_started (Zoom)</option>
              <option value="sync_calendar">calendar_event_added (Google Calendar)</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Event Description Details</label>
            <input 
              type="text" 
              placeholder="e.g. Commit 7ef5a01: Update db.js configurations" 
              value={webhookDetails} 
              onChange={(e) => setWebhookDetails(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ color: '#000', height: '42px', justifyContent: 'center' }}>
            Trigger Event Callback
          </button>
        </form>

        {webhookResponse && (
          <div className="glass-panel" style={{ marginTop: '20px', padding: '14px', background: 'hsla(220, 20%, 10%, 0.5)' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--accent-cyan))', marginBottom: '8px' }}>Response Logs:</h4>
            <pre style={{ fontSize: '0.75rem', fontFamily: 'Courier New, monospace', color: 'hsl(var(--text-main))', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(webhookResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Integrations;
