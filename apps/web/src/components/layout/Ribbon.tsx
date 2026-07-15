import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronUp, ChevronDown, Bold, Italic, Underline, Strikethrough, Highlighter, PaintBucket, Type, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, CheckSquare, Link, Image, Table, Mic, Video, Clock,
  FileText, Paperclip, LayoutTemplate, Calculator, Smile, MousePointer2, Lasso, Hand, PenTool, Edit3, Square, Circle, Triangle, TrendingUp, MonitorSmartphone, Ear, Palette, FileSearch, Trash2, History, MessageSquare, SpellCheck, Globe, Lock, Search, Send,
  Indent, Outdent, ArrowUpDown, Crop, AppWindow, Pin, UserMinus, Languages, Grid, Eraser, ZoomIn, ZoomOut, EyeOff, BookOpen, Replace, Slash, Minus, Maximize2, ArrowRight
} from 'lucide-react';
import { BackstageView, Tab } from './BackstageView';
import { RecordingModal } from '../modals/RecordingModal';
import { ImmersiveReaderModal } from '../modals/ImmersiveReaderModal';
import { RecycleBinModal } from '../modals/RecycleBinModal';
import { PageVersionsModal } from '../modals/PageVersionsModal';
import { FindReplaceModal } from '../modals/FindReplaceModal';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useEditorStore } from '../../store/useEditorStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useTreeStore } from '../../store/useTreeStore';

type TabId = 'file' | 'home' | 'insert' | 'draw' | 'view' | 'history' | 'review' | 'table-layout';

import { RecentEditsModal } from '../modals/RecentEditsModal';

