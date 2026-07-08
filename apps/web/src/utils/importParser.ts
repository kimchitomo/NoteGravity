export interface ImportNode {
  id: string;
  title: string;
  level: number;
  elementType?: string; // Ví dụ: 'h1', 'h2', 'l1', 'l2' (Heading / List)
  content?: string;
  htmlTitle?: string;
  attachments?: { filename: string; dataUrl: string; type: string }[];
  children: ImportNode[];
  metadata?: Record<string, any>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Phân tách Markdown dựa trên Heading level
 */
export const parseMarkdown = (text: string): ImportNode[] => {
  const lines = text.split('\n');
  const rootNodes: ImportNode[] = [];
  const stack: { node: ImportNode; type: 'heading' | 'list'; levelVal: number; indent: number }[] = [];
  let currentContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Nếu rỗng thì thêm xuống dòng vào content (ngoại trừ các block list liền kề)
    if (line.trim() === '') {
      if (stack.length > 0) stack[stack.length - 1].node.content += '\n';
      else currentContent += '\n';
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    const listMatch = line.match(/^(\s*)([-*+])\s+(.*)/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const elementType = `h${level}`;
      const newNode: ImportNode = { id: generateId(), title, level, elementType, content: '', children: [] };

      if (stack.length === 0 && currentContent.trim()) {
         rootNodes.push({ id: generateId(), title: 'Giới thiệu', level: 1, elementType: 'text', content: currentContent.trim(), children: [] });
         currentContent = '';
      }

      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === 'heading' && top.levelVal >= level) stack.pop();
        else if (top.type === 'list') stack.pop();
        else break;
      }

      if (stack.length === 0) rootNodes.push(newNode);
      else stack[stack.length - 1].node.children.push(newNode);
      
      stack.push({ node: newNode, type: 'heading', levelVal: level, indent: 0 });
    } else if (listMatch) {
      const indent = listMatch[1].length;
      const title = listMatch[3].trim();
      const newNode: ImportNode = { id: generateId(), title, level: 0, content: '', children: [] };

      if (stack.length === 0 && currentContent.trim()) {
         rootNodes.push({ id: generateId(), title: 'Giới thiệu', level: 1, elementType: 'text', content: currentContent.trim(), children: [] });
         currentContent = '';
      }

      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === 'list' && top.indent >= indent) stack.pop();
        else break;
      }

      const top = stack[stack.length - 1];
      newNode.level = top ? top.node.level + 1 : 1;
      newNode.elementType = `l${newNode.level}`;

      if (stack.length === 0) rootNodes.push(newNode);
      else top.node.children.push(newNode);

      stack.push({ node: newNode, type: 'list', levelVal: newNode.level, indent });
    } else {
      if (stack.length > 0) stack[stack.length - 1].node.content += line + '\n';
      else currentContent += line + '\n';
    }
  }

  if (rootNodes.length === 0 && currentContent.trim()) {
    rootNodes.push({ id: generateId(), title: 'Tài liệu Markdown', level: 1, elementType: 'text', content: currentContent.trim(), children: [] });
  }

  return rootNodes;
};

/**
 * Phân tích cấu trúc Mermaid Mindmap dựa trên khoảng trắng thụt lề (Indentation)
 */
export const parseMermaid = (text: string): ImportNode[] => {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const rootNodes: ImportNode[] = [];
  const stack: { node: ImportNode, indent: number }[] = [];

  // Bỏ qua dòng `mindmap` và dòng blank
  let startIndex = 0;
  if (lines[0].trim().startsWith('mindmap')) startIndex = 1;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    
    // Xóa các ký tự đặc biệt của mermaid như (( )), [ ], ( )
    let title = line.trim().replace(/^[\(\[\{]+|[\)\]\}]+$/g, '').trim();
    if (!title) continue;

    const newNode: ImportNode = {
      id: generateId(),
      title,
      level: 0, // Sẽ tính lại theo stack
      children: []
    };

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    newNode.level = stack.length > 0 ? stack[stack.length - 1].node.level + 1 : 1;

    if (stack.length === 0) {
      rootNodes.push(newNode);
    } else {
      stack[stack.length - 1].node.children.push(newNode);
    }

    stack.push({ node: newNode, indent });
  }

  return rootNodes;
};

