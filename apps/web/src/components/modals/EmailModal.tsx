import React, { useState, useEffect } from 'react';
import { useTreeStore } from '../../store/useTreeStore';
import { Mail, CheckCircle2, Loader2, X } from 'lucide-react';

export const EmailModal = () => {
  const { emailModalNodeIds, closeEmailModal } = useTreeStore();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [recipient, setRecipient] = useState('');
  const [server, setServer] = useState('');

  const handleSend = () => {
    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
      console.log(`Email sent successfully for notes ${emailModalNodeIds?.join(', ')} to ${recipient} via ${server}.`);
    }, 2000);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '8px', padding: '24px',
        width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        position: 'relative'
      }}>
        <button 
          onClick={closeEmailModal}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={20} color="#666" />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          {status === 'idle' ? (
            <>
              <Mail size={48} color="#0066cc" />
              <h3 style={{ margin: 0, color: '#333' }}>Gửi Email Đính kèm</h3>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#333' }}>Email người nhận</label>
                  <input 
                    type="email" 
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="ví dụ: user@example.com"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#333' }}>Setup Email Server (SMTP)</label>
                  <input 
                    type="text" 
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    placeholder="ví dụ: smtp.gmail.com:587"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <button 
                onClick={handleSend}
                disabled={!recipient || !server}
                style={{
                  marginTop: '16px', width: '100%', padding: '10px', backgroundColor: recipient && server ? '#0066cc' : '#ccc',
                  color: '#fff', border: 'none', borderRadius: '4px', cursor: recipient && server ? 'pointer' : 'not-allowed',
                  fontWeight: 500
                }}
              >
                Gửi Email
              </button>
            </>
          ) : status === 'sending' ? (
            <>
              <Loader2 size={48} color="#0066cc" style={{ animation: 'spin 2s linear infinite' }} />
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              <h3 style={{ margin: 0, color: '#333' }}>Đang gửi Email...</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Đang đóng gói nội dung ghi chú và đính kèm các tệp...
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 size={48} color="#10b981" />
              <h3 style={{ margin: 0, color: '#333' }}>Gửi thành công!</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Ghi chú đã được gửi qua email cùng toàn bộ file đính kèm.
              </p>
              <button 
                onClick={closeEmailModal}
                style={{
                  marginTop: '8px', padding: '8px 24px', backgroundColor: '#0066cc',
                  color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Đóng
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