export const Ribbon: React.FC = () => {
  const isMobile = useIsMobile();
  const activeEditor = useEditorStore(state => state.activeEditor);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findReplaceMode, setFindReplaceMode] = useState<'find' | 'replace'>('find');
  
  useEffect(() => {
    if (isMobile) setIsCollapsed(true);
  }, [isMobile]);
  const [showBackstage, setShowBackstage] = useState<Tab | false>(false);
  
  const immersivePlaylist = useWorkspaceStore(state => state.immersivePlaylist);
  const setImmersivePlaylist = useWorkspaceStore(state => state.setImmersivePlaylist);
  
  // Handle Ctrl+P shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowBackstage('print');
      }
      // Ctrl+F = Find, Ctrl+H = Replace
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindReplaceMode('find');
        setShowFindReplace(true);
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setFindReplaceMode('replace');
        setShowFindReplace(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // === Đăng ký phím tắt cho tất cả Ribbon tools ===
  useEffect(() => {
    const handleRibbonKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inEditor = target.isContentEditable || target.tagName === 'TEXTAREA';
      const ctrl = e.ctrlKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const key = e.key.toLowerCase();

      // --- HOME tab shortcuts (hoạt động trong editor) ---
      // Ctrl+Shift+X = Strikethrough (Ctrl+B/I/U/S đã do TipTap xử lý)
      if (ctrl && shift && key === 'x') { e.preventDefault(); activeEditor?.chain().focus().toggleStrike().run(); return; }
      // Ctrl+Shift+H = Highlight
      if (ctrl && shift && key === 'h' && inEditor) { e.preventDefault(); activeEditor?.chain().focus().toggleHighlight().run(); return; }
      // Alt+Shift+5 = Strikethrough alternative
      // Ctrl+Shift+L = Align Left
      if (ctrl && shift && key === 'l') { e.preventDefault(); activeEditor?.chain().focus().setTextAlign('left').run(); return; }
      // Ctrl+Shift+E = Align Center
      if (ctrl && shift && key === 'e') { e.preventDefault(); activeEditor?.chain().focus().setTextAlign('center').run(); return; }
      // Ctrl+Shift+R = Align Right
      if (ctrl && shift && key === 'r') { e.preventDefault(); activeEditor?.chain().focus().setTextAlign('right').run(); return; }
      // Ctrl+Shift+J = Justify
      if (ctrl && shift && key === 'j') { e.preventDefault(); activeEditor?.chain().focus().setTextAlign('justify').run(); return; }
      // Ctrl+Shift+7 = Ordered List
      if (ctrl && shift && key === '7') { e.preventDefault(); activeEditor?.chain().focus().toggleOrderedList().run(); return; }
      // Ctrl+Shift+8 = Bullet List
      if (ctrl && shift && key === '8') { e.preventDefault(); activeEditor?.chain().focus().toggleBulletList().run(); return; }
      // Ctrl+Shift+9 = Task List
      if (ctrl && shift && key === '9') { e.preventDefault(); activeEditor?.chain().focus().toggleTaskList().run(); return; }
      // Tab = Indent (inside list)
      // Shift+Tab = Outdent (inside list)
      // Ctrl+Shift+. = Increase font size (placeholder)
      // Ctrl+Shift+, = Decrease font size (placeholder)

      // --- INSERT tab shortcuts ---
      // Ctrl+Shift+T = Insert Table
      if (ctrl && shift && key === 't') { e.preventDefault(); activeEditor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); return; }
      // Ctrl+K = Insert Link (standard)
      if (ctrl && key === 'k' && inEditor) { e.preventDefault(); const url = window.prompt('URL liên kết:'); if (url) activeEditor?.chain().focus().setLink({ href: url }).run(); return; }
      // Ctrl+Shift+D = Insert Date/Time
      if (ctrl && shift && key === 'd') { e.preventDefault(); if (inEditor) activeEditor?.chain().focus().insertContent(new Date().toLocaleString('vi-VN')).run(); return; }
      // Ctrl+Shift+I = Insert Image
      if (ctrl && shift && key === 'i') { e.preventDefault(); document.getElementById('ribbon-img-input')?.click(); return; }

      // --- DRAW tab shortcuts ---
      // Alt+1 = Type tool
      if (alt && key === '1') { e.preventDefault(); useCanvasStore.getState().setDrawTool('type'); return; }
      // Alt+2 = Pen tool
      if (alt && key === '2') { e.preventDefault(); useCanvasStore.getState().setDrawTool('pen'); return; }
      // Alt+3 = Highlighter tool
      if (alt && key === '3') { e.preventDefault(); useCanvasStore.getState().setDrawTool('highlighter'); return; }
      // Alt+4 = Eraser tool
      if (alt && key === '4') { e.preventDefault(); useCanvasStore.getState().setDrawTool('eraser'); return; }
      // Alt+5 = Shape tool
      if (alt && key === '5') { e.preventDefault(); useCanvasStore.getState().setDrawTool('shape'); return; }
      // Alt+6 = Panning
      if (alt && key === '6') { e.preventDefault(); useCanvasStore.getState().setDrawTool('pan'); return; }
      // Escape = Back to Type tool (from drawing)
      if (key === 'escape' && !inEditor) { useCanvasStore.getState().setDrawTool('type'); return; }

      // --- VIEW tab shortcuts ---
      // Ctrl+= (plus) = Zoom in
      if (ctrl && (key === '=' || key === '+')) {
        const activeNoteId = useWorkspaceStore.getState().activeNoteId;
        if (activeNoteId) {
          const cur = useCanvasStore.getState().pages[activeNoteId]?.zoom || 1;
          useCanvasStore.getState().setZoom(activeNoteId, Math.min(3, cur + 0.25));
          e.preventDefault();
        }
        return;
      }
      // Ctrl+- = Zoom out
      if (ctrl && key === '-') {
        const activeNoteId = useWorkspaceStore.getState().activeNoteId;
        if (activeNoteId) {
          const cur = useCanvasStore.getState().pages[activeNoteId]?.zoom || 1;
          useCanvasStore.getState().setZoom(activeNoteId, Math.max(0.25, cur - 0.25));
          e.preventDefault();
        }
        return;
      }
      // Ctrl+0 = Zoom 100%
      if (ctrl && key === '0') {
        const activeNoteId = useWorkspaceStore.getState().activeNoteId;
        if (activeNoteId) { useCanvasStore.getState().setZoom(activeNoteId, 1); e.preventDefault(); }
        return;
      }
      // Ctrl+Shift+F = Fullscreen
      if (ctrl && shift && key === 'f') { e.preventDefault(); if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); return; }

      // --- REVIEW shortcuts ---
      // F7 = Spelling toggle (browser native)
      // Ctrl+Shift+G = Translate selection
      if (ctrl && shift && key === 'g') {
        const selected = window.getSelection()?.toString();
        if (selected) { e.preventDefault(); window.open(`https://translate.google.com/?sl=auto&tl=vi&text=${encodeURIComponent(selected)}`, '_blank', 'width=1000,height=600'); }
        return;
      }
      // Ctrl+Shift+P = Password/Lock toggle
      if (ctrl && shift && key === 'p') {
        e.preventDefault();
        const activeNoteId = useWorkspaceStore.getState().activeNoteId;
        if (activeNoteId) useTreeStore.getState().toggleLock(activeNoteId);
        return;
      }

      // --- Heading shortcuts (Ctrl+Alt+1/2/3) ---
      if (ctrl && alt && key === '1') { e.preventDefault(); activeEditor?.chain().focus().toggleHeading({ level: 1 }).run(); return; }
      if (ctrl && alt && key === '2') { e.preventDefault(); activeEditor?.chain().focus().toggleHeading({ level: 2 }).run(); return; }
      if (ctrl && alt && key === '3') { e.preventDefault(); activeEditor?.chain().focus().toggleHeading({ level: 3 }).run(); return; }
      if (ctrl && alt && key === '0') { e.preventDefault(); activeEditor?.chain().focus().setParagraph().run(); return; }
      // Ctrl+Shift+B = Blockquote
      if (ctrl && shift && key === 'b') { e.preventDefault(); activeEditor?.chain().focus().toggleBlockquote().run(); return; }
      // Ctrl+Shift+C = Code Block
      if (ctrl && shift && key === 'c' && !inEditor) { e.preventDefault(); activeEditor?.chain().focus().toggleCodeBlock().run(); return; }
    };

    window.addEventListener('keydown', handleRibbonKeys, true);
    return () => window.removeEventListener('keydown', handleRibbonKeys, true);
  }, [activeEditor]);
  
  // Contextual state
  const isTableActive = activeEditor?.isActive('table') || false;

  const tabs: { id: TabId, label: string, isContextual?: boolean, contextColor?: string }[] = [
    { id: 'file', label: 'File' },
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'draw', label: 'Draw' },
    { id: 'view', label: 'View' },
    { id: 'history', label: 'History' },
    { id: 'review', label: 'Review' },
    ...(isTableActive ? [{ id: 'table-layout' as TabId, label: 'Layout', isContextual: true, contextColor: '#f59e0b' }] : []),
  ];

  return (
    <>
      <ImmersiveReaderModal isOpen={!!immersivePlaylist} onClose={() => setImmersivePlaylist(null)} text={''} />
      {showBackstage && <BackstageView initialTab={showBackstage as Tab} onClose={() => setShowBackstage(false)} />}
      {showFindReplace && <FindReplaceModal initialMode={findReplaceMode} onClose={() => setShowFindReplace(false)} />}
      
      <div style={{
        backgroundColor: '#f3f4f6',
        borderBottom: '1px solid #d1d5db',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none'
      }}>
        {/* Tab Headers */}
        <div style={{ display: 'flex', padding: '0 8px', gap: '2px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'file') {
                  setShowBackstage('info');
                } else {
                  setActiveTab(tab.id);
                  if (isCollapsed) setIsCollapsed(false);
                }
              }}
              style={{
                padding: '6px 12px',
                color: tab.id === 'file' ? '#ffffff' : '#374151',
                backgroundColor: tab.id === 'file' ? '#10b981' : (activeTab === tab.id && !isCollapsed ? '#ffffff' : 'transparent'),
                borderRadius: tab.id === 'file' ? '4px 4px 0 0' : (activeTab === tab.id && !isCollapsed ? '4px 4px 0 0' : '4px'),
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === tab.id && !isCollapsed ? 600 : 400,
                border: activeTab === tab.id && !isCollapsed ? '1px solid #d1d5db' : '1px solid transparent',
                borderBottom: activeTab === tab.id && !isCollapsed ? '1px solid #ffffff' : '1px solid transparent',
                marginBottom: activeTab === tab.id && !isCollapsed ? '-1px' : '0',
                zIndex: activeTab === tab.id && !isCollapsed ? 1 : 0
              }}
            >
              {tab.label}
            </button>
          ))}
          
          <div style={{ flex: 1 }} />
          
          {/* Collapse Button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 8px' }}
            title={isCollapsed ? "Pin Ribbon" : "Collapse Ribbon"}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Ribbon Content */}
        {!isCollapsed && (
          <div style={{
            height: '90px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #d1d5db',
            display: 'flex',
            padding: '4px 8px',
            overflowX: 'auto',
            overflowY: 'hidden'
          }}>
            {activeTab === 'home' && <HomeRibbonContent activeEditor={activeEditor} />}
            {activeTab === 'insert' && <InsertRibbonContent activeEditor={activeEditor} />}
            {activeTab === 'draw' && <DrawRibbonContent activeEditor={activeEditor} />}
            {activeTab === 'view' && <ViewRibbonContent />}
            {activeTab === 'history' && <HistoryRibbonContent activeEditor={activeEditor} />}
            {activeTab === 'review' && <ReviewRibbonContent activeEditor={activeEditor} />}
            {activeTab === 'table-layout' && <TableLayoutRibbonContent activeEditor={activeEditor} />}
          </div>
        )}

        <style>{`
          .ribbon-group {
            display: flex;
            align-items: center;
            padding: 0 12px;
            border-right: 1px solid #e5e7eb;
            position: relative;
          }
          .ribbon-group-title {
            position: absolute;
            bottom: -2px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
          }
          .ribbon-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: 1px solid transparent;
            border-radius: 4px;
            cursor: pointer;
            color: #374151;
            padding: 4px;
            gap: 2px;
          }
          .ribbon-btn:hover { background-color: #f3f4f6; border-color: #e5e7eb; }
          .ribbon-btn-small {
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: 1px solid transparent;
            border-radius: 4px;
            cursor: pointer;
            color: #374151;
            padding: 4px;
          }
          .ribbon-btn-small:hover { background-color: #f3f4f6; border-color: #e5e7eb; }
          .ribbon-btn-small.active { background-color: #e5e7eb; border-color: #d1d5db; }
          
          /* Tooltip system */
          [title] { position: relative; }
          .ribbon-btn[title]:hover::after,
          .ribbon-btn-small[title]:hover::after,
          button[title]:hover::after,
          label[title]:hover::after {
            content: attr(title);
            position: fixed;
            bottom: auto;
            left: auto;
            z-index: 999999;
            transform: translate(-50%, 8px);
            background: linear-gradient(135deg, #1e293b, #0f172a);
            color: #f1f5f9;
            padding: 5px 10px;
            border-radius: 7px;
            font-size: 11.5px;
            font-weight: 500;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            letter-spacing: 0.2px;
            line-height: 1.4;
            font-family: 'Inter', system-ui, sans-serif;
          }
        `}</style>
      </div>
    </>
  );
};

