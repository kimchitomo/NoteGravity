import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Search, Replace, X, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';

interface FindReplaceModalProps {
  onClose: () => void;
  initialMode?: 'find' | 'replace';
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({ onClose, initialMode = 'find' }) => {
  const { activeEditor } = useEditorStore();
  const [mode, setMode] = useState<'find' | 'replace'>(initialMode);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matches, setMatches] = useState<number[]>([]);
  const [currentMatch, setCurrentMatch] = useState(-1);
  const [message, setMessage] = useState('');
  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    findInputRef.current?.focus();
  }, []);

  // Tìm tất cả vị trí match trong editor content
  const findMatches = useCallback(() => {
    if (!activeEditor || !findText) {
      setMatches([]);
      setCurrentMatch(-1);
      setMessage('');
      return [];
    }

    const text = activeEditor.getText();
    const searchStr = matchCase ? findText : findText.toLowerCase();
    const sourceText = matchCase ? text : text.toLowerCase();

    const found: number[] = [];
    let idx = 0;
    while (true) {
      const pos = sourceText.indexOf(searchStr, idx);
      if (pos === -1) break;

      // Kiểm tra whole word
      if (wholeWord) {
        const before = pos === 0 ? '' : sourceText[pos - 1];
        const after = pos + searchStr.length >= sourceText.length ? '' : sourceText[pos + searchStr.length];
        const wordChar = /\w/;
        if (wordChar.test(before) || wordChar.test(after)) {
          idx = pos + 1;
          continue;
        }
      }
      found.push(pos);
      idx = pos + 1;
    }

    setMatches(found);
    if (found.length === 0) {
      setMessage(`Không tìm thấy "${findText}"`);
      setCurrentMatch(-1);
    } else {
      setMessage(`${found.length} kết quả`);
      setCurrentMatch(0);
      scrollToMatch(found[0]);
    }
    return found;
  }, [activeEditor, findText, matchCase, wholeWord]);

  const scrollToMatch = (pos: number) => {
    if (!activeEditor) return;
    try {
      // Đặt selection tại vị trí tìm thấy
      const { doc } = activeEditor.state;
      let charCount = 0;
      let targetPos = 1;
      doc.descendants((node: any, nodePos: number) => {
        if (node.isText && node.text) {
          if (charCount + node.text.length > pos) {
            targetPos = nodePos + (pos - charCount) + 1;
            return false;
          }
          charCount += node.text.length;
        }
      });
      activeEditor.commands.setTextSelection({ from: targetPos, to: targetPos + findText.length });
      activeEditor.commands.scrollIntoView();
    } catch {
      // ignore
    }
  };

  const goToMatch = (idx: number) => {
    if (matches.length === 0) return;
    const newIdx = ((idx % matches.length) + matches.length) % matches.length;
    setCurrentMatch(newIdx);
    setMessage(`${newIdx + 1} / ${matches.length} kết quả`);
    scrollToMatch(matches[newIdx]);
  };

  const handleFind = () => {
    const found = findMatches();
    if (found.length > 0) {
      setCurrentMatch(0);
      scrollToMatch(found[0]);
      setMessage(`1 / ${found.length} kết quả`);
    }
  };

  const handleReplace = () => {
    if (!activeEditor || !findText || matches.length === 0) return;
    const html = activeEditor.getHTML();
    // Replace single (simple string replace)
    const regex = new RegExp(escapeRegex(findText), matchCase ? '' : 'i');
    const newHtml = html.replace(regex, replaceText);
    activeEditor.commands.setContent(newHtml, false);
    // Re-find
    setTimeout(() => {
      const found = findMatches();
      setMessage(`Đã thay thế 1. Còn ${found.length} kết quả.`);
    }, 50);
  };

  const handleReplaceAll = () => {
    if (!activeEditor || !findText) return;
    const html = activeEditor.getHTML();
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(escapeRegex(findText), flags);
    const count = (html.match(regex) || []).length;
    const newHtml = html.replace(regex, replaceText);
    activeEditor.commands.setContent(newHtml, false);
    setMatches([]);
    setCurrentMatch(-1);
    setMessage(count > 0 ? `Đã thay thế ${count} kết quả.` : 'Không tìm thấy để thay thế.');
  };

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Ctrl+Enter = find, Escape = close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleFind(); }
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  const modal = (
    <div style={{
      position: 'fixed', top: 80, right: 20, zIndex: 10000,
      backgroundColor: '#fff', borderRadius: 12,
      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      border: '1px solid #e5e7eb', width: 380, overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#fafafa' }}>
        <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <button onClick={() => setMode('find')}
            style={{ padding: '4px 14px', fontSize: 13, cursor: 'pointer', border: 'none', backgroundColor: mode === 'find' ? '#3b82f6' : 'transparent', color: mode === 'find' ? '#fff' : '#374151', fontWeight: mode === 'find' ? 600 : 400, transition: 'all 0.15s' }}>
            Tìm
          </button>
          <button onClick={() => setMode('replace')}
            style={{ padding: '4px 14px', fontSize: 13, cursor: 'pointer', border: 'none', backgroundColor: mode === 'replace' ? '#3b82f6' : 'transparent', color: mode === 'replace' ? '#fff' : '#374151', fontWeight: mode === 'replace' ? 600 : 400, transition: 'all 0.15s' }}>
            Thay thế
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 6, display: 'flex' }}>
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Find input */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            ref={findInputRef}
            type="text"
            placeholder="Tìm văn bản..."
            value={findText}
            onChange={e => { setFindText(e.target.value); setMessage(''); }}
            onKeyDown={handleKeyDown}
            style={{ width: '100%', padding: '8px 80px 8px 32px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          {/* Prev/Next buttons */}
          <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
            <button onClick={() => goToMatch(currentMatch - 1)} disabled={matches.length === 0}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 3, borderRadius: 4, display: 'flex' }}>
              <ChevronUp size={14} />
            </button>
            <button onClick={() => goToMatch(currentMatch + 1)} disabled={matches.length === 0}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 3, borderRadius: 4, display: 'flex' }}>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Replace input (only in replace mode) */}
        {mode === 'replace' && (
          <div style={{ position: 'relative' }}>
            <Replace size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Thay thế bằng..."
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
        )}

        {/* Options */}
        <div style={{ display: 'flex', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>
            <input type="checkbox" checked={matchCase} onChange={e => setMatchCase(e.target.checked)} style={{ width: 13, height: 13 }} />
            Phân biệt hoa/thường
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>
            <input type="checkbox" checked={wholeWord} onChange={e => setWholeWord(e.target.checked)} style={{ width: 13, height: 13 }} />
            Cả từ
          </label>
        </div>

        {/* Message */}
        {message && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: matches.length === 0 ? '#ef4444' : '#059669', padding: '4px 8px', backgroundColor: matches.length === 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 6 }}>
            {matches.length === 0 && <AlertCircle size={12} />}
            {message}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={handleFind}
          style={{ padding: '7px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Tìm
        </button>
        {mode === 'replace' && (
          <>
            <button onClick={handleReplace} disabled={!activeEditor || matches.length === 0}
              style={{ padding: '7px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              Thay thế
            </button>
            <button onClick={handleReplaceAll} disabled={!activeEditor || !findText}
              style={{ padding: '7px 16px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Thay thế tất cả
            </button>
          </>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};
