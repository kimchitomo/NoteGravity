import React from 'react';
import { useTreeStore } from '../../store/useTreeStore';
import { X } from 'lucide-react';

const ICONS = [
  // Văn phòng & Công việc
  '📁', '📂', '📄', '📃', '📑', '📊', '📈', '📉', '📋', '📌', '📍', '📎', '💼', '💻', '🖥️', '🖨️', '🖱️', '📱', '📞', '☎️', '📠', '🔌', '🔋', '📚', '📓', '📒', '📝', '✏️', '🖋️', '✒️', '📅', '📆', '🗓️', '📇', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔑',
  // Cảm xúc & People
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '😎', '🤓', '🧐', '🥳', '😡', '🤬', '🤯', '😱', '😨', '🥶', '🥵', '🤢', '🤮', '🤧', '🤒', '🤕', '😴', '🤤', '😪', '😵',
  // Đồ vật & Khác
  '🚀', '💡', '⭐', '🔥', '✅', '❌', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '🎉', '🎊', '🎈', '🎂', '🎁', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '✈️'
];

export const IconPickerModal = () => {
  const { iconPickerNodeIds, closeIconPicker, updateNodeIcon, contextMenuPos } = useTreeStore();

  if (!iconPickerNodeIds) return null;

  const handleSelect = (icon: string) => {
    iconPickerNodeIds.forEach(id => updateNodeIcon(id, icon));
    closeIconPicker();
  };

  return (
    <div style={{
      position: 'fixed',
      top: contextMenuPos ? Math.min(contextMenuPos.y, window.innerHeight - 350) : '50%',
      left: contextMenuPos ? contextMenuPos.x : '50%',
      transform: contextMenuPos ? 'none' : 'translate(-50%, -50%)',
      backgroundColor: '#fff',
      border: '1px solid #eaeaea',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      padding: '12px',
      zIndex: 1100,
      borderRadius: '8px',
      width: '280px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>Chọn Icon</span>
        <button onClick={closeIconPicker} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
        {ICONS.map((icon, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(icon)}
            style={{
              background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer',
              padding: '4px', borderRadius: '4px', textAlign: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};
