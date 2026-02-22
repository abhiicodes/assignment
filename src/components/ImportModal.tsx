import React, { useState, useRef } from 'react';
import { useAppDispatch } from '../store/store';
import { importFlow } from '../store/flowSlice';
import { importFromJson } from '../utils/jsonExport';
import { X, Upload, ClipboardPaste, AlertCircle, FileJson } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const [pasteValue, setPasteValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImportText = () => {
    if (!pasteValue.trim()) {
      setError('Please paste some JSON first.');
      return;
    }
    setError(null);
    const result = importFromJson(pasteValue);
    if (result.success && result.nodes) {
      dispatch(
        importFlow({
          nodes: result.nodes,
          startNodeId: result.startNodeId || '',
        })
      );
      setPasteValue('');
      onClose();
    } else {
      setError(result.error || 'Unknown import error');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importFromJson(text);
      if (result.success && result.nodes) {
        dispatch(
          importFlow({
            nodes: result.nodes,
            startNodeId: result.startNodeId || '',
          })
        );
        setPasteValue('');
        onClose();
      } else {
        setError(result.error || 'Unknown import error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h2>Import JSON</h2>
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => { setActiveTab('paste'); setError(null); }}
          >
            <ClipboardPaste size={14} /> Paste JSON
          </button>
          <button
            className={`modal-tab ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => { setActiveTab('file'); setError(null); }}
          >
            <FileJson size={14} /> Upload File
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="inline-error error" style={{ marginBottom: 10 }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}

          {activeTab === 'paste' && (
            <>
              <textarea
                className="import-textarea"
                rows={14}
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder='Paste your flow JSON here...\n\n{\n  "startNodeId": "...",\n  "nodes": [ ... ]\n}'
                spellCheck={false}
                autoFocus
              />
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleImportText}>
                  <Upload size={14} /> Import
                </button>
              </div>
            </>
          )}

          {activeTab === 'file' && (
            <div className="file-drop-zone">
              <label className="file-drop-label">
                <FileJson size={36} />
                <span>Click to select a .json file</span>
                <span className="file-drop-hint">or drag & drop</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
