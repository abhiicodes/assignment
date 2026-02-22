import type { FlowSchema, FlowNodeData, FlowEdge, AppNode } from '../types';

export function exportToJson(nodes: AppNode[], startNodeId: string): FlowSchema {
    return {
        startNodeId,
        nodes: nodes.map((n) => {
            const data = n.data as FlowNodeData;
            return {
                id: data.nodeId,
                description: data.description,
                prompt: data.prompt,
                edges: data.edges.map((e) => {
                    const edge: FlowEdge = {
                        id: e.id,
                        to_node_id: e.to_node_id,
                        condition: e.condition,
                    };
                    if (e.parameters && Object.keys(e.parameters).length > 0) {
                        edge.parameters = e.parameters;
                    }
                    return edge;
                }),
            };
        }),
    };
}

export interface ImportResult {
    success: boolean;
    error?: string;
    nodes?: AppNode[];
    startNodeId?: string;
}

export function importFromJson(jsonString: string): ImportResult {
    try {
        const data = JSON.parse(jsonString) as FlowSchema;

        if (!data.nodes || !Array.isArray(data.nodes)) {
            return { success: false, error: 'Invalid schema: "nodes" array is required.' };
        }
        if (!data.startNodeId || typeof data.startNodeId !== 'string') {
            return { success: false, error: 'Invalid schema: "startNodeId" is required.' };
        }

        const COLS = 3;
        const X_GAP = 300;
        const Y_GAP = 200;

        const nodes: AppNode[] = data.nodes.map((n, i) => ({
            id: `node-${n.id}`,
            type: 'custom',
            position: {
                x: (i % COLS) * X_GAP + 50,
                y: Math.floor(i / COLS) * Y_GAP + 50,
            },
            data: {
                label: n.id,
                description: n.description || '',
                prompt: n.prompt || '',
                edges: (n.edges || []).map((e) => ({
                    id: e.id || `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    to_node_id: e.to_node_id,
                    condition: e.condition || '',
                    parameters: e.parameters || {},
                })),
                isStart: n.id === data.startNodeId,
                nodeId: n.id,
            },
        }));

        return {
            success: true,
            nodes,
            startNodeId: data.startNodeId,
        };
    } catch (e) {
        return {
            success: false,
            error: `Failed to parse JSON: ${(e as Error).message}`,
        };
    }
}
