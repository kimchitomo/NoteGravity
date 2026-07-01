import React, { useState } from 'react';
import { useTreeStore, TreeNode } from '../../store/useTreeStore';
import { X } from 'lucide-react';

export const DestinationPickerModal = () => {
  const { destinationModalData, closeDestinationModal, moveNodeTo, copyNodeTo, data } = useTreeStore();
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  if (!destinationModalData) return null;

  const handleConfirm = () => {
    if (!selectedParentId) return;
    if (destinationModalData.action === 'move') {
      moveNodeTo(destinationModalData.id, selectedParentId);
    } else {
      copyNodeTo(destinationModalData.id, selectedParentId);
    }
    closeDestinationModal();
  };

  const renderFolder = (node: TreeNode, level = 0) => {
    if (node.type !== 'notebook') return null; // Only pick folders
    // Cannot move a node into itself
    if (node.id === destinationModalData.id) return null;

    const isSelected = selectedParentId === node.id;
    return (
      <div key={node.id} style={{ marginLeft: level * 16 }}>
        <div 
          onClick={() => setSelectedParentId(node.id)}
          style={{
            padding: '4px 8px', cursor: 'pointer', borderRadius: '4px',
            backgroundColor: isSelected ? '#e0f2fe' : 'transparent',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <span>📁</span>
          <span>{node.title}</span>
        </div>
        {node.children?.map(child => renderFolder(child, level + 1))}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '8px', padding: '16px',
        width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>
            {destinationModalData.action === 'move' ? 'Di chuyển tới' : 'Sao chép tới'}
          </h3>
          <button onClick={closeDestinationModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', border: '1px solid #eaeaea', borderRadius: '6px', padding: '8px' }}>
          {data.map(node => renderFolder(node))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button onClick={closeDestinationModal} style={{ padding: '6px 12px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
          <button 
            onClick={handleConfirm} 
            disabled={!selectedParentId}
            style={{ padding: '6px 12px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: selectedParentId ? 'pointer' : 'not-allowed', opacity: selectedParentId ? 1 : 0.5 }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};
