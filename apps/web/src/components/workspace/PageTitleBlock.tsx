import React from 'react';

interface PageTitleBlockProps {
  title: string;
  createdAt?: number;
  onTitleChange: (newTitle: string) => void;
}

export const PageTitleBlock: React.FC<PageTitleBlockProps> = ({ title, createdAt, onTitleChange }) => {
  const dateStr = createdAt ? new Date(createdAt).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('vi-VN');
  const timeStr = createdAt ? new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('vi-VN');

  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '800px', 
        padding: '30px 40px 10px 40px',
        backgroundColor: 'transparent'
      }}
      onClick={(e) => e.stopPropagation()} // Prevent creating a new note container when clicking here
    >
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Page Title"
        style={{
          fontSize: '28px',
          fontWeight: 300, // OneNote uses a light font weight for titles
          fontFamily: 'Inter, "Segoe UI", sans-serif',
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          width: '100%',
          color: 'var(--text-color, #111827)',
          paddingBottom: '4px'
        }}
      />
      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#6b7280', marginTop: '4px', marginLeft: '2px' }}>
        <span>{dateStr}</span>
        <span>{timeStr}</span>
      </div>
      
      {/* Date line separator like OneNote */}
      <div style={{ height: '1px', backgroundColor: '#e5e7eb', marginTop: '12px', width: '100%' }} />
    </div>
  );
};
