import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Mic, MicOff, Delete, Check, Trash2 } from 'lucide-react';
import { useTreeStore, asrWorker, initAsrWorker, terminateAsrWorker } from '../../store/useTreeStore';

export interface SpeechRecognitionModalProps {
  initialText: string;
  onClose: () => void;
  onApply: (text: string) => void;
}

export const SpeechRecognitionModal: React.FC<SpeechRecognitionModalProps> = ({ initialText, onClose, onApply }) => {
  const { offlineAsrDevice, setOfflineAsrDevice } = useTreeStore();
  const [inputValue, setInputValue] = useState(initialText);
  
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textBeforeRef = useRef<string>('');
  const textAfterRef = useRef<string>('');
  const inputValueRef = useRef<string>(initialText);
  const interimTranscriptRef = useRef<string>('');
  const ignoredResultIndices = useRef<Set<number>>(new Set());
  const currentResultIndex = useRef<number>(-1);

  const handleTextOrCursorChange = (newText?: string) => {
      const currentText = newText !== undefined ? newText : (textareaRef.current ? textareaRef.current.value : inputValueRef.current);
      const start = textareaRef.current?.selectionStart ?? currentText.length;
      const end = textareaRef.current?.selectionEnd ?? currentText.length;
      
      if (newText !== undefined) {
         setInputValue(newText);
         inputValueRef.current = newText;
      }
      
      if (interimTranscriptRef.current) {
         if (isListening && isOnline && recognitionRef.current) {
             ignoredResultIndices.current.add(currentResultIndex.current);
             interimTranscriptRef.current = '';
         }
      }
      
      textBeforeRef.current = currentText.substring(0, start);
      textAfterRef.current = currentText.substring(end);
  };
  
  // Sync ref with state
  useEffect(() => { inputValueRef.current = inputValue; }, [inputValue]);
  
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
      const defaultTitles = ['Ghi chú mới', 'Thư mục mới', 'Tiêu đề mới', 'Page Title', 'Sổ tay mới', 'Untitled', 'Sổ tay cá nhân', 'Sổ tay Công việc'];
      if (defaultTitles.includes(initialText.trim())) {
        textareaRef.current.select();
      } else {
        textareaRef.current.setSelectionRange(initialText.length, initialText.length);
      }
      handleTextOrCursorChange();
    }
    
    // Auto start listening on mount immediately to preserve user gesture token
    startListening();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopListening();
    };
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsTranscribing(true);
    } else if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setIsTranscribing(true);
    }
  };

  const startListening = async () => {
    if (isTranscribing) return;
    
    if (isOnline && typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // Use Online Engine
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'vi-VN';
      
      ignoredResultIndices.current.clear();
      currentResultIndex.current = -1;
      
      const currentText = textareaRef.current ? textareaRef.current.value : inputValueRef.current;
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart !== null ? textareaRef.current.selectionStart : currentText.length;
        const end = textareaRef.current.selectionEnd !== null ? textareaRef.current.selectionEnd : currentText.length;
        textBeforeRef.current = currentText.substring(0, start);
        textAfterRef.current = currentText.substring(end);
      } else {
        textBeforeRef.current = currentText;
        textAfterRef.current = '';
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        currentResultIndex.current = event.results.length - 1;
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (ignoredResultIndices.current.has(i)) continue;
          
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          textBeforeRef.current = (textBeforeRef.current ? textBeforeRef.current + ' ' : '') + finalTranscript.trim();
          setIsTranscribing(false);
        }
        
        interimTranscriptRef.current = interimTranscript;
        
        let prefix = textBeforeRef.current.trim();
        let middle = interimTranscript.trim();
        let suffix = textAfterRef.current.trim();

        let newText = prefix;
        if (middle) {
           newText += (newText ? ' ' : '') + middle;
        }
        const cursorPosition = newText.length;
        if (suffix) {
           newText += (newText ? ' ' : '') + suffix;
        }
        
        setInputValue(newText);
        
        setTimeout(() => {
           if (textareaRef.current) {
               textareaRef.current.selectionStart = cursorPosition;
               textareaRef.current.selectionEnd = cursorPosition;
           }
        }, 0);
      };

      recognition.onerror = () => {
        if (recognitionRef.current === recognition) {
           setIsListening(false);
           setIsTranscribing(false);
           recognitionRef.current = null;
        }
      };

      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
           setIsListening(false);
           setIsTranscribing(false);
           recognitionRef.current = null;
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } else {
      // Use Offline Engine
      try {
        if (!asrWorker && typeof window !== 'undefined') {
          initAsrWorker(offlineAsrDevice);
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        mediaRecorder.addEventListener('dataavailable', event => {
          audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', async () => {
          stream.getTracks().forEach(track => track.stop());
          const audioBlob = new Blob(audioChunks);
          const arrayBuffer = await audioBlob.arrayBuffer();

          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const audioData = audioBuffer.getChannelData(0);

          if (asrWorker) {
            asrWorker.onmessage = (e: MessageEvent) => {
              const { status, text, error } = e.data;
              if (status === 'complete' && text) {
                let prefix = textBeforeRef.current.trim();
                let middle = text.trim();
                let suffix = textAfterRef.current.trim();
                
                let newText = prefix;
                if (middle) newText += (newText ? ' ' : '') + middle;
                const cursorPosition = newText.length;
                if (suffix) newText += (newText ? ' ' : '') + suffix;
                
                setInputValue(newText);
                textBeforeRef.current = newText.substring(0, cursorPosition);
                textAfterRef.current = suffix;
                
                setTimeout(() => {
                   if (textareaRef.current) {
                       textareaRef.current.selectionStart = cursorPosition;
                       textareaRef.current.selectionEnd = cursorPosition;
                   }
                }, 0);
                setIsTranscribing(false);
              } else if (status === 'error') {
                console.error('ASR Worker Error:', error);
                alert('Lỗi Nhận diện Giọng nói (Offline): ' + error + '\nBạn hãy thử chuyển sang CPU hoặc bật mạng để sử dụng Nhận diện Online.');
                setIsTranscribing(false);
              }
            };
            asrWorker.postMessage({ type: 'TRANSCRIBE', audio: audioData, id: Date.now().toString() });
          }
        });

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsListening(true);
      } catch (err) {
        console.error('Microphone error:', err);
        setIsTranscribing(false);
        alert('Không thể truy cập Microphone!');
      }
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const deleteLastWord = () => {
    const currentText = textareaRef.current ? textareaRef.current.value : inputValueRef.current;
    const start = textareaRef.current?.selectionStart ?? currentText.length;
    
    let textBefore = currentText.substring(0, start).trimEnd();
    let textAfter = currentText.substring(start);
    
    const words = textBefore.split(' ');
    words.pop();
    const newTextBefore = words.join(' ');
    const newText = newTextBefore + (newTextBefore && textAfter ? ' ' : '') + textAfter;
    
    setInputValue(newText);
    inputValueRef.current = newText;
    
    // Update cursor asynchronously after React renders the new value
    setTimeout(() => {
        if (textareaRef.current) {
           textareaRef.current.focus();
           textareaRef.current.selectionStart = newTextBefore.length;
           textareaRef.current.selectionEnd = newTextBefore.length;
           handleTextOrCursorChange();
        }
    }, 0);
  };

  const clearAll = () => {
    handleTextOrCursorChange('');
    setTimeout(() => {
        if (textareaRef.current) {
           textareaRef.current.focus();
        }
    }, 0);
  };

  const modalContent = (
    <div 
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} 
      onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          onApply(inputValue.trim());
        }
        if (e.key === 'F3') {
          e.preventDefault();
          e.stopPropagation();
          if (!e.repeat) {
            toggleListening();
          }
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '24px', width: '600px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid #e5e7eb' }} onMouseDown={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: isOnline ? '#dcfce7' : '#f3f4f6', color: isOnline ? '#16a34a' : '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Mic size={20} />
            </div>
            Nhập liệu Giọng nói {isOnline ? <span style={{ fontSize: '14px', fontWeight: 500, color: '#16a34a' }}>(Online)</span> : <span style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>(Offline)</span>}
          </h2>
          <button onClick={onClose} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex' }}>✕</button>
        </div>

        <div style={{ position: 'relative', minHeight: '160px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }}>
          <textarea 
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              handleTextOrCursorChange(e.target.value);
            }}
            onClick={() => {
              handleTextOrCursorChange();
            }}
            onKeyUp={(e) => {
              if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                handleTextOrCursorChange();
              }
            }}
            style={{ flex: 1, backgroundColor: 'transparent', resize: 'none', outline: 'none', fontSize: '18px', color: '#1f2937', width: '100%', border: 'none' }}
            placeholder="Hãy bắt đầu nói..."
            autoFocus
          />
          
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={clearAll}
              title="Xóa tất cả"
              style={{ padding: '10px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '50%', cursor: 'pointer', display: 'flex', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={deleteLastWord}
              title="Xóa từ cuối"
              style={{ padding: '10px', backgroundColor: 'white', border: '1px solid #e5e7eb', color: '#4b5563', borderRadius: '50%', cursor: 'pointer', display: 'flex', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
            >
              <Delete size={20} />
            </button>
            
            <button 
              onClick={toggleListening}
              title={isListening ? "Dừng ghi âm và nhận diện" : "Bắt đầu nói"}
              style={{ padding: '14px', borderRadius: '50%', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: isListening ? '#ef4444' : '#0066cc', animation: isTranscribing ? 'none' : isListening ? 'speechpulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none' }}
            >
              {isTranscribing ? (
                 <span style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'speechspin 1s linear infinite' }} />
              ) : isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>
            {(!isOnline || typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) && (
              <>
                <span>Lõi xử lý Offline:</span>
                <select
                  value={offlineAsrDevice}
                  onChange={(e) => {
                    setOfflineAsrDevice(e.target.value as any);
                    terminateAsrWorker();
                    setTimeout(() => initAsrWorker(e.target.value as any), 100);
                  }}
                  style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 12px', outline: 'none', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                >
                  <option value="webgpu">Card Đồ hoạ (WebGPU)</option>
                  <option value="wasm">Bộ vi xử lý (CPU)</option>
                </select>
              </>
            )}
          </div>
          
          <button 
            onClick={() => onApply(inputValue.trim())}
            style={{ backgroundColor: '#0066cc', color: 'white', padding: '10px 24px', borderRadius: '12px', fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          >
            <Check size={20} />
            Xác nhận
          </button>
        </div>
      </div>
      <style>
        {`
          @keyframes speechpulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
          @keyframes speechspin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
  
  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(modalContent, document.body);
};

