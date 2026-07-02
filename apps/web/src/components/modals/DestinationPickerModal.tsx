import React, { useState } from 'react';
import { useTreeStore, TreeNode } from '../../store/useTreeStore';
import { X } from 'lucide-react';

export const DestinationPickerModal = () => {
  const { destinationModalData, closeDestinationModal, moveNodesTo, copyNodesTo, data, expandedIds } = useTreeStore();
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  
  const [localExpandedIds, setLocalExpandedIds] = useState<Set<string>>(new Set(expandedIds));
  
  // Initialize with the original action from context menu
  const [isCopy, setIsCopy] = useState(destinationModalData?.action === 'copy');

  if (!destinationModalData) return null;

  const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const isMovingOnlyNotes = destinationModalData.ids.every(id => {
    const n = findNode(data, id);
    return n && n.type === 'note';
  });

  const handleConfirm = () => {
    if (!selectedParentId) return;
    if (isCopy) {
      copyNodesTo(destinationModalData.ids, selectedParentId);
    } else {
      moveNodesTo(destinationModalData.ids, selectedParentId);
    }
    closeDestinationModal();
  };

  const renderFolder = (node: TreeNode, level = 0) => {
    // Cannot move a node into itself
    if (destinationModalData.ids.includes(node.id)) return null;

    const isSelected = selectedParentId === node.id;
    const isNote = node.type === 'note';
    const canSelect = isMovingOnlyNotes || !isNote;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = localExpandedIds.has(node.id);

    const toggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      setLocalExpandedIds(prev => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
    };

    return (
      <div key={node.id} style={{ marginLeft: level * 16 }}>
        <div 
          onClick={() => { if (canSelect) setSelectedParentId(node.id) }}
          title={!canSelect ? "Không thể chọn ghi chú làm đích đến" : ""}
          style={{
            padding: '4px 8px', cursor: !canSelect ? 'default' : 'pointer', borderRadius: '4px',
            backgroundColor: isSelected ? 'var(--hover-bg, #e0f2fe)' : 'transparent',
            display: 'flex', alignItems: 'center', gap: '8px',
            opacity: !canSelect ? 0.6 : 1,
            color: 'var(--text-color)'
          }}
        >
          <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
            {hasChildren && (
              <span 
                onClick={toggleExpand}
                style={{ fontSize: '10px', opacity: 0.6, cursor: 'pointer', padding: '2px' }}
              >
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
          </div>
          <span style={{ opacity: 0.8 }}>{node.customIcon || (isNote ? '📄' : '📁')}</span>
          <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.title}</span>
        </div>
        {isExpanded && node.children?.map(child => renderFolder(child, level + 1))}
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
        backgroundColor: 'var(--bg-color)', borderRadius: '8px', padding: '16px',
        width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center', color: 'var(--text-color)' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>
            {isCopy ? 'Sao chép tới' : 'Di chuyển tới'}
          </h3>
          <button onClick={closeDestinationModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', backgroundColor: 'var(--bg-color)' }}>
          {data.map(node => renderFolder(node))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', color: 'var(--text-color)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
            <input type="checkbox" checked={isCopy} onChange={(e) => setIsCopy(e.target.checked)} />
            Chỉ sao chép
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={closeDestinationModal} style={{ padding: '6px 12px', background: 'var(--hover-bg, #f5f5f5)', color: 'var(--text-color)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
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
    </div>
  );
};
