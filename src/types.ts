import type { Node, Edge } from '@xyflow/react';

// --- Schema Types (exported JSON) ---

export interface FlowEdge {
    id: string;
    to_node_id: string;
    condition: string;
    parameters?: Record<string, string>;
}

export interface FlowNodeData {
    [key: string]: unknown;
    label: string;
    description: string;
    prompt: string;
    edges: FlowEdge[];
    isStart: boolean;
    nodeId: string; // user-editable unique ID
}

export interface FlowSchema {
    startNodeId: string;
    nodes: Array<{
        id: string;
        description: string;
        prompt: string;
        edges: FlowEdge[];
    }>;
}

// --- React Flow Types ---

export type AppNode = Node<FlowNodeData, 'custom'>;
export type AppEdge = Edge;

// --- Validation ---

export interface ValidationError {
    id: string;
    type: 'error' | 'warning';
    message: string;
    nodeId?: string;
    field?: string;
}
