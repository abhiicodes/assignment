import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '../types';
import { Play, AlertCircle } from 'lucide-react';
import { useAppSelector } from '../store/store';

const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as FlowNodeData;
  const validationErrors = useAppSelector((s) => s.flow.validationErrors);
  const hasError = validationErrors.some(
    (e) => e.nodeId === nodeData.nodeId && e.type === 'error'
  );
  const hasWarning = validationErrors.some(
    (e) => e.nodeId === nodeData.nodeId && e.type === 'warning'
  );

  return (
    <div
      className={`custom-node ${nodeData.isStart ? 'start-node' : ''} ${
        selected ? 'selected' : ''
      } ${hasError ? 'has-error' : ''} ${hasWarning && !hasError ? 'has-warning' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="node-handle target-handle" />

      <div className="node-header">
        {nodeData.isStart && (
          <span className="start-badge">
            <Play size={10} />
            START
          </span>
        )}
        {hasError && <AlertCircle size={14} className="error-icon" />}
        <span className="node-label">{nodeData.label || nodeData.nodeId}</span>
      </div>

      {nodeData.description && (
        <div className="node-description">{nodeData.description}</div>
      )}

      {nodeData.edges.length > 0 && (
        <div className="node-edge-count">
          {nodeData.edges.length} edge{nodeData.edges.length !== 1 ? 's' : ''}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="node-handle source-handle" />
    </div>
  );
};

export default memo(CustomNode);
