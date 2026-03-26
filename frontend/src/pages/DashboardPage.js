import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, isAfter, isBefore, addDays } from 'date-fns';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          tasksAPI.getStats(),
          tasksAPI.getAll({ limit: 5, sortBy: 'createdAt', order: 'desc' }),
        ]);
        setStats(statsRes.data.data);
        setRecentTasks(tasksRes.data.data);
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const byStatus = stats?.byStatus || {};
  const totalTasks = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const statCards = [
    { label: 'Total Tasks', value: totalTasks, icon: '📋', variant: '' },
    { label: 'Completed', value: byStatus.completed || 0, icon: '✅', variant: 'success' },
    { label: 'In Progress', value: byStatus['in-progress'] || 0, icon: '⚡', variant: '' },
    { label: 'Overdue', value: stats?.overdue || 0, icon: '⚠️', variant: 'danger' },
  ];

  const priorityBars = [
    { label: 'Urgent', count: stats?.byPriority?.urgent || 0, color: 'var(--priority-urgent)' },
    { label: 'High', count: stats?.byPriority?.high || 0, color: 'var(--priority-high)' },
    { label: 'Medium', count: stats?.byPriority?.medium || 0, color: 'var(--priority-medium)' },
    { label: 'Low', count: stats?.byPriority?.low || 0, color: 'var(--priority-low)' },
  ];
  const maxPriority = Math.max(...priorityBars.map(p => p.count), 1);

  const getStatusClass = (status) => {
    const map = { todo: 'badge-todo', 'in-progress': 'badge-in-progress', completed: 'badge-completed', archived: 'badge-archived' };
    return map[status] || 'badge-todo';
  };

  const getDueInfo = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    if (isBefore(due, now)) return { text: 'Overdue', cls: 'due-overdue' };
    if (isBefore(due, addDays(now, 3))) return { text: 'Due soon', cls: 'due-soon' };
    return { text: format(due, 'MMM d'), cls: '' };
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good to see you, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM do yyyy')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
          + New Task
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className={`stat-card ${s.variant}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Priority Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Tasks by Priority</h3>
          {priorityBars.map(p => (
            <div key={p.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: p.color, fontWeight: 600 }}>{p.label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{p.count}</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, background: p.color,
                  width: `${(p.count / maxPriority) * 100}%`,
                  transition: 'width 0.6s ease'
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Status Summary */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Status Overview</h3>
          {[
            { key: 'todo', label: 'To Do', icon: '○' },
            { key: 'in-progress', label: 'In Progress', icon: '◑' },
            { key: 'completed', label: 'Completed', icon: '●' },
            { key: 'archived', label: 'Archived', icon: '▪' },
          ].map(s => (
            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.icon} {s.label}</span>
              <span className={`badge badge-${s.key}`}>{byStatus[s.key] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Tasks</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View all →</button>
        </div>

        {recentTasks.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <div className="empty-icon">📭</div>
            <p className="empty-title">No tasks yet</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/tasks')}>Create your first task</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map(task => {
                  const due = getDueInfo(task.dueDate);
                  return (
                    <tr key={task._id} style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
                      <td>
                        <span style={{ fontWeight: 500 }}>{task.title}</span>
                        {task.description && (
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}
                          </p>
                        )}
                      </td>
                      <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td>
                        {due ? <span className={`task-meta ${due.cls}`} style={{ fontSize: 12 }}>{due.text}</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
