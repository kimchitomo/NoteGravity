import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { ArrowLeft, Info, Printer, Share2, Download, Upload, Send, Settings, User, FileText, Smartphone, Mail, Cloud, Network, Wifi, Save } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface BackstageViewProps {
  onClose: () => void;
  initialTab?: Tab;
}

export type Tab = 'info' | 'print' | 'share' | 'export' | 'import' | 'send' | 'account' | 'options';

export const BackstageView: React.FC<BackstageViewProps> = ({ onClose, initialTab = 'info' }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [printSettings, setPrintSettings] = useState({ paper: 'a4', orientation: 'portrait', margin: 'normal', scale: 'fit-width', copies: 1, pages: 'all', customPages: '' });
  const [exportFormat, setExportFormat] = useState('.ngg');
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: '', user: '', pass: '' });
  const [isSimulating, setIsSimulating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  useEffect(() => {
    if (activeTab === 'print') {
      const canvasEl = document.querySelector('.infinite-canvas-surface') as HTMLElement;
      if (canvasEl) {
        setIsGeneratingPreview(true);
        
        // Temporarily reset transform to get true coordinates
        const originalTransform = canvasEl.style.transform;
        canvasEl.style.transform = 'none';

        // Calculate bounding box of all children to capture overflowing content
        let maxW = canvasEl.offsetWidth || 800;
        let maxH = canvasEl.offsetHeight || 1123;
        
        const children = canvasEl.children;
        for (let i = 0; i < children.length; i++) {
           const el = children[i] as HTMLElement;
           const bottom = el.offsetTop + el.offsetHeight;
           const right = el.offsetLeft + el.offsetWidth;
           if (bottom > maxH) maxH = bottom;
           if (right > maxW) maxW = right;
        }

        html2canvas(canvasEl, {
          backgroundColor: '#ffffff',
          useCORS: true,
          scale: 1.5, // High resolution for printing
          width: maxW + 40,
          height: maxH + 40,
          windowWidth: maxW + 40,
          windowHeight: maxH + 40,
          logging: false
        }).then(canvas => {
          canvasEl.style.transform = originalTransform;
          setPreviewImage(canvas.toDataURL('image/png'));
          setIsGeneratingPreview(false);
        }).catch(err => {
          console.error("Failed to generate preview", err);
          canvasEl.style.transform = originalTransform;
          setIsGeneratingPreview(false);
        });
      }
    }
  }, [activeTab]);

  const simulateAction = (actionName: string) => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      alert(`Đã hoàn tất giả lập: ${actionName}`);
    }, 1500);
  };

  const handlePrint = () => {
    if (!previewImage) {
      alert("Đang tải bản xem trước, vui lòng thử lại sau giây lát.");
      return;
    }

    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) return;
    
    const clientHeight = previewContainer.clientHeight;
    const scrollHeight = previewContainer.scrollHeight;
    const totalPages = Math.ceil(scrollHeight / clientHeight);

    // Parse selected pages
    let selectedPages: number[] = [];
    if (printSettings.pages === 'all') {
      for (let i = 1; i <= totalPages; i++) selectedPages.push(i);
    } else if (printSettings.pages === 'current') {
      const currentScroll = previewContainer.scrollTop;
      const current = Math.min(totalPages, Math.max(1, Math.ceil((currentScroll + clientHeight * 0.5) / clientHeight)));
      selectedPages.push(current);
    } else if (printSettings.pages === 'custom' && printSettings.customPages) {
      const parts = printSettings.customPages.split(',');
      parts.forEach(part => {
        const range = part.trim().split('-');
        if (range.length === 1) {
          const p = parseInt(range[0]);
          if (!isNaN(p) && p >= 1 && p <= totalPages) selectedPages.push(p);
        } else if (range.length === 2) {
          const start = parseInt(range[0]);
          const end = parseInt(range[1]);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
              if (!selectedPages.includes(i)) selectedPages.push(i);
            }
          }
        }
      });
      selectedPages.sort((a, b) => a - b);
    }

    if (selectedPages.length === 0) {
      for (let i = 1; i <= totalPages; i++) selectedPages.push(i); // fallback to all
    }

    const img = new Image();
    img.onload = () => {
      const imgPageHeight = img.height / (scrollHeight / clientHeight);

      // Slice the image into separate data URLs for the selected pages
      const pageImages: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = img.width;
        canvas.height = imgPageHeight;

        selectedPages.forEach(pageNum => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const sourceY = (pageNum - 1) * imgPageHeight;
          ctx.drawImage(img, 0, sourceY, img.width, imgPageHeight, 0, 0, canvas.width, canvas.height);
          pageImages.push(canvas.toDataURL('image/png'));
        });
      }

      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        let imgTags = pageImages.map(src => `<div class="page"><img src="${src}" /></div>`).join('');
        
        iframeDoc.write(`
          <html>
            <head>
              <style>
                @page {
                  size: ${printSettings.paper === 'a4' ? 'A4' : printSettings.paper === 'a3' ? 'A3' : 'letter'} ${printSettings.orientation};
                  margin: ${printSettings.margin === 'normal' ? '20mm' : printSettings.margin === 'narrow' ? '10mm' : '30mm'};
                }
                * { box-sizing: border-box; }
                body { margin: 0; padding: 0; text-align: center; }
                .page {
                  width: 100%;
                  height: 100vh;
                  overflow: hidden;
                  page-break-after: always;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: flex-start;
                }
                .page:last-child {
                  page-break-after: auto;
                }
                img { 
                  ${printSettings.scale === 'fit-width' ? 'width: 100%; height: auto;' : ''}
                  ${printSettings.scale === 'fit-height' ? 'height: 100%; width: auto;' : ''}
                  ${printSettings.scale === 'actual' ? 'width: auto; height: auto;' : ''}
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                  object-position: top center;
                }
              </style>
            </head>
            <body>
              ${imgTags}
              <script>
                window.onload = () => {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        iframeDoc.close();
        
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 10000);
      }
    };
    img.src = previewImage;
  };

  return (
    <div className="backstage-container" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#ffffff', zIndex: 9999, display: 'flex' }}>
      
      {/* Sidebar Menu */}
      <div style={{ width: '200px', backgroundColor: '#10b981', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <button onClick={onClose} style={{ padding: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} style={{ marginRight: '8px' }} /> Back
        </button>
        
        <div className="backstage-menu">
          <button className={`menu-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}><Info size={18} /> Info</button>
          <button className={`menu-btn ${activeTab === 'print' ? 'active' : ''}`} onClick={() => setActiveTab('print')}><Printer size={18} /> Print</button>
          <button className={`menu-btn ${activeTab === 'share' ? 'active' : ''}`} onClick={() => setActiveTab('share')}><Share2 size={18} /> Share</button>
          <button className={`menu-btn ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')}><Download size={18} /> Export</button>
          <button className={`menu-btn ${activeTab === 'import' ? 'active' : ''}`} onClick={() => setActiveTab('import')}><Upload size={18} /> Import</button>
          <button className={`menu-btn ${activeTab === 'send' ? 'active' : ''}`} onClick={() => setActiveTab('send')}><Send size={18} /> Send</button>
          
          <div style={{ flex: 1 }} />
          
          <button className={`menu-btn ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}><User size={18} /> Account</button>
          <button className={`menu-btn ${activeTab === 'options' ? 'active' : ''}`} onClick={() => setActiveTab('options')}><Settings size={18} /> Options</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', backgroundColor: '#f9fafb', overflowY: 'auto' }}>
        {activeTab === 'info' && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#374151', marginBottom: '24px' }}>Notebook Information</h1>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', maxWidth: '600px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>Storage Status</h2>
              <p>Local Storage Space: ~1.2 MB used.</p>
              <h2 style={{ fontSize: '18px', fontWeight: 500, margin: '16px 0' }}>Sync</h2>
              <p style={{ color: '#10b981' }}>Up to date (Offline Mode)</p>
            </div>
          </div>
        )}

        {activeTab === 'print' && (
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ width: '300px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#374151', marginBottom: '24px' }}>Print</h1>
              <button 
                onClick={handlePrint}
                style={{ width: '100px', height: '100px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '24px' }}>
                <Printer size={32} color="#4b5563" />
                <span style={{ marginTop: '8px', fontWeight: 500 }}>Print</span>
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label>Máy in (Printer)</label>
                <select className="print-select"><option>Hệ thống tự quyết định</option></select>
                
                <label>Số bản in (Copies)</label>
                <input type="number" min="1" value={printSettings.copies} onChange={e => setPrintSettings({...printSettings, copies: parseInt(e.target.value)})} className="print-select" />
                
                <label>Trang in (Pages)</label>
                <select value={printSettings.pages} onChange={e => setPrintSettings({...printSettings, pages: e.target.value})} className="print-select">
                  <option value="all">Tất cả (All)</option>
                  <option value="current">Trang hiện tại (Current)</option>
                  <option value="custom">Tùy chỉnh... (Custom)</option>
                </select>
                {printSettings.pages === 'custom' && (
                  <input 
                    type="text" 
                    placeholder="Nhập số trang (VD: 1-3, 5)" 
                    value={printSettings.customPages || ''} 
                    onChange={e => setPrintSettings({...printSettings, customPages: e.target.value})} 
                    className="print-select" 
                    style={{ marginTop: '-4px' }} 
                  />
                )}

                <label>Khổ giấy (Paper)</label>
                <select value={printSettings.paper} onChange={e => setPrintSettings({...printSettings, paper: e.target.value})} className="print-select">
                  <option value="a4">A4</option><option value="a3">A3</option><option value="letter">Letter</option>
                </select>

                <label>Hướng giấy (Orientation)</label>
                <select value={printSettings.orientation} onChange={e => setPrintSettings({...printSettings, orientation: e.target.value})} className="print-select">
                  <option value="portrait">Dọc (Portrait)</option><option value="landscape">Ngang (Landscape)</option>
                </select>

                <label>Căn lề (Margins)</label>
                <select value={printSettings.margin} onChange={e => setPrintSettings({...printSettings, margin: e.target.value})} className="print-select">
                  <option value="normal">Bình thường (Normal)</option><option value="narrow">Hẹp (Narrow)</option>
                </select>

                <label>Thu phóng (Zoom/Scale)</label>
                <select value={printSettings.scale} onChange={e => setPrintSettings({...printSettings, scale: e.target.value})} className="print-select">
                  <option value="fit-width">Vừa chiều ngang (Fit Width)</option>
                  <option value="fit-height">Vừa chiều dọc (Fit Height)</option>
                  <option value="actual">Kích thước thật (100%)</option>
                </select>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#e5e7eb', padding: '40px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <div id="preview-page-indicator" style={{ marginBottom: '12px', fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                Trang 1 / 1
              </div>
              <div 
                id="preview-container"
                style={{ 
                  height: 'calc(100% - 40px)',
                  maxHeight: '900px',
                  aspectRatio: printSettings.orientation === 'portrait' ? '1 / 1.414' : '1.414 / 1', 
                  backgroundColor: 'white', 
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: printSettings.scale === 'actual' ? 'flex-start' : 'center', 
                  color: '#9ca3af', 
                  overflow: 'auto', 
                  position: 'relative' 
                }}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const currentScroll = target.scrollTop;
                  const clientHeight = target.clientHeight;
                  const scrollHeight = target.scrollHeight;
                  
                  const pages = Math.ceil(scrollHeight / clientHeight);
                  const current = Math.min(pages, Math.max(1, Math.ceil((currentScroll + clientHeight * 0.5) / clientHeight)));
                  
                  target.setAttribute('data-current-page', current.toString());
                  target.setAttribute('data-total-pages', pages.toString());
                  
                  // Force an update to the sibling element containing the page text
                  const pageIndicator = document.getElementById('preview-page-indicator');
                  if (pageIndicator) {
                    pageIndicator.innerText = `Trang ${current} / ${pages}`;
                  }
                }}
                onLoad={(e) => {
                  // Trigger scroll calculation when image loads
                  const target = e.currentTarget;
                  const pages = Math.ceil(target.scrollHeight / target.clientHeight);
                  const pageIndicator = document.getElementById('preview-page-indicator');
                  if (pageIndicator) {
                    pageIndicator.innerText = `Trang 1 / ${pages}`;
                  }
                }}
              >
                {isGeneratingPreview ? (
                  <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Đang tạo bản xem trước...</span>
                  </div>
                ) : previewImage ? (
                  <img 
                    src={previewImage} 
                    onLoad={(e) => {
                      // Initial page calc after image loads
                      const target = e.currentTarget.parentElement;
                      if (target) {
                        const pages = Math.ceil(target.scrollHeight / target.clientHeight);
                        const pageIndicator = document.getElementById('preview-page-indicator');
                        if (pageIndicator) {
                          pageIndicator.innerText = `Trang 1 / ${pages}`;
                        }
                      }
                    }}
                    style={{ 
                      width: printSettings.scale === 'fit-width' ? '100%' : 'auto', 
                      height: printSettings.scale === 'fit-height' ? '100%' : 'auto', 
                      display: 'block',
                      maxWidth: printSettings.scale === 'actual' ? 'none' : (printSettings.scale === 'fit-width' ? '100%' : 'none')
                    }} 
                    alt="Print Preview" 
                  />
                ) : (
                  <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <span>Print Preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'share' && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#374151', marginBottom: '24px' }}>Share</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '600px' }}>
              <button className="share-btn" onClick={() => simulateAction('Share qua Facebook Messenger')}><MessageSquare color="#06b6d4" /> Facebook Messenger</button>
              <button className="share-btn" onClick={() => simulateAction('Share qua Telegram')}><Send color="#3b82f6" /> Telegram</button>
              <button className="share-btn" onClick={() => simulateAction('Lưu vào Google Drive')}><Cloud color="#10b981" /> Google Drive</button>
              <button className="share-btn" onClick={() => simulateAction('Lưu vào OneDrive')}><Cloud color="#0ea5e9" /> OneDrive</button>
              <button className="share-btn" onClick={() => simulateAction('Lưu vào Dropbox')}><Cloud color="#6366f1" /> Dropbox</button>
              <button className="share-btn" onClick={() => simulateAction('Lưu vào Sharepoint')}><Cloud color="#14b8a6" /> Sharepoint</button>
              <button className="share-btn" onClick={() => simulateAction('Gửi qua mạng nội bộ (SMB)')}><Network color="#8b5cf6" /> Mạng nội bộ (SMB)</button>
              <button className="share-btn" onClick={() => simulateAction('Gửi qua máy chủ (FTP)')}><Network color="#f59e0b" /> FTP Server</button>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 500, margin: '24px 0 16px' }}>Chia sẻ qua chung mạng Wifi</h2>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '24px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', maxWidth: '600px' }}>
              <QRCodeSVG value={window.location.href} size={128} />
              <div>
                <p>1. Quét mã QR bằng điện thoại cùng mạng Wifi.</p>
                <p>2. Hoặc truy cập địa chỉ IP của máy tính hiện tại.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#374151', marginBottom: '24px' }}>Export</h1>
            <div style={{ display: 'flex', gap: '24px', maxWidth: '800px' }}>
              <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className={`format-btn ${exportFormat === '.ngg' ? 'active' : ''}`} onClick={() => setExportFormat('.ngg')}>
                  <span style={{ fontWeight: 500 }}>NoteGravity (.ngg)</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Định dạng JSON gốc, giữ nguyên nét vẽ</span>
                </button>
                <button className={`format-btn ${exportFormat === 'pdf' ? 'active' : ''}`} onClick={() => setExportFormat('pdf')}>
                  <span style={{ fontWeight: 500 }}>Tài liệu (PDF)</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Xuất thành trang tài liệu PDF tĩnh</span>
                </button>
                <button className={`format-btn ${exportFormat === 'markdown' ? 'active' : ''}`} onClick={() => setExportFormat('markdown')}>
                  <span style={{ fontWeight: 500 }}>Văn bản (Markdown)</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Xuất văn bản thô cho Obsidian/Notion</span>
                </button>
              </div>
              <div style={{ flex: 1, padding: '24px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Export as {exportFormat}</h2>
                <button 
                  onClick={() => simulateAction(`Xuất file định dạng ${exportFormat}`)}
                  style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <Download size={20} /> Bắt đầu xuất (Export)
                </button>
                {isSimulating && <p style={{ marginTop: '16px', color: '#f59e0b' }}>Đang tạo file... Vui lòng đợi.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#374151', marginBottom: '24px' }}>Import</h1>
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', border: '2px dashed #d1d5db', maxWidth: '600px', textAlign: 'center' }}>
              <Upload size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>Kéo thả hoặc chọn file để nhập dữ liệu</h2>
              <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>Hỗ trợ các định dạng: .ngg, .one, .pdf, .xps, .docx, .doc, .mhtml, .md, .mermaid, .freemind, .opml, .html, .json, .pst</p>
              <input type="file" id="importFile" style={{ display: 'none' }} accept=".ngg,.one,.pdf,.xps,.docx,.doc,.mhtml,.md,.mermaid,.freemind,.opml,.html,.json,.pst" onChange={() => simulateAction('Phân tích (Parse) dữ liệu file')} />
              <button 
                onClick={() => document.getElementById('importFile')?.click()}
                style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Duyệt file...
              </button>
            </div>
          </div>
        )}

        {activeTab === 'send' && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#374151', marginBottom: '24px' }}>Send via Email (SMTP)</h1>
            <div style={{ display: 'flex', gap: '24px', maxWidth: '800px' }}>
              <div style={{ flex: 1, padding: '24px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Soạn thư</h2>
                <input type="text" placeholder="Gửi tới (To:)" className="print-select" style={{ marginBottom: '12px' }} />
                <input type="text" placeholder="Tiêu đề (Subject)" className="print-select" style={{ marginBottom: '12px' }} />
                <textarea placeholder="Nội dung thư..." className="print-select" style={{ height: '150px', marginBottom: '16px', resize: 'vertical' }} />
                <button onClick={() => simulateAction('Gửi thư qua SMTP Server')} style={{ padding: '8px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  <Send size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> Send
                </button>
              </div>
              <div style={{ width: '300px', padding: '24px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Cấu hình SMTP Server</h2>
                <label>SMTP Host</label>
                <input type="text" placeholder="smtp.gmail.com" value={smtpConfig.host} onChange={e => setSmtpConfig({...smtpConfig, host: e.target.value})} className="print-select" style={{ marginBottom: '12px' }} />
                <label>Port</label>
                <input type="text" placeholder="587" value={smtpConfig.port} onChange={e => setSmtpConfig({...smtpConfig, port: e.target.value})} className="print-select" style={{ marginBottom: '12px' }} />
                <label>Email Username</label>
                <input type="text" placeholder="you@domain.com" value={smtpConfig.user} onChange={e => setSmtpConfig({...smtpConfig, user: e.target.value})} className="print-select" style={{ marginBottom: '12px' }} />
                <label>App Password</label>
                <input type="password" placeholder="••••••••" value={smtpConfig.pass} onChange={e => setSmtpConfig({...smtpConfig, pass: e.target.value})} className="print-select" style={{ marginBottom: '16px' }} />
                <button onClick={() => simulateAction('Lưu cấu hình SMTP')} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                  <Save size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'account' || activeTab === 'options') && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#374151', marginBottom: '24px' }}>{activeTab === 'account' ? 'Account' : 'Options'}</h1>
            <p>Tính năng này đang được phát triển.</p>
          </div>
        )}
      </div>

      <style>{`
        .menu-btn {
          padding: 12px 20px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          text-align: left;
          width: 100%;
        }
        .menu-btn:hover { background-color: rgba(255, 255, 255, 0.1); }
        .menu-btn.active { background-color: #059669; font-weight: bold; border-left: 4px solid #fff; padding-left: 16px; }
        .print-select {
          padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white; width: 100%;
        }
        .print-select:focus { outline: 2px solid #3b82f6; }
        label { display: block; font-size: 13px; color: #4b5563; margin-bottom: 4px; font-weight: 500; }
        .share-btn { display: flex; align-items: center; gap: 12px; padding: 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 14px; font-weight: 500; }
        .share-btn:hover { border-color: #3b82f6; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .format-btn { display: flex; flex-direction: column; padding: 12px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; text-align: left; }
        .format-btn:hover { border-color: #9ca3af; }
        .format-btn.active { border-color: #10b981; background-color: #ecfdf5; box-shadow: inset 0 0 0 1px #10b981; }
      `}</style>
    </div>
  );
};
