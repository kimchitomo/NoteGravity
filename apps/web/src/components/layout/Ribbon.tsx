import React, { useState, useEffect } from 'react';
import { 
  ChevronUp, ChevronDown, Bold, Italic, Underline, Strikethrough, Highlighter, PaintBucket, Type, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, CheckSquare, Link, Image, Table, Mic, Video, Clock,
  FileText, Paperclip, LayoutTemplate, Calculator, Smile, MousePointer2, Lasso, Hand, PenTool, Edit3, Square, Circle, Triangle, TrendingUp, MonitorSmartphone, Ear, Palette, FileSearch, Trash2, History, MessageSquare, SpellCheck, Globe, Lock, Search, Send,
  Indent, Outdent, ArrowUpDown, Crop, AppWindow, Pin, UserMinus, Languages, Grid
} from 'lucide-react';
import { BackstageView, Tab } from './BackstageView';
import { RecordingModal } from '../modals/RecordingModal';
import { ImmersiveReaderModal } from '../modals/ImmersiveReaderModal';
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
  
  useEffect(() => {
    if (isMobile) setIsCollapsed(true);
  }, [isMobile]);
  const [showBackstage, setShowBackstage] = useState<Tab | false>(false);
  
  // Handle Ctrl+P shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowBackstage('print');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
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
      {showBackstage && <BackstageView initialTab={showBackstage === true ? 'info' : showBackstage} onClose={() => setShowBackstage(false)} />}
      
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
        `}</style>
      </div>
    </>
  );
};

const HomeRibbonContent = ({ activeEditor }: { activeEditor: any }) => (
  <>
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }} onClick={() => alert('Vui lòng dùng phím tắt Ctrl+V để Dán (Paste) do bảo mật trình duyệt.')}>
        <div style={{ width: '32px', height: '32px', backgroundColor: '#fbbf24', borderRadius: '4px', marginBottom: '2px' }} />
        <span style={{ fontSize: '12px' }}>Paste</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%' }}>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '60px' }} onClick={() => navigator.clipboard.writeText(window.getSelection()?.toString() || '')}>Cut</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '60px' }} onClick={() => navigator.clipboard.writeText(window.getSelection()?.toString() || '')}>Copy</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '60px' }}>Painter</button>
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
          <button className={`ribbon-btn-small ${activeEditor?.isActive('bold') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleBold().run()} title="Bold"><Bold size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive('italic') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleItalic().run()} title="Italic"><Italic size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive('underline') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleUnderline().run()} title="Underline"><Underline size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive('strike') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough size={14} /></button>
          <div style={{ width: '1px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />
          <button className={`ribbon-btn-small ${activeEditor?.isActive('highlight') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleHighlight().run()} title="Highlight"><Highlighter size={14} color="#facc15" /></button>
          <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().setColor('#ef4444').run()} title="Font Color"><Type size={14} color="#ef4444" /></button>
          <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting"><PaintBucket size={14} /></button>
        </div>
      </div>
      <div className="ribbon-group-title">Basic Text</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button className={`ribbon-btn ${activeEditor?.isActive('paragraph') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().setParagraph().run()} style={{ border: '1px solid #d1d5db', backgroundColor: '#f9fafb' }}>
          <span style={{ fontSize: '14px' }}>AaBbCc</span>
          <span style={{ fontSize: '10px' }}>Normal</span>
        </button>
        <button className={`ribbon-btn ${activeEditor?.isActive('heading', { level: 1 }) ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 1 }).run()} style={{ border: '1px solid transparent' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>AaBbCc</span>
          <span style={{ fontSize: '10px' }}>Heading 1</span>
        </button>
      </div>
      <div className="ribbon-group-title">Styles</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className={`ribbon-btn-small ${activeEditor?.isActive('bulletList') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleBulletList().run()} title="Bullets"><List size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive('orderedList') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()} title="Numbering"><ListOrdered size={14} /></button>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className={`ribbon-btn-small ${activeEditor?.isActive({ textAlign: 'left' }) ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().setTextAlign('left').run()} title="Align Left"><AlignLeft size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive({ textAlign: 'center' }) ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().setTextAlign('center').run()} title="Center"><AlignCenter size={14} /></button>
          <button className={`ribbon-btn-small ${activeEditor?.isActive({ textAlign: 'right' }) ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().setTextAlign('right').run()} title="Align Right"><AlignRight size={14} /></button>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().sinkListItem('listItem').run()} title="Decrease Indent"><Outdent size={14} /></button>
          <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().liftListItem('listItem').run()} title="Increase Indent"><Indent size={14} /></button>
          <button className="ribbon-btn-small" title="Paragraph Spacing"><ArrowUpDown size={14} /></button>
        </div>
      </div>
      <div className="ribbon-group-title">Paragraph</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className={`ribbon-btn ${activeEditor?.isActive('taskList') ? 'active' : ''}`} onClick={() => activeEditor?.chain().focus().toggleTaskList().run()} style={{ padding: '4px 8px' }}>
        <CheckSquare size={24} color="#10b981" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>To Do</span>
      </button>
      <button className="ribbon-btn" onClick={() => {
        const searchInput = document.querySelector('input[placeholder="Tìm kiếm mọi thứ..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.value = '#';
          searchInput.focus();
        }
      }} style={{ padding: '4px 8px' }}>
        <Search size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Find Tags</span>
      </button>
      <div className="ribbon-group-title">Tags</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" onClick={() => window.location.href = 'mailto:?subject=NoteGravity&body=Chia sẻ ghi chú từ NoteGravity'} style={{ padding: '4px 8px' }}>
        <Send size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Email Page</span>
      </button>
      <div className="ribbon-group-title">Email</div>
    </div>
  </>
);

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
        <button className="ribbon-btn" onClick={() => activeEditor?.chain().focus().insertContent('<p><br></p><p><br></p>').run()} style={{ padding: '4px 8px' }}>
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
        <button className="ribbon-btn" onClick={() => { if(checkEditor()) fileInputRef.current?.click(); }} style={{ padding: '4px 8px' }}>
          <Paperclip size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>File</span>
        </button>
        <button className="ribbon-btn" onClick={() => { if(checkEditor()) pdfInputRef.current?.click(); }} style={{ padding: '4px 8px' }}>
          <FileText size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Printout</span>
        </button>
        <div className="ribbon-group-title">Files</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => { if(checkEditor()) imgInputRef.current?.click(); }} style={{ padding: '4px 8px' }}>
          <Image size={24} color="#8b5cf6" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Pictures</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button className="ribbon-btn-small" onClick={() => alert('Vui lòng dùng phím tắt Win+Shift+S để chụp màn hình và Paste (Ctrl+V) vào ghi chú.')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}><Crop size={12} style={{ marginRight: '4px' }} /> Screen Clipping</button>
          <button className="ribbon-btn-small" onClick={() => {
            const url = window.prompt('URL hình ảnh:');
            if (url && checkEditor()) activeEditor?.chain().focus().setImage({ src: url }).run();
          }} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}><Globe size={12} style={{ marginRight: '4px' }} /> Online Pictures</button>
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
        }} style={{ padding: '4px 8px' }}>
          <Link size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Link</span>
        </button>
        <div className="ribbon-group-title">Links</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => { if(checkEditor()) setRecordingType('audio'); }} style={{ padding: '4px 8px' }}>
          <Mic size={24} color="#ef4444" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Record Audio</span>
        </button>
        <button className="ribbon-btn" onClick={() => { if(checkEditor()) setRecordingType('video'); }} style={{ padding: '4px 8px' }}>
          <Video size={24} color="#14b8a6" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Record Video</span>
        </button>
        <div className="ribbon-group-title">Recording</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          if (checkEditor()) activeEditor?.chain().focus().insertContent(new Date().toLocaleString()).run();
        }} style={{ padding: '4px 8px' }}>
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
        }} style={{ padding: '4px 8px' }}>
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
  const { drawTool, drawColor, setDrawTool, setDrawColor, setDrawWidth } = useCanvasStore();

  return (
    <>
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" onClick={() => setDrawTool('type')} style={{ padding: '4px 8px', backgroundColor: drawTool === 'type' ? '#e5e7eb' : 'transparent' }}>
        <MousePointer2 size={24} color="#374151" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Type</span>
      </button>
      <button className="ribbon-btn" onClick={() => setDrawTool('lasso')} style={{ padding: '4px 8px', backgroundColor: drawTool === 'lasso' ? '#e5e7eb' : 'transparent' }}>
        <Lasso size={24} color="#374151" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Lasso</span>
      </button>
      <button className="ribbon-btn" onClick={() => setDrawTool('pan')} style={{ padding: '4px 8px', backgroundColor: drawTool === 'pan' ? '#e5e7eb' : 'transparent' }}>
        <Hand size={24} color="#374151" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Panning</span>
      </button>
      <div className="ribbon-group-title">Tools</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
        <button className="ribbon-btn-small" onClick={() => { setDrawTool('pen'); setDrawColor('#000000'); setDrawWidth(3); }} style={{ width: '40px', height: '40px', border: drawTool === 'pen' && drawColor === '#000000' ? '2px solid #3b82f6' : '1px solid #d1d5db', backgroundColor: '#f3f4f6' }}><PenTool size={20} color="#000" /></button>
        <button className="ribbon-btn-small" onClick={() => { setDrawTool('pen'); setDrawColor('#ef4444'); setDrawWidth(3); }} style={{ width: '40px', height: '40px', border: drawTool === 'pen' && drawColor === '#ef4444' ? '2px solid #3b82f6' : '1px solid transparent', backgroundColor: '#fef2f2' }}><PenTool size={20} color="#ef4444" /></button>
        <button className="ribbon-btn-small" onClick={() => { setDrawTool('highlighter'); setDrawColor('#facc15'); setDrawWidth(20); }} style={{ width: '40px', height: '40px', border: drawTool === 'highlighter' ? '2px solid #3b82f6' : '1px solid transparent', backgroundColor: '#fefce8' }}><Edit3 size={20} color="#facc15" /></button>
      </div>
      <div className="ribbon-group-title">Pens Gallery</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '4px', padding: '4px' }}>
        <button className="ribbon-btn-small" onClick={() => setDrawTool('shape')} style={{ backgroundColor: drawTool === 'shape' ? '#e5e7eb' : 'transparent' }}><Square size={18} /></button>
        <button className="ribbon-btn-small" onClick={() => setDrawTool('shape')} style={{ backgroundColor: drawTool === 'shape' ? '#e5e7eb' : 'transparent' }}><Circle size={18} /></button>
        <button className="ribbon-btn-small" onClick={() => setDrawTool('shape')} style={{ backgroundColor: drawTool === 'shape' ? '#e5e7eb' : 'transparent' }}><Triangle size={18} /></button>
      </div>
      <div className="ribbon-group-title">Shapes</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" onClick={() => alert('Vui lòng đợi cập nhật tính năng Đồ thị Toán học.')} style={{ padding: '4px 8px' }}>
        <TrendingUp size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Graph</span>
      </button>
      <div className="ribbon-group-title">Graph</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button className="ribbon-btn-small" onClick={() => alert('Vui lòng đợi tính năng Ink to Text')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}>Ink to Text</button>
        <button className="ribbon-btn-small" onClick={() => alert('Vui lòng đợi tính năng Ink to Math')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}>Ink to Math</button>
        <button className="ribbon-btn-small" onClick={() => alert('Vui lòng đợi tính năng Ink to Shape')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}>Ink to Shape</button>
      </div>
      <div className="ribbon-group-title">Convert</div>
    </div>
  </>
  );
};


