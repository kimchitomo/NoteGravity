import React, { useState } from 'react';
import { useTreeStore } from '../../store/useTreeStore';
import { RotateCcw, X, Globe, FileText, Clock } from 'lucide-react';

interface RecentEditsModalProps {
  onClose: () => void;
}

export const RecentEditsModal: React.FC<RecentEditsModalProps> = ({ onClose }) => {
  const actionLog = useTreeStore(state => state.actionLog);
  const restoreSnapshot = useTreeStore(state => state.restoreSnapshot);

  const handleUndo = (snapshot: any, mode: 'global' | 'local', targetDocId?: string) => {
    if (!snapshot) {
      alert("Không tìm thấy dữ liệu khôi phục cho hành động này.");
      return;
    }
    const confirmMsg = mode === 'global' 
      ? "CẢNH BÁO: Bạn đang chọn Hoàn tác Toàn cục (Global). Toàn bộ cấu trúc cây thư mục và nội dung tất cả các file sẽ bị quay ngược về thời điểm này. Bạn có chắc chắn muốn tiếp tục?"
      : "Bạn đang chọn Hoàn tác Cục bộ (Local). Chỉ nội dung của file này sẽ được quay ngược về thời điểm trước đó. Các file khác không bị ảnh hưởng. Tiếp tục?";
      
    if (window.confirm(confirmMsg)) {
      restoreSnapshot(snapshot, mode, targetDocId);
      alert("Đã hoàn tác thành công!");
      onClose();
    }
  };

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={modalStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Lịch sử thao tác (Time Travel)</h2>
          </div>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>

        <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          {actionLog.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
              Chưa có thao tác nào được thực hiện gần đây.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {actionLog.map((log, index) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString('vi-VN');
                const canLocalUndo = log.docId && log.snapshot;
                const canGlobalUndo = !!log.snapshot;

                return (
                  <div key={log.id} style={logItemStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                          {timeStr}
                        </span>
                        <strong style={{ fontSize: '14px', color: '#111827' }}>{log.action}</strong>
                      </div>
                      <div style={{ fontSize: '13px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={14} />
                        {log.noteTitle}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                      {canLocalUndo && (
                        <button 
                          onClick={() => handleUndo(log.snapshot, 'local', log.docId)}
                          style={{...undoBtnStyle, backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe'}}
                          title="Hoàn tác chỉ áp dụng cho file này"
                        >
                          <RotateCcw size={14} />
                          Undo File
                        </button>
                      )}
                      {canGlobalUndo && (
                        <button 
                          onClick={() => handleUndo(log.snapshot, 'global')}
                          style={{...undoBtnStyle, backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca'}}
                          title="Hoàn tác toàn bộ Workspace về thời điểm này"
                        >
                          <Globe size={14} />
                          Undo All
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(2px)'
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '600px',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  overflow: 'hidden'
};

const headerStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#f9fafb'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#6b7280',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px'
};

const logItemStyle: React.CSSProperties = {
  padding: '12px 16px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#ffffff',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
};

const undoBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s',
};
