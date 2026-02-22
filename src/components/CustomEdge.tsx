import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';
import { useAppDispatch } from '../store/store';
import { removeFlowEdge } from '../store/flowSlice';

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  source,
  selected,
}) => {
  const dispatch = useAppDispatch();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const flowEdgeId = id.replace('rf-', '');
    dispatch(removeFlowEdge({ sourceInternalId: source, edgeId: flowEdgeId }));
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: selected ? '#818cf8' : '#64748b',
          strokeWidth: selected ? 2.5 : 1.5,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={`edge-label ${selected ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          <span className="edge-label-text">
            {label || '(no condition)'}
          </span>
          <button
            className="edge-delete-btn"
            onClick={handleDelete}
            title="Delete edge"
          >
            <X size={12} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