const ViewRibbonContent = () => {
  const activeNoteId = useWorkspaceStore(state => state.activeNoteId);
  const activeEditor = useEditorStore(state => state.activeEditor);
  const { setZoom, setPageColor, setGridPattern, setPaperSize } = useCanvasStore();
  const [showImmersive, setShowImmersive] = useState(false);
  const [paperDropdownOpen, setPaperDropdownOpen] = useState(false);
  const paperBtnRef = React.useRef<HTMLButtonElement>(null);
  const [paperCoords, setPaperCoords] = useState({ top: 0, left: 0 });

  const handleZoom = (zoomLevel: number) => {
    if (activeNoteId) setZoom(activeNoteId, zoomLevel);
  };

  const handleKeepOnTop = async () => {
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 400,
          height: 600,
        });
        pipWindow.document.body.innerHTML = `
          <div style="padding: 20px; font-family: sans-serif;">
            <h3>NoteGravity PiP</h3>
            <div>${activeEditor?.getHTML() || 'Không có nội dung'}</div>
          </div>
        `;
      } catch (err) {
        alert('Lỗi khi mở chế độ Always On Top: ' + err);
      }
    } else {
      alert('Trình duyệt của bạn không hỗ trợ Document Picture-in-Picture API. Vui lòng dùng Chrome mới nhất.');
    }
  };

  const togglePaperDropdown = () => {
    if (!paperDropdownOpen && paperBtnRef.current) {
      const rect = paperBtnRef.current.getBoundingClientRect();
      setPaperCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setPaperDropdownOpen(!paperDropdownOpen);
  };

  return (
    <>
      <ImmersiveReaderModal 
        isOpen={showImmersive} 
        onClose={() => setShowImmersive(false)} 
        text={activeEditor?.getText() || ''} 
      />

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
        }} style={{ padding: '4px 8px' }}>
          <div style={{ width: '24px', height: '24px', border: '1px solid #d1d5db', marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Normal View</span>
        </button>
        <button className="ribbon-btn" onClick={() => {
          document.documentElement.requestFullscreen().catch(err => alert('Fullscreen API không được hỗ trợ.'));
        }} style={{ padding: '4px 8px' }}>
          <MonitorSmartphone size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Full Page</span>
        </button>
        <div className="ribbon-group-title">Views</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button className="ribbon-btn-small" onClick={() => window.open(window.location.href, '_blank', 'width=450,height=800,left=100')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }}><AppWindow size={12} style={{ marginRight: '4px' }} /> Dock to Desktop</button>
          <button className="ribbon-btn-small" onClick={() => window.open(window.location.href, '_blank')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }}><AppWindow size={12} style={{ marginRight: '4px' }} /> New Window</button>
          <button className="ribbon-btn-small" onClick={handleKeepOnTop} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }}><Pin size={12} style={{ marginRight: '4px' }} /> Keep on Top</button>
        </div>
        <div className="ribbon-group-title">Window</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => setShowImmersive(true)} style={{ padding: '4px 8px' }}>
          <Ear size={24} color="#8b5cf6" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Immersive</span>
        </button>
        <div className="ribbon-group-title">Immersive</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          if (activeNoteId) {
            const colors = ['#ffffff', '#fef3c7', '#dcfce7', '#e0f2fe', '#fce7f3'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            setPageColor(activeNoteId, randomColor);
          }
        }} style={{ padding: '4px 8px' }}>
          <Palette size={24} color="#10b981" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Page Color</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button className="ribbon-btn-small" onClick={() => {
            if (activeNoteId) {
              const patterns = ['none', 'rule', 'grid'] as const;
              const current = useCanvasStore.getState().pages[activeNoteId]?.gridPattern || 'none';
              const next = patterns[(patterns.indexOf(current) + 1) % patterns.length];
              setGridPattern(activeNoteId, next);
            }
          }} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '80px' }}>Rule Lines</button>
          <button ref={paperBtnRef} className="ribbon-btn-small" onClick={togglePaperDropdown} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '80px' }}>
            Paper Size <ChevronDown size={12} style={{ marginLeft: 'auto' }} />
          </button>
        </div>
        <div className="ribbon-group-title">Page Setup</div>
      </div>

      {paperDropdownOpen && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setPaperDropdownOpen(false)} />
          <div style={{
            position: 'absolute', top: `${paperCoords.top}px`, left: `${paperCoords.left}px`, 
            backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '4px 0', zIndex: 99999, minWidth: '120px'
          }}>
            {[
              { label: 'Auto (Vô cực)', value: 'auto' },
              { label: 'A4 (210 x 297mm)', value: 'a4' },
              { label: 'A3 (297 x 420mm)', value: 'a3' },
              { label: 'Letter (8.5 x 11")', value: 'letter' },
            ].map(size => (
              <div 
                key={size.value}
                onClick={() => {
                  if (activeNoteId) setPaperSize(activeNoteId, size.value as any);
                  setPaperDropdownOpen(false);
                }}
                style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {size.label}
              </div>
            ))}
          </div>
        </>,
        document.body
      )}

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => handleZoom(1)} style={{ padding: '4px 8px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>100%</span>
          <span style={{ fontSize: '12px' }}>Zoom 100%</span>
        </button>
        <button className="ribbon-btn" onClick={() => handleZoom(1.5)} style={{ padding: '4px 8px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>↔</span>
          <span style={{ fontSize: '12px' }}>Page Width</span>
        </button>
        <div className="ribbon-group-title">Zoom</div>
      </div>
    </>
  );
};

const HistoryRibbonContent = ({ activeEditor }: { activeEditor: any }) => {
  const [showRecentEdits, setShowRecentEdits] = React.useState(false);
  
  return (
    <>
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => alert('Đã đánh dấu toàn bộ trang trong Notebook là Đã Đọc!')} style={{ padding: '4px 8px' }}>
          <CheckSquare size={24} color="#10b981" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Mark Read</span>
        </button>
        <div className="ribbon-group-title">Unread</div>
      </div>
      
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => setShowRecentEdits(true)} style={{ padding: '4px 8px' }}>
          <Clock size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Recent Edits</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button className="ribbon-btn-small" onClick={() => alert('Văn bản này đang được lưu trữ cục bộ (Local). Bạn là tác giả duy nhất của trang này.')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}><FileSearch size={12} style={{ marginRight: '4px' }} /> Find by Author</button>
          <button className="ribbon-btn-small" onClick={() => alert('Đã ẩn thông tin tác giả khỏi văn bản (Local Mode).')} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}><UserMinus size={12} style={{ marginRight: '4px' }} /> Hide Authors</button>
        </div>
        <div className="ribbon-group-title">Authors</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => alert('Phiên bản hiện tại là phiên bản mới nhất. Tính năng Version History yêu cầu bật đồng bộ Cloud Storage để lưu trữ các bản nháp cũ.')} style={{ padding: '4px 8px' }}>
          <History size={24} color="#f59e0b" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Page Versions</span>
        </button>
        <button className="ribbon-btn" onClick={() => alert('Thùng rác hiện đang trống. Dữ liệu đã xóa đã được dọn dẹp khỏi bộ nhớ Local để tối ưu dung lượng.')} style={{ padding: '4px 8px' }}>
          <Trash2 size={24} color="#ef4444" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Recycle Bin</span>
        </button>
        <div className="ribbon-group-title">History</div>
      </div>

      {showRecentEdits && (
        <RecentEditsModal onClose={() => setShowRecentEdits(false)} />
      )}
    </>
  );
};

