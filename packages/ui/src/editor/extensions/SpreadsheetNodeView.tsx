import React, { useEffect, useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import * as XLSX from 'xlsx';

export const SpreadsheetNodeView: React.FC<NodeViewProps> = ({ node }) => {
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
        
        // Use SheetJS to parse Excel/CSV
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Take the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to HTML
        const html = XLSX.utils.sheet_to_html(worksheet);
        
        // Add some basic styling classes to the table if needed
        const styledHtml = html.replace(/<table/g, '<table class="min-w-full divide-y divide-gray-200 border"');
        
        setHtmlContent(styledHtml);
      } catch (err: any) {
        setError(err.message || 'Lỗi đọc file Bảng tính');
      } finally {
        setLoading(false);
      }
    };

    fetchAndParse();
  }, [src]);

  return (
    <NodeViewWrapper className="spreadsheet-node-view">
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
          <span>📊</span> {filename || 'Bảng tính Excel/CSV'}
        </div>
        
        <div style={{ padding: '16px', maxHeight: '500px', overflow: 'auto', backgroundColor: '#ffffff', color: '#1f2937' }}>
          {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Đang tải nội dung...</div>}
          {error && <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>}
          {!loading && !error && htmlContent && (
             // @ts-ignore
            <div 
              className="prose max-w-none xlsx-content" 
              style={{ overflowX: 'auto' }}
              dangerouslySetInnerHTML={{ __html: htmlContent }} 
            />
          )}
          {!loading && !error && !htmlContent && (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>Bảng tính trống hoặc không hỗ trợ định dạng này.</div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};
