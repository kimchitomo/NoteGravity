import React, { useEffect, useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
// @ts-ignore
import mammoth from 'mammoth/mammoth.browser';

export const DocumentNodeView: React.FC<NodeViewProps> = ({ node }) => {
  const { src, filename } = node.attrs;
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    const fetchAndParse = async () => {
      try {
        setLoading(true);
        const response = await fetch(src);
        if (!response.ok) throw new Error('Không thể tải file');
        
        const arrayBuffer = await response.arrayBuffer();
        
        // Use mammoth to convert docx to HTML
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
        if (result.messages.length > 0) {
          console.warn('Mammoth messages:', result.messages);
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi đọc file Word');
      } finally {
        setLoading(false);
      }
    };

    fetchAndParse();
  }, [src]);

  return (
    <NodeViewWrapper className="document-node-view">
      <div 
        style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          margin: '16px 0', 
          overflow: 'hidden',
          backgroundColor: '#f9fafb'
        }}
        contentEditable={false} // Disable editing inside the node view
      >
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f3f4f6', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📄</span> {filename || 'Tài liệu Word'}
        </div>
        
        <div style={{ padding: '16px', maxHeight: '500px', overflowY: 'auto', backgroundColor: '#ffffff', color: '#1f2937' }}>
          {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Đang tải nội dung...</div>}
          {error && <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>}
          {!loading && !error && htmlContent && (
             // @ts-ignore
            <div 
              className="prose max-w-none docx-content" 
              dangerouslySetInnerHTML={{ __html: htmlContent }} 
            />
          )}
          {!loading && !error && !htmlContent && (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>Tài liệu trống hoặc không hỗ trợ định dạng này (chỉ hỗ trợ .docx).</div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};
