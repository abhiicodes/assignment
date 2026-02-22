import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  updateNodeData,
  setStartNode,
  deleteNode,
  addFlowEdge,
  removeFlowEdge,
  updateFlowEdge,
  selectNode,
} from '../store/flowSlice';
import type { FlowNodeData, FlowEdge } from '../types';
import {
  X,
  Trash2,
  Plus,
  Play,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

const NodeSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedNodeId = useAppSelector((s) => s.flow.selectedNodeId);
  const nodes = useAppSelector((s) => s.flow.nodes);
  const validationErrors = useAppSelector((s) => s.flow.validationErrors);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const nodeData = selectedNode?.data as FlowNodeData | undefined;

  const [localNodeId, setLocalNodeId] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [localPrompt, setLocalPrompt] = useState('');
  const [expandedEdge, setExpandedEdge] = useState<string | null>(null);

  useEffect(() => {
    if (nodeData) {
      setLocalNodeId(nodeData.nodeId);
      setLocalDescription(nodeData.description);
      setLocalPrompt(nodeData.prompt);
    }
  }, [selectedNodeId, nodeData?.nodeId]);

  if (!selectedNode || !nodeData) {
    return (
      <div className="sidebar sidebar-empty">
        <div className="sidebar-empty-content">
          <div className="sidebar-empty-icon">🔍</div>
          <h3>No Node Selected</h3>
          <p>Click on a node in the canvas to edit its properties</p>
        </div>
      </div>
    );
  }

  const nodeErrors = validationErrors.filter(
    (e) => e.nodeId === nodeData.nodeId
  );

  const otherNodes = nodes.filter((n) => n.id !== selectedNode.id);

  const handleNodeIdChange = (value: string) => {
    setLocalNodeId(value);
    dispatch(
      updateNodeData({
        internalId: selectedNode.id,
        data: { nodeId: value, label: value },
      })
    );
  };

  const handleDescriptionChange = (value: string) => {
    setLocalDescription(value);
    dispatch(
      updateNodeData({
        internalId: selectedNode.id,
        data: { description: value },
      })
    );
  };

  const handlePromptChange = (value: string) => {
    setLocalPrompt(value);
    dispatch(
      updateNodeData({
        internalId: selectedNode.id,
        data: { prompt: value },
      })
    );
  };

  const handleSetStart = () => {
    dispatch(setStartNode(nodeData.nodeId));
  };

  const handleDelete = () => {
    dispatch(deleteNode(selectedNode.id));
  };

  const handleAddEdge = () => {
    if (otherNodes.length === 0) return;
    const targetNodeId = (otherNodes[0].data as FlowNodeData).nodeId;
    dispatch(
      addFlowEdge({
        sourceInternalId: selectedNode.id,
        targetNodeId,
        condition: '',
      })
    );
  };

  const handleRemoveEdge = (edgeId: string) => {
    dispatch(removeFlowEdge({ sourceInternalId: selectedNode.id, edgeId }));
  };

  const handleUpdateEdge = (edgeId: string, updates: Partial<FlowEdge>) => {
    dispatch(
      updateFlowEdge({
        sourceInternalId: selectedNode.id,
        edgeId,
        updates,
      })
    );
  };

  const handleAddParam = (edgeId: string, edge: FlowEdge) => {
    const params = { ...(edge.parameters || {}), '': '' };
    handleUpdateEdge(edgeId, { parameters: params });
  };

  const handleUpdateParam = (
    edgeId: string,
    edge: FlowEdge,
    oldKey: string,
    newKey: string,
    newValue: string
  ) => {
    const params = { ...(edge.parameters || {}) };
    if (oldKey !== newKey) {
      delete params[oldKey];
    }
    params[newKey] = newValue;
    handleUpdateEdge(edgeId, { parameters: params });
  };

  const handleRemoveParam = (edgeId: string, edge: FlowEdge, key: string) => {
    const params = { ...(edge.parameters || {}) };
    delete params[key];
    handleUpdateEdge(edgeId, { parameters: params });
  };

  const idError = nodeErrors.find((e) => e.field === 'nodeId');
  const descError = nodeErrors.find((e) => e.field === 'description');

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Node Properties</h2>
        <button
          className="sidebar-close-btn"
          onClick={() => dispatch(selectNode(null))}
          title="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="sidebar-content">
        {/* Node ID */}
        <div className={`form-group ${idError ? 'has-error' : ''}`}>
          <label htmlFor="node-id">Node ID</label>
          <input
            id="node-id"
            type="text"
            value={localNodeId}
            onChange={(e) => handleNodeIdChange(e.target.value)}
            placeholder="Unique identifier..."
            spellCheck={false}
          />
          {idError && (
            <span className="field-error">
              <AlertCircle size={12} /> {idError.message}
            </span>
          )}
        </div>

        {/* Description */}
        <div className={`form-group ${descError ? 'has-error' : ''}`}>
          <label htmlFor="node-desc">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="node-desc"
            rows={2}
            value={localDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="What does this node do?"
          />
          {descError && (
            <span className="field-error">
              <AlertCircle size={12} /> {descError.message}
            </span>
          )}
        </div>

        {/* Prompt */}
        <div className="form-group">
          <label htmlFor="node-prompt">Prompt</label>
          <textarea
            id="node-prompt"
            rows={3}
            value={localPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="The prompt text for this step..."
          />
        </div>

        {/* Start Node Toggle */}
        <div className="form-group">
          {nodeData.isStart ? (
            <div className="start-indicator">
              <Play size={14} /> This is the start node
            </div>
          ) : (
            <button className="btn btn-secondary" onClick={handleSetStart}>
              <Play size={14} /> Set as Start Node
            </button>
          )}
        </div>

        {/* Outgoing Edges */}
        <div className="edges-section">
          <div className="edges-header">
            <h3>Outgoing Edges ({nodeData.edges.length})</h3>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleAddEdge}
              disabled={otherNodes.length === 0}
              title={otherNodes.length === 0 ? 'Add more nodes first' : 'Add an edge'}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {nodeData.edges.length === 0 && (
            <p className="edges-empty">
              No outgoing edges. Draw a connection on the canvas or click "Add" above.
            </p>
          )}

          {nodeData.edges.map((edge) => (
            <div key={edge.id} className="edge-card">
              <div
                className="edge-card-header"
                onClick={() =>
                  setExpandedEdge(expandedEdge === edge.id ? null : edge.id)
                }
              >
                <span className="edge-card-toggle">
                  {expandedEdge === edge.id ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </span>
                <span className="edge-card-title">
                  → {edge.to_node_id || '(none)'}
                </span>
                <span className="edge-card-condition">
                  {edge.condition || '(no condition)'}
                </span>
                <button
                  className="edge-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveEdge(edge.id);
                  }}
                  title="Remove edge"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {expandedEdge === edge.id && (
                <div className="edge-card-body">
                  <div className="form-group">
                    <label>Target Node</label>
                    <select
                      value={edge.to_node_id}
                      onChange={(e) =>
                        handleUpdateEdge(edge.id, { to_node_id: e.target.value })
                      }
                    >
                      <option value="">Select target...</option>
                      {otherNodes.map((n) => {
                        const nd = n.data as FlowNodeData;
                        return (
                          <option key={n.id} value={nd.nodeId}>
                            {nd.nodeId}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Condition</label>
                    <input
                      type="text"
                      value={edge.condition}
                      onChange={(e) =>
                        handleUpdateEdge(edge.id, { condition: e.target.value })
                      }
                      placeholder="When should this transition occur?"
                    />
                  </div>

                  {/* Parameters */}
                  <div className="params-section">
                    <div className="params-header">
                      <label>Parameters</label>
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => handleAddParam(edge.id, edge)}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    {edge.parameters &&
                      Object.entries(edge.parameters).map(([key, value], idx) => (
                        <div key={idx} className="param-row">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) =>
                              handleUpdateParam(edge.id, edge, key, e.target.value, value)
                            }
                            placeholder="key"
                            className="param-key"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              handleUpdateParam(edge.id, edge, key, key, e.target.value)
                            }
                            placeholder="value"
                            className="param-value"
                          />
                          <button
                            className="param-remove"
                            onClick={() => handleRemoveParam(edge.id, edge, key)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* End: Other errors/warnings for this node */}
        {nodeErrors.filter((e) => !e.field).length > 0 && (
          <div className="node-errors">
            {nodeErrors
              .filter((e) => !e.field)
              .map((err) => (
                <div key={err.id} className={`inline-error ${err.type}`}>
                  <AlertCircle size={13} /> {err.message}
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="btn btn-danger" onClick={handleDelete}>
          <Trash2 size={14} /> Delete Node
        </button>
      </div>
    </div>
  );
};

export default NodeSidebar;
