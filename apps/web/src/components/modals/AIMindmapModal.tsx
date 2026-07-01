import React, { useEffect, useState } from 'react';
import { useTreeStore } from '../../store/useTreeStore';
import { X, BrainCircuit, Copy, Download, Check, ImageIcon, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

type Format = 'image' | 'markdown' | 'mermaid' | 'freemind' | 'opml' | 'html' | 'json';

export const AIMindmapModal = () => {
  const { mindmapModalNodeId, closeMindmapModal, data } = useTreeStore();
  const [nodeTitle, setNodeTitle] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState<Format>('image');
  const [results, setResults] = useState<Record<Exclude<Format, 'image'>, string>>({
    markdown: '', mermaid: '', freemind: '', opml: '', html: '', json: ''
  });
  const [svgContent, setSvgContent] = useState<string>('');
  
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!mindmapModalNodeId) return;
    
    // Find node title
    const findNode = (nodes: any[], id: string): any => {
      for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children) {
          const found = findNode(n.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    const n = findNode(data, mindmapModalNodeId);
    if (n) setNodeTitle(n.title);
    
    // Reset state
    setStatus('idle');
    setProgress(0);
    setResults({ markdown: '', mermaid: '', freemind: '', opml: '', html: '', json: '' });
    setSvgContent('');
  }, [mindmapModalNodeId, data]);

  if (!mindmapModalNodeId) return null;

  const startAI = () => {
    setStatus('processing');
    setProgress(0);
    
    // Simulate AI progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          generateMindmaps();
          setStatus('done');
          return 100;
        }
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);
  };

  const generateMindmaps = () => {
    const findNode = (nodes: any[], id: string): any => {
      for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children) {
          const found = findNode(n.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const targetNode = findNode(data, mindmapModalNodeId!);
    if (!targetNode) return;

    const parser = new DOMParser();
    interface NodeInfo { level: number; text: string; children: NodeInfo[] }
    const root: NodeInfo = { level: 0, text: targetNode.title || 'Root', children: [] };
    
    const processTreeNode = (treeNode: any, parentMindmapNode: NodeInfo, baseLevel: number) => {
      // 1. Process note content
      if (treeNode.type === 'note') {
        const rawHtml = localStorage.getItem(`note-content-${treeNode.id}`) || '';
        if (rawHtml) {
          const doc = parser.parseFromString(rawHtml, 'text/html');
          const elements = doc.body.querySelectorAll('h1, h2, h3, h4, p, li');
          
          const stack: NodeInfo[] = [parentMindmapNode];
          
          elements.forEach(el => {
            const tag = el.tagName.toLowerCase();
            let text = el.textContent?.trim() || '';
            if (!text) return;
            
            let level = baseLevel + 4; // p, li
            if (tag === 'h1') level = baseLevel + 1;
            if (tag === 'h2') level = baseLevel + 2;
            if (tag === 'h3') level = baseLevel + 3;
            if (tag === 'h4') level = baseLevel + 4;
            
            if (text.length > 50) text = text.substring(0, 50) + '...';
            
            const newNode: NodeInfo = { level, text, children: [] };
            
            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
              stack.pop();
            }
            
            stack[stack.length - 1].children.push(newNode);
            if (tag.startsWith('h')) {
              stack.push(newNode);
            }
          });
        }
      }
      
      // 2. Process children
      if (treeNode.children && treeNode.children.length > 0) {
        treeNode.children.forEach((childNode: any) => {
          const childMindmapNode: NodeInfo = { level: baseLevel + 1, text: childNode.title, children: [] };
          parentMindmapNode.children.push(childMindmapNode);
          processTreeNode(childNode, childMindmapNode, baseLevel + 1);
        });
      }
    };

    processTreeNode(targetNode, root, 0);

    if (root.children.length === 0) {
      root.children.push({ level: 1, text: 'Không có nội dung', children: [] });
    }

    // 1. Markdown
    const generateMarkdown = (node: NodeInfo, indent: string): string => {
      let res = `${indent}- ${node.text}\n`;
      node.children.forEach(c => res += generateMarkdown(c, indent + '  '));
      return res;
    };
    const mdResult = generateMarkdown(root, '');

    // 2. Mermaid
    const generateMermaid = (node: NodeInfo, indent: string): string => {
      let res = `${indent}${node.text.replace(/[\(\)\[\]\{\}]/g, '')}\n`;
      node.children.forEach(c => res += generateMermaid(c, indent + '  '));
      return res;
    };
    const mermaidResult = `mindmap\n  root((${root.text.replace(/[\(\)\[\]\{\}]/g, '')}))\n` + root.children.map(c => generateMermaid(c, '    ')).join('');

    // 3. FreeMind
    const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
    const generateFreeMind = (node: NodeInfo): string => {
      let res = `<node TEXT="${escapeXml(node.text)}">\n`;
      node.children.forEach(c => res += generateFreeMind(c));
      res += `</node>\n`;
      return res;
    };
    const freeMindResult = `<map version="1.0.1">\n${generateFreeMind(root)}</map>`;

    // 4. OPML
    const generateOPML = (node: NodeInfo): string => {
      if (node.children.length === 0) return `<outline text="${escapeXml(node.text)}" />\n`;
      let res = `<outline text="${escapeXml(node.text)}">\n`;
      node.children.forEach(c => res += generateOPML(c));
      res += `</outline>\n`;
      return res;
    };
    const opmlResult = `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="1.0">\n  <head>\n    <title>${escapeXml(root.text)}</title>\n  </head>\n  <body>\n${generateOPML(root)}  </body>\n</opml>`;

    // 5. HTML
    const generateHTML = (node: NodeInfo): string => {
      if (node.children.length === 0) return `<li>${escapeXml(node.text)}</li>\n`;
      let res = `<li>${escapeXml(node.text)}\n<ul>\n`;
      node.children.forEach(c => res += generateHTML(c));
      res += `</ul>\n</li>\n`;
      return res;
    };
    const htmlResult = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${escapeXml(root.text)}</title>\n<style>\nbody { font-family: sans-serif; line-height: 1.6; padding: 20px; color: #333; }\nul { list-style-type: circle; }\n</style>\n</head>\n<body>\n<h1>${escapeXml(root.text)}</h1>\n<ul>\n${root.children.map(c => generateHTML(c)).join('')}</ul>\n</body>\n</html>`;

    // 6. JSON
    const jsonResult = JSON.stringify(root, null, 2);

    setResults({
      markdown: mdResult.trim(),
      mermaid: mermaidResult.trim(),
      freemind: freeMindResult.trim(),
      opml: opmlResult.trim(),
      html: htmlResult.trim(),
      json: jsonResult.trim()
    });

    // Giữ nguyên chuỗi mermaid gốc, không ngắt dòng
    let processedMermaid = mermaidResult.trim();

    // Render SVG
    try {
      mermaid.initialize({ startOnLoad: false, theme: 'default', htmlLabels: false, securityLevel: 'loose', fontFamily: 'arial, sans-serif' });
      mermaid.render('mindmap-svg', processedMermaid).then((result) => {
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = result.svg;
        const svgEl = tempContainer.querySelector('svg');
        
        if (svgEl) {
          // 1. Thu nhỏ font chữ toàn cục xuống 12px để đảm bảo luôn lọt thỏm trong box do Mermaid tính toán
          const allTexts = svgEl.querySelectorAll('text, tspan');
          allTexts.forEach(el => {
            (el as SVGElement).style.setProperty('font-size', '12px', 'important');
          });

          // 2. Căn giữa toán học ĐỘC QUYỀN cho bong bóng tròn trung tâm
          // Trực tiếp tìm Text chứa chính xác Title để đảm bảo không sai class
          let rootFixed = false;
          const allGroups = svgEl.querySelectorAll('g');
          allGroups.forEach(node => {
            if (rootFixed) return;
            const textEl = node.querySelector('text');
            if (!textEl) return;
            
            const textContent = textEl.textContent?.replace(/\s+/g, '') || '';
            const targetTitle = nodeTitle.replace(/\s+/g, '');
            
            if (textContent === targetTitle) {
              // Xoá toàn bộ tspan cũ rác của Mermaid để tránh lỗi chữ đè lên nhau (clumping)
              textEl.innerHTML = '';
              
              // Tạo một tspan mới sạch sẽ, chứa đúng 1 dòng text
              const newTspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
              newTspan.textContent = nodeTitle;
              newTspan.setAttribute('x', '0');
              newTspan.style.setProperty('font-size', '12px', 'important');
              textEl.appendChild(newTspan);

              textEl.setAttribute('text-anchor', 'middle');
              textEl.style.setProperty('text-anchor', 'middle', 'important');
              
              const transform = textEl.getAttribute('transform');
              if (transform) {
                const match = transform.match(/translate\(([^,]+)(?:,\s*([^\)]+))?\)/);
                if (match) {
                  const y = match[2] || '0';
                  // Ép toạ độ X của toàn khối văn bản về trung tâm (0)
                  textEl.setAttribute('transform', `translate(0, ${y})`);
                }
              }
              rootFixed = true;
            }
          });
          setSvgContent(tempContainer.innerHTML);
        } else {
          setSvgContent(result.svg);
        }
      }).catch(err => console.error("Mermaid render error:", err));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = () => {
    if (format === 'image') return; // Cannot copy image directly easily
    navigator.clipboard.writeText(results[format]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = (type: 'jpeg' | 'svg') => {
    const container = document.createElement('div');
    container.innerHTML = svgContent;
    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    let width = 800;
    let height = 600;
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/);
      if (parts.length >= 4) {
        const w = parseFloat(parts[2]);
        const h = parseFloat(parts[3]);
        if (!isNaN(w) && w > 0) width = w;
        if (!isNaN(h) && h > 0) height = h;
      }
    }

    if (!svgElement.getAttribute('xmlns')) {
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    svgElement.setAttribute('width', width.toString());
    svgElement.setAttribute('height', height.toString());
    svgElement.style.backgroundColor = 'white';

    let svgData = new XMLSerializer().serializeToString(svgElement);
    svgData = svgData.replace(/@import[^;]+;/g, ''); // Xoá font ngoài phòng hờ

    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    if (type === 'svg') {
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindmap-${nodeTitle}.svg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      return;
    }

    // Export JPEG using Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 2K Resolution
      let scale = 3;
      const MAX_DIM = 2560;
      if (width * scale > MAX_DIM) scale = MAX_DIM / width;
      if (height * scale > MAX_DIM) scale = Math.min(scale, MAX_DIM / height);

      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        try {
          const jpeg = canvas.toDataURL('image/jpeg', 1.0);
          const a = document.createElement('a');
          a.href = jpeg;
          a.download = `mindmap-${nodeTitle}.jpeg`;
          a.click();
        } catch (e) {
          console.error("Error creating JPEG data URL", e);
          alert("Lỗi bộ nhớ khi xuất ảnh JPEG. Vui lòng tải file SVG.");
        }
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    };
    
    img.onerror = (err) => {
      console.error("Failed to load SVG into Image", err);
      alert("Lỗi tải SVG vào Canvas. Vui lòng tải file SVG.");
    };
    
    img.src = url;
  };

  const handleDownload = () => {
    const blob = new Blob([results[format as Exclude<Format, 'image'>]], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${nodeTitle}.${exts[format as Exclude<Format, 'image'>]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-color)', borderRadius: '12px', padding: '24px',
        width: '650px', maxWidth: '90vw', maxHeight: '90vh',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', color: 'var(--text-color)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(35, 131, 226, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
              <BrainCircuit size={18} />
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>AI MindMap</h2>
          </div>
          <button onClick={closeMindmapModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)', opacity: 0.6 }}><X size={20} /></button>
        </div>

        {status === 'idle' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <h3 style={{ marginBottom: '12px', fontWeight: 500 }}>Tạo sơ đồ tư duy cho "{nodeTitle}"</h3>
            <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px' }}>
              Hệ thống AI sẽ tự động đọc nội dung ghi chú, tóm tắt các ý chính và sắp xếp thành cấu trúc Mindmap hoàn chỉnh.
            </p>
            <button 
              onClick={startAI}
              style={{
                background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px',
                padding: '10px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}
            >
              <BrainCircuit size={16} /> Bắt đầu phân tích
            </button>
          </div>
        )}

        {status === 'processing' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 20px', position: 'relative' }}>
              <BrainCircuit size={40} style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--accent-color)', animation: 'pulse 1.5s infinite' }} />
            </div>
            <h3 style={{ marginBottom: '16px', fontWeight: 500 }}>AI Đang xử lý...</h3>
            <div style={{ width: '80%', height: '6px', backgroundColor: 'var(--border-color)', margin: '0 auto', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--accent-color)', transition: 'width 0.2s ease-out' }}></div>
            </div>
            <p style={{ color: '#888', marginTop: '12px', fontSize: '13px' }}>{progress}% hoàn thành</p>
          </div>
        )}

        {status === 'done' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', flexWrap: 'wrap' }}>
              {(['image', 'markdown', 'mermaid', 'freemind', 'opml', 'html', 'json'] as Format[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  style={{
                    background: format === f ? 'rgba(35, 131, 226, 0.1)' : 'transparent',
                    color: format === f ? 'var(--accent-color)' : 'var(--text-color)',
                    border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: format === f ? 600 : 400,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  {f === 'image' && <ImageIcon size={14} />}
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {format === 'image' ? (
              <div style={{
                flex: 1, minHeight: '300px', borderRadius: '8px', position: 'relative',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {svgContent ? (
                  <TransformWrapper
                    initialScale={1}
                    minScale={0.1}
                    maxScale={5}
                    centerOnInit={true}
                    wheel={{ step: 0.05 }}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <>
                        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: '4px', backgroundColor: 'var(--bg-color)', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          <button onClick={() => zoomIn()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--text-color)' }} title="Phóng to">
                            <ZoomIn size={16} />
                          </button>
                          <button onClick={() => zoomOut()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--text-color)' }} title="Thu nhỏ">
                            <ZoomOut size={16} />
                          </button>
                          <button onClick={() => resetTransform()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--text-color)' }} title="Vừa màn hình">
                            <Maximize size={16} />
                          </button>
                        </div>
                        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div className="mindmap-svg-container" dangerouslySetInnerHTML={{ __html: svgContent }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                        </TransformComponent>
                      </>
                    )}
                  </TransformWrapper>
                ) : (
                  <div style={{ color: 'var(--text-color)', opacity: 0.5 }}>Đang tạo hình ảnh...</div>
                )}
              </div>
            ) : (
              <textarea 
                readOnly
                value={results[format as Exclude<Format, 'image'>]}
                style={{
                  flex: 1, minHeight: '300px', padding: '16px', borderRadius: '8px',
                  border: '1px solid var(--border-color)', backgroundColor: 'var(--hover-bg, #f9f9f9)',
                  color: 'var(--text-color)', fontFamily: 'monospace', fontSize: '13px',
                  resize: 'none', outline: 'none'
                }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              {format !== 'image' && (
                <button 
                  onClick={handleCopy}
                  style={{
                    background: 'var(--hover-bg, #f0f0f0)', color: 'var(--text-color)', border: 'none', borderRadius: '6px',
                    padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  {copied ? <Check size={16} color="green" /> : <Copy size={16} />} 
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              )}
              {format === 'image' ? (
                <>
                  <button 
                    onClick={() => handleDownloadImage('svg')}
                    style={{
                      background: 'var(--hover-bg, #f0f0f0)', color: 'var(--text-color)', border: 'none', borderRadius: '6px',
                      padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Download size={16} /> Tải SVG
                  </button>
                  <button 
                    onClick={() => handleDownloadImage('jpeg')}
                    style={{
                      background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px',
                      padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Download size={16} /> Tải JPEG (2K)
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleDownload}
                  style={{
                    background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px',
                    padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Download size={16} /> Tải về
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