const HomeRibbonContent = ({ activeEditor }: { activeEditor: any }) => {
  const [fontColorPickerRef] = useState(() => ({ current: null as HTMLInputElement | null }));
  const [painterMode, setPainterMode] = useState(false);
  const [savedMarks, setSavedMarks] = useState<any>(null);
  const [lineHeightOpen, setLineHeightOpen] = useState(false);
  const lineHeightBtnRef = useRef<HTMLButtonElement>(null);
  const [lineHeightCoords, setLineHeightCoords] = useState({ top: 0, left: 0 });

  const handleCut = () => {
    try { document.execCommand('cut'); } catch { navigator.clipboard.writeText(window.getSelection()?.toString() || ''); }
  };
  const handleCopy = () => {
    try { document.execCommand('copy'); } catch { navigator.clipboard.writeText(window.getSelection()?.toString() || ''); }
  };
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (activeEditor) activeEditor.chain().focus().insertContent(text).run();
      else document.execCommand('paste');
    } catch { document.execCommand('paste'); }
  };

  const handleFormatPainter = () => {
    if (!activeEditor) return;
    if (!painterMode) {
      // Lưu marks hiện tại
      const marks = activeEditor.getAttributes('textStyle');
      const bold = activeEditor.isActive('bold');
      const italic = activeEditor.isActive('italic');
      const underline = activeEditor.isActive('underline');
      const strike = activeEditor.isActive('strike');
      setSavedMarks({ marks, bold, italic, underline, strike });
      setPainterMode(true);
    } else {
      // Áp dụng marks đã lưu
      if (savedMarks) {
        const chain = activeEditor.chain().focus();
        if (savedMarks.bold) chain.setBold(); else chain.unsetBold();
        if (savedMarks.italic) chain.setItalic(); else chain.unsetItalic();
        if (savedMarks.underline) chain.setUnderline(); else chain.unsetUnderline();
        if (savedMarks.strike) chain.setStrike(); else chain.unsetStrike();
        chain.run();
      }
      setPainterMode(false);
      setSavedMarks(null);
    }
  };

  const toggleLineHeightDropdown = () => {
    if (!lineHeightOpen && lineHeightBtnRef.current) {
      const rect = lineHeightBtnRef.current.getBoundingClientRect();
      setLineHeightCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setLineHeightOpen(!lineHeightOpen);
  };

  return (
    <>
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }} onClick={handlePaste} title="Dán nội dung từ clipboard (Ctrl+V)">
        <div style={{ width: '32px', height: '32px', backgroundColor: '#fbbf24', borderRadius: '4px', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
        <span style={{ fontSize: '12px' }}>Paste</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%' }}>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '60px' }} onClick={handleCut} title="Cắt văn bản đã chọn (Ctrl+X)">✂ Cut</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '60px' }} onClick={handleCopy} title="Sao chép văn bản đã chọn (Ctrl+C)">📄 Copy</button>
        <button className={`ribbon-btn-small ${painterMode ? 'active' : ''}`} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '60px', color: painterMode ? '#3b82f6' : undefined }} onClick={handleFormatPainter} title={painterMode ? 'Click vào text để áp dụng định dạng (Ctrl+Shift+V)' : 'Sao chép định dạng (Ctrl+Shift+V)'}>
          🖌 Painter
        </button>
      </div>
      <div className="ribbon-group-title">Clipboard</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start', paddingBottom: '16px', gap: '4px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <select 
            style={{ height: '24px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px', width: '120px' }}
            onChange={(e) => activeEditor?.chain().focus().setFontFamily(e.target.value).run()}
            value={activeEditor?.getAttributes('textStyle')?.fontFamily || ''}
          >
            <option value="">Default</option>
            <option value="Inter">Inter</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
          <select 
            style={{ height: '24px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px', width: '50px' }}
            onChange={(e) => activeEditor?.chain().focus().setFontSize(`${e.target.value}px`).run()}
            value={activeEditor?.getAttributes('textStyle')?.fontSize?.replace('px', '') || '16'}
          >
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="24">24</option>
            <option value="36">36</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className={`ribbon-btn-small ${activeEditor?.isActive('bold') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleBold().run()} title="In đậm (Ctrl+B)"><Bold size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive('italic') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleItalic().run()} title="In nghiêng (Ctrl+I)"><Italic size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive('underline') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleUnderline().run()} title="Gạch chân (Ctrl+U)"><Underline size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive('strike') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleStrike().run()} title="Gạch ngang (Ctrl+Shift+X)"><Strikethrough size={14} /></button>
          <div style={{ width: '1px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />
          <button className={`ribbon-btn-small ${activeEditor?.isActive('highlight') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleHighlight().run()} title="Tô sáng (Ctrl+Shift+H)"><Highlighter size={14} color="#facc15" /></button>
          {/* Font Color with color picker */}
          <label title="Màu chữ (chọn màu)" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 4, border: '1px solid transparent', cursor: 'pointer', position: 'relative' }}
            className="ribbon-btn-small">
            <Type size={14} />
            <input type="color" defaultValue="#111827"
              onChange={(e) => activeEditor?.chain().focus().setColor(e.target.value).run()}
              style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', inset: 0 }} />
          </label>
          <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().clearNodes().unsetAllMarks().run()} title="Xóa định dạng (Ctrl+\\)"><PaintBucket size={14} /></button>
        </div>
      </div>
      <div className="ribbon-group-title">Basic Text</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', maxWidth: 280 }}>
        <button className={`ribbon-btn ${activeEditor?.isActive('paragraph') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().setParagraph().run()} style={{ border: '1px solid #d1d5db', backgroundColor: '#f9fafb', minWidth: 60 }} title="Văn bản thường (Ctrl+Alt+0)">
          <span style={{ fontSize: '13px' }}>AaBb</span>
          <span style={{ fontSize: '10px' }}>Normal</span>
        </button>
        <button className={`ribbon-btn ${activeEditor?.isActive('heading', { level: 1 }) ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 1 }).run()} style={{ border: '1px solid transparent', minWidth: 60 }} title="Tiêu đề 1 (Ctrl+Alt+1)">
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>AaBb</span>
          <span style={{ fontSize: '10px' }}>Heading 1</span>
        </button>
        <button className={`ribbon-btn ${activeEditor?.isActive('heading', { level: 2 }) ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 2 }).run()} style={{ border: '1px solid transparent', minWidth: 60 }} title="Tiêu đề 2 (Ctrl+Alt+2)">
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>AaBb</span>
          <span style={{ fontSize: '10px' }}>Heading 2</span>
        </button>
        <button className={`ribbon-btn ${activeEditor?.isActive('heading', { level: 3 }) ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 3 }).run()} style={{ border: '1px solid transparent', minWidth: 60 }} title="Tiêu đề 3 (Ctrl+Alt+3)">
          <span style={{ fontSize: '12px', fontWeight: 600 }}>AaBb</span>
          <span style={{ fontSize: '10px' }}>Heading 3</span>
        </button>
        <button className={`ribbon-btn ${activeEditor?.isActive('blockquote') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleBlockquote().run()} style={{ border: '1px solid transparent', minWidth: 60 }} title="Trích dẫn (Ctrl+Shift+B)">
          <span style={{ fontSize: '13px', borderLeft: '3px solid #9ca3af', paddingLeft: 3, color: '#6b7280' }}>AaBb</span>
          <span style={{ fontSize: '10px' }}>Quote</span>
        </button>
        <button className={`ribbon-btn ${activeEditor?.isActive('codeBlock') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleCodeBlock().run()} style={{ border: '1px solid transparent', minWidth: 60 }} title="Khối lệnh (Ctrl+Alt+C)">
          <span style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '0 3px', borderRadius: 2 }}>code</span>
          <span style={{ fontSize: '10px' }}>Code</span>
        </button>
      </div>
      <div className="ribbon-group-title">Styles</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className={`ribbon-btn-small ${activeEditor?.isActive('bulletList') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleBulletList().run()} title="Danh sách chấm (Ctrl+Shift+8)"><List size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive('orderedList') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()} title="Danh sách số (Ctrl+Shift+7)"><ListOrdered size={14} /></button>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className={`ribbon-btn-small ${activeEditor?.isActive({ textAlign: 'left' }) ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().setTextAlign('left').run()} title="Căn trái (Ctrl+Shift+L)"><AlignLeft size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive({ textAlign: 'center' }) ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().setTextAlign('center').run()} title="Căn giữa (Ctrl+Shift+E)"><AlignCenter size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive({ textAlign: 'right' }) ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().setTextAlign('right').run()} title="Căn phải (Ctrl+Shift+R)"><AlignRight size={14} /></button>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().sinkListItem('listItem').run()} title="Giảm thụt lề (Shift+Tab)"><Outdent size={14} /></button>
          <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().liftListItem('listItem').run()} title="Tăng thụt lề (Tab)"><Indent size={14} /></button>
          {/* Paragraph Spacing dropdown */}
          <button ref={lineHeightBtnRef} className="ribbon-btn-small" onClick={toggleLineHeightDropdown} title="Giãn dòng (Alt+L)"><ArrowUpDown size={14} /></button>
        </div>
      </div>
      <div className="ribbon-group-title">Paragraph</div>
    </div>

    {lineHeightOpen && createPortal(
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setLineHeightOpen(false)} />
        <div style={{ position: 'absolute', top: `${lineHeightCoords.top}px`, left: `${lineHeightCoords.left}px`, backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '4px 0', zIndex: 99999, minWidth: 140 }}>
          <div style={{ padding: '4px 12px', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>GIÃN DÒNG</div>
          {[['1.0', '1.0'], ['1.15', '1.15'], ['1.5', '1.5'], ['2.0', '2.0'], ['2.5', '2.5']].map(([label, val]) => (
            <div key={val} onClick={() => { activeEditor?.chain().focus().setNode('paragraph', { lineHeight: val }).run(); setLineHeightOpen(false); }}
              style={{ padding: '7px 16px', cursor: 'pointer', fontSize: 13 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              {label}
            </div>
          ))}
        </div>
      </>,
      document.body
    )}

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className={`ribbon-btn ${activeEditor?.isActive('taskList') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleTaskList().run()} style={{ padding: '4px 8px' }} title="Danh sách việc cần làm (Ctrl+Shift+9)">
        <CheckSquare size={24} color="#10b981" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>To Do</span>
      </button>
      <button className="ribbon-btn" onClick={() => {
        const searchInput = document.querySelector('input[placeholder="Tìm kiếm mọi thứ..."]') as HTMLInputElement;
        if (searchInput) { searchInput.value = '#'; searchInput.focus(); }
      }} style={{ padding: '4px 8px' }} title="Tìm thẻ tag (#) trong ghi chú">
        <Search size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Find Tags</span>
      </button>
      <div className="ribbon-group-title">Tags</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" onClick={() => {
        const content = activeEditor?.getHTML() || '';
        const text = activeEditor?.getText() || '';
        const subject = encodeURIComponent('NoteGravity – Chia sẻ ghi chú');
        const body = encodeURIComponent(text.slice(0, 2000) + (text.length > 2000 ? '...(xem đầy đủ tại NoteGravity)' : ''));
        window.open(`mailto:?subject=${subject}&body=${body}`);
      }} style={{ padding: '4px 8px' }}>
        <Send size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Email Page</span>
      </button>
      <div className="ribbon-group-title">Email</div>
    </div>
  </>
  );
};

import { createPortal } from 'react-dom';

const TableButton = ({ activeEditor }: { activeEditor: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverSize, setHoverSize] = useState({ r: 0, c: 0 });
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const maxRows = 8;
  const maxCols = 10;
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const toggleOpen = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button 
        ref={buttonRef}
        className="ribbon-btn" 
        onClick={toggleOpen}
        style={{ padding: '4px 8px' }}
      >
        <Table size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>
          Table <ChevronDown size={12} style={{ marginLeft: '2px' }}/>
        </span>
      </button>
      
      {isOpen && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: 'absolute', top: `${coords.top}px`, left: `${coords.left}px`, 
            backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '8px', zIndex: 99999
          }}>
            <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {hoverSize.r > 0 ? `${hoverSize.c}x${hoverSize.r} Table` : 'Insert Table'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${maxCols}, 16px)`, gap: '2px' }} onMouseLeave={() => setHoverSize({ r: 0, c: 0 })}>
              {Array.from({ length: maxRows }).map((_, rIndex) => (
                Array.from({ length: maxCols }).map((_, cIndex) => {
                  const isHovered = rIndex < hoverSize.r && cIndex < hoverSize.c;
                  return (
                    <div
                      key={`${rIndex}-${cIndex}`}
                      onMouseEnter={() => setHoverSize({ r: rIndex + 1, c: cIndex + 1 })}
                      onClick={() => {
                        if (!activeEditor) {
                          alert("Vui lòng click vào vùng trắng trên trang giấy để đặt con trỏ trước khi chèn bảng.");
                          setIsOpen(false);
                          return;
                        }
                        activeEditor.chain().focus().insertTable({ rows: rIndex + 1, cols: cIndex + 1, withHeaderRow: true }).run();
                        setIsOpen(false);
                      }}
                      style={{
                        width: '16px', height: '16px',
                        border: '1px solid',
                        borderColor: isHovered ? '#3b82f6' : '#e5e7eb',
                        backgroundColor: isHovered ? '#eff6ff' : 'transparent',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    />
                  );
                })
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

const TemplateButton = ({ activeEditor }: { activeEditor: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const templates = [
    { name: 'To-Do List', content: '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Nhiệm vụ 1</p></li><li data-type="taskItem" data-checked="false"><p>Nhiệm vụ 2</p></li></ul>' },
    { name: 'Meeting Notes', content: '<h3>Biên bản cuộc họp</h3><p><strong>Ngày:</strong> </p><p><strong>Người tham gia:</strong> </p><h4>Nội dung:</h4><p></p>' },
    { name: 'Project Plan', content: '<h3>Kế hoạch dự án</h3><p><strong>Mục tiêu:</strong> </p><h4>Tiến độ:</h4><p></p>' }
  ];

  const toggleOpen = () => {
    if (!activeEditor) {
      alert("Vui lòng click vào vùng trắng trên trang giấy để đặt con trỏ trước.");
      return;
    }
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button ref={buttonRef} className="ribbon-btn" onClick={toggleOpen} style={{ padding: '4px 8px' }}>
        <LayoutTemplate size={24} color="#6366f1" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>
          Templates <ChevronDown size={12} style={{ marginLeft: '2px' }}/>
        </span>
      </button>
      
      {isOpen && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: 'absolute', top: `${coords.top}px`, left: `${coords.left}px`, 
            backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '4px 0', zIndex: 99999, minWidth: '150px'
          }}>
            {templates.map(t => (
              <div 
                key={t.name}
                onClick={() => {
                  activeEditor.chain().focus().insertContent(t.content).run();
                  setIsOpen(false);
                }}
                style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {t.name}
              </div>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
};

const SymbolButton = ({ activeEditor }: { activeEditor: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const symbols = ['☺', '♥', '★', '✔', '✘', '©', '®', '™', '€', '£', '¥', '°', '±', '×', '÷', '∞', '≈', '≠', '≤', '≥', 'α', 'β', 'γ', 'π', 'Ω'];

  const toggleOpen = () => {
    if (!activeEditor) {
      alert("Vui lòng click vào vùng trắng trên trang giấy để đặt con trỏ trước.");
      return;
    }
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button ref={buttonRef} className="ribbon-btn" onClick={toggleOpen} style={{ padding: '4px 8px' }}>
        <Smile size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>
          Symbol <ChevronDown size={12} style={{ marginLeft: '2px' }}/>
        </span>
      </button>
      
      {isOpen && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: 'absolute', top: `${coords.top}px`, left: `${coords.left}px`, 
            backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '8px', zIndex: 99999, width: '200px'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {symbols.map(s => (
                <button 
                  key={s}
                  onClick={() => {
                    activeEditor.chain().focus().insertContent(s).run();
                    setIsOpen(false);
                  }}
                  style={{ width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', border: '1px solid #e5e7eb', backgroundColor: '#fff', borderRadius: '4px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

const InsertRibbonContent = ({ activeEditor }: { activeEditor: any }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pdfInputRef = React.useRef<HTMLInputElement>(null);
  const imgInputRef = React.useRef<HTMLInputElement>(null);
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);

  const checkEditor = () => {
    if (!activeEditor) {
      alert("Vui lòng click vào vùng trắng trên trang giấy để đặt con trỏ trước khi chèn.");
      return false;
    }
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'pdf' | 'image') => {
    const file = e.target.files?.[0];
    if (!file || !checkEditor()) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'image') {
        activeEditor.chain().focus().setImage({ src: dataUrl }).run();
      } else if (type === 'pdf') {
        activeEditor.chain().focus().setIframe({ src: dataUrl }).run();
      } else {
        // Just insert a link for normal files
        activeEditor.chain().focus().setLink({ href: dataUrl }).insertContent(`📎 ${file.name}`).run();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'file')} />
      <input type="file" accept=".pdf" ref={pdfInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'pdf')} />
      <input type="file" accept="image/*" ref={imgInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'image')} />
      
      <RecordingModal 
        isOpen={!!recordingType} 
        type={recordingType || 'audio'} 
        onClose={() => setRecordingType(null)} 
        onInsert={(url) => {
          if (recordingType === 'audio') activeEditor?.chain().focus().setAudio({ src: url }).run();
          else activeEditor?.chain().focus().setVideo({ src: url }).run();
        }} 
      />

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => activeEditor?.chain().focus().insertContent('<p><br></p><p><br></p>').run()} style={{ padding: '4px 8px' }} title="Thêm khoảng trắng (Enter)">
          <div style={{ height: '24px', width: '24px', borderTop: '2px dashed #6b7280', borderBottom: '2px dashed #6b7280', marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Space</span>
        </button>
        <div className="ribbon-group-title">Space</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <TableButton activeEditor={activeEditor} />
        <div className="ribbon-group-title">Tables</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => { if(checkEditor()) fileInputRef.current?.click(); }} style={{ padding: '4px 8px' }} title="Đính kèm tệp (Ctrl+Shift+A)">
          <Paperclip size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>File</span>
        </button>
        <button className="ribbon-btn" onClick={() => { if(checkEditor()) pdfInputRef.current?.click(); }} style={{ padding: '4px 8px' }} title="Nhúng tài liệu PDF">
          <FileText size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Printout</span>
        </button>
        <div className="ribbon-group-title">Files</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => { if(checkEditor()) imgInputRef.current?.click(); }} style={{ padding: '4px 8px' }} title="Chèn ảnh từ máy tính (Ctrl+Shift+I)">
          <Image size={24} color="#8b5cf6" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Pictures</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button className="ribbon-btn" onClick={async () => {
          if (!checkEditor()) return;
          try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'window' as any }, audio: false });
            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')!.drawImage(video, 0, 0);
            stream.getTracks().forEach(t => t.stop());
            const dataUrl = canvas.toDataURL('image/png');
            activeEditor?.chain().focus().setImage({ src: dataUrl }).run();
          } catch (err: any) {
            if (err.name !== 'NotAllowedError') alert('Lỗi chụp màn hình: ' + err.message);
          }
        }} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }} title="Chụp màn hình và chèn (Alt+S)"><Crop size={12} style={{ marginRight: '4px' }} /> Screen Clipping</button>
          <button className="ribbon-btn-small" onClick={() => {
            const url = window.prompt('URL hình ảnh:');
            if (url && checkEditor()) activeEditor?.chain().focus().setImage({ src: url }).run();
          }} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }} title="Chèn ảnh từ URL online"><Globe size={12} style={{ marginRight: '4px' }} /> Online Pictures</button>
        </div>
        <div className="ribbon-group-title">Images</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          if (!checkEditor()) return;
          const url = window.prompt('Nhập URL liên kết:');
          if (url) {
            activeEditor?.chain().focus().setLink({ href: url }).run();
          } else if (url === '') {
            activeEditor?.chain().focus().unsetLink().run();
          }
        }} style={{ padding: '4px 8px' }} title="Chèn liên kết (Ctrl+K)">
          <Link size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Link</span>
        </button>
        <div className="ribbon-group-title">Links</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => { if(checkEditor()) setRecordingType('audio'); }} style={{ padding: '4px 8px' }} title="Ghi âm và nhúng vào trang (F4)">
          <Mic size={24} color="#ef4444" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Record Audio</span>
        </button>
        <button className="ribbon-btn" onClick={() => { if(checkEditor()) setRecordingType('video'); }} style={{ padding: '4px 8px' }} title="Ghi video từ webcam và nhúng">
          <Video size={24} color="#14b8a6" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Record Video</span>
        </button>
        <div className="ribbon-group-title">Recording</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          if (checkEditor()) activeEditor?.chain().focus().insertContent(new Date().toLocaleString()).run();
        }} style={{ padding: '4px 8px' }} title="Chèn ngày giờ hiện tại (Ctrl+Shift+D)">
          <Clock size={24} color="#f59e0b" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Date/Time</span>
        </button>
        <div className="ribbon-group-title">Time Stamp</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <TemplateButton activeEditor={activeEditor} />
        <div className="ribbon-group-title">Templates</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          if (!checkEditor()) return;
          const eq = window.prompt('Nhập biểu thức Toán học (Equation):', 'E = mc²');
          if (eq) activeEditor?.chain().focus().insertContent(eq).run();
        }} style={{ padding: '4px 8px' }} title="Chèn công thức toán học (Alt+= )">
          <Calculator size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Equation</span>
        </button>
        <SymbolButton activeEditor={activeEditor} />
        <div className="ribbon-group-title">Symbols</div>
      </div>
    </>
  );
};

