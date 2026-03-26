import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (tab === 'dashboard') {
          const { data } = await adminAPI.getDashboard();
          setDashboard(data.data);
        } else {
          const { data } = await adminAPI.getUsers({ page, limit: 10 });
          setUsers(data.data);
          setMeta(data.meta);
        }
      } catch { toast.error('Failed to load admin data'); }
      finally { setLoading(false); }
    };
    load();
  }, [tab, page]);

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    try {
      await adminAPI.updateUser(userId, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch { toast.error('Failed to update role'); }
  };

  const toggleActive = async (userId, isActive) => {
    if (!window.confirm(`${isActive ? 'Deactivate' : 'Activate'} this user?`)) return;
    try {
      await adminAPI.updateUser(userId, { isActive: !isActive });
      toast.success(`User ${isActive ? 'deactivated' : 'activated'}`);
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: !isActive } : u));
    } catch { toast.error('Failed to update user'); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all their tasks? This cannot be undone.')) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted');
      setUsers(users.filter(u => u._id !== userId));
    } catch { toast.error('Failed to delete user'); }
  };

  const tabStyle = (t) => ({
    padding: '8px 20px', borderRadius: 'var(--radius-md)',
    cursor: 'pointer', border: 'none', fontWeight: 600, fontSize: 14,
    transition: 'all 0.2s',
    background: tab === t ? 'var(--accent)' : 'var(--bg-hover)',
    color: tab === t ? 'white' : 'var(--text-secondary)',
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ Admin Panel</h1>
          <p className="page-subtitle">Manage users and platform overview</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={tabStyle('dashboard')} onClick={() => setTab('dashboard')}>📊 Dashboard</button>
        <button style={tabStyle('users')} onClick={() => setTab('users')}>👥 Users</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : tab === 'dashboard' && dashboard ? (
        <div>
          {/* Top Stats */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{dashboard.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card success">
              <div className="stat-icon">📋</div>
              <div className="stat-value">{dashboard.totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            {Object.entries(dashboard.tasksByStatus).map(([status, count]) => (
              <div key={status} className="stat-card">
                <div className="stat-icon">
                  {status === 'completed' ? '✅' : status === 'in-progress' ? '⚡' : status === 'archived' ? '📦' : '○'}
                </div>
                <div className="stat-value">{count}</div>
                <div className="stat-label">{status.replace('-', ' ')}</div>
              </div>
            ))}
          </div>

          {/* Recent Users */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Registrations</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentUsers.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {format(new Date(u.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td>
                        <span className={`badge`} style={{
                          background: u.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: u.isActive ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : tab === 'users' ? (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td>
                      <span className="badge" style={{
                        background: u.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: u.isActive ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td>
                      {u._id !== currentUser._id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            title={`Make ${u.role === 'admin' ? 'user' : 'admin'}`}
                            onClick={() => toggleRole(u._id, u.role)}
                          >{u.role === 'admin' ? '👤' : '🛡️'}</button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleActive(u._id, u.isActive)}
                          >{u.isActive ? '🔒' : '🔓'}</button>
                          <button
                            className="btn btn-danger btn-sm"
                            title="Delete"
                            onClick={() => deleteUser(u._id)}
                          >🗑️</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>You</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="page-info">Page {meta.page} of {meta.totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