const ReviewRibbonContent = ({ activeEditor }: { activeEditor: any }) => {
  const activeNoteId = useWorkspaceStore(state => state.activeNoteId);
  
  return (
    <>
      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          if (!activeEditor) return;
          const currentSpellcheck = activeEditor.view.dom.spellcheck;
          activeEditor.view.dom.spellcheck = !currentSpellcheck;
          alert(`Đã ${!currentSpellcheck ? 'BẬT' : 'TẮT'} tính năng kiểm tra chính tả của trình duyệt.`);
        }} style={{ padding: '4px 8px' }}>
          <SpellCheck size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Spelling</span>
        </button>
        <button className="ribbon-btn" onClick={() => {
          const selected = window.getSelection()?.toString();
          if (!selected) {
            alert('Vui lòng bôi đen một từ để tra từ điển đồng nghĩa!');
            return;
          }
          window.open(`https://1tudien.com/?word=${encodeURIComponent(selected)}`, '_blank', 'width=800,height=600');
        }} style={{ padding: '4px 8px' }}>
          <FileSearch size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Thesaurus</span>
        </button>
        <div className="ribbon-group-title">Spelling</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          const selected = window.getSelection()?.toString();
          if (!selected) {
            alert('Vui lòng bôi đen đoạn văn bản cần dịch!');
            return;
          }
          window.open(`https://translate.google.com/?sl=auto&tl=vi&text=${encodeURIComponent(selected)}`, '_blank', 'width=1000,height=600');
        }} style={{ padding: '4px 8px' }}>
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
        }} style={{ padding: '4px 8px' }}>
          <Languages size={24} color="#6366f1" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Language</span>
        </button>
        <div className="ribbon-group-title">Language</div>
      </div>

      <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
        <button className="ribbon-btn" onClick={() => {
          if (activeNoteId) {
            useTreeStore.getState().toggleLock(activeNoteId);
            const isLocked = useTreeStore.getState().lockedIds.has(activeNoteId);
            alert(`Đã ${isLocked ? 'KHÓA' : 'MỞ KHÓA'} Note hiện tại.`);
          }
        }} style={{ padding: '4px 8px' }}>
          <Lock size={24} color="#ef4444" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '12px' }}>Password</span>
        </button>
        <div className="ribbon-group-title">Protect</div>
      </div>
    </>
  );
};

