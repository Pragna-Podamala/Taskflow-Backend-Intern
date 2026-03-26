import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U';

  return (
    <div className="app-layout">
      {/* Mobile Toggle */}
      <button
        className="btn btn-ghost btn-icon"
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 200, display: 'none' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >☰</button>

      {/* Sidebar */}
      <aside className="sidebar" style={mobileOpen ? { transform: 'translateX(0)' } : {}}>
        <div className="sidebar-logo">
          <div className="logo-mark">T</div>
          <span className="logo-text">TaskFlow</span>
        </div>

        <span className="nav-section-label">Navigation</span>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📊</span> Dashboard
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">✅</span> My Tasks
        </NavLink>

        {isAdmin && (
          <>
            <span className="nav-section-label">Admin</span>
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">🛡️</span> Admin Panel
            </NavLink>
          </>
        )}

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-link" style={{ marginTop: 4, color: 'var(--danger)' }}>
            <span className="nav-icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
