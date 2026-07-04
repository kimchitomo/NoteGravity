import React from 'react';
import ReactDOM from 'react-dom';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { useTreeStore } from '../../store/useTreeStore';

interface RecycleBinModalProps {
  onClose: () => void;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({ onClose }) => {
  const { deletedNodes, restoreNode, permanentlyDelete } = useTreeStore();

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const modal = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: 560, maxWidth: '92vw', maxHeight: '75vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={18} color="#ef4444" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>Thùng Rác</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{deletedNodes.length} mục đã xóa</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 6, borderRadius: 8, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {deletedNodes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
              <Trash2 size={48} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
              <p style={{ fontSize: 15, fontWeight: 500 }}>Thùng rác trống</p>
              <p style={{ fontSize: 13 }}>Các ghi chú đã xóa sẽ hiển thị ở đây</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...deletedNodes].reverse().map((entry) => (
                <div key={entry.node.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid #f3f4f6', backgroundColor: '#fafafa' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.node.customIcon && <span style={{ marginRight: 6 }}>{entry.node.customIcon}</span>}
                      {entry.node.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {entry.node.type === 'notebook' ? '📁 Notebook' : '📄 Ghi chú'} · Đã xóa {formatDate(entry.deletedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => restoreNode(entry.node.id)}
                    title="Khôi phục"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', color: '#059669', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, flexShrink: 0 }}
                  >
                    <RotateCcw size={13} /> Khôi phục
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Xóa vĩnh viễn "${entry.node.title}"? Không thể hoàn tác!`)) {
                        permanentlyDelete(entry.node.id);
                      }
                    }}
                    title="Xóa vĩnh viễn"
                    style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', backgroundColor: 'transparent', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {deletedNodes.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} color="#f59e0b" />
            <span style={{ fontSize: 12, color: '#6b7280' }}>Xóa vĩnh viễn sẽ không thể khôi phục. Dữ liệu nội dung vẫn trong localStorage cho đến khi dọn dẹp.</span>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};
