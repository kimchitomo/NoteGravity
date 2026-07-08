import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Square, Volume2, Type, ZoomIn, ZoomOut, Loader2, AlertCircle, Wifi, WifiOff, Download, Mic, MicOff, CloudDownload, Check, SkipBack, SkipForward, RotateCcw, RotateCw, Trash2, ChevronDown, ChevronUp, Cpu, ChevronRight } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useTreeStore, findNodeById } from '../../store/useTreeStore';

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
  
  const [isGeneratingFile, setIsGeneratingFile] = useState(false);
  const [isCachingOffline, setIsCachingOffline] = useState(false);
  const [isCachedOffline, setIsCachedOffline] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const workerRef = useRef<Worker | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioApiRef = useRef<HTMLAudioElement | null>(null);
  const shouldContinueRef = useRef(false);
  const autoPlayTriggeredRef = useRef(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [engineOverride, setEngineOverride] = useState<'google' | 'google-api' | 'xenova' | null>(null);
  const [engineMode, setEngineMode] = useState<'google-api' | 'xenova'>('google-api');
  const immersivePlaylist = useWorkspaceStore(state => state.immersivePlaylist);
  const { setFocus, setSelected, expandedIds, toggleExpand, data } = useTreeStore();

  const globalChunks = React.useMemo(() => {
    let finalChunks: { text: string; nodeId?: string; isNewNode?: boolean }[] = [];
    if (immersivePlaylist && immersivePlaylist.length > 0) {
      immersivePlaylist.forEach((item, index) => {
        const raw = item.text.match(/[^.!?\n]+[.!?\n]*/g) || [item.text];
        raw.map(c => c.trim()).filter(c => c.length > 0).forEach((c, cIdx) => {
           const parts = c.match(/.{1,200}(\s|$)/g) || [c];
           parts.map(p => p.trim()).filter(p => p.length > 0).forEach((p, pIdx) => {
              finalChunks.push({ 
                 text: p, 
                 nodeId: item.nodeId, 
                 isNewNode: cIdx === 0 && pIdx === 0 && index > 0 
              });
           });
        });
      });
    } else if (text) {
      const rawChunks = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
      rawChunks.map(c => c.trim()).filter(c => c.length > 0).forEach(c => {
         const parts = c.match(/.{1,200}(\s|$)/g) || [c];
         parts.map(p => p.trim()).filter(p => p.length > 0).forEach(p => {
            finalChunks.push({ text: p });
         });
      });
    }
    return finalChunks;
  }, [immersivePlaylist, text]);

  const activeEngine = engineOverride || engineMode;

  const [playingChunkIndex, setPlayingChunkIndex] = useState(-1);
  const [cachedFileCount, setCachedFileCount] = useState(0);
  const [cachedItems, setCachedItems] = useState<{ url: string; nodeId: string; noteTitle: string; text: string; sizeStr: string }[]>([]);
  const [isListOpen, setIsListOpen] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const volumeRef = useRef(1.0);
  const [rate, setRate] = useState(1.3);
  const rateRef = useRef(1.3);
  const cursorChunkIndexRef = useRef<number | null>(null);
  const startTextRef = useRef<string | null>(null);
  const cursorTimeoutRef = useRef<any>(null);
  const playSessionIdRef = useRef<number>(0);
  const seekOffsetRef = useRef<number>(0);
  const lastSeekTimeRef = useRef<number>(0);
  const [cacheTreeExpandedIds, setCacheTreeExpandedIds] = useState<Set<string>>(new Set());

  const toggleCacheTreeExpand = (nodeId: string) => {
     setCacheTreeExpandedIds(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
           next.delete(nodeId);
        } else {
           next.add(nodeId);
        }
        return next;
     });
  };

  // Load LameJS from CDN dynamically
  const loadLamejs = () => {
     return new Promise<any>((resolve, reject) => {
        if ((window as any).lamejs) {
           resolve((window as any).lamejs);
           return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js';
        script.onload = () => resolve((window as any).lamejs);
        script.onerror = reject;
        document.head.appendChild(script);
     });
  };

  // MP3 Encoder Utility using lamejs
  const encodeMp3 = (audioBuffer: AudioBuffer, lamejs: any) => {
     const channels = audioBuffer.numberOfChannels;
     const sampleRate = audioBuffer.sampleRate;
     const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
     
     const mp3Data = [];
     const sampleBlockSize = 1152;
     
     const left = audioBuffer.getChannelData(0);
     const right = channels > 1 ? audioBuffer.getChannelData(1) : null;
     
     const leftInt16 = new Int16Array(left.length);
     for (let i = 0; i < left.length; i++) {
        let s = Math.max(-1, Math.min(1, left[i]));
        leftInt16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
     }
     
     let rightInt16 = null;
     if (right) {
        rightInt16 = new Int16Array(right.length);
        for (let i = 0; i < right.length; i++) {
           let s = Math.max(-1, Math.min(1, right[i]));
           rightInt16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
     }
     
     for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
        const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
        let mp3buf;
        if (rightInt16) {
           const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
           mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        } else {
           mp3buf = mp3encoder.encodeBuffer(leftChunk);
        }
        if (mp3buf.length > 0) {
           mp3Data.push(new Int8Array(mp3buf));
        }
     }
     
     const mp3buf = mp3encoder.flush();
     if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
     }
     
     return new Blob(mp3Data, { type: 'audio/mp3' });
  };

  const updateCachedItems = async () => {
     try {
        const cache = await caches.open('tts-offline-cache');
        const keys = await cache.keys();
        const itemsList: any[] = [];
        for (const req of keys) {
           const res = await cache.match(req);
           if (res) {
              const blob = await res.blob();
              const sizeKB = (blob.size / 1024).toFixed(1);
              const parsed = new URL(req.url);
              const nodeId = parsed.searchParams.get('nodeId') || '';
              const q = parsed.searchParams.get('q') || '';
              
              const node = findNodeById(data, nodeId);
              const noteTitle = node ? node.title : 'Ghi chú khác/đã xóa';
              
              itemsList.push({
                 url: req.url,
                 nodeId,
                 noteTitle,
                 text: q,
                 sizeStr: `${sizeKB} KB`
              });
           }
        }
        setCachedItems(itemsList);
        setCachedFileCount(itemsList.length);
     } catch(e) {}
  };

  useEffect(() => {
     if (isOpen) {
        updateCachedItems();
     }
  }, [isOpen, isCachedOffline]);

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const getTargetIndexFromDocIdAndTextBefore = (docId: string, textBefore: string) => {
      const activeNoteId = useWorkspaceStore.getState().activeNoteId;
      
      let previousChunksCount = 0;
      let titleChunksCount = 0;
      let firstChunkIndexOfNote = -1;
      
      const isCanvas = activeNoteId && docId !== activeNoteId && docId.startsWith(activeNoteId + '-');
      const noteId = activeNoteId || docId;
      
      // 1. Find the first chunk in globalChunks that matches noteId
      firstChunkIndexOfNote = globalChunks.findIndex(chunk => chunk.nodeId === noteId);

      // 2. Calculate chunks taken by the title
      if (firstChunkIndexOfNote !== -1) {
          const state = useTreeStore.getState();
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
          const node = findNode(state.data, noteId);
          if (node && node.title) {
             const rawTitle = node.title.match(/[^.!?\n]+[.!?\n]*/g) || [node.title];
             rawTitle.map((c: string) => c.trim()).filter((c: string) => c.length > 0).forEach((c: string) => {
                const parts = c.match(/.{1,200}(\s|$)/g) || [c];
                titleChunksCount += parts.map((p: string) => p.trim()).filter((p: string) => p.length > 0).length;
             });
          }
      }

      // 3. Calculate chunks taken by previous containers (if Canvas)
      if (isCanvas) {
          const activeContainerId = docId.substring(noteId.length + 1);
          try {
             const canvasDataStr = localStorage.getItem('canvas-storage');
             if (canvasDataStr) {
                const canvasData = JSON.parse(canvasDataStr);
                const page = canvasData.state?.pages?.[noteId];
                if (page && page.containers && page.containers.length > 0) {
                   const sorted = [...page.containers].sort((a: any, b: any) => {
                      if (Math.abs(a.y - b.y) > 50) return a.y - b.y;
                      return a.x - b.x;
                   });
                   const activeIdx = sorted.findIndex((c: any) => c.id === activeContainerId);
                   if (activeIdx > 0) {
                      for (let i = 0; i < activeIdx; i++) {
                         const c = sorted[i];
                         const cHtml = localStorage.getItem(`note-content-${noteId}-${c.id}`) || '';
                         let html = cHtml.replace(/<\/p>/g, '</p>\n')
                                         .replace(/<\/h[1-6]>/g, '$&\n')
                                         .replace(/<br\s*\/?>/g, '\n')
                                         .replace(/<\/div>/g, '</div>\n');
                         const tempDiv = document.createElement('div');
                         tempDiv.innerHTML = html;
                         const textContent = (tempDiv.textContent || tempDiv.innerText || '')
                            .replace(/\n/g, '. ').replace(/\s+/g, ' ').trim();
                         if (textContent) {
                            const sentences = textContent.match(/[^.!?\n]+[.!?\n]*/g) || [textContent];
                            sentences.map(s => s.trim()).filter(s => s.length > 0).forEach(s => {
                               const parts = s.match(/.{1,200}(\s|$)/g) || [s];
                               previousChunksCount += parts.map(p => p.trim()).filter(p => p.length > 0).length;
                            });
                         }
                      }
                   }
                }
             }
          } catch(e) {}
      }
      
      // 4. Calculate chunks taken by the current container's textBefore
      const processedTextBefore = textBefore.replace(/\n/g, '. ').replace(/\s+/g, ' ');
      const rawBefore = processedTextBefore.match(/[^.!?\n]+[.!?\n]*/g) || [];
      let cursorChunkCount = 0;
      rawBefore.map((c: string) => c.trim()).filter((c: string) => c.length > 0).forEach((c: string) => {
         const parts = c.match(/.{1,200}(\s|$)/g) || [c];
         cursorChunkCount += parts.map(p => p.trim()).filter(p => p.length > 0).length;
      });
      
      const localTargetIndex = Math.max(0, cursorChunkCount - 1);
      
      if (firstChunkIndexOfNote !== -1) {
         return firstChunkIndexOfNote + titleChunksCount + previousChunksCount + localTargetIndex;
      }
      
      return Math.max(0, previousChunksCount + cursorChunkCount - 1);
  };

  useEffect(() => {
    const handleCursorChange = (e: any) => {
      if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
      
      const textBefore = e.detail.textBefore;
      if (!textBefore) return;
      
      const docId = e.detail.docId || '';
      
      cursorTimeoutRef.current = setTimeout(() => {
         const targetIndex = getTargetIndexFromDocIdAndTextBefore(docId, textBefore);
         if (targetIndex < globalChunks.length) {
            // Only seek if we haven't manually clicked recently
            if (Date.now() - lastSeekTimeRef.current > 500) {
               cursorChunkIndexRef.current = targetIndex;
               seekOffsetRef.current = 0; // reset offset if navigating by keyboard
               
               // Nếu đang phát trực tiếp, lập tức nhảy tới đoạn mới
               if (statusRef.current === 'playing') {
                  handlePlay(targetIndex);
               }
            }
         }
      }, 150);
    };
    window.addEventListener('editor-cursor-changed', handleCursorChange);
    return () => {
       window.removeEventListener('editor-cursor-changed', handleCursorChange);
       if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
    };
  }, [globalChunks]);

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

  useEffect(() => {
     if (globalChunks.length > 0) {
       const checkCache = async () => {
         try {
            const cache = await caches.open('tts-offline-cache');
            const chunkText = globalChunks[0].text.trim();
            const keys = await cache.keys();
            let found = false;
            for (const req of keys) {
               const parsed = new URL(req.url);
               const q = parsed.searchParams.get('q');
               if (q && q.trim() === chunkText) {
                  found = true;
                  break;
               }
            }
            setIsCachedOffline(found);
         } catch(e) {}
       };
       checkCache();
     }
  }, [globalChunks]);

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
          if (status !== 'playing' && status !== 'paused' && status !== 'generating' && status !== 'error') {
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

      if (!isOnline) {
        workerRef.current.postMessage({ type: 'INIT' });
      }
    }

    if ((activeEngine === 'google' || activeEngine === 'google-api') && status === 'idle') {
      setStatus('ready');
    }

    return () => {
      handleStop();
    };
  }, [isOpen, activeEngine]);


  useEffect(() => {
    if (isOpen && status === 'ready' && !autoPlayTriggeredRef.current && globalChunks.length > 0) {
      autoPlayTriggeredRef.current = true;
      let startIndex = 0;
      if (startTextRef.current) {
         const idx = globalChunks.findIndex(g => g.text.trim() === startTextRef.current!.trim());
         if (idx !== -1) startIndex = idx;
         startTextRef.current = null;
      } else if (cursorChunkIndexRef.current !== null) {
         startIndex = cursorChunkIndexRef.current;
         cursorChunkIndexRef.current = null;
      }
      handlePlay(startIndex);
    }
    if (!isOpen) {
      autoPlayTriggeredRef.current = false;
    }
  }, [isOpen, status, globalChunks]);

  useEffect(() => {
    if (status === 'playing' || status === 'paused') {
      document.body.classList.add('reading-mode-active');
    } else {
      document.body.classList.remove('reading-mode-active');
    }
    return () => document.body.classList.remove('reading-mode-active');
  }, [status]);

  useEffect(() => {
    if (playingChunkIndex >= 0) {
      const el = document.getElementById(`chunk-${playingChunkIndex}`);
      if (el) {
        const container = document.getElementById('immersive-reader-content');
        if (container) {
           const containerRect = container.getBoundingClientRect();
           const elRect = el.getBoundingClientRect();
           if (elRect.bottom > containerRect.bottom - containerRect.height * 0.3 || elRect.top < containerRect.top) {
              container.scrollTo({
                 top: container.scrollTop + (elRect.top - containerRect.top) - containerRect.height * 0.2,
                 behavior: 'smooth'
              });
           }
        }
      }
    }
  }, [playingChunkIndex]);

  useEffect(() => {
    const handleClickJump = (e: any) => {
      const { docId, textBefore, rawSnippet } = e.detail;
      if (!textBefore) return;
      
      const targetIndex = getTargetIndexFromDocIdAndTextBefore(docId, textBefore);
      
      if (targetIndex >= 0 && targetIndex < globalChunks.length) {
         let offset = 0;
         if (rawSnippet) {
             const chunkText = globalChunks[targetIndex].text;
             const cleanSnippet = rawSnippet.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '').toLowerCase();
             if (cleanSnippet) {
                 const cleanChunk = chunkText.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '').toLowerCase();
                 const posMap: number[] = [];
                 for (let j = 0; j < chunkText.length; j++) {
                     if (/[a-zA-Z0-9\u00C0-\u1EF9]/.test(chunkText[j])) {
                         posMap.push(j);
                     }
                 }
                 const matchIdx = cleanChunk.indexOf(cleanSnippet);
                 if (matchIdx !== -1) {
                     offset = posMap[matchIdx] || 0;
                 } else {
                     const firstWord = rawSnippet.split(/\s+/)[0].replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '').toLowerCase();
                     const firstMatch = cleanChunk.indexOf(firstWord);
                     if (firstMatch !== -1) {
                         offset = posMap[firstMatch] || 0;
                     }
                 }
             }
         }
         
         lastSeekTimeRef.current = Date.now();
         cursorChunkIndexRef.current = targetIndex;
         seekOffsetRef.current = offset;
         
         if (statusRef.current === 'playing' || statusRef.current === 'paused') {
             handlePlay(targetIndex);
         }
      }
    };
    
    window.addEventListener('immersive-reader-click', handleClickJump);
    return () => window.removeEventListener('immersive-reader-click', handleClickJump);
  }, [globalChunks]);

  const onChunkStart = (idx: number) => {
    setStatus('playing');
    setPlayingChunkIndex(idx);
    const chunk = globalChunks[idx];
    if (chunk) {
      if (chunk.nodeId) {
        setFocus(chunk.nodeId);
        setSelected(chunk.nodeId, false);
        useWorkspaceStore.getState().setActiveNoteId(chunk.nodeId);

        const state = useTreeStore.getState();
        const parentsToExpand = [];
        let curr = chunk.nodeId;
        const findParent = (nodes: any[], targetId: string, parent: any = null): any => {
          for (const node of nodes) {
            if (node.id === targetId) return parent;
            if (node.children) {
              const found = findParent(node.children, targetId, node);
              if (found) return found;
            }
          }
          return null;
        };
        while (true) {
          const parent = findParent(state.data, curr);
          if (parent) {
            parentsToExpand.push(parent.id);
            curr = parent.id;
          } else {
            break;
          }
        }
        if (parentsToExpand.length > 0) {
          const newExpanded = new Set(state.expandedIds);
          parentsToExpand.forEach(id => newExpanded.add(id));
          useTreeStore.setState({ expandedIds: newExpanded });
        }
        
        setTimeout(() => {
          const el = document.querySelector(`[data-node-id="${chunk.nodeId}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      
      window.dispatchEvent(new CustomEvent('canvas-highlight-text', {
        detail: {
          docId: chunk.nodeId || 'default-doc',
          text: chunk.text
        }
      }));
    }
  };

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
      onChunkStart(0);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const handlePlay = (forceStartIndex?: number) => {
    playSessionIdRef.current++;
    const currentSessionId = playSessionIdRef.current;

    if (status === 'paused' && forceStartIndex === undefined) {
      if (activeEngine === 'google') {
        window.speechSynthesis.resume();
      } else if (activeEngine === 'google-api' && audioApiRef.current) {
        audioApiRef.current.volume = volumeRef.current;
        audioApiRef.current.play();
      } else if (audioCtxRef.current) {
        audioCtxRef.current.resume();
      }
      setStatus('playing');
      return;
    }
    
    if (status === 'ready' || status === 'error' || status === 'idle' || forceStartIndex !== undefined) {
      if (!text.trim() && (!immersivePlaylist || immersivePlaylist.length === 0)) return;
      
      if (forceStartIndex !== undefined) {
        shouldContinueRef.current = false; // Kill any running play loop immediately
        window.speechSynthesis.cancel();
        if (audioApiRef.current) { audioApiRef.current.pause(); audioApiRef.current.src = ''; }
      }

      const actualStartIndex = forceStartIndex !== undefined ? forceStartIndex : (cursorChunkIndexRef.current !== null ? cursorChunkIndexRef.current : 0);
      cursorChunkIndexRef.current = null;

      if (activeEngine === 'google') {
        window.speechSynthesis.cancel();
        
        const tryPlay = () => {
          const sessionId = currentSessionId;
          let voices = window.speechSynthesis.getVoices();
          if (voices.length === 0) return false;
          
          const viVoices = voices.filter(v => v.lang.toLowerCase().startsWith('vi') || v.name.toLowerCase().includes('việt') || v.name.toLowerCase().includes('viet'));
          
          const chunks = globalChunks;

          if (viVoices.length === 0) {
            if (isOnline || isCachedOffline) {
              setEngineOverride('google-api');
              handleGoogleApiPlay(forceStartIndex !== undefined ? forceStartIndex : 0, sessionId);
            } else {
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
            }
            return true;
          }
          
          let viVoice = viVoices[0];
          setSelectedVoiceName(viVoice ? viVoice.name : 'Unknown');
                     
          if (chunks.length === 0) return true;
          
          let currentChunk = actualStartIndex;

          const speakNextChunk = () => {
            if (sessionId !== playSessionIdRef.current) return;
            if (!shouldContinueRef.current) return;
            
            if (currentChunk >= chunks.length) {
              setStatus('ready');
              setPlayingChunkIndex(-1);
              return;
            }
            
            const chunk = chunks[currentChunk];
            let chunkText = chunk.text;
            if (currentChunk === startIndex && seekOffsetRef.current > 0) {
               if (seekOffsetRef.current < chunkText.length) {
                  chunkText = chunkText.substring(seekOffsetRef.current).trim();
               }
               seekOffsetRef.current = 0;
            }

            const utterance = new SpeechSynthesisUtterance(chunkText);
            if (viVoice) utterance.voice = viVoice;
            utterance.lang = 'vi-VN';
            utterance.rate = rateRef.current; 
            utterance.volume = volumeRef.current;
            
            const startTime = Date.now();
            utterance.onstart = () => {
               if (sessionId !== playSessionIdRef.current) return;
               onChunkStart(currentChunk);
            };
            utterance.onend = () => {
              if (sessionId !== playSessionIdRef.current) return;
              if (!shouldContinueRef.current) return;
              
              if (currentChunk === 0 && (Date.now() - startTime) < 500) {
                 setEngineOverride('google-api');
                 handleGoogleApiPlay(0, sessionId);
                 return;
              }
              
              currentChunk++;
              speakNextChunk();
            };
            utterance.onerror = (e) => {
              if (sessionId !== playSessionIdRef.current) return;
              if (e.error !== 'interrupted' && e.error !== 'canceled') {
                if (currentChunk === 0) {
                   setEngineOverride('google-api');
                   handleGoogleApiPlay(0, sessionId);
                   return;
                }
                setStatus('error');
                setErrorMsg(e.error);
              }
              shouldContinueRef.current = false;
            };
            
            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
          };

          shouldContinueRef.current = true;
          setStatus('generating');
          speakNextChunk();
          
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
          
          setTimeout(() => {
             if (!window.speechSynthesis.speaking && activeEngine === 'google') {
                tryPlay();
             }
          }, 1000);
        }
        
      } else if (activeEngine === 'google-api') {
        handleGoogleApiPlay(actualStartIndex, currentSessionId);
      } else {
        if (!workerRef.current) return;
        setStatus('generating');
        
        let textToRead = text;
        if (immersivePlaylist && immersivePlaylist.length > 0) {
           textToRead = immersivePlaylist.map(i => i.text).join(' ');
        }
        
        textToRead = textToRead.length > 300 ? textToRead.substring(0, 300) + "..." : textToRead;
        
        workerRef.current.postMessage({ 
          type: 'GENERATE', 
          text: textToRead,
          id: Date.now().toString() 
        });
      }
    }
  };

  const handleGoogleApiPlay = (startIndex: number, sessionId: number) => {
    const chunks = globalChunks;
    if (chunks.length === 0) return;
    shouldContinueRef.current = true;
    let currentChunk = startIndex;

    const playNext = () => {
      if (sessionId !== playSessionIdRef.current) return;
      if (!shouldContinueRef.current) return;
      if (currentChunk >= chunks.length) {
        setStatus('ready');
        setPlayingChunkIndex(-1);
        return;
      }
      
      const chunk = chunks[currentChunk];
      let chunkText = chunk.text.trim();
      
      if (currentChunk === startIndex && seekOffsetRef.current > 0) {
         if (seekOffsetRef.current < chunkText.length) {
            chunkText = chunkText.substring(seekOffsetRef.current).trim();
         }
         seekOffsetRef.current = 0;
      }

      const url = `/api/tts?nodeId=${chunk.nodeId || ''}&ie=UTF-8&q=${encodeURIComponent(chunkText)}&tl=vi&client=gtx`;
      
      const prepareAudio = async () => {
         try {
           const cache = await caches.open('tts-offline-cache');
           // First try strict match
           let cachedResponse = await cache.match(url);
           if (cachedResponse) {
              const blob = await cachedResponse.blob();
              return URL.createObjectURL(blob);
           }
           
           // If strict match fails, use loose matching on 'q' parameter
           const keys = await cache.keys();
           for (const req of keys) {
              const parsed = new URL(req.url);
              const q = parsed.searchParams.get('q');
              if (q && q.trim() === chunkText) {
                 const res = await cache.match(req);
                 if (res) {
                    const blob = await res.blob();
                    return URL.createObjectURL(blob);
                 }
              }
           }
         } catch(e) {}
         return url;
      };

      setStatus('generating');
      prepareAudio().then(src => {
        if (sessionId !== playSessionIdRef.current) return;
        if (!shouldContinueRef.current) return;
         const audio = new Audio(src);
         audio.playbackRate = rateRef.current;
         audio.preservesPitch = true;
         audio.volume = volumeRef.current;
         audioApiRef.current = audio;
        
        audio.onplay = () => {
           if (sessionId !== playSessionIdRef.current) return;
           onChunkStart(currentChunk);
        };
        audio.onended = () => {
          if (sessionId !== playSessionIdRef.current) return;
          if (!shouldContinueRef.current) return;
          currentChunk++;
          playNext();
        };
        audio.onerror = () => {
          if (sessionId !== playSessionIdRef.current) return;
          if (!shouldContinueRef.current) return;
          setStatus('error');
          setErrorMsg('Lỗi khi tải Audio từ Google API.');
          shouldContinueRef.current = false;
        };
        
        audio.play().catch(err => {
          if (sessionId !== playSessionIdRef.current) return;
          if (!shouldContinueRef.current) return;
          if (err.name === 'AbortError') return;
          setStatus('error');
          setErrorMsg(err.message);
        });
      });
    };

    playNext();
  };

  const handlePause = () => {
    if (status === 'playing') {
      if (activeEngine === 'google') {
        window.speechSynthesis.pause();
      } else if (activeEngine === 'google-api' && audioApiRef.current) {
        audioApiRef.current.pause();
      } else if (audioCtxRef.current) {
        audioCtxRef.current.suspend();
      }
      setStatus('paused');
    }
  };

  const handleDownloadTTS = async () => {
     if (isGeneratingFile || globalChunks.length === 0) return;
     setIsGeneratingFile(true);
     try {
        const blobs: Blob[] = [];
        for (let i = 0; i < globalChunks.length; i++) {
           let chunkText = globalChunks[i].text.trim();
           if (!chunkText) continue;
           const chunksOf200 = chunkText.match(/.{1,200}(\s|$)/g) || [chunkText];
           for (const part of chunksOf200) {
              const url = `/api/tts?nodeId=${globalChunks[i].nodeId || ''}&ie=UTF-8&q=${encodeURIComponent(part.trim())}&tl=vi&client=gtx`;
              const res = await fetch(url);
              const blob = await res.blob();
              blobs.push(blob);
           }
        }
        const finalBlob = new Blob(blobs, { type: 'audio/mp3' });
        const downloadUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Audio-${Date.now()}.mp3`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
     } catch(e) {
        alert("Lỗi tải xuống MP3");
     }
     setIsGeneratingFile(false);
  };

  const toggleMicRecording = async () => {
    if (isRecordingMic) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new (window as any).MediaRecorder(stream);
        recordedChunksRef.current = [];
        recorder.ondataavailable = (e: any) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t: any) => t.stop());
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/mp3' }); 
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Ghi-am-${Date.now()}.mp3`;
          a.click();
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecordingMic(true);
      } catch(e) {
        alert("Lỗi truy cập Mic");
      }
    }
  };

  const handleCacheOffline = async () => {
     if (!navigator.onLine) {
        alert("Vui lòng kết nối mạng để tải dữ liệu Audio từ Google Cloud về máy trước.");
        return;
     }
     if (isCachingOffline || globalChunks.length === 0) return;
     setIsCachingOffline(true);
     try {
        // Yêu cầu trình duyệt cấp quyền lưu trữ vĩnh viễn (Persistent Storage)
        if (navigator.storage && navigator.storage.persist) {
           const isPersisted = await navigator.storage.persisted();
           if (!isPersisted) {
              await navigator.storage.persist();
           }
        }

        const cache = await caches.open('tts-offline-cache');
        
        // Xóa các file audio cũ của các note này trước khi lưu mới
        const uniqueNodeIds = Array.from(new Set(globalChunks.map(c => c.nodeId).filter(Boolean))) as string[];
        if (uniqueNodeIds.length > 0) {
           const requests = await cache.keys();
           for (const req of requests) {
              const parsed = new URL(req.url);
              const nid = parsed.searchParams.get('nodeId');
              if (nid && uniqueNodeIds.includes(nid)) {
                 await cache.delete(req);
              }
           }
        }

        for (let i = 0; i < globalChunks.length; i++) {
           let chunkText = globalChunks[i].text.trim();
           if (!chunkText) continue;
           const url = `/api/tts?nodeId=${globalChunks[i].nodeId || ''}&ie=UTF-8&q=${encodeURIComponent(chunkText)}&tl=vi&client=gtx`;
           try {
              const existing = await cache.match(url);
              if (!existing) {
                 await cache.add(url);
              }
           } catch (err) {
              console.warn(`[Offline Cache] Failed to cache chunk: "${chunkText.substring(0, 15)}...", continuing. Error:`, err);
           }
        }
         setIsCachedOffline(true);
         updateCachedItems();
         alert('Đã lưu xong audio để nghe ngoại tuyến!');
      } catch(e) {
         alert("Lỗi khi lưu audio ngoại tuyến");
      }
      setIsCachingOffline(false);
   };

   const handleClearAllCache = async () => {
      if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ bộ nhớ đệm audio offline?")) return;
      try {
         const cache = await caches.open('tts-offline-cache');
         const keys = await cache.keys();
         for (const key of keys) {
            await cache.delete(key);
         }
         setIsCachedOffline(false);
         setCachedItems([]);
         setCachedFileCount(0);
         alert("Đã xóa toàn bộ bộ nhớ đệm audio!");
      } catch(e) {
         alert("Lỗi khi xóa bộ nhớ đệm");
      }
   };

   const handleDeleteSingleCache = async (url: string) => {
      try {
         const cache = await caches.open('tts-offline-cache');
         await cache.delete(url);
         updateCachedItems();
         
         // Update isCachedOffline based on if the current note has any chunks left
         if (globalChunks.length > 0) {
            const chunkText = globalChunks[0].text.trim();
            if (chunkText) {
               const part = (chunkText.match(/.{1,200}(\s|$)/g) || [chunkText])[0];
               const firstChunkUrl = `/api/tts?nodeId=${globalChunks[0].nodeId || ''}&ie=UTF-8&q=${encodeURIComponent(part.trim())}&tl=vi&client=gtx`;
               const stillCached = await cache.match(firstChunkUrl);
               setIsCachedOffline(!!stillCached);
            }
         }
      } catch(e) {}
   };

   const handleSkipNext = () => {
      if (activeEngine === 'google-api') {
         if (playingChunkIndex >= 0 && playingChunkIndex < globalChunks.length - 1) {
            handleStop();
            handleGoogleApiPlay(playingChunkIndex + 1);
         }
      }
   };

   const handleSkipPrev = () => {
      if (activeEngine === 'google-api') {
         if (playingChunkIndex > 0) {
            handleStop();
            handleGoogleApiPlay(playingChunkIndex - 1);
         }
      }
   };

   const handleForward5s = () => {
      if (audioApiRef.current) {
         audioApiRef.current.currentTime = Math.min(audioApiRef.current.duration, audioApiRef.current.currentTime + 5);
      }
   };

   const handleRewind5s = () => {
      if (audioApiRef.current) {
         audioApiRef.current.currentTime = Math.max(0, audioApiRef.current.currentTime - 5);
      }
   };

   const playNodeCache = (node: TreeNode) => {
      const collectNotes = (n: TreeNode): TreeNode[] => {
         if (n.type === 'note') return [n];
         let list: TreeNode[] = [];
         if (n.children) {
            n.children.forEach(c => {
               list = list.concat(collectNotes(c));
            });
         }
         return list;
      };
      
      const notes = collectNotes(node);
      const playlist: { text: string; nodeId: string }[] = [];
      
      const getNoteHtml = (noteId: string): string => {
         let allHtml = '';
         let hasContainers = false;
         try {
            const canvasDataStr = localStorage.getItem('canvas-storage');
            if (canvasDataStr) {
               const canvasData = JSON.parse(canvasDataStr);
               const page = canvasData.state?.pages?.[noteId];
               if (page && page.containers && page.containers.length > 0) {
                  hasContainers = true;
                  const sorted = [...page.containers].sort((a: any, b: any) => {
                     if (Math.abs(a.y - b.y) > 50) return a.y - b.y;
                     return a.x - b.x;
                  });
                  sorted.forEach((c: any) => {
                     const cHtml = localStorage.getItem(`note-content-${noteId}-${c.id}`);
                     if (cHtml) allHtml += ' <br> ' + cHtml;
                  });
               }
            }
         } catch(e) {}
         
         if (!hasContainers) {
            allHtml = localStorage.getItem(`note-content-${noteId}`) || '';
         }
         return allHtml;
      };

      notes.forEach(n => {
         let html = getNoteHtml(n.id);
         html = html.replace(/<\/p>/g, '</p>\n')
                    .replace(/<\/h[1-6]>/g, '$&\n')
                    .replace(/<br\s*\/?>/g, '\n')
                    .replace(/<\/div>/g, '</div>\n');

         const tempDiv = document.createElement('div');
         tempDiv.innerHTML = html;
         const textContent = (tempDiv.textContent || tempDiv.innerText || '')
            .replace(/\n/g, '. ').replace(/\s+/g, ' ');
         
         if (textContent.trim()) {
            playlist.push({ text: textContent, nodeId: n.id });
         }
      });

      if (playlist.length > 0) {
         handleStop();
         useWorkspaceStore.getState().setActiveNoteId(notes[0].id);
         useWorkspaceStore.getState().setImmersivePlaylist(playlist);
         
         autoPlayTriggeredRef.current = false;
         setStatus('ready');
      }
   };

   const downloadNodeMp3 = async (node: TreeNode) => {
      const collectNotes = (n: TreeNode): TreeNode[] => {
         if (n.type === 'note') return [n];
         let list: TreeNode[] = [];
         if (n.children) {
            n.children.forEach(c => {
               list = list.concat(collectNotes(c));
            });
         }
         return list;
      };
      
      const notes = collectNotes(node);
      const chunks: { text: string; nodeId: string }[] = [];
      
      const getNoteHtml = (noteId: string): string => {
         let allHtml = '';
         let hasContainers = false;
         try {
            const canvasDataStr = localStorage.getItem('canvas-storage');
            if (canvasDataStr) {
               const canvasData = JSON.parse(canvasDataStr);
               const page = canvasData.state?.pages?.[noteId];
               if (page && page.containers && page.containers.length > 0) {
                  hasContainers = true;
                  const sorted = [...page.containers].sort((a: any, b: any) => {
                     if (Math.abs(a.y - b.y) > 50) return a.y - b.y;
                     return a.x - b.x;
                  });
                  sorted.forEach((c: any) => {
                     const cHtml = localStorage.getItem(`note-content-${noteId}-${c.id}`);
                     if (cHtml) allHtml += ' <br> ' + cHtml;
                  });
               }
            }
         } catch(e) {}
         
         if (!hasContainers) {
            allHtml = localStorage.getItem(`note-content-${noteId}`) || '';
         }
         return allHtml;
      };

      notes.forEach(n => {
         let html = getNoteHtml(n.id);
         // Thay thế các thẻ block bằng dấu ngắt dòng để tránh dính chữ khi dùng textContent
         html = html.replace(/<\/p>/g, '</p>\n')
                    .replace(/<\/h[1-6]>/g, '$&\n')
                    .replace(/<br\s*\/?>/g, '\n')
                    .replace(/<\/div>/g, '</div>\n');

         const tempDiv = document.createElement('div');
         tempDiv.innerHTML = html;
         const textContent = (tempDiv.textContent || tempDiv.innerText || '')
            .replace(/\n/g, '. ')
            .replace(/\s+/g, ' ');
         
         const rawChunks = textContent.match(/[^.!?\n]+[.!?\n]*/g) || [textContent];
         rawChunks.map(c => c.trim()).filter(c => c.length > 0).forEach(c => {
            const parts = c.match(/.{1,200}(\s|$)/g) || [c];
            parts.forEach(p => chunks.push({ text: p.trim(), nodeId: n.id }));
         });
      });
      
      if (chunks.length === 0) {
         alert("Không có nội dung chữ để tải.");
         return;
      }
      
      alert(`Đang kết nối máy chủ Google Cloud để tạo file MP3 tốc độ ${rateRef.current}x cho mục "${node.title}". Vui lòng chờ...`);
      
      try {
         const lamejs = await loadLamejs();
         const blobs: Blob[] = [];
         
         // Sử dụng Cache trước, nếu không có mới fetch từ mạng
         const cache = await caches.open('tts-offline-cache');
         for (const chunk of chunks) {
            const url = `/api/tts?nodeId=${chunk.nodeId}&ie=UTF-8&q=${encodeURIComponent(chunk.text)}&tl=vi&client=gtx`;
            const cachedResponse = await cache.match(url);
            if (cachedResponse) {
               const blob = await cachedResponse.blob();
               blobs.push(blob);
            } else {
               const res = await fetch(url);
               if (!res.ok) throw new Error("Lỗi tải một đoạn âm thanh");
               const blob = await res.blob();
               blobs.push(blob);
            }
         }
         
         const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
         const decodedBuffers: AudioBuffer[] = [];
         
         for (const blob of blobs) {
            const arrayBuffer = await blob.arrayBuffer();
            const decoded = await audioCtx.decodeAudioData(arrayBuffer);
            decodedBuffers.push(decoded);
         }
         
         const speed = rateRef.current;
         let totalLength = 0;
         decodedBuffers.forEach(buf => {
            totalLength += Math.floor(buf.length / speed);
         });
         
         const offlineCtx = new OfflineAudioContext(
            decodedBuffers[0].numberOfChannels,
            totalLength,
            decodedBuffers[0].sampleRate
         );
         
         let startTime = 0;
         decodedBuffers.forEach(buf => {
            const source = offlineCtx.createBufferSource();
            source.buffer = buf;
            source.playbackRate.value = speed;
            source.connect(offlineCtx.destination);
            source.start(startTime);
            startTime += buf.duration / speed;
         });
         
         const renderedBuffer = await offlineCtx.startRendering();
         const mp3Blob = encodeMp3(renderedBuffer, lamejs);
         
         const downloadUrl = URL.createObjectURL(mp3Blob);
         const a = document.createElement('a');
         a.href = downloadUrl;
         a.download = `${node.title}-${speed}x.mp3`;
         a.click();
         URL.revokeObjectURL(downloadUrl);
         audioCtx.close();
      } catch (err: any) {
         alert("Lỗi khi tải xuống: " + err.message);
      }
   };

   const downloadSingleChunkMp3 = async (chunk: any) => {
      alert(`Đang xử lý tải xuống đoạn audio tốc độ ${rateRef.current}x...`);
      try {
         const lamejs = await loadLamejs();
         const cache = await caches.open('tts-offline-cache');
         const res = await cache.match(chunk.url);
         let blob;
         if (res) {
            blob = await res.blob();
         } else {
            const fetchRes = await fetch(chunk.url);
            if (!fetchRes.ok) throw new Error("Không thể tải audio từ server");
            blob = await fetchRes.blob();
         }
         
         const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
         const arrayBuffer = await blob.arrayBuffer();
         const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
         
         const speed = rateRef.current;
         const offlineCtx = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            Math.floor(audioBuffer.length / speed),
            audioBuffer.sampleRate
         );
         
         const source = offlineCtx.createBufferSource();
         source.buffer = audioBuffer;
         source.playbackRate.value = speed;
         source.connect(offlineCtx.destination);
         source.start(0);
         
         const renderedBuffer = await offlineCtx.startRendering();
         const mp3Blob = encodeMp3(renderedBuffer, lamejs);
         
         const downloadUrl = URL.createObjectURL(mp3Blob);
         const a = document.createElement('a');
         a.href = downloadUrl;
         a.download = `${chunk.text.substring(0, 15)}-${speed}x.mp3`;
         a.click();
         URL.revokeObjectURL(downloadUrl);
         audioCtx.close();
      } catch (err: any) {
         alert("Lỗi khi tải xuống: " + err.message);
      }
   };

   const deleteNodeCache = async (node: TreeNode) => {
      if (!confirm(`Bạn có chắc chắn muốn xóa toàn bộ audio offline của mục: "${node.title}"?`)) return;
      
      const collectNotes = (n: TreeNode): TreeNode[] => {
         if (n.type === 'note') return [n];
         let list: TreeNode[] = [];
         if (n.children) {
            n.children.forEach(c => {
               list = list.concat(collectNotes(c));
            });
         }
         return list;
      };
      
      const notes = collectNotes(node);
      const idsToDelete = notes.map(n => n.id);
      
      try {
         const cache = await caches.open('tts-offline-cache');
         const requests = await cache.keys();
         for (const req of requests) {
            const url = new URL(req.url);
            const nodeId = url.searchParams.get('nodeId');
            if (nodeId && idsToDelete.includes(nodeId)) {
               await cache.delete(req);
            }
         }
         updateCachedItems();
         
         if (globalChunks.length > 0) {
            const chunkText = globalChunks[0].text.trim();
            if (chunkText) {
               const part = (chunkText.match(/.{1,200}(\s|$)/g) || [chunkText])[0];
               const firstChunkUrl = `/api/tts?nodeId=${globalChunks[0].nodeId || ''}&ie=UTF-8&q=${encodeURIComponent(part.trim())}&tl=vi&client=gtx`;
               const stillCached = await cache.match(firstChunkUrl);
               setIsCachedOffline(!!stillCached);
            }
         }
      } catch(e) {}
   };

  const handleStop = () => {
    shouldContinueRef.current = false;
    window.speechSynthesis.cancel();
    if (audioApiRef.current) {
      audioApiRef.current.pause();
      audioApiRef.current.src = '';
      audioApiRef.current = null;
    }
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
    setPlayingChunkIndex(-1);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', width: '320px', zIndex: 100000, 
      backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column', color: '#1a202c', overflow: 'hidden', border: '1px solid #e2e8f0'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Volume2 size={18} color="#6366f1" />
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Trình đọc</h2>
        </div>
        <button onClick={() => { handleStop(); onClose(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px' }}>
          <X size={18} color="#64748b" />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Engine Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>BỘ ĐỌC PHÁT ÂM:</span>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
            <button 
              onClick={() => {
                 setEngineOverride('google-api');
                 setEngineMode('google-api');
              }}
              style={{
                 flex: 1, padding: '4px 6px', fontSize: '11px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                 backgroundColor: activeEngine === 'google-api' ? '#fff' : 'transparent',
                 color: activeEngine === 'google-api' ? '#4f46e5' : '#64748b',
                 fontWeight: activeEngine === 'google-api' ? 'bold' : 'normal',
                 boxShadow: activeEngine === 'google-api' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.15s ease'
              }}
            >
              {isOnline ? <Wifi size={12} color="#16a34a" /> : <WifiOff size={12} color="#f97316" />}
              Google Cloud {isCachedOffline && "☁️"}
            </button>
            <button 
              onClick={() => {
                 setEngineOverride('xenova');
                 setEngineMode('xenova');
              }}
              style={{
                 flex: 1, padding: '4px 6px', fontSize: '11px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                 backgroundColor: activeEngine === 'xenova' ? '#fff' : 'transparent',
                 color: activeEngine === 'xenova' ? '#4f46e5' : '#64748b',
                 fontWeight: activeEngine === 'xenova' ? 'bold' : 'normal',
                 boxShadow: activeEngine === 'xenova' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.15s ease'
              }}
            >
              <Cpu size={12} />
              AI Offline (Xenova)
            </button>
          </div>
        </div>
        
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            {status === 'loading_model' || status === 'generating' ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1' }}>
                 <Loader2 size={20} className="animate-spin" />
                 <span style={{ fontSize: '13px' }}>Đang tải...</span>
               </div>
            ) : (
              <>
                <button onClick={handleSkipPrev} title="Câu trước" style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><SkipBack size={16} /></button>
                <button onClick={handleRewind5s} title="Lùi 5s" style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><RotateCcw size={16} /></button>

                {status === 'playing' ? (
                  <button onClick={handlePause} style={{ border: 'none', background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Pause size={20} fill="currentColor" /></button>
                ) : (
                  <button onClick={() => handlePlay()} style={{ border: 'none', background: '#e0e7ff', color: '#4f46e5', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Play size={20} fill="currentColor" style={{ marginLeft: '4px' }} /></button>
                )}
                <button onClick={handleStop} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Square size={16} fill="currentColor" /></button>
                
                <button onClick={handleForward5s} title="Tua 5s" style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><RotateCw size={16} /></button>
                <button onClick={handleSkipNext} title="Câu tiếp theo" style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><SkipForward size={16} /></button>
              </>
            )}
          </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <button onClick={handleCacheOffline} title="Lưu nghe ngoại tuyến" style={{ border: 'none', background: isCachedOffline ? '#dcfce7' : '#f1f5f9', color: isCachedOffline ? '#16a34a' : '#64748b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {isCachingOffline ? <Loader2 size={14} className="animate-spin" /> : (isCachedOffline ? <Check size={14} /> : <CloudDownload size={14} />)}
              </button>
              {cachedFileCount > 0 && (
                <button onClick={handleClearAllCache} title="Xóa toàn bộ audio offline" style={{ border: 'none', background: '#fee2e2', color: '#dc2626', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
          
          {/* Volume control slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px', marginTop: '2px' }}>
            <Volume2 size={14} color="#64748b" style={{ flexShrink: 0 }} />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={volume} 
              onChange={(e) => {
                 const val = parseFloat(e.target.value);
                 setVolume(val);
                 volumeRef.current = val;
                 if (audioApiRef.current) {
                    audioApiRef.current.volume = val;
                 }
              }}
              style={{ flex: 1, accentColor: '#6366f1', height: '4px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '10px', color: '#64748b', minWidth: '24px', textAlign: 'right', flexShrink: 0 }}>{Math.round(volume * 100)}%</span>
          </div>

          {/* Speed rate control slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', flexShrink: 0 }}>Tốc độ:</span>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1" 
              value={rate} 
              onChange={(e) => {
                 const val = parseFloat(e.target.value);
                 setRate(val);
                 rateRef.current = val;
                 if (audioApiRef.current) {
                    audioApiRef.current.playbackRate = val;
                 }
              }}
              style={{ flex: 1, accentColor: '#6366f1', height: '4px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '10px', color: '#64748b', minWidth: '24px', textAlign: 'right', flexShrink: 0 }}>{rate.toFixed(1)}x</span>
          </div>
          
        {/* Offline Cache Manager Status */}
        {cachedFileCount > 0 && (() => {
          const cachedNodeIds = new Set(cachedItems.map(item => item.nodeId).filter(Boolean));
          const hasUnknown = cachedItems.some(item => !item.nodeId);
          
          const filterTreeForCache = (nodes: any[], cachedIds: Set<string>): any[] => {
             const result: any[] = [];
             for (const node of nodes) {
                const isSelfCached = cachedIds.has(node.id);
                let filteredChildren: any[] = [];
                if (node.children) {
                   filteredChildren = filterTreeForCache(node.children, cachedIds);
                }
                if (isSelfCached || filteredChildren.length > 0) {
                   result.push({
                      ...node,
                      children: filteredChildren.length > 0 ? filteredChildren : undefined
                   });
                }
             }
             return result;
          };
          
          const filteredTree = filterTreeForCache(data, cachedNodeIds);
          if (hasUnknown) {
             filteredTree.push({
                id: '',
                title: 'Ghi chú khác (Từ phiên bản cũ)',
                type: 'note'
             });
          }

          const renderCacheTree = (nodes: any[], depth = 0): React.ReactNode => {
             return nodes.map(node => {
                const nodeChunks = cachedItems.filter(item => item.nodeId === node.id);
                const isFolder = node.type === 'notebook';
                const isExpanded = cacheTreeExpandedIds.has(node.id);
                const hasChildren = isFolder ? (node.children && node.children.length > 0) : (nodeChunks.length > 0);
                
                return (
                   <div key={node.id || 'unknown-legacy'} style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginLeft: depth > 0 ? '8px' : '0' }}>
                      <div style={{
                         display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                         padding: '4px 6px', borderRadius: '4px',
                         fontSize: '11px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fff',
                         gap: '8px'
                      }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', flex: 1 }}>
                            {hasChildren ? (
                               <button 
                                  onClick={() => toggleCacheTreeExpand(node.id)}
                                  style={{ border: 'none', background: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b', flexShrink: 0 }}
                               >
                                  {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                               </button>
                            ) : (
                               <div style={{ width: '14px', flexShrink: 0 }} />
                            )}
                            <span style={{ fontSize: '12px', flexShrink: 0 }}>{isFolder ? '📁' : '📄'}</span>
                            <span 
                               onClick={() => hasChildren && toggleCacheTreeExpand(node.id)}
                               style={{ 
                                  fontWeight: isFolder ? 'bold' : 'normal', 
                                  color: isFolder ? '#4f46e5' : '#334155', 
                                  textOverflow: 'ellipsis', 
                                  overflow: 'hidden', 
                                  whiteSpace: 'nowrap',
                                  cursor: hasChildren ? 'pointer' : 'default'
                               }}
                            >
                               {node.title}
                            </span>
                            {!isFolder && nodeChunks.length > 0 && (
                               <span style={{ color: '#94a3b8', fontSize: '9px', flexShrink: 0 }}>({nodeChunks.length} câu)</span>
                            )}
                         </div>
                         
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {node.id && (
                               <button 
                                  onClick={() => {
                                     startTextRef.current = null;
                                     playNodeCache(node);
                                  }} 
                                  style={{ border: 'none', background: 'none', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }} 
                                  title="Đọc từ mục này"
                               >
                                  <Play size={12} fill="currentColor" />
                               </button>
                            )}
                            {node.id && (
                               <button onClick={() => downloadNodeMp3(node)} style={{ border: 'none', background: 'none', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }} title="Tải file MP3 của thư mục/ghi chú này">
                                  <Download size={12} />
                               </button>
                            )}
                            <button onClick={() => deleteNodeCache(node)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }} title="Xóa cache thư mục/ghi chú này">
                               <Trash2 size={12} />
                            </button>
                         </div>
                      </div>
                      
                      {isExpanded && !isFolder && nodeChunks.length > 0 && (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '24px', borderLeft: '1px dashed #cbd5e1', paddingLeft: '6px', marginBottom: '2px' }}>
                            {nodeChunks.map((chunk, idx) => (
                               <div key={idx} style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                  fontSize: '10px', color: '#64748b', padding: '2px 4px', gap: '6px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }}>
                                     <button 
                                        onClick={() => {
                                           startTextRef.current = chunk.text;
                                           playNodeCache(node);
                                        }} 
                                        style={{ border: 'none', background: 'none', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0 }}
                                        title="Đọc từ câu này"
                                     >
                                        <Play size={10} fill="currentColor" />
                                     </button>
                                     <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }} title={chunk.text}>
                                        "{chunk.text}"
                                     </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                     <button onClick={() => downloadSingleChunkMp3(chunk)} style={{ border: 'none', background: 'none', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }} title="Tải đoạn này">
                                        <Download size={12} />
                                     </button>
                                     <span style={{ color: '#cbd5e1', fontSize: '9px' }}>{chunk.sizeStr}</span>
                                     <button onClick={() => handleDeleteSingleCache(chunk.url)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Xóa câu này">
                                        <X size={10} />
                                     </button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      )}
                      
                      {isExpanded && isFolder && node.children && renderCacheTree(node.children, depth + 1)}
                   </div>
                );
             });
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => setIsListOpen(!isListOpen)}>
                <span>Đã tải: <strong>{cachedFileCount}</strong> đoạn audio offline</span>
                {isListOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>

              {isListOpen && (
                <div style={{
                  maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', 
                  backgroundColor: '#f8fafc', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0'
                }}>
                  {renderCacheTree(filteredTree)}
                </div>
              )}
            </div>
          );
        })()}
        
        {/* Progress or current text snippet */}
        {playingChunkIndex >= 0 && globalChunks[playingChunkIndex] && (
          <div style={{ fontSize: '13px', color: '#334155', fontStyle: 'italic', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginTop: '8px' }}>
             "{globalChunks[playingChunkIndex].text}"
          </div>
        )}
        
        {status === 'error' && (
          <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
