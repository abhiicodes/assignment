import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  onNodesChange,
  onEdgesChange,
  onConnect,
  selectNode,
  deleteSelected,
} from '../store/flowSlice';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import type { FlowNodeData } from '../types';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

const Canvas: React.FC = () => {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector((s) => s.flow.nodes);
  const edges = useAppSelector((s) => s.flow.rfEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const handleNodesChange = useCallback(
    (changes: any) => dispatch(onNodesChange(changes)),
    [dispatch]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => dispatch(onEdgesChange(changes)),
    [dispatch]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        dispatch(onConnect({ source: connection.source, target: connection.target }));
      }
    },
    [dispatch]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      dispatch(selectNode(node.id));
    },
    [dispatch]
  );

  const handlePaneClick = useCallback(() => {
    dispatch(selectNode(null));
  }, [dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if user is typing in an input
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT'
        )
          return;
        dispatch(deleteSelected());
      }
    },
    [dispatch]
  );

  return (
    <div
      className="canvas-container"
      ref={reactFlowWrapper}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'custom',
        }}
        deleteKeyCode={null} // We handle delete ourselves
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3a3a3a" />
        <Controls className="flow-controls" />
        <MiniMap
          className="flow-minimap"
          nodeColor={(node) => {
            const data = node.data as unknown as FlowNodeData;
            if (data.isStart) return '#22c55e';
            return '#d4952e';
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
        />
        <Panel position="bottom-center" className="canvas-hint">
          <span>Drag to connect • Delete key to remove • Click node to edit</span>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default Canvas;