const DrawRibbonContent = ({ activeEditor }: { activeEditor: any }) => {
  const { drawTool, drawColor, drawWidth, shapeType, setDrawTool, setDrawColor, setDrawWidth, setShapeType, clearAll } = useCanvasStore();
  const activeNoteId = useWorkspaceStore(state => state.activeNoteId);
  const [showGraphModal, setShowGraphModal] = useState(false);

  return (
    <>
    {showGraphModal && createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) setShowGraphModal(false); }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', width: 800, height: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: '#1f2937', color: '#fff' }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>📊 Đồ thị Toán học (Desmos)</span>
            <button onClick={() => setShowGraphModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>
          <iframe src="https://www.desmos.com/calculator" style={{ width: '100%', height: 470, border: 'none' }} title="Desmos Graph" />
        </div>
      </div>,
      document.body
    )}

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" onClick={() => setDrawTool('type')} style={{ padding: '4px 8px', backgroundColor: drawTool === 'type' ? '#e5e7eb' : 'transparent' }} title="Chế độ nhập văn bản (Alt+1 hoặc Esc)">
        <MousePointer2 size={24} color="#374151" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Type</span>
      </button>
      <button className="ribbon-btn" onClick={() => setDrawTool('lasso')} style={{ padding: '4px 8px', backgroundColor: drawTool === 'lasso' ? '#e5e7eb' : 'transparent' }} title="Chọn vùng (Lasso Select)">
        <Lasso size={24} color="#374151" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Lasso</span>
      </button>
      <button className="ribbon-btn" onClick={() => setDrawTool('pan')} style={{ padding: '4px 8px', backgroundColor: drawTool === 'pan' ? '#e5e7eb' : 'transparent' }} title="Di chuyển khung nhìn (Alt+6 hoặc giữ Space)">
        <Hand size={24} color="#374151" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Panning</span>
      </button>
      <div className="ribbon-group-title">Tools</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
        <button className="ribbon-btn-small" onClick={() => { setDrawTool('pen'); setDrawColor('#000000'); setDrawWidth(3); }} style={{ width: '40px', height: '40px', border: drawTool === 'pen' && drawColor === '#000000' ? '2px solid #3b82f6' : '1px solid #d1d5db', backgroundColor: '#f3f4f6' }} title="Bút đen (Alt+2)"><PenTool size={20} color="#000" /></button>
        <button className="ribbon-btn-small" onClick={() => { setDrawTool('pen'); setDrawColor('#ef4444'); setDrawWidth(3); }} style={{ width: '40px', height: '40px', border: drawTool === 'pen' && drawColor === '#ef4444' ? '2px solid #3b82f6' : '1px solid transparent', backgroundColor: '#fef2f2' }} title="Bút đỏ (Alt+2)"><PenTool size={20} color="#ef4444" /></button>
        <button className="ribbon-btn-small" onClick={() => { setDrawTool('highlighter'); setDrawColor('#facc15'); setDrawWidth(20); }} style={{ width: '40px', height: '40px', border: drawTool === 'highlighter' ? '2px solid #3b82f6' : '1px solid transparent', backgroundColor: '#fefce8' }} title="Bút tô sáng (Alt+3)"><Edit3 size={20} color="#facc15" /></button>
        <button className="ribbon-btn-small" onClick={() => { setDrawTool('eraser'); setDrawWidth(20); }} style={{ width: '40px', height: '40px', border: drawTool === 'eraser' ? '2px solid #3b82f6' : '1px solid #e5e7eb', backgroundColor: drawTool === 'eraser' ? '#eff6ff' : '#fff' }} title="Tẩy xóa nét vẽ (Alt+4)">
          <Eraser size={20} color={drawTool === 'eraser' ? '#3b82f6' : '#6b7280'} />
        </button>
        {/* Custom color pen */}
        <label title="Bút màu tùy chọn (Alt+2 sau khi chọn màu)" style={{ width: 40, height: 40, border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: drawColor, border: '2px solid #e5e7eb' }} />
          <input type="color" value={drawColor}
            onChange={(e) => { setDrawTool('pen'); setDrawColor(e.target.value); setDrawWidth(3); }}
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
        </label>
      </div>
      <div className="ribbon-group-title">Pens Gallery</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '4px', padding: '4px' }}>
        <button className="ribbon-btn-small" onClick={() => { setDrawTool('shape'); setShapeType('rect'); }} style={{ backgroundColor: drawTool === 'shape' && shapeType === 'rect' ? '#dbeafe' : 'transparent', border: drawTool === 'shape' && shapeType === 'rect' ? '1px solid #3b82f6' : '1px solid transparent' }} title="Vẽ hình chữ nhật (Alt+5)">
          <Square size={18} color={drawTool === 'shape' && shapeType === 'rect' ? '#3b82f6' : undefined} />
        </button>
        <button className="ribbon-btn-small" onClick={() => { setDrawTool('shape'); setShapeType('circle'); }} style={{ backgroundColor: drawTool === 'shape' && shapeType === 'circle' ? '#dbeafe' : 'transparent', border: drawTool === 'shape' && shapeType === 'circle' ? '1px solid #3b82f6' : '1px solid transparent' }} title="Vẽ hình tròn (Alt+5)">
          <Circle size={18} color={drawTool === 'shape' && shapeType === 'circle' ? '#3b82f6' : undefined} />
        </button>
        <button className="ribbon-btn-small" onClick={() => { setDrawTool('shape'); setShapeType('triangle'); }} style={{ backgroundColor: drawTool === 'shape' && shapeType === 'triangle' ? '#dbeafe' : 'transparent', border: drawTool === 'shape' && shapeType === 'triangle' ? '1px solid #3b82f6' : '1px solid transparent' }} title="Vẽ hình tam giác (Alt+5)">
          <Triangle size={18} color={drawTool === 'shape' && shapeType === 'triangle' ? '#3b82f6' : undefined} />
        </button>
      </div>
      <div className="ribbon-group-title">Shapes</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" onClick={() => setShowGraphModal(true)} style={{ padding: '4px 8px' }} title="Mở đồ thị Desmos toán học (Alt+G)">
        <TrendingUp size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Graph</span>
      </button>
      <div className="ribbon-group-title">Graph</div>
    </div>

    {/* Stroke Width + Clear Ink */}
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#6b7280', minWidth: 30 }}>Size</span>
          <input type="range" min={1} max={40} value={drawWidth}
            onChange={e => setDrawWidth(Number(e.target.value))}
            style={{ width: 80, cursor: 'pointer' }} />
          <span style={{ fontSize: 11, color: '#374151', minWidth: 22 }}>{drawWidth}px</span>
        </div>
        <button className="ribbon-btn-small"
          onClick={() => {
            if (!activeNoteId) { alert('Chưa có trang nào đang mở.'); return; }
            if (window.confirm('Xóa toàn bộ nét vẽ và hình dạng trên trang này?')) {
              clearAll(activeNoteId);
            }
          }}
          style={{ fontSize: 11, color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 6, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
          title="Xóa tất cả nét vẽ trên trang (Ctrl+Shift+Delete)">
          <Trash2 size={12} /> Clear Ink
        </button>
      </div>
      <div className="ribbon-group-title">Ink</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button className="ribbon-btn-small" onClick={() => {
          const text = window.getSelection()?.toString();
          if (text) { if (activeEditor) activeEditor.chain().focus().insertContent(text).run(); }
          else alert('Chọn vùng vẽ có chữ để chuyển thành text. Tính năng AI nhận dạng đang phát triển.');
        }} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }} title="Chuyển nét vẽ thành văn bản">Ink to Text</button>
        <button className="ribbon-btn-small" onClick={() => {
          const eq = window.prompt('Nhập biểu thức toán học:', 'E = mc²');
          if (eq && activeEditor) activeEditor.chain().focus().insertContent(eq).run();
        }} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }} title="Chuyển nét vẽ thành công thức">Ink to Math</button>
        <button className="ribbon-btn-small" onClick={() => {
          setDrawTool('shape'); setShapeType('rect');
        }} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }} title="Chuyển nét vẽ thành hình dạng">Ink to Shape</button>
      </div>
      <div className="ribbon-group-title">Convert</div>
    </div>
  </>
  );
};


