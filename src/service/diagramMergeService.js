const generateMergeProcessId = () => `merge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getThreatArray = (cell) => {
    if (!cell) {
        return [];
    }
    if (Array.isArray(cell.data?.threats)) {
        return cell.data.threats;
    }
    if (Array.isArray(cell.threats)) {
        return cell.threats;
    }
    return [];
};

const hasOpenThreats = (threats) => {
    return Array.isArray(threats) && threats.some((threat) => threat && threat.status && threat.status.toLowerCase() === 'open');
};

const getDiagramBounds = (diagram) => {
    const bounds = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    };

    if (!diagram || !Array.isArray(diagram.cells)) {
        return bounds;
    }

    diagram.cells.forEach((cell) => {
        if (!cell || !(
            cell.shape === 'process' ||
            cell.shape === 'actor' ||
            cell.shape === 'store' ||
            cell.data?.type === 'tm.Process' ||
            cell.data?.type === 'tm.Actor' ||
            cell.data?.type === 'tm.Store' ||
            cell.data?.type === 'tm.DataStore' ||
            cell.data?.type === 'tm.ExternalEntity'
        )) {
            return;
        }

        const x = cell.position?.x ?? cell.x ?? 0;
        const y = cell.position?.y ?? cell.y ?? 0;
        const width = cell.size?.width ?? 100;
        const height = cell.size?.height ?? 100;

        bounds.minX = Math.min(bounds.minX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxX = Math.max(bounds.maxX, x + width);
        bounds.maxY = Math.max(bounds.maxY, y + height);
    });

    return bounds;
};

const calculateDiagramOffset = (targetDiagram, sourceDiagram, margin = 220) => {
    const targetBounds = getDiagramBounds(targetDiagram);
    const sourceBounds = getDiagramBounds(sourceDiagram);

    if (targetBounds.maxX === -Infinity || sourceBounds.minX === Infinity) {
        return { x: 0, y: 0 };
    }

    return {
        x: targetBounds.maxX + margin - sourceBounds.minX,
        y: 0
    };
};

const cloneCell = (cell) => {
    const cloned = JSON.parse(JSON.stringify(cell));
    if (cloned.data && cloned.data.id) {
        cloned.data.id = generateMergeProcessId();
    }
    if (cloned.id) {
        cloned.id = generateMergeProcessId();
    }
    if (cloned.data && cloned.data.name && cloned.attrs && cloned.attrs.text) {
        cloned.attrs.text.text = cloned.data.name;
    }
    if (cloned.data) {
        const threats = getThreatArray(cloned);
        cloned.data.threats = Array.isArray(threats) ? threats : [];
        cloned.threats = cloned.data.threats;
        cloned.data.hasOpenThreats = hasOpenThreats(cloned.data.threats);
    }
    return cloned;
};

const cloneSourceFlow = (flow, importedNodeMap) => {
    if (!flow || (!flow.data && flow.shape !== 'flow') || (flow.data && flow.data.type && flow.data.type !== 'tm.Flow')) {
        return null;
    }

    const sourceId = flow.source?.cell || flow.data?.sourceId || flow.data?.source?.cell;
    const targetId = flow.target?.cell || flow.data?.targetId || flow.data?.target?.cell;
    if (!sourceId || !targetId) {
        return null;
    }

    const newSourceId = importedNodeMap.get(sourceId);
    const newTargetId = importedNodeMap.get(targetId);
    if (!newSourceId || !newTargetId) {
        return null;
    }

    const clonedFlow = JSON.parse(JSON.stringify(flow));
    const newFlowId = generateMergeProcessId();
    clonedFlow.id = newFlowId;
    if (clonedFlow.data) {
        clonedFlow.data.id = newFlowId;
        clonedFlow.data.sourceId = newSourceId;
        clonedFlow.data.targetId = newTargetId;
    } else {
        clonedFlow.data = {
            id: newFlowId,
            type: 'tm.Flow',
            sourceId: newSourceId,
            targetId: newTargetId
        };
    }
    clonedFlow.source = { cell: newSourceId };
    clonedFlow.target = { cell: newTargetId };
    clonedFlow.data.name = '';
    clonedFlow.attrs = clonedFlow.attrs || {};
    clonedFlow.attrs.label = { text: '' };
    clonedFlow.labels = [];

    return clonedFlow;
};

export const mergeDiagrams = (targetDiagram, sourceDiagram, config = {}) => {
    const result = {
        importedCount: 0,
        linkCreated: false,
        errors: []
    };

    if (!targetDiagram || !sourceDiagram) {
        result.errors.push('Both diagrams are required for merge');
        return result;
    }

    if (!targetDiagram.cells) {
        targetDiagram.cells = [];
    }

    const selectedTargetProcess = config.targetProcessId
        ? (targetDiagram.cells || []).find((cell) => cell.id === config.targetProcessId || (cell.data && cell.data.id === config.targetProcessId))
        : null;

    const sourceProcesses = (sourceDiagram.cells || []).filter((cell) => cell && (
        cell.shape === 'process' ||
        cell.shape === 'actor' ||
        cell.shape === 'store' ||
        cell.data?.type === 'tm.Process' ||
        cell.data?.type === 'tm.Actor' ||
        cell.data?.type === 'tm.Store' ||
        cell.data?.type === 'tm.DataStore' ||
        cell.data?.type === 'tm.ExternalEntity'
    ));
    if (sourceProcesses.length === 0) {
        result.errors.push('Source diagram must contain at least one node');
        return result;
    }

    if (config.mergeMode === 'all') {
        const offset = calculateDiagramOffset(targetDiagram, sourceDiagram);
        let firstImportedNode = null;
        const importedNodeMap = new Map();

        sourceProcesses.forEach((sourceProcess) => {
            const originalId = sourceProcess.id || sourceProcess.data?.id;
            const importedNode = cloneCell(sourceProcess);
            const sourceX = sourceProcess.position?.x ?? 0;
            const sourceY = sourceProcess.position?.y ?? 0;
            importedNode.position = {
                x: sourceX + offset.x,
                y: sourceY + offset.y
            };
            const sourceThreats = getThreatArray(sourceProcess);
            importedNode.data = {
                ...(importedNode.data || {}),
                id: importedNode.id,
                name: importedNode.data?.name || importedNode.id,
                type: importedNode.data?.type || 'tm.Process',
                threats: sourceThreats,
                hasOpenThreats: hasOpenThreats(sourceThreats)
            };

            if (originalId) {
                importedNodeMap.set(originalId, importedNode.id);
            }

            // Normalize threat storage so UI and store modules can find them
            if (importedNode.data) {
                importedNode.data.threats = Array.isArray(importedNode.data.threats)
                    ? importedNode.data.threats
                    : Array.isArray(importedNode.threats)
                        ? importedNode.threats
                        : [];
                importedNode.threats = importedNode.data.threats;
                importedNode.data.hasOpenThreats = hasOpenThreats(importedNode.data.threats);
            }

            targetDiagram.cells.push(importedNode);
            if (!firstImportedNode) {
                firstImportedNode = importedNode;
            }
            result.importedCount += 1;
        });

        (sourceDiagram.cells || [])
            .filter((cell) => cell && cell.data?.type === 'tm.Flow')
            .forEach((flow) => {
                const importedFlow = cloneSourceFlow(flow, importedNodeMap);
                if (importedFlow) {
                    targetDiagram.cells.push(importedFlow);
                }
            });

        if (selectedTargetProcess && firstImportedNode) {
            const flowId = generateMergeProcessId();
            const linkEdge = {
                id: flowId,
                shape: 'flow',
                data: {
                    id: flowId,
                    type: 'tm.Flow',
                    name: `${firstImportedNode.data?.name || ''} → ${selectedTargetProcess.data?.name || ''}`,
                    method: '',
                    path: '',
                    description: '',
                    protocol: '',
                    threats: [],
                    sourceId: firstImportedNode.id,
                    targetId: selectedTargetProcess.id
                },
                source: { cell: firstImportedNode.id },
                target: { cell: selectedTargetProcess.id },
                attrs: {
                    line: {
                        stroke: '#333333',
                        strokeWidth: 2,
                        targetMarker: {
                            name: 'block',
                            width: 12,
                            height: 8
                        }
                    }
                }
            };
            targetDiagram.cells.push(linkEdge);
            result.linkCreated = true;
        }

        return result;
    }

    const selectedSourceProcess = sourceProcesses.find((cell) => cell.id === config.sourceProcessId || (cell.data && cell.data.id === config.sourceProcessId));
    if (!selectedSourceProcess) {
        result.errors.push('Source process not found');
        return result;
    }

    if (!selectedTargetProcess) {
        result.errors.push('Target process not found');
        return result;
    }

    const importedNode = cloneCell(selectedSourceProcess);
    const offset = calculateDiagramOffset(targetDiagram, sourceDiagram);
    const sourceX = selectedSourceProcess.position?.x ?? 220;
    const sourceY = selectedSourceProcess.position?.y ?? 40;
    importedNode.position = {
        x: sourceX + offset.x,
        y: sourceY + offset.y
    };
    const sourceThreats = getThreatArray(selectedSourceProcess);
    importedNode.data = {
        ...(importedNode.data || {}),
        id: importedNode.id,
        name: importedNode.data?.name || importedNode.id,
        type: importedNode.data?.type || 'tm.Process',
        threats: sourceThreats,
        hasOpenThreats: hasOpenThreats(sourceThreats)
    };

    // Normalize threat storage so UI and store modules can find them
    if (importedNode.data) {
        importedNode.data.threats = Array.isArray(importedNode.data.threats)
            ? importedNode.data.threats
            : Array.isArray(importedNode.threats)
                ? importedNode.threats
                : [];
        importedNode.threats = importedNode.data.threats;
        importedNode.data.hasOpenThreats = hasOpenThreats(importedNode.data.threats);
    }

    targetDiagram.cells.push(importedNode);
    result.importedCount += 1;

    const importedNodeMap = new Map();
    const sourceId = selectedSourceProcess.id || selectedSourceProcess.data?.id;
    if (sourceId) {
        importedNodeMap.set(sourceId, importedNode.id);
    }

    (sourceDiagram.cells || [])
        .filter((cell) => cell && cell.data?.type === 'tm.Flow')
        .forEach((flow) => {
            const importedFlow = cloneSourceFlow(flow, importedNodeMap);
            if (importedFlow) {
                targetDiagram.cells.push(importedFlow);
            }
        });

    const flowId = generateMergeProcessId();
    const linkEdge = {
        id: flowId,
        shape: 'flow',
        data: {
            id: flowId,
            type: 'tm.Flow',
            name: `${importedNode.data?.name || ''} → ${selectedTargetProcess.data?.name || ''}`,
            method: '',
            path: '',
            description: '',
            protocol: '',
            threats: [],
            sourceId: importedNode.id,
            targetId: selectedTargetProcess.id
        },
        source: { cell: importedNode.id },
        target: { cell: selectedTargetProcess.id },
        attrs: {
            line: {
                stroke: '#333333',
                strokeWidth: 2,
                targetMarker: {
                    name: 'block',
                    width: 12,
                    height: 8
                }
            }
        }
    };

    targetDiagram.cells.push(linkEdge);
    result.linkCreated = true;

    return result;
};
