import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppNode, FlowNodeData, FlowEdge, ValidationError } from '../types';
import { validateFlow } from '../utils/validation';
import { nanoid } from 'nanoid';
import {
    applyNodeChanges,
    applyEdgeChanges,
    type Edge,
    type NodeChange,
    type EdgeChange,
} from '@xyflow/react';

interface FlowState {
    nodes: AppNode[];
    rfEdges: Edge[];
    startNodeId: string;
    selectedNodeId: string | null; // internal React Flow node id
    validationErrors: ValidationError[];
}

const initialNodes: AppNode[] = [
    {
        id: 'node-1',
        type: 'custom',
        position: { x: 100, y: 150 },
        data: {
            label: 'greeting',
            description: 'Greet the user',
            prompt: 'Say hello to the user and ask how you can help.',
            edges: [],
            isStart: true,
            nodeId: 'greeting',
        },
    },
    {
        id: 'node-2',
        type: 'custom',
        position: { x: 500, y: 100 },
        data: {
            label: 'collect_info',
            description: 'Collect user information',
            prompt: 'Ask the user for their name and email.',
            edges: [],
            isStart: false,
            nodeId: 'collect_info',
        },
    },
    {
        id: 'node-3',
        type: 'custom',
        position: { x: 500, y: 350 },
        data: {
            label: 'farewell',
            description: 'Say goodbye',
            prompt: 'Thank the user and end the conversation.',
            edges: [],
            isStart: false,
            nodeId: 'farewell',
        },
    },
];

// Set initial edges on the greeting node
initialNodes[0].data.edges = [
    {
        id: 'edge-1',
        to_node_id: 'collect_info',
        condition: 'user wants help',
        parameters: {},
    },
    {
        id: 'edge-2',
        to_node_id: 'farewell',
        condition: 'user wants to leave',
        parameters: {},
    },
];

const initialRfEdges: Edge[] = [
    {
        id: 'rf-edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'user wants help',
        type: 'custom',
    },
    {
        id: 'rf-edge-2',
        source: 'node-1',
        target: 'node-3',
        label: 'user wants to leave',
        type: 'custom',
    },
];

const initialState: FlowState = {
    nodes: initialNodes,
    rfEdges: initialRfEdges,
    startNodeId: 'greeting',
    selectedNodeId: null,
    validationErrors: [],
};

// Revalidate helper
function revalidate(state: FlowState) {
    state.validationErrors = validateFlow(state.nodes, state.rfEdges, state.startNodeId);
}

