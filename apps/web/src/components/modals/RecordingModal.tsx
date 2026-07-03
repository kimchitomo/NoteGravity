import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Video, Square, Play, Save } from 'lucide-react';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'audio' | 'video';
  onInsert: (url: string) => void;
}

export const RecordingModal: React.FC<RecordingModalProps> = ({ isOpen, onClose, type, onInsert }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      stopMediaTracks();
      setRecordedUrl(null);
      setTime(0);
      setIsRecording(false);
    }
  }, [isOpen]);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    try {
      setRecordedUrl(null);
      setTime(0);
      chunksRef.current = [];
      const constraints = type === 'video' ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (type === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.muted = true;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: type === 'video' ? 'video/webm' : 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        if (type === 'video' && videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = url;
          videoPreviewRef.current.muted = false;
        }
      };

      mediaRecorder.start(200); // collect chunks every 200ms
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Không thể truy cập Microphone/Camera. Vui lòng cấp quyền.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopMediaTracks();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '8px', padding: '24px', 
        width: type === 'video' ? '600px' : '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {type === 'video' ? <Video size={24} color="#14b8a6" /> : <Mic size={24} color="#ef4444" />}
            {type === 'video' ? 'Ghi hình (Video)' : 'Ghi âm (Audio)'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <X size={24} />
          </button>
        </div>

        {type === 'video' && (
          <div style={{ width: '100%', height: '300px', backgroundColor: '#000', borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' }}>
            {(!isRecording && !recordedUrl) ? (
              <div style={{ color: '#fff', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                Camera Preview
              </div>
            ) : (
              <video 
                ref={videoPreviewRef} 
                autoPlay={isRecording} 
                controls={!isRecording && !!recordedUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            )}
          </div>
        )}

        {type === 'audio' && recordedUrl && (
          <div style={{ marginBottom: '20px' }}>
            <audio controls src={recordedUrl} style={{ width: '100%' }} />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '32px', fontFamily: 'monospace', fontWeight: 'bold', color: isRecording ? '#ef4444' : '#374151' }}>
            {formatTime(time)}
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            {!isRecording && !recordedUrl && (
              <button 
                onClick={startRecording}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fff' }} />
                Bắt đầu ghi
              </button>
            )}

            {isRecording && (
              <button 
                onClick={stopRecording}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <Square size={16} fill="#fff" />
                Dừng lại
              </button>
            )}

            {recordedUrl && !isRecording && (
              <>
                <button 
                  onClick={startRecording}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <Play size={16} /> Ghi lại
                </button>
                <button 
                  onClick={() => {
                    onInsert(recordedUrl);
                    onClose();
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <Save size={16} /> Chèn vào ghi chú
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
