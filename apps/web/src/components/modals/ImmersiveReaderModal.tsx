import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Square, Volume2, Type, ZoomIn, ZoomOut, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface ImmersiveReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

type TTSStatus = 'idle' | 'loading_model' | 'ready' | 'generating' | 'playing' | 'paused' | 'error';

export const ImmersiveReaderModal: React.FC<ImmersiveReaderModalProps> = ({ isOpen, onClose, text }) => {
  const [fontSize, setFontSize] = useState(24);
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const workerRef = useRef<Worker | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [engineOverride, setEngineOverride] = useState<'google' | 'xenova' | null>(null);

  const activeEngine = engineOverride || (isOnline ? 'google' : 'xenova');

  // Network listener
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setEngineOverride(null); };
    const handleOffline = () => { setIsOnline(false); setEngineOverride(null); };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ensure voices are loaded
  useEffect(() => {
    if (isOpen && activeEngine === 'google') {
      window.speechSynthesis.getVoices();
    }
  }, [isOpen, activeEngine]);

  useEffect(() => {
    if (!isOpen) {
      handleStop();
      return;
    }

    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../../workers/tts.worker.ts', import.meta.url), {
        type: 'module'
      });
      
      workerRef.current.onmessage = (e) => {
        const data = e.data;
        if (data.status === 'loading') setStatus('loading_model');
        else if (data.status === 'loaded') {
          if (status !== 'playing' && status !== 'paused' && status !== 'generating') {
            setStatus('ready');
          }
        }
        else if (data.status === 'generating') setStatus('generating');
        else if (data.status === 'complete') {
          playAudioData(data.audio, data.sampling_rate);
        }
        else if (data.status === 'error') {
          setStatus('error');
          setErrorMsg(data.error);
        }
      };

      workerRef.current.postMessage({ type: 'INIT' });
    }

    if (activeEngine === 'google' && status === 'idle') {
      setStatus('ready');
    }

    return () => {
      handleStop();
    };
  }, [isOpen]);

  const playAudioData = (audioData: Float32Array, sampleRate: number) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext({ sampleRate });
      audioCtxRef.current = ctx;

      const buffer = ctx.createBuffer(1, audioData.length, sampleRate);
      buffer.getChannelData(0).set(audioData as any);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setStatus('ready');
      };
      
      sourceNodeRef.current = source;
      source.start(0);
      setStatus('playing');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const handlePlay = () => {
    if (status === 'paused') {
      if (activeEngine === 'google') {
        window.speechSynthesis.resume();
      } else if (audioCtxRef.current) {
        audioCtxRef.current.resume();
      }
      setStatus('playing');
      return;
    }
    
    if (status === 'ready' || status === 'error' || status === 'idle') {
      if (!text.trim()) return;
      
      if (activeEngine === 'google') {
        window.speechSynthesis.cancel();
        
        const tryPlay = () => {
          let voices = window.speechSynthesis.getVoices();
          if (voices.length === 0) return false;
          
          const viVoices = voices.filter(v => v.lang.toLowerCase().startsWith('vi') || v.name.toLowerCase().includes('việt') || v.name.toLowerCase().includes('viet'));
          
          if (viVoices.length === 0) {
            // FALLBACK TO XENOVA if the browser has NO Vietnamese voice installed
            setEngineOverride('xenova');
            if (workerRef.current) {
              setStatus('generating');
              const textToRead = text.length > 300 ? text.substring(0, 300) + "..." : text;
              workerRef.current.postMessage({ 
                type: 'GENERATE', 
                text: textToRead,
                id: Date.now().toString() 
              });
            }
            return true;
          }
          
          viVoices.sort((a, b) => {
             const score = (v: SpeechSynthesisVoice) => {
                let s = 0;
                const name = v.name.toLowerCase();
                if (name.includes('google')) s += 10;
                if (name.includes('online')) s += 5;
                if (name.includes('natural')) s += 5;
                if (name.includes('premium')) s += 5;
                return s;
             };
             return score(b) - score(a);
          });
          
          let viVoice = viVoices[0];
          setSelectedVoiceName(viVoice ? viVoice.name : 'Unknown');
                     
          const utterance = new SpeechSynthesisUtterance(text);
          if (viVoice) utterance.voice = viVoice;
          utterance.lang = 'vi-VN';
          
          utterance.onstart = () => setStatus('playing');
          utterance.onend = () => setStatus('ready');
          utterance.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
              setStatus('error');
              setErrorMsg(e.error);
            }
          };
          
          utteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
          setStatus('generating');
          return true;
        };

        if (!tryPlay()) {
          setStatus('loading_model');
          const onVoicesChanged = () => {
            if (tryPlay()) {
              window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
            }
          };
          window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
          
          // Fallback if voiceschanged never fires (some browsers)
          setTimeout(() => {
             if (!window.speechSynthesis.speaking && activeEngine === 'google') {
                tryPlay();
             }
          }, 1000);
        }
        
      } else {
        if (!workerRef.current) return;
        setStatus('generating');
        // Offline AI is slow, limit length
        const textToRead = text.length > 300 ? text.substring(0, 300) + "..." : text;
        
        workerRef.current.postMessage({ 
          type: 'GENERATE', 
          text: textToRead,
          id: Date.now().toString() 
        });
      }
    }
  };

  const handlePause = () => {
    if (status === 'playing') {
      if (activeEngine === 'google') {
        window.speechSynthesis.pause();
      } else if (audioCtxRef.current) {
        audioCtxRef.current.suspend();
      }
      setStatus('paused');
    }
  };

  const handleStop = () => {
    // Stop Web Speech
    window.speechSynthesis.cancel();
    
    // Stop Xenova Audio
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (status === 'playing' || status === 'paused' || status === 'generating') {
      setStatus('ready');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000, backgroundColor: '#fdf6e3', 
      display: 'flex', flexDirection: 'column', color: '#1a202c', overflow: 'hidden'
    }}>
      {/* Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Volume2 size={24} color="#6366f1" />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            Immersive Reader 
            <span style={{ fontSize: '12px', fontWeight: 'normal', marginLeft: '8px', padding: '4px 8px', borderRadius: '12px', backgroundColor: isOnline ? '#dcfce7' : '#f1f5f9', color: isOnline ? '#166534' : '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle' }}>
              {isOnline ? <><Wifi size={12}/> {selectedVoiceName ? `Google Cloud Voice (${selectedVoiceName})` : 'Google Cloud Voice'}</> : <><WifiOff size={12}/> Xenova Offline TTS</>}
            </span>
          </h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '8px' }}>
            <Type size={16} />
            <button onClick={() => setFontSize(f => Math.max(16, f - 2))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}><ZoomOut size={16} /></button>
            <span style={{ fontSize: '14px', minWidth: '30px', textAlign: 'center' }}>{fontSize}</span>
            <button onClick={() => setFontSize(f => Math.min(64, f + 2))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}><ZoomIn size={16} /></button>
          </div>
          
          <button onClick={() => { handleStop(); onClose(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={24} color="#64748b" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 10%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '800px', width: '100%', fontSize: `${fontSize}px`, lineHeight: 1.8, fontFamily: 'serif', whiteSpace: 'pre-wrap' }}>
          {text || 'Không có nội dung để đọc.'}
          {status === 'error' && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} />
              Lỗi TTS: {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {status === 'loading_model' || (status === 'generating' && activeEngine === 'xenova') ? (
            <button disabled style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#a5b4fc', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={24} className="animate-spin" />
            </button>
          ) : status === 'playing' ? (
            <button onClick={handlePause} style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pause size={24} fill="#fff" />
            </button>
          ) : (
            <button onClick={handlePlay} disabled={status === 'idle' && activeEngine === 'xenova'} style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: (status === 'idle' && activeEngine === 'xenova') ? '#cbd5e1' : '#6366f1', color: '#fff', border: 'none', cursor: (status === 'idle' && activeEngine === 'xenova') ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={24} fill="#fff" />
            </button>
          )}
          
          <button onClick={handleStop} disabled={status !== 'playing' && status !== 'paused' && status !== 'generating'} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: (status === 'playing' || status === 'paused' || status === 'generating') ? '#ef4444' : '#e2e8f0', color: '#fff', border: 'none', cursor: (status === 'playing' || status === 'paused' || status === 'generating') ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Square size={16} fill="#fff" />
          </button>
        </div>
        
        {/* Status text */}
        <div style={{ position: 'absolute', right: '24px', bottom: '36px', fontSize: '12px', color: '#64748b' }}>
          {status === 'idle' && activeEngine === 'xenova' && 'Khởi tạo Offline Model...'}
          {status === 'loading_model' && 'Đang tải AI Model (~20MB)...'}
          {status === 'ready' && 'Sẵn sàng'}
          {status === 'generating' && activeEngine === 'xenova' && 'Đang tạo âm thanh AI...'}
          {status === 'generating' && activeEngine === 'google' && 'Đang kết nối Google Cloud...'}
        </div>
      </div>
    </div>
  );
};
