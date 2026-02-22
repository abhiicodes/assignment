import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { addNode } from '../store/flowSlice';
import { Plus, Upload, GitBranch, AlertCircle, CheckCircle2 } from 'lucide-react';
import ImportModal from './ImportModal';

const Toolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const validationErrors = useAppSelector((s) => s.flow.validationErrors);
  const [showImport, setShowImport] = useState(false);

  const errorCount = validationErrors.filter((e) => e.type === 'error').length;
  const warningCount = validationErrors.filter((e) => e.type === 'warning').length;
  const isValid = errorCount === 0;

  const handleAddNode = () => {
    dispatch(addNode(undefined));
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="toolbar-brand">
            <GitBranch size={20} />
            <span>Flow Builder</span>
          </div>
        </div>

        <div className="toolbar-center">
          <button className="btn btn-primary" onClick={handleAddNode}>
            <Plus size={16} /> Add Node
          </button>
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
            <Upload size={15} /> Import JSON
          </button>
        </div>

        <div className="toolbar-right">
          <div className={`validation-status ${isValid ? 'valid' : 'invalid'}`}>
            {isValid ? (
              <>
                <CheckCircle2 size={16} />
                <span>Valid</span>
              </>
            ) : (
              <>
                <AlertCircle size={16} />
                <span>
                  {errorCount} error{errorCount !== 1 ? 's' : ''}
                  {warningCount > 0 &&
                    `, ${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} />
    </>
  );
};

export default Toolbar;