const TableLayoutRibbonContent = ({ activeEditor }: { activeEditor: any }) => (
  <>
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" onClick={() => activeEditor?.chain().focus().deleteTable().run()} style={{ padding: '4px 8px' }}>
        <Trash2 size={24} color="#ef4444" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Delete Table</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().deleteRow().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}><Square size={12} style={{ marginRight: '4px' }} /> Delete Row</button>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().deleteColumn().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}><Square size={12} style={{ marginRight: '4px' }} /> Delete Col</button>
      </div>
      <div className="ribbon-group-title">Delete</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().addRowBefore().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }}><ChevronUp size={12} style={{ marginRight: '4px' }} /> Row Above</button>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().addRowAfter().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }}><ChevronDown size={12} style={{ marginRight: '4px' }} /> Row Below</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '4px' }}>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().addColumnBefore().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }}><ArrowUpDown size={12} style={{ marginRight: '4px', transform: 'rotate(90deg)' }} /> Col Left</button>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().addColumnAfter().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }}><ArrowUpDown size={12} style={{ marginRight: '4px', transform: 'rotate(90deg)' }} /> Col Right</button>
      </div>
      <div className="ribbon-group-title">Rows & Columns</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" onClick={() => activeEditor?.chain().focus().mergeCells().run()} style={{ padding: '4px 8px' }}>
        <Square size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Merge Cells</span>
      </button>
      <button className="ribbon-btn" onClick={() => activeEditor?.chain().focus().splitCell().run()} style={{ padding: '4px 8px' }}>
        <Grid size={24} color="#6366f1" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Split Cell</span>
      </button>
      <div className="ribbon-group-title">Merge</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().toggleHeaderRow().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '110px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#e5e7eb', marginRight: '4px' }} /> Header Row
        </button>
        <button className="ribbon-btn-small" onClick={() => activeEditor?.chain().focus().toggleHeaderColumn().run()} style={{ fontSize: '11px', justifyContent: 'flex-start', width: '110px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#e5e7eb', marginRight: '4px' }} /> Header Column
        </button>
      </div>
      <div className="ribbon-group-title">Options</div>
    </div>
  </>
);
