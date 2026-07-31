import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [scrollY, setScrollY] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [activeTab, setActiveTab] = useState('kanban');
  const [contactData, setContactData] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactStatus, setContactStatus] = useState({ type: null, text: '' });
  const [paymentLoading, setPaymentLoading] = useState('');

  const handleRazorpayPayment = async (plan) => {
    setPaymentLoading(plan);
    const baseUrl = window.location.origin.includes('localhost:5173') ? 'http://localhost:5000' : '';

    try {
      // 1. Create order on backend
      const res = await fetch(`${baseUrl}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, currency })
      });
      const order = await res.json();

      if (!res.ok) throw new Error(order.error || 'Order creation failed');

      // 2. Load Razorpay checkout script dynamically
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // 3. Open Razorpay modal
      const rzpOptions = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Project Hub',
        description: order.planName,
        image: '/logo.png',
        order_id: order.orderId,
        handler: async (response) => {
          // 4. Verify payment on backend
          try {
            const verifyRes = await fetch(`${baseUrl}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              alert(`✅ Payment Successful!\n\nPayment ID: ${response.razorpay_payment_id}\n\nRedirecting you to register your workspace admin account...`);
              window.location.href = `/register?payment_id=${response.razorpay_payment_id}&plan=${plan}`;
            } else {
              alert(`❌ Payment verification failed: ${verifyData.error}`);
            }
          } catch (err) {
            console.error(err);
            alert('Payment verification error. Please contact support@stufflas.com');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#0ea5e9',
          backdrop_color: 'rgba(0,0,0,0.8)'
        },
        modal: {
          ondismiss: () => setPaymentLoading('')
        }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      alert(`Payment failed: ${err.message}`);
    } finally {
      setPaymentLoading('');
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
      setContactStatus({ type: 'error', text: 'All fields are required.' });
      return;
    }

    setContactSubmitting(true);
    setContactStatus({ type: null, text: '' });

    try {
      const baseUrl = window.location.origin.includes('localhost:5173') ? 'http://localhost:5000' : '';
      const response = await fetch(`${baseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setContactStatus({ type: 'success', text: data.message || 'Message sent successfully!' });
        setContactData({ name: '', email: '', subject: '', message: '' });
      } else {
        setContactStatus({ type: 'error', text: data.error || 'Failed to send message.' });
      }
    } catch (err) {
      console.error(err);
      setContactStatus({ type: 'error', text: 'Network error. Please try again later.' });
    } finally {
      setContactSubmitting(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: '📁',
      title: 'Project Management',
      desc: 'Create, manage and track projects with deadlines, statuses, document uploads and full team assignment controls.'
    },
    {
      icon: '✅',
      title: 'Kanban Task Board',
      desc: 'Visual 4-column Kanban board: Pending → In Progress → Testing → Completed. Drag statuses, set priorities, assign members.'
    },
    {
      icon: '💬',
      title: 'Team Chat',
      desc: 'Real-time group messaging for your workspace. Collaborate, share updates, and keep everyone on the same page.'
    },
    {
      icon: '📊',
      title: 'Reports & Analytics',
      desc: 'Visual charts, task completion rates, project overview graphs and performance insights for your team.'
    },
    {
      icon: '📅',
      title: 'Calendar View',
      desc: 'See all project deadlines and task due dates in an interactive monthly calendar view.'
    },
    {
      icon: '👥',
      title: 'Team Management',
      desc: 'Add team members, assign roles (Admin, PM, Developer, Client), and manage workspace access.'
    },
    {
      icon: '🔐',
      title: 'Firebase Authentication',
      desc: 'Secure login with Google SSO or email/password via Firebase Auth. Auto profile sync with database.'
    },
    {
      icon: '⏱️',
      title: 'Attendance & Check-In',
      desc: 'Daily check-in/check-out system with real-time attendance tracking for the entire workspace team.'
    },
    {
      icon: '⚙️',
      title: 'Settings & Profile',
      desc: 'Customize your profile, update credentials, manage workspace preferences and notification settings.'
    }
  ];

  const stats = [
    { value: '9+', label: 'Core Features' },
    { value: '4', label: 'User Roles' },
    { value: '100%', label: 'Real-time' },
    { value: '∞', label: 'Projects' }
  ];

  const roles = [
    { role: 'Admin', color: '#ef4444', desc: 'Full system control, user management, all features' },
    { role: 'Project Manager', color: '#3b82f6', desc: 'Create projects, assign teams, manage tasks' },
    { role: 'Team Member', color: '#06b6d4', desc: 'Create tasks, update status, team collaboration' },
    { role: 'Client', color: '#a855f7', desc: 'View project progress and deliverables' }
  ];

  return (
    <div style={{ background: 'hsl(224, 25%, 10%)', minHeight: '100vh', overflowX: 'hidden', fontFamily: "'Outfit', 'Inter', sans-serif", color: 'hsl(220, 20%, 95%)' }}>

      {/* Animated background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, hsla(260,80%,65%,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, hsla(190,90%,50%,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '40%', right: '15%', width: '300px', height: '300px', background: 'radial-gradient(circle, hsla(215,90%,55%,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrollY > 50 ? 'hsla(222,22%,13%,0.95)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid hsla(220,20%,25%,0.4)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Project Hub Logo" style={{ height: '52px', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/login" style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid hsla(190,90%,50%,0.4)', color: 'hsl(190,90%,50%)', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.3s ease' }}
            onMouseOver={e => { e.currentTarget.style.background = 'hsla(190,90%,50%,0.1)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>
            Sign In
          </Link>
          <Link to="/register" style={{ padding: '9px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, hsl(190,90%,50%), hsl(215,90%,55%))', color: '#000', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 40px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: '860px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', borderRadius: '100px', background: 'hsla(190,90%,50%,0.1)', border: '1px solid hsla(190,90%,50%,0.3)', marginBottom: '28px', fontSize: '0.82rem', color: 'hsl(190,90%,55%)', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            🚀 Built for Growing Teams &amp; Companies
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4.2rem)', fontWeight: '900', lineHeight: 1.08, marginBottom: '28px', letterSpacing: '-0.03em' }}>
            Run Your Entire Team From{' '}
            <span style={{ background: 'linear-gradient(135deg, hsl(190,90%,50%), hsl(260,80%,65%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>
              One Powerful Dashboard
            </span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'hsl(218,15%,62%)', maxWidth: '640px', margin: '0 auto 14px', lineHeight: 1.75 }}>
            Project Hub gives your company a complete system — assign tasks, track attendance, chat in real-time, generate PDF reports, and deliver projects on time. <strong style={{ color: 'hsl(220,20%,88%)' }}>No more switching between 5 different apps.</strong>
          </p>
          <p style={{ fontSize: '0.92rem', color: 'hsl(218,15%,48%)', maxWidth: '500px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            Trusted by <strong style={{ color: 'hsl(190,90%,55%)' }}>startups, agencies &amp; IT teams</strong> managing 5 to 500+ members globally.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
            <Link to="/register" style={{ padding: '15px 36px', borderRadius: '12px', background: 'linear-gradient(135deg, hsl(190,90%,50%), hsl(215,90%,55%))', color: '#000', textDecoration: 'none', fontWeight: '800', fontSize: '1rem', boxShadow: '0 0 40px hsla(190,90%,50%,0.35)' }}>
              Get Started Free →
            </Link>
            <a href="#contact" style={{ padding: '15px 36px', borderRadius: '12px', border: '1px solid hsla(220,20%,28%,0.8)', color: 'hsl(220,20%,90%)', textDecoration: 'none', fontWeight: '600', fontSize: '1rem', background: 'hsla(222,22%,15%,0.7)', backdropFilter: 'blur(10px)' }}>
              Talk to Sales ↓
            </a>
          </div>
          <div style={{ display: 'flex', gap: '28px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[{ icon: '🔐', text: 'Firebase Auth' }, { icon: '⚡', text: 'Real-time Sync' }, { icon: '📱', text: 'Mobile Friendly' }, { icon: '🌍', text: 'Global Ready' }].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'hsl(218,15%,52%)', fontWeight: '600' }}>
                <span>{b.icon}</span><span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section style={{ position: 'relative', zIndex: 1, padding: '70px 40px', background: 'hsla(222,22%,11%,0.8)', borderTop: '1px solid hsla(220,20%,20%,0.4)', borderBottom: '1px solid hsla(220,20%,20%,0.4)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: '800', marginBottom: '14px' }}>😤 Does This Sound Familiar?</h2>
          <p style={{ color: 'hsl(218,15%,58%)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 44px', lineHeight: 1.6 }}>
            Most growing teams hit the same walls. Here is what kills productivity every single day:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', textAlign: 'left', marginBottom: '40px' }}>
            {[
              { icon: '😵', t: 'Scattered Tools', d: 'Tasks on WhatsApp, attendance on paper, reports in Excel — nothing connected.' },
              { icon: '🕐', t: 'Zero Visibility', d: 'No one knows who is doing what or whether deadlines will be met.' },
              { icon: '📞', t: 'Endless Follow-ups', d: 'Managers waste hours pinging people just to get a simple status update.' },
              { icon: '📁', t: 'Lost Information', d: 'Documents and decisions vanish in chat threads or long email chains.' },
            ].map((p, i) => (
              <div key={i} style={{ padding: '20px', borderRadius: '14px', background: 'hsla(0,70%,50%,0.05)', border: '1px solid hsla(0,70%,50%,0.15)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{p.icon}</div>
                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'hsl(0,75%,70%)', marginBottom: '6px' }}>{p.t}</div>
                <div style={{ fontSize: '0.82rem', color: 'hsl(218,15%,58%)', lineHeight: 1.6 }}>{p.d}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '18px 28px', borderRadius: '14px', background: 'hsla(190,90%,50%,0.07)', border: '1px solid hsla(190,90%,50%,0.2)', display: 'inline-block' }}>
            <p style={{ margin: 0, fontSize: '1rem', color: 'hsl(190,90%,60%)', fontWeight: '700' }}>
              ✅ Project Hub solves all of this — in one single workspace.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE APPS SHOWCASE */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 40px 80px', marginTop: '-40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: '800', marginBottom: '12px' }}>
              Explore the Workspace Features
            </h2>
            <p style={{ color: 'hsl(218,15%,65%)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>
              Click on the tabs below to preview the actual real-time interface in action.
            </p>
          </div>

          {/* Showcase Tabs */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap',
            marginBottom: '30px', padding: '6px', borderRadius: '14px',
            background: 'hsla(222,22%,12%,0.6)', border: '1px solid hsla(220,20%,25%,0.3)',
            maxWidth: '780px', margin: '0 auto 40px'
          }}>
            {[
              { id: 'kanban', label: 'Kanban Board', icon: '📋' },
              { id: 'chat', label: 'Team Chat', icon: '💬' },
              { id: 'pdf', label: 'PDF Reports', icon: '📊' },
              { id: 'checkin', label: 'Daily Timer', icon: '⏱️' },
              { id: 'calendar', label: 'Calendar View', icon: '📅' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 18px', borderRadius: '10px', border: 'none',
                  fontSize: '0.85rem', fontWeight: '750', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, hsl(190,90%,50%), hsl(215,90%,55%))' : 'transparent',
                  color: activeTab === tab.id ? '#000' : 'hsl(218,15%,65%)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Showcase Screen Mockup Frame */}
          <div style={{
            background: 'hsl(222,22%,12%)',
            borderRadius: '24px',
            border: '1px solid hsla(190,90%,50%,0.2)',
            padding: '24px',
            boxShadow: '0 0 60px hsla(190,90%,50%,0.06), 0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Top Bar of Mockup */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid hsla(220,20%,25%,0.4)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(218,15%,50%)', fontFamily: 'monospace', background: 'hsla(220,20%,15%,0.8)', padding: '4px 16px', borderRadius: '20px', border: '1px solid hsla(220,20%,25%,0.3)' }}>
                app.projecthub.com/dashboard/{activeTab}
              </div>
              <div style={{ width: '30px' }} />
            </div>

            {/* Mockup Content Render */}
            <div style={{ minHeight: '360px', position: 'relative' }}>
              
              {activeTab === 'kanban' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', textAlign: 'left' }}>
                  {[
                    { title: 'Pending', color: 'hsl(215,90%,60%)', tasks: [{ name: 'Setup Prisma DB Migration', priority: 'High', date: 'June 28' }] },
                    { title: 'In Progress', color: 'hsl(40,90%,55%)', tasks: [{ name: 'Create Invites Admin Panel', priority: 'High', date: 'June 27' }, { name: 'Refactor Auth Routes', priority: 'Medium', date: 'June 29' }] },
                    { title: 'Testing', color: 'hsl(190,90%,55%)', tasks: [{ name: 'Test Socket.io Chat Events', priority: 'Medium', date: 'June 26' }] },
                    { title: 'Completed', color: 'hsl(145,75%,50%)', tasks: [{ name: 'Setup Tailwind Styling System', priority: 'Low', date: 'June 24' }] }
                  ].map((col, cIdx) => (
                    <div key={cIdx} style={{ background: 'hsla(220,20%,15%,0.4)', borderRadius: '12px', padding: '12px', border: '1px solid hsla(220,20%,20%,0.6)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'hsl(220,20%,90%)' }}>{col.title}</span>
                        <span style={{ fontSize: '0.7rem', color: 'hsl(218,15%,50%)', marginLeft: 'auto', background: 'hsla(220,20%,20%,0.8)', padding: '2px 6px', borderRadius: '20px' }}>{col.tasks.length}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {col.tasks.map((task, tIdx) => (
                          <div key={tIdx} style={{ background: 'hsla(222,22%,16%,0.8)', border: '1px solid hsla(220,20%,25%,0.4)', borderRadius: '10px', padding: '12px', cursor: 'default' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(220,20%,95%)', marginBottom: '8px' }}>{task.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '0.65rem', fontWeight: '800',
                                padding: '2px 8px', borderRadius: '20px',
                                background: task.priority === 'High' ? 'hsla(0,85%,60%,0.1)' : task.priority === 'Medium' ? 'hsla(40,90%,55%,0.1)' : 'hsla(145,75%,45%,0.1)',
                                color: task.priority === 'High' ? 'hsl(0,85%,65%)' : task.priority === 'Medium' ? 'hsl(40,90%,60%)' : 'hsl(145,75%,55%)'
                              }}>{task.priority}</span>
                              <span style={{ fontSize: '0.68rem', color: 'hsl(218,15%,50%)' }}>📅 {task.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'chat' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '360px', background: 'hsla(220,20%,15%,0.3)', borderRadius: '12px', border: '1px solid hsla(220,20%,20%,0.6)', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid hsla(220,20%,25%,0.4)', paddingBottom: '12px', marginBottom: '14px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: '800', color: 'hsl(220,20%,90%)' }}>#general-workspace-chat</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1, overflowY: 'auto', textAlign: 'left', paddingRight: '8px' }}>
                    {[
                      { user: 'Ritik (Admin)', text: 'Hey guys, did you check out the new 30-day PDF attendance reporting tool?', time: '11:42 AM', initials: 'R', color: 'hsl(190,90%,50%)' },
                      { user: 'Sanya (Manager)', text: 'Yes, just downloaded the workspace audit log. It formats perfectly! 📈', time: '11:43 AM', initials: 'S', color: 'hsl(260,80%,65%)' },
                      { user: 'Arjun (Developer)', text: 'Awesome work. Im checking in now to start working on the calendar synchronization.', time: '11:45 AM', initials: 'A', color: 'hsl(145,75%,50%)' }
                    ].map((msg, mIdx) => (
                      <div key={mIdx} style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.color, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', flexShrink: 0 }}>{msg.initials}</div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'hsl(220,20%,95%)' }}>{msg.user}</span>
                            <span style={{ fontSize: '0.65rem', color: 'hsl(218,15%,50%)' }}>{msg.time}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'hsl(218,15%,75%)', lineHeight: 1.5 }}>{msg.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Type a message to your workspace..." disabled style={{ flexGrow: 1, background: 'hsla(222,22%,10%,0.6)', border: '1px solid hsla(220,20%,25%,0.5)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem', color: 'hsl(220,20%,90%)' }} />
                    <button disabled style={{ background: 'linear-gradient(135deg, hsl(190,90%,50%), hsl(215,90%,55%))', border: 'none', borderRadius: '8px', padding: '0 16px', fontWeight: '700', fontSize: '0.8rem', color: '#000' }}>Send</button>
                  </div>
                </div>
              )}

              {activeTab === 'pdf' && (
                <div style={{ textAlign: 'left', background: 'hsla(220,20%,15%,0.3)', borderRadius: '12px', border: '1px solid hsla(220,20%,20%,0.6)', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'hsl(220,20%,95%)', margin: 0 }}>Attendance Log & Audit Reports</h4>
                      <p style={{ fontSize: '0.72rem', color: 'hsl(218,15%,50%)', margin: '2px 0 0 0' }}>Audit logs for team members check-ins</p>
                    </div>
                    <button style={{ padding: '8px 14px', borderRadius: '8px', background: 'hsla(220,20%,25%,0.6)', border: '1px solid hsla(190,90%,50%,0.4)', color: 'hsl(190,90%,50%)', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      💾 Export Attendance PDF (Last 30 Days)
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: 'hsl(218,15%,75%)', minWidth: '500px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid hsla(220,20%,25%,0.6)' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Employee</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Check In</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Check Out</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Arjun Dev', date: 'June 26, 2026', in: '09:02 AM', out: '05:30 PM', status: 'Present', color: 'hsl(145,75%,45%)' },
                          { name: 'Sanya Shah', date: 'June 26, 2026', in: '09:15 AM', out: '—', status: 'Active', color: 'hsl(190,90%,50%)' },
                          { name: 'Ritik Jagnit', date: 'June 25, 2026', in: '08:45 AM', out: '06:00 PM', status: 'Present', color: 'hsl(145,75%,45%)' }
                        ].map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid hsla(220,20%,25%,0.2)' }}>
                            <td style={{ padding: '10px 8px', fontWeight: '600' }}>{row.name}</td>
                            <td style={{ padding: '10px 8px' }}>{row.date}</td>
                            <td style={{ padding: '10px 8px', color: 'hsl(145,75%,50%)' }}>{row.in}</td>
                            <td style={{ padding: '10px 8px', color: row.out === '—' ? 'hsl(190,90%,55%)' : 'hsl(40,90%,60%)' }}>{row.out}</td>
                            <td style={{ padding: '10px 8px' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '20px', background: `${row.color}15`, color: row.color, border: `1px solid ${row.color}30` }}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'checkin' && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '320px' }}>
                  <div style={{
                    width: '320px', padding: '30px 24px', borderRadius: '20px',
                    background: 'hsla(222,22%,16%,0.8)', border: '1px solid hsla(190,90%,50%,0.25)',
                    textAlign: 'center', boxShadow: '0 0 30px hsla(190,90%,50%,0.06)'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'hsl(190,90%,50%)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Daily Timer Status</div>
                    
                    <div style={{
                      width: '120px', height: '120px', borderRadius: '50%',
                      background: 'radial-gradient(circle, hsla(190,90%,50%,0.05) 0%, transparent 80%)',
                      border: '4px solid hsla(190,90%,50%,0.2)', borderTopColor: 'hsl(190,90%,50%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 24px', position: 'relative'
                    }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'hsl(220,20%,95%)', fontFamily: 'monospace' }}>08:12:44</div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button disabled style={{ flexGrow: 1, padding: '10px', borderRadius: '10px', background: 'hsla(220,20%,20%,0.6)', border: '1px solid hsla(220,20%,25%,0.6)', color: 'hsl(218,15%,50%)', fontWeight: '750', fontSize: '0.8rem' }}>
                        Check In
                      </button>
                      <button disabled style={{ flexGrow: 1, padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, hsl(0,85%,60%), hsl(0,85%,50%))', border: 'none', color: '#fff', fontWeight: '750', fontSize: '0.8rem', boxShadow: '0 0 20px hsla(0,85%,60%,0.15)' }}>
                        Check Out
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'calendar' && (
                <div style={{ background: 'hsla(220,20%,15%,0.3)', borderRadius: '12px', border: '1px solid hsla(220,20%,20%,0.6)', padding: '16px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'hsl(220,20%,95%)' }}>June 2026</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button disabled style={{ background: 'hsla(220,20%,20%,0.6)', border: 'none', color: 'hsl(218,15%,65%)', borderRadius: '4px', padding: '2px 8px' }}>&lt;</button>
                      <button disabled style={{ background: 'hsla(220,20%,20%,0.6)', border: 'none', color: 'hsl(218,15%,65%)', borderRadius: '4px', padding: '2px 8px' }}>&gt;</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, dIdx) => (
                      <div key={dIdx} style={{ fontSize: '0.7rem', fontWeight: '850', color: 'hsl(218,15%,45%)', padding: '4px 0' }}>{day}</div>
                    ))}
                    {Array.from({ length: 28 }).map((_, dayIdx) => {
                      const dayNum = dayIdx + 1;
                      const hasEvent = dayNum === 26 || dayNum === 28;
                      const eventColor = dayNum === 26 ? 'hsl(190,90%,50%)' : 'hsl(260,80%,65%)';
                      return (
                        <div key={dayIdx} style={{
                          aspectRatio: '1.4', background: dayNum === 26 ? 'hsla(190,90%,50%,0.08)' : 'hsla(220,20%,16%,0.5)',
                          borderRadius: '8px', border: dayNum === 26 ? '1px solid hsla(190,90%,50%,0.4)' : '1px solid hsla(220,20%,20%,0.2)',
                          padding: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                          position: 'relative'
                        }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: dayNum === 26 ? '800' : '500', color: dayNum === 26 ? 'hsl(190,90%,55%)' : 'hsl(218,15%,75%)' }}>{dayNum}</span>
                          {hasEvent && (
                            <div style={{
                              width: '100%', height: '4px', borderRadius: '2px', background: eventColor
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px', borderTop: '1px solid hsla(220,20%,25%,0.4)', borderBottom: '1px solid hsla(220,20%,25%,0.4)', background: 'hsla(222,22%,13%,0.5)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', background: 'linear-gradient(135deg, hsl(190,90%,50%), hsl(260,80%,65%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'hsl(218,15%,65%)', fontWeight: '600', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES GRID */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '800', marginBottom: '16px' }}>
              Everything Your Team Needs
            </h2>
            <p style={{ color: 'hsl(218,15%,65%)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
              A complete toolkit to plan, execute, collaborate and deliver — all in one place.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {features.map((f, i) => (
              <div key={i} style={{
                padding: '28px', borderRadius: '16px',
                background: 'hsla(222,22%,15%,0.7)', backdropFilter: 'blur(16px)',
                border: '1px solid hsla(220,20%,25%,0.4)',
                transition: 'all 0.3s ease', cursor: 'default'
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'hsla(190,90%,50%,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 0 24px hsla(190,90%,50%,0.1), 0 8px 32px rgba(0,0,0,0.4)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'hsla(220,20%,25%,0.4)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '10px', color: 'hsl(220,20%,95%)' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(218,15%,65%)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES SECTION */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 40px', background: 'hsla(222,22%,13%,0.5)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '800', marginBottom: '16px' }}>
              Built for Every Role
            </h2>
            <p style={{ color: 'hsl(218,15%,65%)', fontSize: '1rem' }}>
              Role-based access control so everyone gets exactly what they need.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {roles.map((r, i) => (
              <div key={i} style={{ padding: '24px', borderRadius: '16px', background: 'hsla(222,22%,15%,0.8)', border: `1px solid ${r.color}30`, textAlign: 'center', transition: 'all 0.3s ease' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = r.color + '80'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = r.color + '30'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: r.color + '20', border: `1px solid ${r.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.4rem' }}>
                  {i === 0 ? '👑' : i === 1 ? '📋' : i === 2 ? '💻' : '👁️'}
                </div>
                <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '8px', color: r.color }}>{r.role}</div>
                <p style={{ fontSize: '0.8rem', color: 'hsl(218,15%,65%)', lineHeight: 1.5 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 40px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '800', marginBottom: '16px' }}>How It Works</h2>
          <p style={{ color: 'hsl(218,15%,65%)', marginBottom: '60px' }}>Up and running in minutes</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '32px' }}>
            {[
              { step: '01', title: 'Sign Up', desc: 'Register with your email or Google account. Firebase handles secure authentication.', icon: '🔐' },
              { step: '02', title: 'Create Project', desc: 'Set up your project with name, description, deadline and status tracking.', icon: '📁' },
              { step: '03', title: 'Add Tasks', desc: 'Break your project into tasks with priorities, due dates and team assignments.', icon: '✅' },
              { step: '04', title: 'Collaborate', desc: 'Chat with your team, track progress on Kanban board, and view analytics.', icon: '🤝' }
            ].map((s, i) => (
              <div key={i} style={{ padding: '28px 20px', borderRadius: '16px', background: 'hsla(222,22%,15%,0.7)', border: '1px solid hsla(220,20%,25%,0.4)', position: 'relative' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'hsl(190,90%,50%)', letterSpacing: '0.1em', marginBottom: '12px' }}>{s.step}</div>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{s.icon}</div>
                <h3 style={{ fontWeight: '700', marginBottom: '10px' }}>{s.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'hsl(218,15%,65%)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 40px', background: 'hsla(222,22%,13%,0.3)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '800', marginBottom: '16px' }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ color: 'hsl(218,15%,65%)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto 24px' }}>
              Choose the perfect plan for your business and scale your team operations globally.
            </p>

            {/* Currency Selector Toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'hsla(222,22%,10%,0.6)', padding: '6px 16px', borderRadius: '100px', border: '1px solid hsla(220,20%,25%,0.5)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: currency === 'USD' ? 'hsl(190,90%,50%)' : 'hsl(218,15%,55%)', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setCurrency('USD')}>USD ($)</span>
              <div 
                style={{
                  width: '42px', height: '22px', borderRadius: '100px', background: 'hsla(220,20%,25%,0.8)', border: '1px solid hsla(220,20%,30%,0.5)', cursor: 'pointer', position: 'relative', transition: 'all 0.3s'
                }}
                onClick={() => setCurrency(prev => prev === 'USD' ? 'INR' : 'USD')}
              >
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, hsl(190,90%,50%), hsl(260,80%,65%))',
                  position: 'absolute', top: '3px', left: currency === 'USD' ? '4px' : '22px', transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: currency === 'INR' ? 'hsl(260,80%,65%)' : 'hsl(218,15%,55%)', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setCurrency('INR')}>INR (₹)</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', justifyContent: 'center', maxWidth: '800px', margin: '0 auto' }}>
            
            {/* Monthly Plan */}
            <div style={{
              padding: '40px 30px',
              borderRadius: '24px',
              background: 'hsla(222,22%,15%,0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid hsla(220,20%,25%,0.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'between',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'hsla(190,90%,50%,0.4)'; e.currentTarget.style.transform = 'translateY(-6px)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'hsla(220,20%,25%,0.4)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'hsl(190,90%,50%)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '15px' }}>Monthly Plan</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '3rem', fontWeight: '900', color: 'hsl(220,20%,95%)' }}>
                    {currency === 'USD' ? '$2.99' : '₹249'}
                  </span>
                  <span style={{ color: 'hsl(218,15%,65%)', fontSize: '0.95rem' }}>/ month</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'hsl(218,15%,65%)', lineHeight: 1.6, marginBottom: '30px' }}>
                  Perfect for teams testing the waters. Pay month-to-month and cancel at any time.
                </p>
                <div style={{ borderTop: '1px solid hsla(220,20%,25%,0.4)', paddingTop: '20px', marginBottom: '30px' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', fontSize: '0.9rem', color: 'hsl(218,15%,75%)' }}>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>Unlimited Projects & Tasks</span></li>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>Kanban Board Access</span></li>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>Real-time Group Chat</span></li>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>Basic Reporting & Analytics</span></li>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>Standard Check-In/Check-Out</span></li>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>Firebase Authentication</span></li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => handleRazorpayPayment('monthly')}
                disabled={paymentLoading === 'monthly'}
                style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid hsla(190,90%,50%,0.5)', color: paymentLoading === 'monthly' ? 'hsl(218,15%,50%)' : 'hsl(190,90%,50%)', background: 'transparent', fontWeight: '700', fontSize: '0.95rem', textAlign: 'center', transition: 'all 0.3s ease', cursor: paymentLoading === 'monthly' ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                onMouseOver={e => { if(paymentLoading !== 'monthly') e.currentTarget.style.background = 'hsla(190,90%,50%,0.1)'; }}
                onMouseOut={e => { if(paymentLoading !== 'monthly') e.currentTarget.style.background = 'transparent'; }}
              >
                {paymentLoading === 'monthly' ? '⏳ Processing...' : '💳 Pay & Get Started Monthly'}
              </button>
            </div>

            {/* Yearly Plan */}
            <div style={{
              padding: '40px 30px',
              borderRadius: '24px',
              background: 'hsla(222,22%,16%,0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid hsla(260,80%,65%,0.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'between',
              transition: 'all 0.3s ease',
              position: 'relative',
              boxShadow: '0 0 40px hsla(260,80%,65%,0.08)'
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'hsla(260,80%,65%,0.8)'; e.currentTarget.style.transform = 'translateY(-6px)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'hsla(260,80%,65%,0.4)'; e.currentTarget.style.transform = 'none'; }}
            >
              {/* Popular Badge */}
              <div style={{
                position: 'absolute', top: '-14px', right: '24px',
                background: 'linear-gradient(135deg, hsl(260,80%,65%), hsl(190,90%,50%))',
                color: '#000', fontSize: '0.7rem', fontWeight: '800',
                padding: '4px 12px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                Best Value / Save big
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'hsl(260,80%,65%)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '15px' }}>Yearly Plan</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '3rem', fontWeight: '900', color: 'hsl(220,20%,95%)' }}>
                    {currency === 'USD' ? '$2.39' : '₹199'}
                  </span>
                  <span style={{ color: 'hsl(218,15%,65%)', fontSize: '0.95rem' }}>/ year</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'hsl(218,15%,65%)', lineHeight: 1.6, marginBottom: '30px' }}>
                  Our most popular choice. One flat annual fee for unlimited access globally.
                </p>
                <div style={{ borderTop: '1px solid hsla(220,20%,25%,0.4)', paddingTop: '20px', marginBottom: '30px' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', fontSize: '0.9rem', color: 'hsl(218,15%,75%)' }}>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>Everything in Monthly Plan</span></li>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>Premium Check-In System</span></li>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>PDF Export for 30-Day Reports</span></li>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>Priority 24/7 Support</span></li>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>Advanced Analytics Dashboard</span></li>
                    <li style={{ display: 'flex', gap: '8px' }}><span>✓</span> <span>Global Multi-Role Capabilities</span></li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => handleRazorpayPayment('yearly')}
                disabled={paymentLoading === 'yearly'}
                style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', background: paymentLoading === 'yearly' ? 'hsla(220,20%,25%,0.6)' : 'linear-gradient(135deg, hsl(260,80%,65%), hsl(190,90%,50%))', border: 'none', color: paymentLoading === 'yearly' ? 'hsl(218,15%,60%)' : '#000', fontWeight: '800', fontSize: '0.95rem', textAlign: 'center', transition: 'all 0.3s ease', boxShadow: paymentLoading === 'yearly' ? 'none' : '0 0 20px hsla(260,80%,65%,0.2)', cursor: paymentLoading === 'yearly' ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                onMouseOver={e => { if(paymentLoading !== 'yearly') e.currentTarget.style.boxShadow = '0 0 30px hsla(260,80%,65%,0.4)'; }}
                onMouseOut={e => { if(paymentLoading !== 'yearly') e.currentTarget.style.boxShadow = '0 0 20px hsla(260,80%,65%,0.2)'; }}
              >
                {paymentLoading === 'yearly' ? '⏳ Processing...' : '💳 Pay & Get Started Yearly'}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 40px', borderRadius: '24px', background: 'hsla(222,22%,15%,0.8)', border: '1px solid hsla(190,90%,50%,0.2)', backdropFilter: 'blur(20px)', boxShadow: '0 0 60px hsla(190,90%,50%,0.08)' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: '800', marginBottom: '16px' }}>
            Ready to{' '}
            <span style={{ background: 'linear-gradient(135deg, hsl(190,90%,50%), hsl(260,80%,65%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Ascend?
            </span>
          </h2>
          <p style={{ color: 'hsl(218,15%,65%)', marginBottom: '36px', fontSize: '1rem', lineHeight: 1.7 }}>
            Join your team on Project Hub and transform the way you manage projects, tasks, and collaboration.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ padding: '14px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, hsl(190,90%,50%), hsl(215,90%,55%))', color: '#000', textDecoration: 'none', fontWeight: '700', fontSize: '1rem', boxShadow: '0 0 30px hsla(190,90%,50%,0.25)' }}>
              Create Free Account
            </Link>
            <Link to="/login" style={{ padding: '14px 32px', borderRadius: '12px', border: '1px solid hsla(220,20%,25%,0.8)', color: 'hsl(220,20%,95%)', textDecoration: 'none', fontWeight: '600', fontSize: '1rem', background: 'hsla(222,22%,20%,0.5)' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 40px', background: 'hsla(222,22%,11%,0.6)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: '800', marginBottom: '12px' }}>What Teams Say About Project Hub</h2>
            <p style={{ color: 'hsl(218,15%,58%)', fontSize: '1rem' }}>Real feedback from teams using the platform daily</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px' }}>
            {[
              { name: 'Arjun Mehta', role: 'CTO, TechVenture Pvt. Ltd.', avatar: 'AM', color: 'hsl(190,90%,50%)', review: 'We replaced 4 tools with Project Hub. Our team attendance tracking alone saves us 3 hours every week. The PDF reports are exactly what our clients want.', stars: 5 },
              { name: 'Priya Sharma', role: 'Project Manager, DesignCo', avatar: 'PS', color: 'hsl(260,80%,65%)', review: 'The Kanban board is incredibly smooth. I can see every task, every team member, and every deadline in one view. Setup took less than 10 minutes.', stars: 5 },
              { name: 'Ravi Kumar', role: 'Founder, Startup Labs', avatar: 'RK', color: 'hsl(40,90%,55%)', review: 'For the price — this is unbeatable. Real-time chat, task management, attendance, and reports? We were paying 3x more for less with other tools.', stars: 5 },
            ].map((t, i) => (
              <div key={i} style={{ padding: '28px', borderRadius: '18px', background: 'hsla(222,22%,15%,0.7)', border: '1px solid hsla(220,20%,25%,0.4)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '1rem', color: 'hsl(40,90%,55%)' }}>{'★'.repeat(t.stars)}</div>
                <p style={{ fontSize: '0.88rem', color: 'hsl(218,15%,72%)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>"{t.review}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid hsla(220,20%,25%,0.4)', paddingTop: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: t.color, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'hsl(220,20%,92%)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(218,15%,52%)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 40px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: '800', marginBottom: '12px' }}>Frequently Asked Questions</h2>
            <p style={{ color: 'hsl(218,15%,58%)', fontSize: '1rem' }}>Everything you need to know before getting started</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { q: 'Who is Project Hub for?', a: 'Any company or team that needs to manage projects, track employee attendance, collaborate via chat, and generate reports — startups, agencies, IT companies, and remote teams.' },
              { q: 'How many team members can I add?', a: 'Unlimited. There is no cap on team members. The admin invites members via email with secure login credentials.' },
              { q: 'Can I generate attendance reports?', a: 'Yes! You can export a full 30-day PDF attendance report with check-in/check-out times and session duration for every employee.' },
              { q: 'Is there a mobile version?', a: 'Project Hub is fully responsive and works on all modern browsers including mobile phones and tablets.' },
              { q: 'What happens after I pay?', a: 'You get instant access to the full workspace. The admin account is set up immediately — invite your team and start in minutes.' },
              { q: 'Can I contact support?', a: 'Absolutely. Use the contact form below or email us at support@stufflas.com. We typically respond within a few hours.' },
            ].map((faq, i) => (
              <div key={i} style={{ padding: '20px 24px', borderRadius: '14px', background: 'hsla(222,22%,14%,0.7)', border: '1px solid hsla(220,20%,24%,0.4)', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'hsl(220,20%,92%)', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ color: 'hsl(190,90%,50%)', flexShrink: 0 }}>Q.</span> {faq.q}
                </div>
                <div style={{ fontSize: '0.86rem', color: 'hsl(218,15%,62%)', lineHeight: 1.7, paddingLeft: '22px' }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" style={{ position: 'relative', zIndex: 1, padding: '80px 40px', background: 'hsla(222,22%,13%,0.5)' }}>
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '800', marginBottom: '16px' }}>
              Get In Touch
            </h2>
            <p style={{ color: 'hsl(218,15%,65%)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
              Have questions about pricing, features, or custom deployments? Send us a message!
            </p>
          </div>

          <div style={{
            background: 'hsla(222,22%,15%,0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsla(220,20%,25%,0.4)',
            borderRadius: '24px',
            padding: '40px 30px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="contact-name" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'hsl(220,20%,90%)' }}>Your Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Enter your name"
                    value={contactData.name}
                    onChange={e => setContactData(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      background: 'hsla(222,22%,10%,0.6)',
                      border: '1px solid hsla(220,20%,25%,0.5)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '0.9rem',
                      color: 'hsl(220,20%,95%)',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'hsl(190,90%,50%)'}
                    onBlur={e => e.target.style.borderColor = 'hsla(220,20%,25%,0.5)'}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="contact-email" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'hsl(220,20%,90%)' }}>Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="Enter your email"
                    value={contactData.email}
                    onChange={e => setContactData(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      background: 'hsla(222,22%,10%,0.6)',
                      border: '1px solid hsla(220,20%,25%,0.5)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '0.9rem',
                      color: 'hsl(220,20%,95%)',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'hsl(190,90%,50%)'}
                    onBlur={e => e.target.style.borderColor = 'hsla(220,20%,25%,0.5)'}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="contact-subject" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'hsl(220,20%,90%)' }}>Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  placeholder="What is this inquiry regarding?"
                  value={contactData.subject}
                  onChange={e => setContactData(prev => ({ ...prev, subject: e.target.value }))}
                  style={{
                    background: 'hsla(222,22%,10%,0.6)',
                    border: '1px solid hsla(220,20%,25%,0.5)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    color: 'hsl(220,20%,95%)',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'hsl(190,90%,50%)'}
                  onBlur={e => e.target.style.borderColor = 'hsla(220,20%,25%,0.5)'}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="contact-message" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'hsl(220,20%,90%)' }}>Message</label>
                <textarea
                  id="contact-message"
                  rows="5"
                  placeholder="Write your message here..."
                  value={contactData.message}
                  onChange={e => setContactData(prev => ({ ...prev, message: e.target.value }))}
                  style={{
                    background: 'hsla(222,22%,10%,0.6)',
                    border: '1px solid hsla(220,20%,25%,0.5)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    color: 'hsl(220,20%,95%)',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'hsl(190,90%,50%)'}
                  onBlur={e => e.target.style.borderColor = 'hsla(220,20%,25%,0.5)'}
                  required
                />
              </div>

              {contactStatus.text && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  background: contactStatus.type === 'success' ? 'hsla(145,75%,45%,0.15)' : 'hsla(0,85%,60%,0.15)',
                  color: contactStatus.type === 'success' ? 'hsl(145,75%,50%)' : 'hsl(0,85%,65%)',
                  border: contactStatus.type === 'success' ? '1px solid hsla(145,75%,45%,0.3)' : '1px solid hsla(0,85%,60%,0.3)'
                }}>
                  {contactStatus.text}
                </div>
              )}

              <button
                type="submit"
                disabled={contactSubmitting}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, hsl(190,90%,50%), hsl(215,90%,55%))',
                  border: 'none',
                  color: '#000',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  cursor: contactSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 0 20px hsla(190,90%,50%,0.2)',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseOver={e => { if(!contactSubmitting) e.currentTarget.style.boxShadow = '0 0 30px hsla(190,90%,50%,0.4)'; }}
                onMouseOut={e => { if(!contactSubmitting) e.currentTarget.style.boxShadow = '0 0 20px hsla(190,90%,50%,0.2)'; }}
              >
                {contactSubmitting ? 'Sending inquiry...' : 'Send Message ✉'}
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        position: 'relative',
        zIndex: 1,
        background: 'hsla(224, 28%, 8%, 0.95)',
        borderTop: '1px solid hsla(220, 20%, 22%, 0.6)',
        padding: '70px 40px 30px 40px',
        color: 'hsl(220, 20%, 85%)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          marginBottom: '50px',
          textAlign: 'left'
        }}>
          {/* Column 1: Brand Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/logo.png" alt="Project Hub Logo" style={{ height: '42px', objectFit: 'contain' }} />
              <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
                Project <span style={{ color: 'hsl(190, 90%, 50%)' }}>Hub</span>
              </span>
            </div>
            <p style={{ color: 'hsl(218, 15%, 62%)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Enterprise full-stack project management, real-time Kanban task tracking, employee attendance, and team collaboration workspace.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'hsla(190, 90%, 50%, 0.1)',
              border: '1px solid hsla(190, 90%, 50%, 0.25)',
              color: 'hsl(190, 90%, 50%)',
              fontSize: '0.8rem',
              fontWeight: '600',
              width: 'fit-content'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(145, 75%, 50%)', display: 'inline-block' }}></span>
              All Systems Operational
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', marginBottom: '18px' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              {['Features', 'Roles', 'Pricing', 'FAQ', 'Contact'].map((link, idx) => (
                <li key={idx}>
                  <a href={`#${link.toLowerCase()}`} style={{ color: 'hsl(218, 15%, 62%)', textDecoration: 'none', transition: 'color 0.2s' }}
                     onMouseOver={e => e.currentTarget.style.color = 'hsl(190, 90%, 50%)'}
                     onMouseOut={e => e.currentTarget.style.color = 'hsl(218, 15%, 62%)'}>
                    {link}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/login" style={{ color: 'hsl(190, 90%, 50%)', textDecoration: 'none', fontWeight: '600' }}>
                  Workspace Login →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Solutions & Modules */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', marginBottom: '18px' }}>Modules & Solutions</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'hsl(218, 15%, 62%)' }}>
              <li>Kanban Task Board</li>
              <li>Real-time Team Chat</li>
              <li>Attendance & Time Logs</li>
              <li>PDF & Excel Exports</li>
              <li>Firebase & Google SSO Auth</li>
            </ul>
          </div>

          {/* Column 4: Support & Contact */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', marginBottom: '18px' }}>Support & Enquiries</h4>
            <p style={{ color: 'hsl(218, 15%, 62%)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '12px' }}>
              Need help or custom deployment? Reach out to our technical team:
            </p>
            <a href="mailto:support@stufflas.com" style={{
              display: 'inline-block',
              color: 'hsl(190, 90%, 50%)',
              fontWeight: '700',
              fontSize: '0.92rem',
              textDecoration: 'none',
              marginBottom: '10px'
            }}>
              ✉ support@stufflas.com
            </a>
            <p style={{ color: 'hsl(218, 15%, 50%)', fontSize: '0.82rem', margin: 0 }}>
              Powered by <strong style={{ color: '#fff' }}>Stufflas Ecosystem</strong>
            </p>
          </div>
        </div>

        {/* BOTTOM BAR WITH DEVELOPER CREDIT */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '24px',
          borderTop: '1px solid hsla(220, 20%, 20%, 0.6)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '0.85rem',
          color: 'hsl(218, 15%, 55%)'
        }}>
          <div>
            © 2026 <strong>Project Hub</strong> (Stufflas PMS). All rights reserved.
          </div>

          <div style={{
            background: 'hsla(220, 25%, 14%, 0.8)',
            padding: '8px 18px',
            borderRadius: '20px',
            border: '1px solid hsla(190, 90%, 50%, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>Designed & Developed by</span>
            <a
              href="https://ritik-portfolio.ritikjagnit.workers.dev/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'hsl(190, 90%, 50%)',
                fontWeight: '800',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, hsl(190, 90%, 50%), hsl(215, 90%, 60%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '0.92rem',
                letterSpacing: '0.3px',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              Ritik Jagnit ✨
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
