import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../store/store';
import { exportToJson } from '../utils/jsonExport';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Copy,
  Download,
  Upload,
  Check,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import ImportModal from './ImportModal';

const JsonPreview: React.FC = () => {
  const nodes = useAppSelector((s) => s.flow.nodes);
  const startNodeId = useAppSelector((s) => s.flow.startNodeId);
  const validationErrors = useAppSelector((s) => s.flow.validationErrors);

  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showImport, setShowImport] = useState(false);

  const schema = useMemo(() => exportToJson(nodes, startNodeId), [nodes, startNodeId]);
  const jsonString = useMemo(() => JSON.stringify(schema, null, 2), [schema]);

  const errorCount = validationErrors.filter((e) => e.type === 'error').length;
  const warningCount = validationErrors.filter((e) => e.type === 'warning').length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = jsonString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow.json';
    a.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div className={`json-preview ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="json-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="json-header-left">
          <span className="json-header-icon">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </span>
          <h3>JSON Schema</h3>
          {errorCount > 0 && (
            <span className="validation-badge error">
              <AlertCircle size={12} /> {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="validation-badge warning">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="json-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-icon" onClick={handleCopy} title="Copy JSON">
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
          <button className="btn btn-icon" onClick={handleDownload} title="Download JSON">
            <Download size={15} />
          </button>
          <button className="btn btn-icon" onClick={() => setShowImport(true)} title="Import JSON">
            <Upload size={15} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="json-body">

          {validationErrors.length > 0 && (
            <div className="validation-list">
              {validationErrors.map((err) => (
                <div key={err.id} className={`inline-error ${err.type}`}>
                  <AlertCircle size={12} /> {err.message}
                </div>
              ))}
            </div>
          )}

          <SyntaxHighlighter
            language="json"
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: '8px',
              fontSize: '12.5px',
              lineHeight: '1.6',
              background: '#1a1b26',
            }}
            wrapLongLines
          >
            {jsonString}
          </SyntaxHighlighter>
        </div>
      )}

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
};

export default JsonPreview;