const ViewRibbonContent = () => {
  const activeNoteId = useWorkspaceStore(state => state.activeNoteId);
  const activeEditor = useEditorStore(state => state.activeEditor);
  const { setZoom, setPageColor, setGridPattern, setPaperSize, getPageData } = useCanvasStore();
  const setImmersivePlaylist = useWorkspaceStore(state => state.setImmersivePlaylist);
  const [paperDropdownOpen, setPaperDropdownOpen] = useState(false);
  const paperBtnRef = useRef<HTMLButtonElement>(null);
  const [paperCoords, setPaperCoords] = useState({ top: 0, left: 0 });
  const pageColorInputRef = useRef<HTMLInputElement>(null);

  const currentPage = activeNoteId ? getPageData(activeNoteId) : null;
  const currentGridPattern = currentPage?.gridPattern || 'none';
  const currentZoom = currentPage?.zoom || 1;
  const currentPageColor = currentPage?.pageColor || '#ffffff';

  const handleZoom = (zoomLevel: number) => {
    if (activeNoteId) setZoom(activeNoteId, zoomLevel);
  };

  const handleKeepOnTop = async () => {
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({ width: 400, height: 600 });
        
        let htmlContent = 'Không có nội dung';
        if (activeEditor && activeEditor.getText().trim()) {
          htmlContent = activeEditor.getHTML();
        } else {
          const editors = document.querySelectorAll('.canvas-tiptap-container .ProseMirror');
          if (editors.length > 0) {
            const sorted = Array.from(editors).sort((a, b) => {
              const rectA = a.getBoundingClientRect();
              const rectB = b.getBoundingClientRect();
              if (Math.abs(rectA.top - rectB.top) < 20) return rectA.left - rectB.left;
              return rectA.top - rectB.top;
            });
            htmlContent = sorted.map(el => el.innerHTML).join('<hr style="margin: 16px 0; border: none; border-top: 1px dashed #ccc;" />');
          }
        }
        
        pipWindow.document.body.innerHTML = `
          <div style="padding: 20px; font-family: sans-serif; color: #333; line-height: 1.6;">
            <h3 style="margin-top: 0; color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">NoteGravity PiP</h3>
            <div>${htmlContent}</div>
          </div>
        `;
      } catch (err) {
        alert('Lỗi khi mở chế độ Always On Top: ' + err);
      }
    } else {
      alert('Trình duyệt của bạn không hỗ trợ Document Picture-in-Picture API.');
    }
  };

  const togglePaperDropdown = () => {
    if (!paperDropdownOpen && paperBtnRef.current) {
      const rect = paperBtnRef.current.getBoundingClientRect();
      setPaperCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setPaperDropdownOpen(!paperDropdownOpen);
  };

  const cycleGridPattern = () => {
    if (!activeNoteId) return;
    const patterns = ['none', 'rule', 'grid'] as const;
    const next = patterns[(patterns.indexOf(currentGridPattern as any) + 1) % patterns.length];
    setGridPattern(activeNoteId, next);
  };

  const gridLabel = currentGridPattern === 'none' ? 'Không' : currentGridPattern === 'rule' ? 'Dòng kẻ' : 'Lưới';

  const getCanvasText = () => {
    if (activeEditor) {
      const text = activeEditor.getText();
      if (text.trim()) return text;
    }
    
    const editors = document.querySelectorAll('.canvas-tiptap-container .ProseMirror');
    if (editors.length > 0) {
      const sorted = Array.from(editors).sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        if (Math.abs(rectA.top - rectB.top) < 20) return rectA.left - rectB.left;
        return rectA.top - rectB.top;
      });
      return sorted.map(el => (el as HTMLElement).textContent || '').filter(t => t.trim().length > 0).join('. ');
    }
    
    return '';
  };

  return (
    <>
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); }} style={{ padding: '4px 8px' }} title="Thoát toàn màn hình (Esc)">
          <div style={{ width: '24px', height: '24px', border: '2px solid #6b7280', marginBottom: '4px', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 3, border: '1px solid #d1d5db' }} />
          </div>
          <span style={{ fontSize: '12px' }}>Normal View</span>
        </button>
        <button className="ribbon-btn" onClick={() => document.documentElement.requestFullscreen().catch(() => {})} style={{ padding: '4px 8px' }} title="Toàn màn hình (Ctrl+Shift+F)">
          <MonitorSmartphone size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Full Page</span>
        </button>
        <div className="ribbon-group-title">Views</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button className="ribbon-btn-small" onClick={() => window.open(window.location.href, '_blank', 'width=450,height=800,left=100')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }} title="Mở cửa sổ nhỏ dạng sidebar"><AppWindow size={12} style={{ marginRight: '4px' }} /> Dock to Desktop</button>
          <button className="ribbon-btn-small" onClick={() => window.open(window.location.href, '_blank')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }} title="Mở tab mới (Ctrl+N)"><AppWindow size={12} style={{ marginRight: '4px' }} /> New Window</button>
          <button className="ribbon-btn-small" onClick={handleKeepOnTop} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }} title="Hiện trên cùng (Picture-in-Picture)"><Pin size={12} style={{ marginRight: '4px' }} /> Keep on Top</button>
        </div>
        <div className="ribbon-group-title">Window</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          const text = getCanvasText();
          if (text) {
             new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIwDk5OUAAAAAAAAAAAAAAAAAAAAAADhIWEgAAAAAAAAAAAAAAABfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19f//OEAAAOEzR0AALoABQAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAA//OEAAP8zR0AALoABQAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAA//OEAAAAAA==').play().catch(()=>{});
             window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
             setImmersivePlaylist([{ text, nodeId: activeNoteId || '' }]);
          }
        }} style={{ padding: '4px 8px' }} title="Đọc văn bản thành tiếng (Immersive Reader – F9)">
          <Ear size={24} color="#8b5cf6" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Immersive</span>
        </button>
        <div className="ribbon-group-title">Immersive</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        {/* Page Color với color picker thực */}
        <label title="Đổi màu nền trang" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid transparent', position: 'relative' }}
          className="ribbon-btn">
          <div style={{ position: 'relative', marginBottom: 4 }}>
            <Palette size={24} color="#10b981" />
            <div style={{ position: 'absolute', bottom: -2, left: 2, right: 2, height: 4, backgroundColor: currentPageColor, border: '1px solid #e5e7eb', borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: '12px' }}>Page Color</span>
          <input type="color" value={currentPageColor}
            onChange={(e) => { if (activeNoteId) setPageColor(activeNoteId, e.target.value); }}
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', inset: 0 }} />
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Rule Lines với indicator */}
          <button className="ribbon-btn-small" onClick={cycleGridPattern}
            style={{ fontSize: '11px', justifyContent: 'flex-start', width: '80px', color: currentGridPattern !== 'none' ? '#3b82f6' : undefined, fontWeight: currentGridPattern !== 'none' ? 600 : 400 }}
            title="Chuyển nền: Không / Dòng kẻ / Lưới ô">
            {currentGridPattern === 'none' ? '☐' : currentGridPattern === 'rule' ? '☰' : '⊞'} {gridLabel}
          </button>
          <button ref={paperBtnRef} className="ribbon-btn-small" onClick={togglePaperDropdown} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '80px' }} title="Chọn khổ giấy (A4, A3, Letter…)">
            Paper Size <ChevronDown size={12} style={{ marginLeft: 'auto' }} />
          </button>
        </div>
        <div className="ribbon-group-title">Page Setup</div>
      </div>

      {paperDropdownOpen && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setPaperDropdownOpen(false)} />
          <div style={{ position: 'absolute', top: `${paperCoords.top}px`, left: `${paperCoords.left}px`, backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '4px 0', zIndex: 99999, minWidth: '120px' }}>
            {[
              { label: 'Auto (Vô cực)', value: 'auto' },
              { label: 'A4 (210 x 297mm)', value: 'a4' },
              { label: 'A3 (297 x 420mm)', value: 'a3' },
              { label: 'Letter (8.5 x 11")', value: 'letter' },
            ].map(size => (
              <div key={size.value} onClick={() => { if (activeNoteId) setPaperSize(activeNoteId, size.value as any); setPaperDropdownOpen(false); }}
                style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                {size.label}
              </div>
            ))}
          </div>
        </>,
        document.body
      )}

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => handleZoom(1)} style={{ padding: '4px 8px', backgroundColor: Math.abs(currentZoom - 1) < 0.05 ? '#e5e7eb' : 'transparent' }} title="Đặt về 100% (Ctrl+0)">
          <span style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>100%</span>
          <span style={{ fontSize: '12px' }}>Zoom 100%</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button className="ribbon-btn-small" onClick={() => handleZoom(Math.min(3, currentZoom + 0.25))} style={{ fontSize: '11px', width: 70, justifyContent: 'flex-start' }} title="Phóng to (+25%) (Ctrl+=)">
            <ZoomIn size={13} style={{ marginRight: 4 }} /> Phóng to
          </button>
          <button className="ribbon-btn-small" onClick={() => handleZoom(Math.max(0.25, currentZoom - 0.25))} style={{ fontSize: '11px', width: 70, justifyContent: 'flex-start' }} title="Thu nhỏ (-25%) (Ctrl+-)">
            <ZoomOut size={13} style={{ marginRight: 4 }} /> Thu nhỏ
          </button>
          <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>{Math.round(currentZoom * 100)}%</span>
        </div>
        <div className="ribbon-group-title">Zoom</div>
      </div>

      {/* Find & Replace */}
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true }));
        }} style={{ padding: '4px 8px' }} title="Tìm kiếm trong trang (Ctrl+F)">
          <Search size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Find</span>
        </button>
        <button className="ribbon-btn" onClick={() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true }));
        }} style={{ padding: '4px 8px' }} title="Tìm và thay thế (Ctrl+H)">
          <Replace size={24} color="#f59e0b" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Replace</span>
        </button>
        <div className="ribbon-group-title">Find</div>
      </div>
    </>
  );
};

