import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({ checkedIn: false, checkInTime: null, checkOutTime: null });

  useEffect(() => {
    if (token) {
      // Validate token and fetch profile
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setUser(data);
          // Load attendance status
          fetchTodayAttendance();
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch('/api/team/attendance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const logs = await response.json();
          const today = new Date().toISOString().split('T')[0];
          const todayLog = logs.find(l => l.date === today);
          if (todayLog) {
            setAttendance({
              checkedIn: !todayLog.check_out,
              checkInTime: todayLog.check_in,
              checkOutTime: todayLog.check_out
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.message || `Login failed: ${response.statusText || response.status}`);
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const loginWithToken = (tokenData, userData) => {
    localStorage.setItem('token', tokenData);
    setToken(tokenData);
    setUser(userData);
  };

  const registerUser = async (username, email, password, role) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, email, password, role })
      });
      
      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.message || `Registration failed: ${response.statusText || response.status}`);
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setAttendance({ checkedIn: false, checkInTime: null, checkOutTime: null });
  };

  const logAttendanceAction = async (action) => {
    if (!token) return;
    try {
      const response = await fetch('/api/team/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (response.ok) {
        const data = await response.json();
        if (action === 'check_in') {
          setAttendance({ checkedIn: true, checkInTime: data.check_in, checkOutTime: null });
        } else {
          setAttendance(prev => ({ ...prev, checkedIn: false, checkOutTime: data.check_out }));
        }
      }
    } catch (err) {
      console.error('Error logging attendance action:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, registerUser, attendance, logAttendanceAction, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
