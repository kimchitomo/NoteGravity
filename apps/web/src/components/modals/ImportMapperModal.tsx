import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, ChevronRight, ChevronDown, Check, AlertTriangle, Paperclip } from 'lucide-react';
import { ImportNode } from '../../utils/importParser';

export type ImportTarget = 'notebook' | 'note' | 'content' | 'content-cascade' | 'content-sibling-cascade' | 'content-prev' | 'content-prev-cascade' | 'ignore';

export interface ImportRule {
  id: string;
  field: 'level' | 'title' | 'attachment' | 'elementType';
  operator: 'eq' | 'gt' | 'lt' | 'contains' | 'has' | 'in';
  value: string;
  target: ImportTarget;
  formatStr?: string;
}

interface ImportMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ImportNode[];
  onImport: (rules: ImportRule[]) => void;
}

export const ImportMapperModal: React.FC<ImportMapperModalProps> = ({ isOpen, onClose, data, onImport }) => {
  const [rules, setRules] = useState<ImportRule[]>([
    { id: '1', field: 'level', operator: 'eq', value: '1', target: 'notebook' },
    { id: '2', field: 'level', operator: 'gt', value: '1', target: 'content-prev-cascade' },
  ]);

  if (!isOpen) return null;

  const addRule = () => {
    setRules([...rules, { id: Math.random().toString(), field: 'level', operator: 'eq', value: '', target: 'content' }]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const updateRule = (id: string, updates: Partial<ImportRule>) => {
    setRules(rules.map(r => {
      if (r.id !== id) return r;
      const newRule = { ...r, ...updates };
      // Tự động reset operator nếu thay đổi field
      if (updates.field && updates.field !== r.field) {
        if (updates.field === 'level') newRule.operator = 'eq';
        if (updates.field === 'title') newRule.operator = 'contains';
        if (updates.field === 'attachment') newRule.operator = 'has';
        newRule.value = '';
      }
      return newRule;
    }));
  };

  const evaluateNode = (node: ImportNode): { target: ImportTarget, rule?: ImportRule } => {
    for (const rule of rules) {
      let isMatch = false;
      if (rule.field === 'elementType') {
        if (rule.operator === 'eq' && node.elementType === rule.value.trim()) isMatch = true;
        if (rule.operator === 'in') {
          const vals = rule.value.split(',').map(s => s.trim());
          if (vals.includes(node.elementType || '')) isMatch = true;
        }
      } else if (rule.field === 'level') {
        if (rule.operator === 'in') {
           const vals = rule.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
           if (vals.includes(node.level)) isMatch = true;
        } else {
           const v = parseInt(rule.value, 10);
           if (!isNaN(v)) {
             if (rule.operator === 'eq' && node.level === v) isMatch = true;
             if (rule.operator === 'gt' && node.level > v) isMatch = true;
             if (rule.operator === 'lt' && node.level < v) isMatch = true;
           }
        }
      } else if (rule.field === 'title') {
        if (rule.operator === 'contains' && node.title.toLowerCase().includes(rule.value.toLowerCase())) isMatch = true;
        if (rule.operator === 'eq' && node.title === rule.value) isMatch = true;
      } else if (rule.field === 'attachment') {
        if (rule.operator === 'has' && node.attachments && node.attachments.length > 0) isMatch = true;
      }
      if (isMatch) return { target: rule.target, rule };
    }
    return { target: 'note' };
  };

  const renderPreviewNode = (node: ImportNode) => {
    const { target } = evaluateNode(node);
    const targetColor = target === 'notebook' ? '#10b981' : target === 'note' ? '#3b82f6' : target.startsWith('content') ? '#8b5cf6' : '#9ca3af';
    const targetLabel = target === 'notebook' ? 'Sổ tay' : target === 'note' ? 'Ghi chú' : target === 'content' ? 'Nội dung' : target === 'content-cascade' ? 'Nội dung (Kèm Con)' : target === 'content-sibling-cascade' ? 'Nội dung (Ngang hàng & Con)' : target === 'content-prev' ? 'Nối vào Mục trước' : target === 'content-prev-cascade' ? 'Nối & Con vào Mục trước' : 'Bỏ qua';

    return (
      <div key={node.id} style={{ marginLeft: node.level > 1 ? '24px' : '0px', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f9fafb', padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
            <span style={{ color: '#9ca3af', marginRight: '4px', fontWeight: 600 }}>L{node.level}</span>
            {node.title || 'Không có tiêu đề'}
          </div>
          {node.attachments && node.attachments.length > 0 && (
            <span style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', marginRight: '8px', backgroundColor: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>
              <Paperclip size={12} style={{ marginRight: '2px' }}/> {node.attachments.length} file
            </span>
          )}
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: `${targetColor}20`, color: targetColor }}>
            {targetLabel}
          </span>
        </div>
        {node.children && node.children.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            {node.children.map(child => renderPreviewNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        width: '1100px', 
        height: '600px', 
        minWidth: '900px',
        minHeight: '400px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        resize: 'both',
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' 
      }}>
        
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', margin: 0 }}>Cấu trúc Import Dữ liệu</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Tùy chỉnh cách các cấp độ (level) của file được chuyển đổi thành cấu trúc NoteGravity.</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Cột trái: Rules Configurator */}
          <div style={{ width: '550px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Quy tắc Ánh xạ (Rules)</span>
              <button onClick={addRule} style={{ display: 'flex', alignItems: 'center', fontSize: '12px', padding: '4px 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#334155' }}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Thêm Rule
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rules.map((rule, idx) => (
                <div key={rule.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Luật #{idx + 1}</span>
                    <button onClick={() => removeRule(rule.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#334155', minWidth: '40px' }}>Nếu</span>
                      <select value={rule.field} onChange={e => updateRule(rule.id, { field: e.target.value as any, operator: e.target.value === 'attachment' ? 'has' : 'eq', value: '' })} style={{ fontSize: '13px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                        <option value="elementType">Loại đối tượng</option>
                        <option value="level">Level</option>
                        <option value="title">Tiêu đề</option>
                        <option value="attachment">File đính kèm</option>
                      </select>
                      
                      <select value={rule.operator} onChange={e => updateRule(rule.id, { operator: e.target.value as any })} style={{ fontSize: '13px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                        {rule.field === 'elementType' && <><option value="eq">=</option><option value="in">Bao gồm (in)</option></>}
                        {rule.field === 'level' && <><option value="eq">=</option><option value="gt">&gt;</option><option value="lt">&lt;</option><option value="in">Bao gồm (in)</option></>}
                        {rule.field === 'title' && <><option value="contains">Chứa</option><option value="eq">Bằng</option></>}
                        {rule.field === 'attachment' && <option value="has">Có chứa</option>}
                      </select>

                      {rule.field !== 'attachment' && (
                        <input 
                          type={rule.field === 'level' && rule.operator !== 'in' ? 'number' : 'text'} 
                          placeholder={rule.operator === 'in' ? 'VD: 3,4' : (rule.field === 'elementType' ? 'VD: h1, l2' : '')}
                          value={rule.value} onChange={e => updateRule(rule.id, { value: e.target.value })} 
                          style={{ fontSize: '13px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', minWidth: '100px', flex: 1 }} 
                        />
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#334155', minWidth: '80px' }}>Chuyển thành</span>
                      <select value={rule.target} onChange={e => updateRule(rule.id, { target: e.target.value as any })} style={{ fontSize: '13px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1, backgroundColor: '#fff', minWidth: 0 }}>
                        <option value="notebook">Sổ tay / Thư mục</option>
                        <option value="note">Trang Ghi chú</option>
                        <option value="content">Nội dung (Content)</option>
                        <option value="content-cascade">Nội dung (Bao gồm toàn bộ cấp con)</option>
                        <option value="content-sibling-cascade">Nội dung (Bao gồm toàn bộ cấp ngang hàng và cấp con)</option>
                        <option value="content-prev">Nội dung (Nối vào mục liền trước)</option>
                        <option value="content-prev-cascade">Nội dung (Bao gồm con, nối vào mục liền trước)</option>
                        <option value="ignore">Bỏ qua (Không import)</option>
                      </select>
                    </div>
                    
                    {rule.target.startsWith('content') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', minWidth: '80px' }}>Cách nối chuỗi:</span>
                        <input 
                          type="text" 
                          placeholder="VD: <br/>{title}"
                          value={rule.formatStr || ''} 
                          onChange={e => updateRule(rule.id, { formatStr: e.target.value })} 
                          style={{ fontSize: '12px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1 }} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
              <div style={{ padding: '8px', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '12px', color: '#0369a1', display: 'flex', gap: '8px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>Các rule được đánh giá từ trên xuống dưới. <b>Rule đầu tiên</b> thỏa mãn sẽ được ưu tiên. Vui lòng chọn lại file nếu chưa đúng.</div>
              </div>
            </div>
          </div>

          {/* Cột phải: Preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', minWidth: 0 }}>
             <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Xem trước kết quả (Preview)</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px' }}>
              {data.map(renderPreviewNode)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#fff' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', color: '#475569' }}>
            Hủy
          </button>
          <button onClick={() => onImport(rules)} style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '4px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
            <Check size={16} /> Bắt đầu Import
          </button>
        </div>
      </div>
    </div>
  );
};