const HistoryRibbonContent = ({ activeEditor }: { activeEditor: any }) => {
  const [showRecentEdits, setShowRecentEdits] = React.useState(false);
  const [showPageVersions, setShowPageVersions] = React.useState(false);
  const [showRecycleBin, setShowRecycleBin] = React.useState(false);
  const activeNoteId = useWorkspaceStore(state => state.activeNoteId);
  const { readIds, toggleRead, deletedNodes } = useTreeStore();
  const isRead = activeNoteId ? readIds.has(activeNoteId) : false;
  
  return (
    <>
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => { if (activeNoteId) toggleRead(activeNoteId); }} style={{ padding: '4px 8px' }} title={isRead ? 'Đánh dấu chưa đọc (Alt+R)' : 'Đánh dấu đã đọc (Alt+R)'}>
          {isRead
            ? <EyeOff size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
            : <BookOpen size={24} color="#10b981" style={{ marginBottom: '4px' }} />}
          <span style={{ fontSize: '12px' }}>{isRead ? 'Mark Unread' : 'Mark Read'}</span>
        </button>
        <div className="ribbon-group-title">Unread</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => setShowRecentEdits(true)} style={{ padding: '4px 8px' }} title="Xem lịch sử chỉnh sửa gần đây (Ctrl+Shift+Z)">
          <Clock size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Recent Edits</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button className="ribbon-btn-small" onClick={() => alert('Văn bản này đang được lưu trữ cục bộ (Local). Bạn là tác giả duy nhất của trang này.')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }} title="Tìm chỉnh sửa theo tác giả"><FileSearch size={12} style={{ marginRight: '4px' }} /> Find by Author</button>
          <button className="ribbon-btn-small" onClick={() => alert('Đã ẩn thông tin tác giả khỏi văn bản (Local Mode).')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }} title="Ẩn thông tin tác giả"><UserMinus size={12} style={{ marginRight: '4px' }} /> Hide Authors</button>
        </div>
        <div className="ribbon-group-title">Authors</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => setShowPageVersions(true)} style={{ padding: '4px 8px' }} title="Xem và khôi phục phiên bản cũ (Alt+V)">
          <History size={24} color="#f59e0b" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Page Versions</span>
        </button>
        <button className="ribbon-btn" onClick={() => setShowRecycleBin(true)} style={{ padding: '4px 8px', position: 'relative' }} title="Thùng rác — xem ghi chú đã xóa">
          <Trash2 size={24} color="#ef4444" style={{ marginBottom: '4px' }} />
          {deletedNodes.length > 0 && (
            <span style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 9, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {deletedNodes.length > 9 ? '9+' : deletedNodes.length}
            </span>
          )}
          <span style={{ fontSize: '12px' }}>Recycle Bin</span>
        </button>
        <div className="ribbon-group-title">History</div>
      </div>

      {showRecentEdits && <RecentEditsModal onClose={() => setShowRecentEdits(false)} />}
      {showPageVersions && <PageVersionsModal onClose={() => setShowPageVersions(false)} />}
      {showRecycleBin && <RecycleBinModal onClose={() => setShowRecycleBin(false)} />}
    </>
  );
};

