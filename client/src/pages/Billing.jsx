import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, FileText, Plus, Receipt, TrendingDown, TrendingUp, CheckCircle, Clock } from 'lucide-react';

const Billing = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [costSummary, setCostSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Modal control & Form state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceClientId, setInvoiceClientId] = useState('');
  
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('hosting');
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchInvoices();
      fetchExpenses();
      fetchClients();
    }
  }, [token]);

  useEffect(() => {
    if (selectedProject) {
      fetchCostSummary(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) setSelectedProject(data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/workspace/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.filter(u => u.role === 'client'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCostSummary = async (projId) => {
    try {
      const res = await fetch(`/api/billing/cost-summary/${projId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setCostSummary(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/billing/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setInvoices(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/billing/expenses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setExpenses(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceNo || !invoiceAmount || !invoiceDueDate) return alert('Fill all required fields');

    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invoice_number: invoiceNo,
          amount: parseFloat(invoiceAmount),
          due_date: invoiceDueDate,
          issue_date: new Date().toISOString(),
          project_id: selectedProject ? parseInt(selectedProject) : null,
          client_id: invoiceClientId ? parseInt(invoiceClientId) : null
        })
      });

      if (res.ok) {
        setIsInvoiceModalOpen(false);
        setInvoiceNo('');
        setInvoiceAmount('');
        setInvoiceDueDate('');
        fetchInvoices();
      } else {
        alert('Invoice creation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expenseAmount) return alert('Amount is required');

    try {
      const res = await fetch('/api/billing/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(expenseAmount),
          description: expenseDesc,
          category: expenseCategory,
          project_id: selectedProject ? parseInt(selectedProject) : null
        })
      });

      if (res.ok) {
        setIsExpenseModalOpen(false);
        setExpenseAmount('');
        setExpenseDesc('');
        fetchExpenses();
        if (selectedProject) fetchCostSummary(selectedProject);
      } else {
        alert('Expense logging failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    if (!window.confirm('Simulate payments routing via gateway?')) return;

    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'paid' })
      });
      if (res.ok) {
        alert('Invoice successfully marked paid!');
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const canManageBilling = user && ['admin', 'project_manager', 'manager'].includes(user.role);

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Billing & Expenses</h1>
          <p className="page-subtitle">Track project burn rates, generate invoices, log custom expenses, and check payment status.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {canManageBilling && (
            <>
              <button onClick={() => setIsInvoiceModalOpen(true)} className="btn btn-primary" style={{ color: '#000' }}>
                <FileText size={16} /> Create Invoice
              </button>
              <button onClick={() => setIsExpenseModalOpen(true)} className="btn btn-secondary">
                <Receipt size={16} /> Log Expense
              </button>
            </>
          )}
        </div>
      </div>

      {/* Project cost breakdown header */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DollarSign size={24} style={{ color: 'hsl(var(--accent-cyan))' }} />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>Project Budget vs Spent Analyzer</h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Compare total labour costs and logged expenses against project limits.</p>
          </div>
        </div>
        <div>
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{ padding: '8px 12px', background: 'hsla(220, 20%, 20%, 0.6)', border: '1px solid hsl(var(--border-glass))', color: '#fff', borderRadius: '6px' }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats row */}
      {costSummary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Allocated Budget</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>${costSummary.budget || 0}</h2>
            </div>
            <TrendingUp size={24} style={{ color: 'hsl(var(--accent-cyan))' }} />
          </div>
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Total Expenses</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'hsl(var(--status-high))', marginTop: '4px' }}>${costSummary.total_expenses || 0}</h2>
            </div>
            <TrendingDown size={24} style={{ color: 'hsl(var(--status-high))' }} />
          </div>
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Labour Costs</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'hsl(var(--accent-blue))', marginTop: '4px' }}>${costSummary.total_labour_cost || 0}</h2>
            </div>
            <Clock size={24} style={{ color: 'hsl(var(--accent-blue))' }} />
          </div>
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Remaining Balance</p>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '800', 
                color: costSummary.remaining_budget >= 0 ? 'hsl(var(--status-complete))' : 'hsl(var(--status-high))', 
                marginTop: '4px' 
              }}>
                ${costSummary.remaining_budget !== null ? costSummary.remaining_budget : 'N/A'}
              </h2>
            </div>
            <DollarSign size={24} style={{ color: costSummary.remaining_budget >= 0 ? 'hsl(var(--status-complete))' : 'hsl(var(--status-high))' }} />
          </div>
        </div>
      )}

      {/* Main invoices / expenses tables grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Invoices list */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>Invoices</h3>
          {invoices.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '30px' }}>No invoices logged.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {invoices.map(inv => (
                <div key={inv.id} className="glass-panel" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsla(220, 20%, 15%, 0.3)' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{inv.invoice_number}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                      Project: {inv.project_name || 'General'}
                    </p>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      padding: '2px 8px', 
                      borderRadius: '10px', 
                      background: inv.status === 'paid' ? 'hsla(145, 75%, 45%, 0.15)' : 'hsla(45, 80%, 55%, 0.15)',
                      color: inv.status === 'paid' ? 'hsl(var(--status-complete))' : 'hsl(var(--status-pending))',
                      fontWeight: '700',
                      display: 'inline-block',
                      marginTop: '6px'
                    }}>
                      {inv.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>${inv.amount}</span>
                    {inv.status !== 'paid' && (
                      <button onClick={() => handlePayInvoice(inv.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}>
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses list */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>Logged Expenses</h3>
          {expenses.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '30px' }}>No expenses logged.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {expenses.map(exp => (
                <div key={exp.id} className="glass-panel" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsla(220, 20%, 15%, 0.3)' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{exp.description || 'General Expense'}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                      Project: {exp.project_name || 'General'}
                    </p>
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'hsla(220,20%,20%,0.6)', border: '1px solid hsl(var(--border-glass))', borderRadius: '4px', display: 'inline-block', marginTop: '6px', color: 'hsl(var(--accent-cyan))' }}>
                      Category: {exp.category}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: 'hsl(var(--status-high))' }}>-${exp.amount}</span>
                    <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                      By: {exp.logged_by_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* CREATE INVOICE MODAL */}
      {isInvoiceModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Generate Invoice</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <Plus style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Invoice Number</label>
                <input type="text" placeholder="e.g. INV-2026-001" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Billing Amount ($)</label>
                <input type="number" step="0.01" placeholder="99.99" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Client</label>
                <select value={invoiceClientId} onChange={(e) => setInvoiceClientId(e.target.value)}>
                  <option value="">Select Target Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.username} ({c.email})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000', marginTop: '10px' }}>
                Generate & Send Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LOG EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Log Project Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                <Plus style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Expense Amount ($)</label>
                <input type="number" step="0.01" placeholder="e.g. 150.00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" placeholder="e.g. AWS hosting charges" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                  <option value="hosting">Cloud Infrastructure / Hosting</option>
                  <option value="marketing">Advertising & Marketing</option>
                  <option value="software">Software Licenses / SaaS subscriptions</option>
                  <option value="hardware">Workstations & Hardware</option>
                  <option value="office">Office Spaces & Rent</option>
                  <option value="other">Other Expenses</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', color: '#000', marginTop: '10px' }}>
                Log Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
