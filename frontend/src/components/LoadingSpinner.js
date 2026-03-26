import React from 'react';

export default function LoadingSpinner({ fullPage = true }) {
  if (fullPage) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading...</p>
      </div>
    );
  }
  return <div className="spinner" style={{ margin: '40px auto' }}></div>;
}
