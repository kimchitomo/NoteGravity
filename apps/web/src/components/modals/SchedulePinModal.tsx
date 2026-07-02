import React, { useState, useEffect } from 'react';
import { useTreeStore, PinScheduleItem } from '../../store/useTreeStore';
import { X, Clock, Edit2, Save } from 'lucide-react';

export const SchedulePinModal = () => {
  const { schedulePinModalNodeIds, closeSchedulePinModal, startPinSchedule, data } = useTreeStore();
  
  const [minutes, setMinutes] = useState(30);
  const [scheduleItems, setScheduleItems] = useState<PinScheduleItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Local edit states
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');

  useEffect(() => {
    if (schedulePinModalNodeIds && schedulePinModalNodeIds.length > 0) {
      // Calculate initial timeline
      const now = Date.now();
      const intervalMs = minutes * 60 * 1000;
      const initialItems: PinScheduleItem[] = schedulePinModalNodeIds.map((id, index) => {
        return {
          id,
          startTime: now + (index * intervalMs),
          endTime: now + ((index + 1) * intervalMs)
        };
      });
      setScheduleItems(initialItems);
    }
  }, [schedulePinModalNodeIds, minutes]);

  if (!schedulePinModalNodeIds) return null;

  const handleStart = () => {
    if (scheduleItems.length > 0) {
      startPinSchedule(scheduleItems);
    }
    closeSchedulePinModal();
  };

  const findNodeTitle = (nodes: any[], id: string): string | null => {
    for (const n of nodes) {
      if (n.id === id) return n.title;
      if (n.children) {
        const found = findNodeTitle(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
  };

  const toInputString = (ts: number) => {
    // format to YYYY-MM-DDTHH:mm
    const d = new Date(ts);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const handleEditClick = (item: PinScheduleItem) => {
    setEditingId(item.id);
    setEditStartTime(toInputString(item.startTime));
    setEditEndTime(toInputString(item.endTime));
  };

  const handleSaveEdit = (id: string) => {
    setScheduleItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          startTime: new Date(editStartTime).getTime(),
          endTime: new Date(editEndTime).getTime()
        };
      }
      return item;
    }));
    setEditingId(null);
  };

  const selectedCount = schedulePinModalNodeIds.length;
  
  let globalStart = scheduleItems.length > 0 ? Math.min(...scheduleItems.map(i => i.startTime)) : 0;
  let globalEnd = scheduleItems.length > 0 ? Math.max(...scheduleItems.map(i => i.endTime)) : 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-color)', borderRadius: '8px', padding: '24px',
        width: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        position: 'relative', color: 'var(--text-color)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        <button 
          onClick={closeSchedulePinModal}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0066cc', marginBottom: '16px' }}>
          <Clock size={24} />
          <h3 style={{ margin: 0, fontSize: '18px' }}>Lên lịch ghim chi tiết</h3>
        </div>

        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', opacity: 0.8 }}>
            Bạn đã chọn <strong>{selectedCount}</strong> ghi chú.
          </p>

          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--hover-bg, #f5f5f5)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span><strong>Bắt đầu:</strong> {globalStart ? formatTime(globalStart) : '--'}</span>
              <span><strong>Kết thúc:</strong> {globalEnd ? formatTime(globalEnd) : '--'}</span>
            </div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
              Thời gian mặc định mỗi mục (phút):
            </label>
            <input 
              type="number" 
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              style={{ 
                width: '100%', padding: '8px', border: '1px solid var(--border-color)', 
                borderRadius: '6px', boxSizing: 'border-box', backgroundColor: 'var(--bg-color)', color: 'inherit'
              }}
            />
          </div>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px', fontSize: '13px' }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>Danh sách sẽ ghim:</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scheduleItems.map(item => {
                const isEditing = editingId === item.id;
                return (
                  <div key={item.id} style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--hover-bg, #fafafa)' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                        {findNodeTitle(data, item.id) || 'Unknown'}
                      </span>
                      {isEditing ? (
                        <button onClick={() => handleSaveEdit(item.id)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#10b981', display: 'flex' }} title="Lưu">
                          <Save size={14} />
                        </button>
                      ) : (
                        <button onClick={() => handleEditClick(item)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#0066cc', display: 'flex' }} title="Sửa thời gian">
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '30px', fontSize: '12px' }}>Từ:</span>
                          <input type="datetime-local" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} style={{ flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '30px', fontSize: '12px' }}>Đến:</span>
                          <input type="datetime-local" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} style={{ flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#666', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '10px' }}>{formatTime(item.startTime)}</span>
                        <span>-</span>
                        <span style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '10px' }}>{formatTime(item.endTime)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={closeSchedulePinModal}
            style={{
              flex: 1, padding: '10px', backgroundColor: 'transparent',
              color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Hủy
          </button>
          <button 
            onClick={handleStart}
            style={{
              flex: 1, padding: '10px', backgroundColor: '#0066cc',
              color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Bắt đầu ghim
          </button>
        </div>
      </div>
    </div>
  );
};
