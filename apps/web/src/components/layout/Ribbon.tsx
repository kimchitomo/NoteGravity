import React, { useState, useEffect } from 'react';
import { 
  ChevronUp, ChevronDown, Bold, Italic, Underline, Strikethrough, Highlighter, PaintBucket, Type, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, CheckSquare, Link, Image, Table, Mic, Video, Clock,
  FileText, Paperclip, LayoutTemplate, Calculator, Smile, MousePointer2, Lasso, Hand, PenTool, Edit3, Square, Circle, Triangle, TrendingUp, MonitorSmartphone, Ear, Palette, FileSearch, Trash2, History, MessageSquare, SpellCheck, Globe, Lock, Search, Send,
  Indent, Outdent, ArrowUpDown, Crop, AppWindow, Pin, UserMinus, Languages
} from 'lucide-react';
import { BackstageView } from './BackstageView';
import { useIsMobile } from '../../hooks/useIsMobile';

type TabId = 'file' | 'home' | 'insert' | 'draw' | 'view' | 'history' | 'review' | 'table-layout';

export const Ribbon: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  useEffect(() => {
    if (isMobile) setIsCollapsed(true);
  }, [isMobile]);
  const [showBackstage, setShowBackstage] = useState(false);
  
  // Mock contextual state
  const isTableActive = true; // Set to true when Tiptap table is focused

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
      {showBackstage && <BackstageView onClose={() => setShowBackstage(false)} />}
      
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
                  setShowBackstage(true);
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
            {activeTab === 'home' && <HomeRibbonContent />}
            {activeTab === 'insert' && <InsertRibbonContent />}
            {activeTab === 'draw' && <DrawRibbonContent />}
            {activeTab === 'view' && <ViewRibbonContent />}
            {activeTab === 'history' && <HistoryRibbonContent />}
            {activeTab === 'review' && <ReviewRibbonContent />}
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

const HomeRibbonContent = () => (
  <>
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: '#fbbf24', borderRadius: '4px', marginBottom: '2px' }} />
        <span style={{ fontSize: '12px' }}>Paste</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: '100%' }}>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '60px' }}>Cut</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '60px' }}>Copy</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '60px' }}>Painter</button>
      </div>
      <div className="ribbon-group-title">Clipboard</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start', paddingBottom: '16px', gap: '4px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <select style={{ height: '24px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px', width: '120px' }}>
            <option>Inter</option>
            <option>Arial</option>
          </select>
          <select style={{ height: '24px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px', width: '50px' }}>
            <option>11</option>
            <option>12</option>
            <option>14</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className="ribbon-btn-small" title="Bold"><Bold size={14} /></button>
          <button className="ribbon-btn-small" title="Italic"><Italic size={14} /></button>
          <button className="ribbon-btn-small" title="Underline"><Underline size={14} /></button>
          <button className="ribbon-btn-small" title="Strikethrough"><Strikethrough size={14} /></button>
          <div style={{ width: '1px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />
          <button className="ribbon-btn-small" title="Highlight"><Highlighter size={14} color="#facc15" /></button>
          <button className="ribbon-btn-small" title="Font Color"><Type size={14} color="#ef4444" /></button>
          <button className="ribbon-btn-small" title="Clear Formatting"><PaintBucket size={14} /></button>
        </div>
      </div>
      <div className="ribbon-group-title">Basic Text</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button className="ribbon-btn" style={{ border: '1px solid #d1d5db', backgroundColor: '#f9fafb' }}>
          <span style={{ fontSize: '14px' }}>AaBbCc</span>
          <span style={{ fontSize: '10px' }}>Normal</span>
        </button>
        <button className="ribbon-btn" style={{ border: '1px solid transparent' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>AaBbCc</span>
          <span style={{ fontSize: '10px' }}>Heading 1</span>
        </button>
      </div>
      <div className="ribbon-group-title">Styles</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className="ribbon-btn-small" title="Bullets"><List size={14} /></button>
          <button className="ribbon-btn-small" title="Numbering"><ListOrdered size={14} /></button>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className="ribbon-btn-small active" title="Align Left"><AlignLeft size={14} /></button>
          <button className="ribbon-btn-small" title="Center"><AlignCenter size={14} /></button>
          <button className="ribbon-btn-small" title="Align Right"><AlignRight size={14} /></button>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className="ribbon-btn-small" title="Decrease Indent"><Outdent size={14} /></button>
          <button className="ribbon-btn-small" title="Increase Indent"><Indent size={14} /></button>
          <button className="ribbon-btn-small" title="Paragraph Spacing"><ArrowUpDown size={14} /></button>
        </div>
      </div>
      <div className="ribbon-group-title">Paragraph</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <CheckSquare size={24} color="#10b981" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>To Do</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Search size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Find Tags</span>
      </button>
      <div className="ribbon-group-title">Tags</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Send size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Email Page</span>
      </button>
      <div className="ribbon-group-title">Email</div>
    </div>
  </>
);

const InsertRibbonContent = () => (
  <>
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <div style={{ height: '24px', width: '24px', borderTop: '2px dashed #6b7280', borderBottom: '2px dashed #6b7280', marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Space</span>
      </button>
      <div className="ribbon-group-title">Space</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Table size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Table</span>
      </button>
      <div className="ribbon-group-title">Tables</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Paperclip size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>File</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <FileText size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Printout</span>
      </button>
      <div className="ribbon-group-title">Files</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Image size={24} color="#8b5cf6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Pictures</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}><Crop size={12} style={{ marginRight: '4px' }} /> Screen Clipping</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}><Globe size={12} style={{ marginRight: '4px' }} /> Online Pictures</button>
      </div>
      <div className="ribbon-group-title">Images</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Link size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Link</span>
      </button>
      <div className="ribbon-group-title">Links</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Mic size={24} color="#ef4444" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Record Audio</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Video size={24} color="#14b8a6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Record Video</span>
      </button>
      <div className="ribbon-group-title">Recording</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Clock size={24} color="#f59e0b" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Date/Time</span>
      </button>
      <div className="ribbon-group-title">Time Stamp</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <LayoutTemplate size={24} color="#6366f1" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Templates</span>
      </button>
      <div className="ribbon-group-title">Templates</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Calculator size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Equation</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Smile size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Symbol</span>
      </button>
      <div className="ribbon-group-title">Symbols</div>
    </div>
  </>
);

const DrawRibbonContent = () => (
  <>
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <MousePointer2 size={24} color="#374151" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Type</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Lasso size={24} color="#374151" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Lasso</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Hand size={24} color="#374151" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Panning</span>
      </button>
      <div className="ribbon-group-title">Tools</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
        <button className="ribbon-btn-small" style={{ width: '40px', height: '40px', border: '1px solid #d1d5db' }}><PenTool size={20} color="#000" /></button>
        <button className="ribbon-btn-small" style={{ width: '40px', height: '40px', border: '1px solid transparent' }}><PenTool size={20} color="#ef4444" /></button>
        <button className="ribbon-btn-small" style={{ width: '40px', height: '40px', border: '1px solid transparent' }}><Edit3 size={20} color="#facc15" /></button>
      </div>
      <div className="ribbon-group-title">Pens Gallery</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '4px', padding: '4px' }}>
        <button className="ribbon-btn-small"><Square size={18} /></button>
        <button className="ribbon-btn-small"><Circle size={18} /></button>
        <button className="ribbon-btn-small"><Triangle size={18} /></button>
      </div>
      <div className="ribbon-group-title">Shapes</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <TrendingUp size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Graph</span>
      </button>
      <div className="ribbon-group-title">Graph</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}>Ink to Text</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}>Ink to Math</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}>Ink to Shape</button>
      </div>
      <div className="ribbon-group-title">Convert</div>
    </div>
  </>
);