const ReviewRibbonContent = ({ activeEditor }: { activeEditor: any }) => {
  const activeNoteId = useWorkspaceStore(state => state.activeNoteId);
  const { toggleLock, lockedIds } = useTreeStore();
  const isLocked = activeNoteId ? lockedIds.has(activeNoteId) : false;
  const [spellEnabled, setSpellEnabled] = React.useState(true);
  
  const toggleSpell = () => {
    if (!activeEditor) return;
    const newVal = !spellEnabled;
    activeEditor.view.dom.spellcheck = newVal;
    document.querySelectorAll('[contenteditable]').forEach((el: any) => { el.spellcheck = newVal; });
    setSpellEnabled(newVal);
  };
  
  return (
    <>
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={toggleSpell} style={{ padding: '4px 8px', backgroundColor: spellEnabled ? 'transparent' : '#f3f4f6', position: 'relative' }} title={`Kiểm tra chính tả (F7) — Đang ${spellEnabled ? 'BẬT' : 'TẮT'}`}>
          <SpellCheck size={24} color={spellEnabled ? '#3b82f6' : '#9ca3af'} style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Spelling</span>
          <span style={{ position: 'absolute', top: 2, right: 2, fontSize: 9, fontWeight: 700, color: spellEnabled ? '#10b981' : '#9ca3af', backgroundColor: spellEnabled ? '#d1fae5' : '#f3f4f6', borderRadius: 3, padding: '1px 3px', lineHeight: 1 }}>
            {spellEnabled ? 'ON' : 'OFF'}
          </span>
        </button>
        <button className="ribbon-btn" onClick={() => {
          const selected = window.getSelection()?.toString();
          if (!selected) { alert('Vui lòng bôi đen một từ để tra từ điển đồng nghĩa!'); return; }
          window.open(`https://1tudien.com/?word=${encodeURIComponent(selected)}`, '_blank', 'width=800,height=600');
        }} style={{ padding: '4px 8px' }} title="Tra từ điển đồng nghĩa (bôi đen từ trước)">
          <FileSearch size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Thesaurus</span>
        </button>
        <div className="ribbon-group-title">Spelling</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          const selected = window.getSelection()?.toString();
          if (!selected) { alert('Vui lòng bôi đen đoạn văn bản cần dịch!'); return; }
          window.open(`https://translate.google.com/?sl=auto&tl=vi&text=${encodeURIComponent(selected)}`, '_blank', 'width=1000,height=600');
        }} style={{ padding: '4px 8px' }} title="Dịch đoạn văn bản đã chọn (Ctrl+Shift+G)">
          <MessageSquare size={24} color="#10b981" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Translate</span>
        </button>
        <button className="ribbon-btn" onClick={() => {
          if (!activeEditor) return;
          const currentLang = activeEditor.view.dom.lang || 'vi-VN';
          const newLang = window.prompt('Nhập mã ngôn ngữ (VD: vi-VN, en-US):', currentLang);
          if (newLang) {
            activeEditor.view.dom.lang = newLang;
            alert(`Đã đổi ngôn ngữ đoạn văn thành: ${newLang}`);
          }
        }} style={{ padding: '4px 8px' }} title="Đặt ngôn ngữ kiểm tra chính tả">
          <Languages size={24} color="#6366f1" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Language</span>
        </button>
        <div className="ribbon-group-title">Language</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          if (activeNoteId) {
            toggleLock(activeNoteId);
          } else {
            alert('Vui lòng mở một ghi chú trước khi khóa.');
          }
        }} style={{ padding: '4px 8px', backgroundColor: isLocked ? '#fee2e2' : 'transparent' }} title={`${isLocked ? 'Mở khóa' : 'Khóa'} ghi chú (Ctrl+Shift+P)`}>
          <Lock size={24} color={isLocked ? '#ef4444' : '#6b7280'} style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>{isLocked ? '🔒 Locked' : 'Password'}</span>
        </button>
        <div className="ribbon-group-title">Protect</div>
      </div>
    </>
  );
};