/**
 * Chuyển JSON thành Tree
 */
export const parseJSON = (text: string): ImportNode[] => {
  try {
    const data = JSON.parse(text);
    
    const buildTree = (obj: any, level: number = 1, defaultTitle: string = 'Node'): ImportNode => {
      const node: ImportNode = {
        id: generateId(),
        title: obj.title || obj.name || defaultTitle,
        level,
        content: obj.content || obj.text || obj.description || '',
        children: []
      };

      if (Array.isArray(obj)) {
        node.children = obj.map((item, i) => buildTree(item, level + 1, `Item ${i+1}`));
      } else if (typeof obj === 'object' && obj !== null) {
        // Nếu có trường children
        if (Array.isArray(obj.children)) {
          node.children = obj.children.map((c: any) => buildTree(c, level + 1));
        } else if (Array.isArray(obj.items)) {
          node.children = obj.items.map((c: any) => buildTree(c, level + 1));
        } else {
          // Flatten các key không phải chuẩn thành content hoặc child
          const keys = Object.keys(obj).filter(k => !['title', 'name', 'content', 'text', 'description'].includes(k));
          for (const key of keys) {
            if (typeof obj[key] === 'object') {
              node.children.push(buildTree(obj[key], level + 1, key));
            } else {
               node.content += `\n**${key}**: ${obj[key]}`;
            }
          }
        }
      } else {
        node.content = String(obj);
      }
      return node;
    };

    if (Array.isArray(data)) {
       return data.map(item => buildTree(item, 1));
    } else {
       return [buildTree(data, 1, 'Root')];
    }
  } catch (e) {
    return [{
      id: generateId(),
      title: 'Invalid JSON',
      level: 1,
      content: 'Lỗi không thể parse cấu trúc JSON.',
      children: []
    }];
  }
};

/**
 * Phân tích CSV thành một danh sách phẳng hoặc phân nhóm
 */
export const parseCSV = (text: string): ImportNode[] => {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rootNodes: ImportNode[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    let title = row[0] || `Row ${i}`;
    let content = '';
    
    for (let j = 1; j < headers.length; j++) {
      if (row[j]) content += `**${headers[j]}**: ${row[j]}\n`;
    }

    rootNodes.push({
      id: generateId(),
      title,
      level: 1,
      content: content.trim(),
      children: []
    });
  }

  return rootNodes;
};

/**
 * Trích xuất nhị phân thô để tìm text và hình ảnh JPEG/PNG (.one, .pst)
 */
