import React, { useState, useMemo } from 'react';
import { useTreeStore } from '../../store/useTreeStore';
import { X, Search } from 'lucide-react';
import { EMOJIS } from '../../data/emojis';

// Helper to ignore case and accents
function removeAccents(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export const IconPickerModal = () => {
  const { iconPickerNodeIds, closeIconPicker, updateNodeIcon, contextMenuPos } = useTreeStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = useMemo(() => {
    if (!searchTerm) return EMOJIS;
    const term = removeAccents(searchTerm);
    return EMOJIS.filter(e => removeAccents(e.keywords).includes(term));
  }, [searchTerm]);

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
      width: '300px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>Chọn Icon</span>
        <button onClick={closeIconPicker} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', padding: '4px 8px', marginBottom: '12px' }}>
        <Search size={14} style={{ color: '#888', marginRight: '6px' }} />
        <input 
          autoFocus
          type="text" 
          placeholder="Tìm kiếm tiếng Việt..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
        {filteredIcons.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(item.char)}
            title={item.keywords}
            style={{
              background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
              padding: '6px 4px', borderRadius: '4px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {item.char}
          </button>
        ))}
        {filteredIcons.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#888', fontSize: '13px' }}>
            Không tìm thấy icon nào
          </div>
        )}
      </div>
    </div>
  );
};
