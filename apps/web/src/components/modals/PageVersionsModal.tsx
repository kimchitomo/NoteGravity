import React from 'react';
import ReactDOM from 'react-dom';
import { History, RotateCcw, X, Clock } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useTreeStore } from '../../store/useTreeStore';

interface PageVersionsModalProps {
  onClose: () => void;
}

export const PageVersionsModal: React.FC<PageVersionsModalProps> = ({ onClose }) => {
  const activeNoteId = useWorkspaceStore(state => state.activeNoteId);
  const { past } = useCanvasStore();
  const { data: treeData } = useTreeStore();

  const versions = activeNoteId ? (past[activeNoteId] || []) : [];

  const formatDate = (index: number) => {
    // Estimate timestamp based on index (most recent last)
    const now = Date.now();
    const estimated = now - (versions.length - 1 - index) * 60000; // 1 min apart estimate
    return new Date(estimated).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const handleRestore = (versionIndex: number) => {
    if (!activeNoteId) return;
    const version = versions[versionIndex];
    if (!version) return;
    if (!window.confirm('Khôi phục về phiên bản này? Trạng thái hiện tại sẽ được lưu vào lịch sử.')) return;

    useCanvasStore.setState(state => {
      const currentPage = state.pages[activeNoteId];
      const docPast = state.past[activeNoteId] || [];
      return {
        pages: { ...state.pages, [activeNoteId]: version },
        past: { ...state.past, [activeNoteId]: [...docPast, currentPage].slice(-50) },
        future: { ...state.future, [activeNoteId]: [] }
      };
    });
    onClose();
  };

  const modal = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: 540, maxWidth: '92vw', maxHeight: '75vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={18} color="#f59e0b" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>Lịch Sử Phiên Bản</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{versions.length} phiên bản được lưu trong phiên này</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 6, borderRadius: 8, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {versions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
              <Clock size={48} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
              <p style={{ fontSize: 15, fontWeight: 500 }}>Chưa có lịch sử</p>
              <p style={{ fontSize: 13 }}>Lịch sử được tạo tự động khi bạn chỉnh sửa trang</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Phiên bản hiện tại */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '2px solid #3b82f6', backgroundColor: '#eff6ff' }}>
                <Clock size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1d4ed8' }}>Phiên bản hiện tại</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Đang hoạt động</div>
                </div>
                <span style={{ fontSize: 11, backgroundColor: '#3b82f6', color: '#fff', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>Hiện tại</span>
              </div>

              {/* Các phiên bản cũ (mới nhất trước) */}
              {[...versions].reverse().map((version, i) => {
                const realIndex = versions.length - 1 - i;
                return (
                  <div key={realIndex} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid #f3f4f6', backgroundColor: '#fafafa' }}>
                    <History size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                        Phiên bản {realIndex + 1}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        {version.containers?.length || 0} khung · {version.strokes?.length || 0} nét vẽ
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestore(realIndex)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, flexShrink: 0 }}
                    >
                      <RotateCcw size={13} /> Khôi phục
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
            💡 Lịch sử được lưu trong bộ nhớ phiên làm việc hiện tại. Tối đa 50 phiên bản.
          </p>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};