const flowSlice = createSlice({
    name: 'flow',
    initialState,
    reducers: {
        // --- React Flow change handlers ---
        onNodesChange(state, action: PayloadAction<NodeChange<AppNode>[]>) {
            state.nodes = applyNodeChanges(action.payload, state.nodes) as AppNode[];
            revalidate(state);
        },
        onEdgesChange(state, action: PayloadAction<EdgeChange<Edge>[]>) {
            state.rfEdges = applyEdgeChanges(action.payload, state.rfEdges);
            revalidate(state);
        },

        // --- Node CRUD ---
        addNode(state, action: PayloadAction<{ x: number; y: number } | undefined>) {
            const id = nanoid(6);
            const pos = action.payload || {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100,
            };
            const newNode: AppNode = {
                id: `node-${id}`,
                type: 'custom',
                position: pos,
                data: {
                    label: `node_${id}`,
                    description: '',
                    prompt: '',
                    edges: [],
                    isStart: state.nodes.length === 0,
                    nodeId: `node_${id}`,
                },
            };
            if (state.nodes.length === 0) {
                state.startNodeId = newNode.data.nodeId;
            }
            state.nodes.push(newNode);
            revalidate(state);
        },

        deleteNode(state, action: PayloadAction<string>) {
            const internalId = action.payload;
            const node = state.nodes.find((n) => n.id === internalId);
            if (!node) return;

            const nodeId = (node.data as FlowNodeData).nodeId;

            // Remove the node
            state.nodes = state.nodes.filter((n) => n.id !== internalId);

            // Remove RF edges involving this node
            state.rfEdges = state.rfEdges.filter(
                (e) => e.source !== internalId && e.target !== internalId
            );

            // Remove flow edges targeting this node from other nodes
            state.nodes.forEach((n) => {
                const data = n.data as FlowNodeData;
                data.edges = data.edges.filter((e) => e.to_node_id !== nodeId);
            });

            // Clear selection if deleted
            if (state.selectedNodeId === internalId) {
                state.selectedNodeId = null;
            }

            // If start node was deleted, reset
            if (state.startNodeId === nodeId) {
                state.startNodeId = state.nodes.length > 0
                    ? (state.nodes[0].data as FlowNodeData).nodeId
                    : '';
                if (state.nodes.length > 0) {
                    (state.nodes[0].data as FlowNodeData).isStart = true;
                }
            }

            revalidate(state);
        },

        updateNodeData(
            state,
            action: PayloadAction<{ internalId: string; data: Partial<FlowNodeData> }>
        ) {
            const { internalId, data } = action.payload;
            const node = state.nodes.find((n) => n.id === internalId);
            if (!node) return;

            const oldNodeId = (node.data as FlowNodeData).nodeId;

            // Apply updates
            Object.assign(node.data, data);

            // If nodeId changed, update label and edges in other nodes
            if (data.nodeId && data.nodeId !== oldNodeId) {
                (node.data as FlowNodeData).label = data.nodeId;

                // Update references in other nodes' flow edges
                state.nodes.forEach((n) => {
                    (n.data as FlowNodeData).edges.forEach((e) => {
                        if (e.to_node_id === oldNodeId) {
                            e.to_node_id = data.nodeId!;
                        }
                    });
                });

                // Update startNodeId if needed
                if (state.startNodeId === oldNodeId) {
                    state.startNodeId = data.nodeId;
                }

                // Update RF edge labels
                state.rfEdges.forEach((e) => {
                    if (e.source === internalId || e.target === internalId) {
                        // Labels get recalculated from flow edges
                    }
                });
            }

            revalidate(state);
        },

        selectNode(state, action: PayloadAction<string | null>) {
            state.selectedNodeId = action.payload;
        },

        // --- Start node ---
        setStartNode(state, action: PayloadAction<string>) {
            const nodeId = action.payload;
            state.startNodeId = nodeId;
            state.nodes.forEach((n) => {
                (n.data as FlowNodeData).isStart = (n.data as FlowNodeData).nodeId === nodeId;
            });
            revalidate(state);
        },

        // --- Flow Edge management (from sidebar) ---
        addFlowEdge(
            state,
            action: PayloadAction<{ sourceInternalId: string; targetNodeId: string; condition: string }>
        ) {
            const { sourceInternalId, targetNodeId, condition } = action.payload;
            const sourceNode = state.nodes.find((n) => n.id === sourceInternalId);
            if (!sourceNode) return;

            const edgeId = nanoid(8);
            const newFlowEdge: FlowEdge = {
                id: edgeId,
                to_node_id: targetNodeId,
                condition,
                parameters: {},
            };
            (sourceNode.data as FlowNodeData).edges.push(newFlowEdge);

            // Also add a React Flow visual edge
            const targetNode = state.nodes.find(
                (n) => (n.data as FlowNodeData).nodeId === targetNodeId
            );
            if (targetNode) {
                state.rfEdges.push({
                    id: `rf-${edgeId}`,
                    source: sourceInternalId,
                    target: targetNode.id,
                    label: condition,
                    type: 'custom',
                });
            }

            revalidate(state);
        },

        removeFlowEdge(state, action: PayloadAction<{ sourceInternalId: string; edgeId: string }>) {
            const { sourceInternalId, edgeId } = action.payload;
            const sourceNode = state.nodes.find((n) => n.id === sourceInternalId);
            if (!sourceNode) return;

            (sourceNode.data as FlowNodeData).edges = (sourceNode.data as FlowNodeData).edges.filter(
                (e) => e.id !== edgeId
            );

            // Remove corresponding RF edge
            state.rfEdges = state.rfEdges.filter((e) => e.id !== `rf-${edgeId}`);

            revalidate(state);
        },

        updateFlowEdge(
            state,
            action: PayloadAction<{
                sourceInternalId: string;
                edgeId: string;
                updates: Partial<FlowEdge>;
            }>
        ) {
            const { sourceInternalId, edgeId, updates } = action.payload;
            const sourceNode = state.nodes.find((n) => n.id === sourceInternalId);
            if (!sourceNode) return;

            const edge = (sourceNode.data as FlowNodeData).edges.find((e) => e.id === edgeId);
            if (!edge) return;

            Object.assign(edge, updates);

            // Update RF edge label if condition changed
            if (updates.condition !== undefined) {
                const rfEdge = state.rfEdges.find((e) => e.id === `rf-${edgeId}`);
                if (rfEdge) {
                    rfEdge.label = updates.condition;
                }
            }

            // Update RF edge target if to_node_id changed
            if (updates.to_node_id !== undefined) {
                const targetNode = state.nodes.find(
                    (n) => (n.data as FlowNodeData).nodeId === updates.to_node_id
                );
                const rfEdge = state.rfEdges.find((e) => e.id === `rf-${edgeId}`);
                if (rfEdge && targetNode) {
                    rfEdge.target = targetNode.id;
                }
            }

            revalidate(state);
        },

        // --- Connect (from canvas drag) ---
        onConnect(state, action: PayloadAction<{ source: string; target: string }>) {
            const { source, target } = action.payload;
            const sourceNode = state.nodes.find((n) => n.id === source);
            const targetNode = state.nodes.find((n) => n.id === target);
            if (!sourceNode || !targetNode) return;

            const edgeId = nanoid(8);
            const targetNodeId = (targetNode.data as FlowNodeData).nodeId;
            const condition = '';

            (sourceNode.data as FlowNodeData).edges.push({
                id: edgeId,
                to_node_id: targetNodeId,
                condition,
                parameters: {},
            });

            state.rfEdges.push({
                id: `rf-${edgeId}`,
                source,
                target,
                label: condition || '(no condition)',
                type: 'custom',
            });

            // Auto-select source node so user can edit the condition
            state.selectedNodeId = source;

            revalidate(state);
        },

        // --- Import ---
        importFlow(
            state,
            action: PayloadAction<{ nodes: AppNode[]; startNodeId: string }>
        ) {
            state.nodes = action.payload.nodes;
            state.startNodeId = action.payload.startNodeId;
            state.selectedNodeId = null;

            // Rebuild RF edges from flow edges
            const rfEdges: Edge[] = [];
            state.nodes.forEach((sourceNode) => {
                const sourceData = sourceNode.data as FlowNodeData;
                sourceData.edges.forEach((edge) => {
                    const targetNode = state.nodes.find(
                        (n) => (n.data as FlowNodeData).nodeId === edge.to_node_id
                    );
                    if (targetNode) {
                        rfEdges.push({
                            id: `rf-${edge.id}`,
                            source: sourceNode.id,
                            target: targetNode.id,
                            label: edge.condition || '(no condition)',
                            type: 'custom',
                        });
                    }
                });
            });
            state.rfEdges = rfEdges;

            revalidate(state);
        },

        // --- Delete selected ---
        deleteSelected(state) {
            // Delete selected RF edges first
            const selectedEdgeIds = state.rfEdges
                .filter((e) => e.selected)
                .map((e) => e.id);

            selectedEdgeIds.forEach((rfEdgeId) => {
                // Remove corresponding flow edge
                const flowEdgeId = rfEdgeId.replace('rf-', '');
                state.nodes.forEach((n) => {
                    const data = n.data as FlowNodeData;
                    data.edges = data.edges.filter((e) => e.id !== flowEdgeId);
                });
            });
            state.rfEdges = state.rfEdges.filter((e) => !e.selected);

            // Delete selected nodes
            const selectedNodeIds = state.nodes
                .filter((n) => n.selected)
                .map((n) => n.id);

            selectedNodeIds.forEach((internalId) => {
                const node = state.nodes.find((n) => n.id === internalId);
                if (!node) return;
                const nodeId = (node.data as FlowNodeData).nodeId;

                state.nodes = state.nodes.filter((n) => n.id !== internalId);
                state.rfEdges = state.rfEdges.filter(
                    (e) => e.source !== internalId && e.target !== internalId
                );
                state.nodes.forEach((n) => {
                    const data = n.data as FlowNodeData;
                    data.edges = data.edges.filter((e) => e.to_node_id !== nodeId);
                });

                if (state.selectedNodeId === internalId) {
                    state.selectedNodeId = null;
                }
                if (state.startNodeId === nodeId && state.nodes.length > 0) {
                    state.startNodeId = (state.nodes[0].data as FlowNodeData).nodeId;
                    (state.nodes[0].data as FlowNodeData).isStart = true;
                }
            });

            revalidate(state);
        },
    },
});

export const {
    onNodesChange,
    onEdgesChange,
    addNode,
    deleteNode,
    updateNodeData,
    selectNode,
    setStartNode,
    addFlowEdge,
    removeFlowEdge,
    updateFlowEdge,
    onConnect,
    importFlow,
    deleteSelected,
} = flowSlice.actions;

export default flowSlice.reducer;
