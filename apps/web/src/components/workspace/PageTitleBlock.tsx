import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { SpeechRecognitionModal } from '../modals/SpeechRecognitionModal';

interface PageTitleBlockProps {
  title: string;
  createdAt?: number;
  onTitleChange: (newTitle: string) => void;
}

export const PageTitleBlock: React.FC<PageTitleBlockProps> = ({ title, createdAt, onTitleChange }) => {
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  
  const dateStr = createdAt ? new Date(createdAt).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('vi-VN');
  const timeStr = createdAt ? new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('vi-VN');

  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px', 
        width: '800px', 
        maxWidth: 'calc(100% - 40px)',
        padding: '0', 
        backgroundColor: 'transparent',
        zIndex: 10
      }}
      onClick={(e) => e.stopPropagation()} // Prevent creating a new note container when clicking here
    >
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
        <button
          onClick={() => setShowVoiceModal(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          title="Nhập tiêu đề bằng giọng nói"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Mic size={18} />
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Page Title"
          style={{
            fontSize: '16px',
            fontWeight: '500',
            fontFamily: 'Inter, "Segoe UI", sans-serif',
            letterSpacing: 'normal',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            flex: 1,
            color: 'var(--text-color, #111827)',
            padding: '0', 
            margin: '0',
            lineHeight: '1.4'
          }}
        />
      </div>
      
      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#6b7280', marginTop: '2px', marginLeft: '26px' }}>
        <span>{dateStr}</span>
        <span>{timeStr}</span>
      </div>
      
      {/* Date line separator like OneNote */}
      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0', width: '100%' }} />

      {showVoiceModal && (
        <SpeechRecognitionModal
          initialText={title}
          onClose={() => setShowVoiceModal(false)}
          onApply={(newText) => {
            onTitleChange(newText);
            setShowVoiceModal(false);
          }}
        />
      )}
    </div>
  );
};