const ViewRibbonContent = () => (
  <>
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <div style={{ width: '24px', height: '24px', border: '1px solid #d1d5db', marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Normal View</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <MonitorSmartphone size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Full Page</span>
      </button>
      <div className="ribbon-group-title">Views</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }}><AppWindow size={12} style={{ marginRight: '4px' }} /> Dock to Desktop</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }}><AppWindow size={12} style={{ marginRight: '4px' }} /> New Window</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '100px' }}><Pin size={12} style={{ marginRight: '4px' }} /> Keep on Top</button>
      </div>
      <div className="ribbon-group-title">Window</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Ear size={24} color="#8b5cf6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Immersive</span>
      </button>
      <div className="ribbon-group-title">Immersive</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Palette size={24} color="#10b981" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Page Color</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '80px' }}>Rule Lines</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '80px' }}>Paper Size</button>
      </div>
      <div className="ribbon-group-title">Page Setup</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>100%</span>
        <span style={{ fontSize: '12px' }}>Zoom 100%</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>↔</span>
        <span style={{ fontSize: '12px' }}>Page Width</span>
      </button>
      <div className="ribbon-group-title">Zoom</div>
    </div>
  </>
);

const HistoryRibbonContent = () => (
  <>
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <CheckSquare size={24} color="#10b981" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Mark Read</span>
      </button>
      <div className="ribbon-group-title">Unread</div>
    </div>
    
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Clock size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Recent Edits</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}><FileSearch size={12} style={{ marginRight: '4px' }} /> Find by Author</button>
        <button className="ribbon-btn-small" style={{ fontSize: '11px', justifyContent: 'flex-start', width: '90px' }}><UserMinus size={12} style={{ marginRight: '4px' }} /> Hide Authors</button>
      </div>
      <div className="ribbon-group-title">Authors</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <History size={24} color="#f59e0b" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Page Versions</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Trash2 size={24} color="#ef4444" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Recycle Bin</span>
      </button>
      <div className="ribbon-group-title">History</div>
    </div>
  </>
);

const ReviewRibbonContent = () => (
  <>
    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <SpellCheck size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Spelling</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <FileSearch size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Thesaurus</span>
      </button>
      <div className="ribbon-group-title">Spelling</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <MessageSquare size={24} color="#10b981" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Translate</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Languages size={24} color="#6366f1" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Language</span>
      </button>
      <div className="ribbon-group-title">Language</div>
    </div>

    <div className="ribbon-group" style={{ height: '70px', alignItems: 'flex-start' }}>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Lock size={24} color="#f59e0b" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Password</span>
      </button>
      <button className="ribbon-btn" style={{ padding: '4px 8px' }}>
        <Link size={24} color="#6b7280" style={{ marginBottom: '4px' }} />
        <span style={{ fontSize: '12px' }}>Linked Notes</span>
      </button>
      <div className="ribbon-group-title">Notes</div>
    </div>
  </>
);