export const parseBinary = async (file: File): Promise<ImportNode[]> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  const rootNode: ImportNode = {
    id: generateId(),
    title: `Trích xuất từ ${file.name}`,
    level: 1,
    content: 'Tệp nhị phân đã được phân tích thô do định dạng không được mã hoá dạng plain text.\n\n',
    children: [],
    attachments: []
  };

  // 1. Quét tìm Text (ASCII Printable Strings)
  let currentString = '';
  const minStringLen = 20; // Chỉ lấy các đoạn dài hơn 20 ký tự
  for (let i = 0; i < Math.min(bytes.length, 1024 * 500); i++) { // Quét 500KB đầu để lấy metadata/text
    const byte = bytes[i];
    // Chữ cái tiếng Anh, số, dấu câu thông thường
    if (byte >= 32 && byte <= 126) {
      currentString += String.fromCharCode(byte);
    } else {
      if (currentString.length > minStringLen) {
        rootNode.content += currentString.trim() + '\n';
      }
      currentString = '';
    }
  }

  // 2. Quét tìm chữ ký (magic bytes) của hình ảnh JPG / PNG (giới hạn quét 5MB)
  let offset = 0;
  const maxScan = Math.min(bytes.length, 5 * 1024 * 1024);
  let imgCount = 0;

  while (offset < maxScan) {
    // Tìm JPEG (FF D8 FF E0 hoặc FF D8 FF E1)
    if (bytes[offset] === 0xFF && bytes[offset+1] === 0xD8 && bytes[offset+2] === 0xFF) {
      // Tìm EOF JPEG (FF D9)
      let endOffset = offset + 3;
      while (endOffset < maxScan - 1) {
        if (bytes[endOffset] === 0xFF && bytes[endOffset+1] === 0xD9) {
          endOffset += 2;
          break;
        }
        endOffset++;
      }
      
      if (endOffset > offset + 100) { // Hình ảnh hợp lệ
        const imgBytes = bytes.slice(offset, endOffset);
        let binaryStr = '';
        for (let i = 0; i < imgBytes.length; i++) binaryStr += String.fromCharCode(imgBytes[i]);
        const b64 = window.btoa(binaryStr);
        rootNode.attachments?.push({
          filename: `extracted_image_${++imgCount}.jpg`,
          dataUrl: `data:image/jpeg;base64,${b64}`,
          type: 'image/jpeg'
        });
        offset = endOffset;
        continue;
      }
    }
    
    // Tìm PNG (89 50 4E 47 0D 0A 1A 0A)
    if (bytes[offset] === 0x89 && bytes[offset+1] === 0x50 && bytes[offset+2] === 0x4E && bytes[offset+3] === 0x47) {
      // Tìm IEND chunk (49 45 4E 44 AE 42 60 82)
      let endOffset = offset + 8;
      while (endOffset < maxScan - 8) {
        if (bytes[endOffset] === 0x49 && bytes[endOffset+1] === 0x45 && bytes[endOffset+2] === 0x4E && bytes[endOffset+3] === 0x44) {
          endOffset += 8; // Kèm cả CRC 4 bytes của IEND
          break;
        }
        endOffset++;
      }

      if (endOffset > offset + 100) {
        const imgBytes = bytes.slice(offset, endOffset);
        let binaryStr = '';
        for (let i = 0; i < imgBytes.length; i++) binaryStr += String.fromCharCode(imgBytes[i]);
        const b64 = window.btoa(binaryStr);
        rootNode.attachments?.push({
          filename: `extracted_image_${++imgCount}.png`,
          dataUrl: `data:image/png;base64,${b64}`,
          type: 'image/png'
        });
        offset = endOffset;
        continue;
      }
    }
    
    offset++;
  }

  if (rootNode.attachments && rootNode.attachments.length > 0) {
     rootNode.content += `\n\n*(Đã trích xuất ${rootNode.attachments.length} tập tin đính kèm/hình ảnh từ file gốc)*`;
  }

  return [rootNode];
};

import * as mammoth from 'mammoth';

