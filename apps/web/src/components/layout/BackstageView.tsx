import React from 'react';
import { ArrowLeft, Info, Printer, Share2, Download, Upload, Send, Settings, User } from 'lucide-react';

interface BackstageViewProps {
  onClose: () => void;
}

export const BackstageView: React.FC<BackstageViewProps> = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#ffffff',
      zIndex: 9999,
      display: 'flex'
    }}>
      {/* Sidebar Menu */}
      <div style={{ width: '200px', backgroundColor: '#10b981', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <button 
          onClick={onClose}
          style={{ padding: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="backstage-menu">
          <button className="menu-btn"><Info size={18} /> Info</button>
          <button className="menu-btn"><Printer size={18} /> Print</button>
          <button className="menu-btn"><Share2 size={18} /> Share</button>
          <button className="menu-btn"><Download size={18} /> Export</button>
          <button className="menu-btn"><Upload size={18} /> Import</button>
          <button className="menu-btn"><Send size={18} /> Send</button>
          
          <div style={{ flex: 1 }} />
          
          <button className="menu-btn"><User size={18} /> Account</button>
          <button className="menu-btn"><Settings size={18} /> Options</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', backgroundColor: '#f9fafb' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#374151', marginBottom: '24px' }}>Notebook Information</h1>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>Sync Status</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '24px' }}>
            Up to date with NoteGravity Cloud
          </div>
          
          <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>Notebook Location</h2>
          <div style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontFamily: 'monospace', color: '#4b5563', marginBottom: '16px' }}>
            cloud://notegravity.com/users/admin/notebooks/main
          </div>
          
          <button style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Settings
          </button>
        </div>
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
        .menu-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};
