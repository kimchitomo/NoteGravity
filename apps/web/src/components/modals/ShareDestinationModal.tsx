import React, { useState } from 'react';
import { useTreeStore, TreeNode } from '../../store/useTreeStore';
import { X, Folder, FileText, CheckCircle2 } from 'lucide-react';
import { SpeechRecognitionModal } from './SpeechRecognitionModal';
import { uploadFileInChunks } from '../../lib/chunkSync';
import localforage from 'localforage';
import { useCanvasStore } from '../../store/useCanvasStore';

export const ShareDestinationModal = () => {
  const { sharedDataQueue, closeShareDestinationModal, data, expandedIds } = useTreeStore();
  const [activeTab, setActiveTab] = useState<'create' | 'append'>('create');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [localExpandedIds, setLocalExpandedIds] = useState<Set<string>>(new Set(expandedIds));
  const [isProcessing, setIsProcessing] = useState(false);
  
  // naming step states
  const [namingStep, setNamingStep] = useState(false);
  const [defaultTitle, setDefaultTitle] = useState('');

  if (!sharedDataQueue || sharedDataQueue.length === 0) return null;

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

  const handleInitialConfirm = () => {
    // Collect the default title from the first shared item
    const firstItem = sharedDataQueue[0];
    const initialTitle = firstItem?.title || 'Shared Note';
    setDefaultTitle(initialTitle);
    setNamingStep(true);
  };

  const processSharedData = async (finalTitle: string) => {
    setIsProcessing(true);
    setNamingStep(false);
    
    try {
      let appendedContent = '';
      
      for (const item of sharedDataQueue) {
        let content = '';
        if (item.title && item.title !== finalTitle) content += `<h2>${item.title}</h2>\n`;
        if (item.text) content += `<p>${item.text}</p>\n`;
        if (item.url) content += `<p><a href="${item.url}">${item.url}</a></p>\n`;
        
        if (item.files && item.files.length > 0) {
          for (const file of item.files) {
            const fileId = Math.random().toString(36).substring(2) + Date.now().toString(36);
            try {
              const serverUrl = await uploadFileInChunks(fileId, file);
              if (file.type.startsWith('image/')) {
                content += `<p><img src="${serverUrl}" alt="${file.name}" /></p>\n`;
              } else if (file.type.startsWith('video/')) {
                content += `<video controls src="${serverUrl}"></video><p></p>\n`;
              } else if (file.type.startsWith('audio/')) {
                content += `<audio controls src="${serverUrl}"></audio><p></p>\n`;
              } else if (file.type === 'application/pdf') {
                content += `<iframe src="${serverUrl}"></iframe><p></p>\n`;
              } else if (
                file.name.endsWith('.docx') || 
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              ) {
                content += `<div data-type="document" src="${serverUrl}" filename="${file.name}"></div><p></p>\n`;
              } else if (
                file.name.endsWith('.xlsx') || 
                file.name.endsWith('.csv') ||
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.type === 'text/csv'
              ) {
                content += `<div data-type="spreadsheet" src="${serverUrl}" filename="${file.name}"></div><p></p>\n`;
              } else {
                content += `<p><a href="${serverUrl}">${file.name}</a></p>\n`;
              }
            } catch (e) {
              console.error('Lỗi upload file share:', e);
              content += `<p>[Lỗi tải file: ${file.name}]</p>\n`;
            }
          }
        }
        
        appendedContent += content;
      }
      
      if (activeTab === 'create') {
        const noteId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const titleToUse = finalTitle || sharedDataQueue[0]?.title || 'Shared Note';
        const newNote: TreeNode = { id: noteId, title: titleToUse, type: 'note', createdAt: Date.now(), updatedAt: Date.now() };
        
        // Tạo một Note Container mới trên Canvas của ghi chú mới
        const newContainerId = useCanvasStore.getState().addContainer(noteId, 40, 90);
        if ((window as any).SyncManager) {
          await (window as any).SyncManager.pushUpdate(`note-content-${noteId}-${newContainerId}`, appendedContent);
        } else {
          await localforage.setItem(`note-content-${noteId}-${newContainerId}`, appendedContent);
        }
        
        useTreeStore.setState((state) => {
           const newData = JSON.parse(JSON.stringify(state.data));
           if (!selectedParentId) {
               newData.push(newNote);
           } else {
               const parent = findNode(newData, selectedParentId);
               if (parent) {
                   parent.children = parent.children || [];
                   parent.children.push(newNote);
               } else {
                   newData.push(newNote);
               }
           }
           return { data: newData };
        });
        
        // Timeout 1 chút để đảm bảo localStorage đã cập nhật
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('reload-editor', { detail: { docId: noteId } }));
          // Dispatch thêm event sync để PC tự động lấy content
          window.dispatchEvent(new CustomEvent('external-note-update', { detail: { key: `note-content-${noteId}-${newContainerId}`, content: appendedContent } }));
        }, 100);
      } else if (activeTab === 'append' && selectedParentId) {
        const pageData = useCanvasStore.getState().getPageData(selectedParentId);
        const existingContainers = pageData?.containers || [];
        
        if (existingContainers.length > 0) {
          // Nếu đã có container trên canvas, chèn nội dung vào container đầu tiên
          const firstContainerId = existingContainers[0].id;
          const key = `note-content-${selectedParentId}-${firstContainerId}`;
          const existingContent = (await localforage.getItem<string>(key)) || '';
          const blockTitle = finalTitle ? `<h1>${finalTitle}</h1>` : '';
          const newContent = existingContent + blockTitle + appendedContent;
          if ((window as any).SyncManager) {
            await (window as any).SyncManager.pushUpdate(key, newContent);
          } else {
            await localforage.setItem(key, newContent);
          }
          
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('reload-editor', { detail: { docId: `${selectedParentId}-${firstContainerId}` } }));
            window.dispatchEvent(new CustomEvent('external-note-update', { detail: { key, content: newContent } }));
          }, 100);
        } else {
          // Nếu chưa có container nào, tạo một container mới trên canvas và lưu nội dung
          const newContainerId = useCanvasStore.getState().addContainer(selectedParentId, 40, 90);
          const key = `note-content-${selectedParentId}-${newContainerId}`;
          const blockTitle = finalTitle ? `<h1>${finalTitle}</h1>` : '';
          const newContent = blockTitle + appendedContent;
          if ((window as any).SyncManager) {
            await (window as any).SyncManager.pushUpdate(key, newContent);
          } else {
            await localforage.setItem(key, newContent);
          }
          
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('reload-editor', { detail: { docId: `${selectedParentId}-${newContainerId}` } }));
            window.dispatchEvent(new CustomEvent('external-note-update', { detail: { key, content: newContent } }));
          }, 100);
        }
      }
      // Remove duplicated code here
      
      const { openDB } = await import('idb');
      const db = await openDB('ShareTargetDB', 1);
      await db.clear('shared_files');
      
      setIsProcessing(false);
      closeShareDestinationModal();
      
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const renderFolder = (node: TreeNode, level = 0) => {
    const isSelected = selectedParentId === node.id;
    const isNote = node.type === 'note';
    const canSelect = activeTab === 'create' ? !isNote : isNote;
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
          style={{
            padding: '6px 8px', cursor: !canSelect ? 'default' : 'pointer', borderRadius: '4px',
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
          <span style={{ opacity: 0.8 }}>
            {node.type === 'note' ? <FileText size={16} /> : <Folder size={16} />}
          </span>
          <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.title}</span>
        </div>
        {isExpanded && node.children?.map(child => renderFolder(child, level + 1))}
      </div>
    );
  };

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-color)', borderRadius: '8px', padding: '0',
          width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', alignItems: 'center', color: 'var(--text-color)', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} color="#0066cc" />
              Lưu dữ liệu chia sẻ
            </h3>
            <button onClick={closeShareDestinationModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><X size={18} /></button>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
            <div 
              onClick={() => { setActiveTab('create'); setSelectedParentId(null); }}
              style={{ flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: activeTab === 'create' ? 'bold' : 'normal', borderBottom: activeTab === 'create' ? '2px solid #0066cc' : '2px solid transparent', color: 'var(--text-color)' }}
            >
              Tạo ghi chú mới
            </div>
            <div 
              onClick={() => { setActiveTab('append'); setSelectedParentId(null); }}
              style={{ flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: activeTab === 'append' ? 'bold' : 'normal', borderBottom: activeTab === 'append' ? '2px solid #0066cc' : '2px solid transparent', color: 'var(--text-color)' }}
            >
              Thêm vào Note
            </div>
          </div>

          <div style={{ padding: '16px', flex: 1 }}>
            <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-color)', opacity: 0.8 }}>
              {activeTab === 'create' 
                ? 'Chọn thư mục chứa ghi chú mới (hoặc để trống để lưu ở ngoài cùng):'
                : 'Chọn một ghi chú có sẵn để chèn dữ liệu vào cuối trang:'}
            </div>
            
            <div style={{ overflowY: 'auto', maxHeight: '250px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', backgroundColor: 'var(--bg-color)', minHeight: '150px' }}>
              {data.map(node => renderFolder(node))}
            </div>
          </div>

          <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={closeShareDestinationModal} style={{ padding: '8px 16px', background: 'var(--hover-bg, #f5f5f5)', color: 'var(--text-color)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Hủy
            </button>
            <button 
              onClick={handleInitialConfirm} 
              disabled={isProcessing || (activeTab === 'append' && !selectedParentId)}
              style={{ padding: '8px 16px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: (isProcessing || (activeTab === 'append' && !selectedParentId)) ? 'not-allowed' : 'pointer', opacity: (isProcessing || (activeTab === 'append' && !selectedParentId)) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isProcessing ? 'Đang xử lý...' : 'Tiếp tục'}
            </button>
          </div>
        </div>
      </div>

      {namingStep && (
        <SpeechRecognitionModal
          initialText={defaultTitle}
          initialCursorPosition={{ start: 0, end: defaultTitle.length }}
          onClose={() => setNamingStep(false)}
          onApply={processSharedData}
        />
      )}
    </>
  );
};
