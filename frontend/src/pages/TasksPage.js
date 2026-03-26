import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format, isPast, isBefore, addDays } from 'date-fns';

const STATUSES = ['todo', 'in-progress', 'completed', 'archived'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function TaskModal({ task, onClose, onSaved }) {
  const isEdit = !!task?._id;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    tags: task?.tags?.join(', ') || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || undefined,
      };
      if (isEdit) {
        await tasksAPI.update(task._id, payload);
        toast.success('Task updated ✓');
      } else {
        await tasksAPI.create(payload);
        toast.success('Task created ✓');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const mapped = {};
        apiErrors.forEach(e => { mapped[e.field] = e.message; });
        setErrors(mapped);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '✏️ Edit Task' : '➕ New Task'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Task title..."
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Optional description..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input
                className="form-input"
                placeholder="design, bug, feature"
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ Saving...' : isEdit ? '✓ Save Changes' : '+ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 12, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.data);
      setMeta(data.meta);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(id);
      toast.success('Task deleted');
      fetchTasks();
    } catch { toast.error('Failed to delete task'); }
  };

  const handleStatusToggle = async (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await tasksAPI.update(task._id, { status: nextStatus });
      toast.success(nextStatus === 'completed' ? '✅ Marked complete!' : 'Reopened');
      fetchTasks();
    } catch { toast.error('Failed to update status'); }
  };

  const getDueClass = (dueDate, status) => {
    if (!dueDate || status === 'completed' || status === 'archived') return '';
    const due = new Date(dueDate);
    if (isPast(due)) return 'due-overdue';
    if (isBefore(due, addDays(new Date(), 3))) return 'due-soon';
    return '';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{meta.total ?? '—'} tasks total</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
          + New Task
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="form-input search-input"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
        </select>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.priority}
          onChange={e => setFilters({ ...filters, priority: e.target.value, page: 1 })}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filters.status || filters.priority || filters.search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '', search: '', page: 1 })}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 className="empty-title">No tasks found</h3>
          <p className="empty-text">
            {filters.search || filters.status || filters.priority
              ? 'Try adjusting your filters'
              : 'Create your first task to get started'}
          </p>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
            + Create Task
          </button>
        </div>
      ) : (
        <div className="tasks-grid">
          {tasks.map(task => (
            <div key={task._id} className="task-card">
              <div className="task-card-header">
                <div style={{ flex: 1 }}>
                  <span className={`badge badge-${task.priority}`} style={{ marginBottom: 6, display: 'inline-flex' }}>
                    {task.priority}
                  </span>
                  <h3 className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}>
                    {task.title}
                  </h3>
                </div>
                <div className="task-actions">
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Edit"
                    onClick={() => { setEditTask(task); setShowModal(true); }}
                  >✏️</button>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Delete"
                    onClick={() => handleDelete(task._id)}
                  >🗑️</button>
                </div>
              </div>

              {task.description && (
                <p className="task-description">
                  {task.description.slice(0, 100)}{task.description.length > 100 ? '…' : ''}
                </p>
              )}

              {task.tags?.length > 0 && (
                <div className="task-tags">
                  {task.tags.map(t => <span key={t} className="tag">#{t}</span>)}
                </div>
              )}

              <div className="task-meta" style={{ marginTop: 14 }}>
                <span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span>

                {task.dueDate && (
                  <span className={getDueClass(task.dueDate, task.status)} style={{ fontSize: 12 }}>
                    📅 {format(new Date(task.dueDate), 'MMM d')}
                  </span>
                )}

                <button
                  className={`btn btn-sm ${task.status === 'completed' ? 'btn-secondary' : 'btn-success'}`}
                  style={{ marginLeft: 'auto' }}
                  onClick={() => handleStatusToggle(task)}
                >
                  {task.status === 'completed' ? 'Reopen' : '✓ Complete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={filters.page <= 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
          >← Prev</button>
          <span className="page-info">Page {meta.page} of {meta.totalPages}</span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={filters.page >= meta.totalPages}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
          >Next →</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSaved={fetchTasks}
        />
      )}
    </div>
  );
}