export const parseDocx = async (file: File): Promise<ImportNode[]> => {
  try {
    const buffer = await file.arrayBuffer();
    
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const html = result.value; 
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    const rootNodes: ImportNode[] = [];
    const stack: { node: ImportNode; levelVal: number; type: 'heading' | 'list' }[] = [];
    
    let currentContent = '';
    const elements = doc.body.children;
    
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const tagName = el.tagName.toLowerCase();
      
      if (tagName.startsWith('h') && tagName.length === 2) {
        const level = parseInt(tagName[1], 10);
        if (!isNaN(level)) {
          const title = el.textContent || 'Không có tiêu đề';
          const htmlTitle = el.innerHTML || title;
          const elementType = `h${level}`;
          const newNode: ImportNode = { id: generateId(), title, htmlTitle, level: 0, elementType, content: '', children: [] };
          
          if (stack.length === 0 && currentContent.trim()) {
            rootNodes.push({ id: generateId(), title: 'Đoạn văn giới thiệu', level: 1, elementType: 'text', content: currentContent.trim(), children: [] });
            currentContent = '';
          }
          
          while (stack.length > 0) {
            const top = stack[stack.length - 1];
            if (top.type === 'heading' && top.levelVal >= level) stack.pop();
            else if (top.type === 'list') stack.pop();
            else break;
          }
          
          const top = stack[stack.length - 1];
          newNode.level = top ? top.node.level + 1 : 1;
          
          if (top) top.node.children.push(newNode);
          else rootNodes.push(newNode);
          
          stack.push({ node: newNode, type: 'heading', levelVal: level });
        }
      } else if (tagName === 'ul' || tagName === 'ol') {
        const processList = (listEl: Element, currentDepth: number) => {
           Array.from(listEl.children).forEach((li) => {
              if (li.tagName.toLowerCase() !== 'li') return;
              
              let title = '';
              let htmlTitle = '';
              const ulChildren: Element[] = [];
              Array.from(li.childNodes).forEach(child => {
                 if (child.nodeType === Node.TEXT_NODE) {
                     title += child.textContent;
                     htmlTitle += child.textContent;
                 }
                 else if (child.nodeType === Node.ELEMENT_NODE) {
                    const elName = (child as Element).tagName.toLowerCase();
                    if (elName === 'ul' || elName === 'ol') ulChildren.push(child as Element);
                    else {
                        title += child.textContent;
                        htmlTitle += (child as Element).outerHTML;
                    }
                 }
              });

              title = title.trim() || 'Mục danh sách';
              const newNode: ImportNode = { id: generateId(), title, htmlTitle: htmlTitle.trim() || title, level: 0, elementType: `l${currentDepth}`, content: '', children: [] };
              
              if (stack.length === 0 && currentContent.trim()) {
                rootNodes.push({ id: generateId(), title: 'Đoạn văn giới thiệu', level: 1, elementType: 'text', content: currentContent.trim(), children: [] });
                currentContent = '';
              }

              while (stack.length > 0) {
                 const top = stack[stack.length - 1];
                 if (top.type === 'heading') break;
                 if (top.type === 'list' && top.levelVal >= currentDepth) stack.pop();
                 else break;
              }

              const top = stack[stack.length - 1];
              newNode.level = top ? top.node.level + 1 : 1;
              
              if (top) top.node.children.push(newNode);
              else rootNodes.push(newNode);
              
              stack.push({ node: newNode, levelVal: currentDepth, type: 'list' });

              ulChildren.forEach(ul => processList(ul, currentDepth + 1));
           });
        };

        processList(el, 1);
      } else if (tagName === 'p') {
        const text = el.innerHTML.replace(/<br\s*\/?>/gi, '\n') + '\n';
        if (stack.length > 0) {
           stack[stack.length - 1].node.content += text;
        } else {
           currentContent += text;
        }
      } else {
        const text = el.textContent + '\n';
        if (stack.length > 0) stack[stack.length - 1].node.content += text;
        else currentContent += text;
      }
    }
    
    if (rootNodes.length === 0 && currentContent.trim()) {
       rootNodes.push({ id: generateId(), title: 'Tài liệu Docx', level: 1, elementType: 'text', content: currentContent.trim(), children: [] });
    }
    
    return rootNodes;
  } catch (e) {
    console.error('Lỗi parse docx', e);
    return [{ id: generateId(), title: 'Lỗi đọc file', level: 1, elementType: 'text', content: 'Không thể đọc file .docx này.', children: [] }];
  }
};

export const parseFileToTree = async (file: File): Promise<ImportNode[]> => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  if (['one', 'pst', 'doc'].includes(ext || '')) {
    return await parseBinary(file);
  }

  if (ext === 'docx') {
    return await parseDocx(file);
  }

  const text = await file.text();
  switch (ext) {
    case 'md':
      return parseMarkdown(text);
    case 'mermaid':
      return parseMermaid(text);
    case 'json':
      return parseJSON(text);
    case 'csv':
      return parseCSV(text);
    default:
      return parseMarkdown(text);
  }
};