const TableLayoutRibbonContent = ({ activeEditor }: { activeEditor: any }) => (
  <>
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" onClick={() => activeEditor?.chain().focus().deleteTable().run()} style={{ padding: '4px 8px' }} title="Xóa toàn bộ bảng">
        <Trash2 size={24} color="#ef4444" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Delete Table</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().deleteRow().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }} title="Xóa hàng hiện tại"><Square size={12} style={{ marginRight: '4px' }} /> Delete Row</button>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().deleteColumn().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }} title="Xóa cột hiện tại"><Square size={12} style={{ marginRight: '4px' }} /> Delete Col</button>
      </div>
      <div className="ribbon-group-title">Delete</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().addRowBefore().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }} title="Thêm hàng phía trên"><ChevronUp size={12} style={{ marginRight: '4px' }} /> Row Above</button>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().addRowAfter().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }} title="Thêm hàng phía dưới"><ChevronDown size={12} style={{ marginRight: '4px' }} /> Row Below</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '4px' }}>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().addColumnBefore().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }} title="Thêm cột bên trái"><ArrowUpDown size={12} style={{ marginRight: '4px', transform: 'rotate(90deg)' }} /> Col Left</button>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().addColumnAfter().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }} title="Thêm cột bên phải"><ArrowUpDown size={12} style={{ marginRight: '4px', transform: 'rotate(90deg)' }} /> Col Right</button>
      </div>
      <div className="ribbon-group-title">Rows & Columns</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" onClick={() => activeEditor?.chain().focus().mergeCells().run()} style={{ padding: '4px 8px' }} title="Gộp các ô đã chọn">
        <Square size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Merge Cells</span>
      </button>
      <button className="ribbon-btn" onClick={() => activeEditor?.chain().focus().splitCell().run()} style={{ padding: '4px 8px' }} title="Tách ô đã gộp">
        <Grid size={24} color="#6366f1" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Split Cell</span>
      </button>
      <div className="ribbon-group-title">Merge</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().toggleHeaderRow().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '110px' }} title="Bật/tắt hàng tiêu đề">
          <div style={{ width: '12px', height: '12px', backgroundColor: '#e5e7eb', marginRight: '4px' }} /> Header Row
        </button>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().toggleHeaderColumn().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '110px' }} title="Bật/tắt cột tiêu đề">
          <div style={{ width: '12px', height: '12px', backgroundColor: '#e5e7eb', marginRight: '4px' }} /> Header Column
        </button>
      </div>
      <div className="ribbon-group-title">Options</div>
    </div>
  </>
);
