import type { ValidationError, FlowNodeData, AppNode, AppEdge } from '../types';

export function validateFlow(
    nodes: AppNode[],
    edges: AppEdge[],
    startNodeId: string
): ValidationError[] {
    const errors: ValidationError[] = [];

    // 1. Check start node exists
    if (!startNodeId) {
        errors.push({
            id: 'no-start-node',
            type: 'error',
            message: 'No start node has been designated. Right-click or use the sidebar to set one.',
        });
    } else {
        const startNode = nodes.find((n) => (n.data as FlowNodeData).nodeId === startNodeId);
        if (!startNode) {
            errors.push({
                id: 'start-node-missing',
                type: 'error',
                message: `Start node "${startNodeId}" does not exist.`,
            });
        }
    }

    // 2. Unique node IDs
    const nodeIdCounts = new Map<string, number>();
    nodes.forEach((n) => {
        const nid = (n.data as FlowNodeData).nodeId;
        nodeIdCounts.set(nid, (nodeIdCounts.get(nid) || 0) + 1);
    });
    nodeIdCounts.forEach((count, nid) => {
        if (count > 1) {
            errors.push({
                id: `duplicate-id-${nid}`,
                type: 'error',
                message: `Duplicate node ID "${nid}" found ${count} times.`,
                nodeId: nid,
                field: 'nodeId',
            });
        }
    });

    // 3. Required description
    nodes.forEach((n) => {
        const data = n.data as FlowNodeData;
        if (!data.description || data.description.trim() === '') {
            errors.push({
                id: `missing-desc-${n.id}`,
                type: 'error',
                message: `Node "${data.nodeId}" is missing a description.`,
                nodeId: data.nodeId,
                field: 'description',
            });
        }
    });

    // 4. Edge validations
    nodes.forEach((n) => {
        const data = n.data as FlowNodeData;
        data.edges.forEach((edge) => {
            // Empty condition
            if (!edge.condition || edge.condition.trim() === '') {
                errors.push({
                    id: `empty-condition-${edge.id}`,
                    type: 'warning',
                    message: `Edge from "${data.nodeId}" to "${edge.to_node_id}" has an empty condition.`,
                    nodeId: data.nodeId,
                    field: 'condition',
                });
            }
            // Dangling edge target
            const targetExists = nodes.some(
                (t) => (t.data as FlowNodeData).nodeId === edge.to_node_id
            );
            if (!targetExists) {
                errors.push({
                    id: `dangling-edge-${edge.id}`,
                    type: 'error',
                    message: `Edge from "${data.nodeId}" targets non-existent node "${edge.to_node_id}".`,
                    nodeId: data.nodeId,
                });
            }
        });
    });

    // 5. Disconnected nodes (warning)
    if (nodes.length > 1) {
        const allNodeIds = new Set(nodes.map((n) => (n.data as FlowNodeData).nodeId));
        const connectedNodeIds = new Set<string>();

        nodes.forEach((n) => {
            const data = n.data as FlowNodeData;
            if (data.edges.length > 0) {
                connectedNodeIds.add(data.nodeId);
                data.edges.forEach((e) => connectedNodeIds.add(e.to_node_id));
            }
        });

        // Also check React Flow visual edges
        edges.forEach((e) => {
            const sourceNode = nodes.find((n) => n.id === e.source);
            const targetNode = nodes.find((n) => n.id === e.target);
            if (sourceNode) connectedNodeIds.add((sourceNode.data as FlowNodeData).nodeId);
            if (targetNode) connectedNodeIds.add((targetNode.data as FlowNodeData).nodeId);
        });

        allNodeIds.forEach((nid) => {
            if (!connectedNodeIds.has(nid)) {
                errors.push({
                    id: `disconnected-${nid}`,
                    type: 'warning',
                    message: `Node "${nid}" is disconnected — it has no incoming or outgoing edges.`,
                    nodeId: nid,
                });
            }
        });
    }

    return errors;
}
