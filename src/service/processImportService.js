/**
 * Service for importing process nodes and their flows into a diagram.
 * If coordinates are included, they are preserved; otherwise a simple horizontal layout is used.
 */

const generateProcessId = () => {
    return `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateEntityId = (prefix = 'entity') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateFlowId = () => {
    return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateHorizontalPositions = (startX = 100, startY = 200, count, spacing = 200) => {
    const positions = [];
    for (let i = 0; i < count; i++) {
        positions.push({
            x: startX + (i * spacing),
            y: startY
        });
    }
    return positions;
};

const normalizePosition = (position, fallbackX, fallbackY) => {
    const numericValue = (value, defaultValue) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : defaultValue;
    };

    return {
        x: numericValue(position && position.x, fallbackX),
        y: numericValue(position && position.y, fallbackY)
    };
};

const normalizeVertices = (vertices) => {
    if (!Array.isArray(vertices)) {
        return [];
    }

    return vertices
        .filter((vertex) => vertex && Number.isFinite(Number(vertex.x)) && Number.isFinite(Number(vertex.y)))
        .map((vertex) => ({
            x: Number(vertex.x),
            y: Number(vertex.y)
        }));
};

const resolveProcessLookupValue = (value) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    return String(value).trim();
};

const createProcessCell = (id, x, y, processData) => {
    const position = normalizePosition(processData && processData.position, x, y);
    const size = processData && processData.size && typeof processData.size === 'object'
        ? {
            width: Number(processData.size.width) || 100,
            height: Number(processData.size.height) || 100
        }
        : { width: 100, height: 100 };

    return {
        id: id,
        shape: 'process',
        position: {
            x: position.x,
            y: position.y
        },
        size,
        visible: true,
        zIndex: 10,
        attrs: {
            text: {
                text: processData.name || 'Process'
            },
            body: {
                stroke: '#333333',
                strokeWidth: 1,
                strokeDasharray: null
            }
        },
        ports: {
            groups: {
                top: {
                    position: 'top',
                    attrs: {
                        circle: {
                            r: 4,
                            magnet: true,
                            stroke: '#5F95FF',
                            strokeWidth: 1,
                            fill: '#fff',
                            style: {
                                visibility: 'hidden'
                            }
                        }
                    }
                },
                right: {
                    position: 'right',
                    attrs: {
                        circle: {
                            r: 4,
                            magnet: true,
                            stroke: '#5F95FF',
                            strokeWidth: 1,
                            fill: '#fff',
                            style: {
                                visibility: 'hidden'
                            }
                        }
                    }
                },
                bottom: {
                    position: 'bottom',
                    attrs: {
                        circle: {
                            r: 4,
                            magnet: true,
                            stroke: '#5F95FF',
                            strokeWidth: 1,
                            fill: '#fff',
                            style: {
                                visibility: 'hidden'
                            }
                        }
                    }
                },
                left: {
                    position: 'left',
                    attrs: {
                        circle: {
                            r: 4,
                            magnet: true,
                            stroke: '#5F95FF',
                            strokeWidth: 1,
                            fill: '#fff',
                            style: {
                                visibility: 'hidden'
                            }
                        }
                    }
                }
            },
            items: [
                { group: 'top', id: `port-${id}-top` },
                { group: 'right', id: `port-${id}-right` },
                { group: 'bottom', id: `port-${id}-bottom` },
                { group: 'left', id: `port-${id}-left` }
            ]
        },
        data: {
            id: id,
            name: processData.name || 'Process',
            type: 'tm.Process',
            description: processData.description || '',
            url: processData.url || '',
            parameters: processData.parameters || '',
            method: processData.method || '',
            threats: [],
            hasOpenThreats: false,
            outOfScope: !!(processData && processData.outOfScope),
            reasonOutOfScope: processData && processData.reasonOutOfScope ? processData.reasonOutOfScope : '',
            isTrustBoundary: false
        }
    };
};

const createActorCell = (id, x, y, actorData) => {
    const position = normalizePosition(actorData && actorData.position, x, y);
    const size = actorData && actorData.size && typeof actorData.size === 'object'
        ? {
            width: Number(actorData.size.width) || 150,
            height: Number(actorData.size.height) || 80
        }
        : { width: 150, height: 80 };

    return {
        id,
        shape: 'actor',
        position,
        size,
        visible: true,
        zIndex: 10,
        attrs: {
            text: {
                text: actorData.name || 'Actor'
            },
            body: {
                stroke: '#333333',
                strokeWidth: 1,
                strokeDasharray: null
            }
        },
        ports: {
            groups: {
                top: { position: 'top', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff', style: { visibility: 'hidden' } } } },
                right: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff', style: { visibility: 'hidden' } } } },
                bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff', style: { visibility: 'hidden' } } } },
                left: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff', style: { visibility: 'hidden' } } } }
            },
            items: [
                { group: 'top', id: `port-${id}-top` },
                { group: 'right', id: `port-${id}-right` },
                { group: 'bottom', id: `port-${id}-bottom` },
                { group: 'left', id: `port-${id}-left` }
            ]
        },
        data: {
            id,
            name: actorData.name || 'Actor',
            type: 'tm.Actor',
            description: actorData.description || '',
            outOfScope: !!(actorData && actorData.outOfScope),
            reasonOutOfScope: actorData && actorData.reasonOutOfScope ? actorData.reasonOutOfScope : '',
            hasOpenThreats: false,
            providesAuthentication: !!(actorData && actorData.providesAuthentication),
            threats: [],
            isTrustBoundary: false
        }
    };
};

const createStoreCell = (id, x, y, storeData) => {
    const position = normalizePosition(storeData && storeData.position, x, y);
    const size = storeData && storeData.size && typeof storeData.size === 'object'
        ? {
            width: Number(storeData.size.width) || 150,
            height: Number(storeData.size.height) || 80
        }
        : { width: 150, height: 80 };

    return {
        id,
        shape: 'store',
        position,
        size,
        visible: true,
        zIndex: 10,
        attrs: {
            text: {
                text: storeData.name || 'Store'
            },
            topLine: {
                stroke: '#333333',
                strokeWidth: 1.5,
                strokeDasharray: null
            },
            bottomLine: {
                stroke: '#333333',
                strokeWidth: 1.5,
                strokeDasharray: null
            }
        },
        ports: {
            groups: {
                top: { position: 'top', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff', style: { visibility: 'hidden' } } } },
                right: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff', style: { visibility: 'hidden' } } } },
                bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff', style: { visibility: 'hidden' } } } },
                left: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff', style: { visibility: 'hidden' } } } }
            },
            items: [
                { group: 'top', id: `port-${id}-top` },
                { group: 'right', id: `port-${id}-right` },
                { group: 'bottom', id: `port-${id}-bottom` },
                { group: 'left', id: `port-${id}-left` }
            ]
        },
        data: {
            id,
            name: storeData.name || 'Store',
            type: 'tm.Store',
            description: storeData.description || '',
            outOfScope: !!(storeData && storeData.outOfScope),
            reasonOutOfScope: storeData && storeData.reasonOutOfScope ? storeData.reasonOutOfScope : '',
            hasOpenThreats: false,
            isALog: !!(storeData && storeData.isALog),
            isEncrypted: !!(storeData && storeData.isEncrypted),
            isSigned: !!(storeData && storeData.isSigned),
            storesCredentials: !!(storeData && storeData.storesCredentials),
            storesInventory: !!(storeData && storeData.storesInventory),
            threats: [],
            isTrustBoundary: false
        }
    };
};

const createTrustBoundaryBoxCell = (id, x, y, boundaryData) => {
    const position = normalizePosition(boundaryData && boundaryData.position, x, y);
    const size = boundaryData && boundaryData.size && typeof boundaryData.size === 'object'
        ? {
            width: Number(boundaryData.size.width) || 500,
            height: Number(boundaryData.size.height) || 400
        }
        : { width: 500, height: 400 };

    return {
        id,
        shape: 'trust-boundary-box',
        position,
        size,
        visible: true,
        zIndex: -50,
        attrs: {
            label: {
                text: boundaryData.name || 'Trust Boundary'
            },
            body: {
                stroke: '#333333',
                strokeWidth: 3,
                strokeDasharray: '10 5',
                fill: 'transparent',
                fillOpacity: 0,
                rx: 10,
                ry: 10
            }
        },
        data: {
            id,
            name: boundaryData.name || 'Trust Boundary',
            type: 'tm.BoundaryBox',
            description: boundaryData.description || '',
            isTrustBoundary: true,
            outOfScope: !!(boundaryData && boundaryData.outOfScope),
            reasonOutOfScope: boundaryData && boundaryData.reasonOutOfScope ? boundaryData.reasonOutOfScope : '',
            hasOpenThreats: false,
            threats: []
        }
    };
};

const createBoundaryCell = (sourceCellId, targetCellId, boundaryData) => {
    const boundaryId = resolveProcessLookupValue(boundaryData && boundaryData.id) || generateEntityId('boundary');
    return {
        id: boundaryId,
        shape: 'trust-boundary-curve',
        source: { cell: sourceCellId },
        target: { cell: targetCellId },
        vertices: normalizeVertices(boundaryData && boundaryData.vertices),
        connector: 'smooth',
        zIndex: 10,
        attrs: {
            line: {
                stroke: '#333333',
                strokeWidth: 3,
                strokeDasharray: '10 5',
                sourceMarker: null,
                targetMarker: null
            }
        },
        labels: [],
        data: {
            id: boundaryId,
            type: 'tm.Boundary',
            name: boundaryData && boundaryData.name ? boundaryData.name : 'Trust Boundary',
            description: boundaryData && boundaryData.description ? boundaryData.description : '',
            sourceId: sourceCellId,
            targetId: targetCellId,
            isTrustBoundary: true,
            threats: []
        }
    };
};

const createFlowCell = (sourceCellId, targetCellId, flowData) => {
    const flowId = resolveProcessLookupValue(flowData && flowData.id) || generateFlowId();
    const name = flowData && flowData.name ? flowData.name : (flowData && flowData.description ? flowData.description : 'Flow');
    const path = flowData && (flowData.path || flowData.url || '');
    const description = flowData && flowData.description ? flowData.description : '';
    return {
        id: flowId,
        shape: 'flow',
        source: { cell: sourceCellId },
        target: { cell: targetCellId },
        vertices: normalizeVertices(flowData && flowData.vertices),
        connector: 'smooth',
        zIndex: 10,
        attrs: {
            line: {
                stroke: '#333333',
                strokeWidth: 1.5,
                sourceMarker: { name: '' },
                targetMarker: { name: 'block' },
                strokeDasharray: null
            }
        },
        labels: [],
        data: {
            id: flowId,
            type: 'tm.Flow',
            name,
            description,
            method: flowData && flowData.method ? flowData.method : '',
            url: path,
            path,
            protocol: flowData && flowData.protocol ? flowData.protocol : '',
            sourceId: sourceCellId,
            targetId: targetCellId,
            threats: Array.isArray(flowData && flowData.threats) ? flowData.threats : [],
            hasOpenThreats: false,
            outOfScope: false,
            reasonOutOfScope: '',
            isBidirectional: !!(flowData && flowData.isBidirectional),
            isEncrypted: !!(flowData && flowData.isEncrypted),
            isPublicNetwork: !!(flowData && flowData.isPublicNetwork)
        }
    };
};

const findMatchingProcessId = (lookupMap, values) => {
    const candidates = Array.isArray(values) ? values : [values];

    for (const value of candidates) {
        const rawValue = resolveProcessLookupValue(value);
        if (!rawValue) {
            continue;
        }

        if (lookupMap.has(rawValue)) {
            return lookupMap.get(rawValue);
        }

        const normalized = rawValue.toLowerCase();
        for (const [key, mappedId] of lookupMap.entries()) {
            if (String(key).toLowerCase() === normalized) {
                return mappedId;
            }
        }
    }

    return null;
};

export const importProcesses = (diagram, importData) => {
    const result = {
        matched: [],
        errors: [],
        processCount: 0,
        flowCount: 0,
        actorCount: 0,
        storeCount: 0,
        boundaryCount: 0
    };

    const processes = Array.isArray(importData && importData.processes) ? importData.processes : [];
    const actors = Array.isArray(importData && importData.actors) ? importData.actors : [];
    const stores = Array.isArray(importData && importData.stores) ? importData.stores : [];
    const trustBoundaries = Array.isArray(importData && importData.trustBoundaries) ? importData.trustBoundaries : [];
    const flows = Array.isArray(importData && importData.flows) ? importData.flows : [];
    const boundaries = Array.isArray(importData && importData.boundaries) ? importData.boundaries : [];

    if (processes.length === 0 && actors.length === 0 && stores.length === 0 && trustBoundaries.length === 0 && flows.length === 0 && boundaries.length === 0) {
        result.errors.push('No supported diagram entities or flows found in import data');
        return result;
    }

    if (!diagram.cells) {
        diagram.cells = [];
    }

    try {
        let maxX = 100;
        diagram.cells.forEach((cell) => {
            const cellX = cell.x !== undefined ? cell.x : (cell.position ? cell.position.x : 0);
            const cellWidth = cell.width || (cell.size ? cell.size.width : 100);
            if (cellX) {
                maxX = Math.max(maxX, cellX + cellWidth + 50);
            }
        });

        const positions = calculateHorizontalPositions(maxX, 200, Math.max(processes.length, 1), 200);
        const actorPositions = calculateHorizontalPositions(maxX + 120, 120, Math.max(actors.length, 1), 220);
        const storePositions = calculateHorizontalPositions(maxX + 200, 340, Math.max(stores.length, 1), 220);
        const trustBoundaryPositions = calculateHorizontalPositions(maxX + 80, 60, Math.max(trustBoundaries.length, 1), 260);
        const processLookup = new Map();

        const addImportedEntity = (entry, index, kind, maker, countKey, label, positionFallback) => {
            if (!entry || !entry.name) {
                result.errors.push(`${label} ${index}: Missing required field "name"`);
                return;
            }

            const externalId = resolveProcessLookupValue(entry.id) || `${kind}_${index}`;
            const position = normalizePosition(entry.position, positionFallback.x, positionFallback.y);
            const cellId = entry.id || generateEntityId(kind);
            const cell = maker(cellId, position.x, position.y, entry);
            cell.id = cellId;
            cell.data.id = cellId;

            diagram.cells.push(cell);
            processLookup.set(externalId, cell.id);
            if (entry.name) {
                processLookup.set(entry.name, cell.id);
            }

            result.matched.push({
                name: entry.name,
                type: label,
                position: { x: position.x, y: position.y }
            });
            result[countKey] += 1;
        };

        processes.forEach((processData, index) => {
            try {
                if (!processData || !processData.name || !processData.description) {
                    result.errors.push(`Process ${index}: Missing required fields (name, description)`);
                    return;
                }

                addImportedEntity(processData, index, 'process', createProcessCell, 'processCount', 'Process', positions[index] || { x: maxX, y: 200 });
            } catch (error) {
                result.errors.push(`Process ${index}: ${error.message}`);
            }
        });

        actors.forEach((actorData, index) => {
            try {
                if (!actorData || !actorData.name) {
                    result.errors.push(`Actor ${index}: Missing required field "name"`);
                    return;
                }

                addImportedEntity(actorData, index, 'actor', createActorCell, 'actorCount', 'Actor', actorPositions[index] || { x: maxX + 120, y: 120 });
            } catch (error) {
                result.errors.push(`Actor ${index}: ${error.message}`);
            }
        });

        stores.forEach((storeData, index) => {
            try {
                if (!storeData || !storeData.name) {
                    result.errors.push(`Store ${index}: Missing required field "name"`);
                    return;
                }

                addImportedEntity(storeData, index, 'store', createStoreCell, 'storeCount', 'Store', storePositions[index] || { x: maxX + 200, y: 340 });
            } catch (error) {
                result.errors.push(`Store ${index}: ${error.message}`);
            }
        });

        trustBoundaries.forEach((boundaryData, index) => {
            try {
                if (!boundaryData || !boundaryData.name) {
                    result.errors.push(`Trust Boundary ${index}: Missing required field "name"`);
                    return;
                }

                addImportedEntity(boundaryData, index, 'trust-boundary', createTrustBoundaryBoxCell, 'boundaryCount', 'Trust Boundary', trustBoundaryPositions[index] || { x: maxX + 80, y: 60 });
            } catch (error) {
                result.errors.push(`Trust Boundary ${index}: ${error.message}`);
            }
        });

        boundaries.forEach((boundaryData, index) => {
            try {
                if (!boundaryData) {
                    result.errors.push(`Boundary ${index}: Missing boundary data`);
                    return;
                }

                const sourceId = findMatchingProcessId(processLookup, [
                    boundaryData.sourceId,
                    boundaryData.source && boundaryData.source.cell,
                    boundaryData.from,
                    boundaryData.sourceName,
                    boundaryData.source && boundaryData.source.name,
                    boundaryData.source && boundaryData.sourceId,
                    boundaryData.source && boundaryData.source.id
                ]);
                const targetId = findMatchingProcessId(processLookup, [
                    boundaryData.targetId,
                    boundaryData.target && boundaryData.target.cell,
                    boundaryData.to,
                    boundaryData.targetName,
                    boundaryData.target && boundaryData.target.name,
                    boundaryData.target && boundaryData.targetId,
                    boundaryData.target && boundaryData.target.id
                ]);

                if (!sourceId || !targetId) {
                    result.errors.push(`Boundary ${index}: Could not match source and target cell IDs for '${boundaryData.name || 'unnamed boundary'}'`);
                    return;
                }

                const cell = createBoundaryCell(sourceId, targetId, boundaryData);
                diagram.cells.push(cell);

                result.matched.push({
                    name: cell.data.name,
                    type: 'Boundary',
                    sourceId,
                    targetId,
                    vertices: cell.vertices
                });
                result.boundaryCount += 1;
            } catch (error) {
                result.errors.push(`Boundary ${index}: ${error.message}`);
            }
        });

        flows.forEach((flowData, index) => {
            try {
                if (!flowData) {
                    result.errors.push(`Flow ${index}: Missing flow data`);
                    return;
                }

                const sourceId = findMatchingProcessId(processLookup, [
                    flowData.sourceId,
                    flowData.source && flowData.source.cell,
                    flowData.from,
                    flowData.sourceName,
                    flowData.source && flowData.source.name,
                    flowData.source && flowData.sourceId,
                    flowData.source && flowData.source.id
                ]);
                const targetId = findMatchingProcessId(processLookup, [
                    flowData.targetId,
                    flowData.target && flowData.target.cell,
                    flowData.to,
                    flowData.targetName,
                    flowData.target && flowData.target.name,
                    flowData.target && flowData.targetId,
                    flowData.target && flowData.target.id
                ]);

                if (!sourceId || !targetId) {
                    result.errors.push(`Flow ${index}: Could not match source and target process IDs for '${flowData.name || 'unnamed flow'}'`);
                    return;
                }

                const cell = createFlowCell(sourceId, targetId, flowData);
                diagram.cells.push(cell);

                result.matched.push({
                    name: cell.data.name,
                    type: 'Flow',
                    sourceId,
                    targetId,
                    vertices: cell.vertices
                });
                result.flowCount += 1;
            } catch (error) {
                result.errors.push(`Flow ${index}: ${error.message}`);
            }
        });

        if (result.matched.length === 0 && result.errors.length > 0) {
            return result;
        }

        if (result.errors.length > 0) {
            result.partialSuccess = true;
        }
    } catch (error) {
        result.errors.push(`Import failed: ${error.message}`);
    }

    return result;
};

/**
 * Generate a template for process import JSON
 * @returns {object} - Template object
 */
export const generateProcessImportTemplate = () => {
    return {
        version: '1.0',
        actors: [
            {
                id: 'actor-1',
                name: 'User',
                description: 'End user',
                position: { x: 40, y: 100 },
                size: { width: 140, height: 90 }
            }
        ],
        processes: [
            {
                id: 'proc-a',
                name: 'User Service',
                url: '/api/users',
                method: 'GET',
                parameters: 'userid, region',
                description: 'Handles user management',
                position: { x: 280, y: 140 },
                size: { width: 120, height: 120 }
            },
            {
                id: 'proc-b',
                name: 'Auth Service',
                url: '/api/auth',
                method: 'POST',
                parameters: 'csrf token, id_key',
                description: 'Handles authentication',
                position: { x: 540, y: 140 },
                size: { width: 120, height: 120 }
            }
        ],
        stores: [
            {
                id: 'store-1',
                name: 'Database',
                description: 'PostgreSQL Database',
                position: { x: 820, y: 160 },
                size: { width: 150, height: 80 }
            }
        ],
        trustBoundaries: [
            {
                id: 'tb-1',
                name: 'Public network',
                description: 'Public zone boundary',
                position: { x: 180, y: 40 },
                size: { width: 860, height: 360 },
                isTrustBoundary: true
            }
        ],
        boundaries: [
            {
                id: 'boundary-1',
                name: 'User request',
                sourceId: 'actor-1',
                targetId: 'proc-a',
                vertices: [
                    { x: 140, y: 150 },
                    { x: 220, y: 150 },
                    { x: 220, y: 210 }
                ]
            }
        ],
        flows: [
            {
                id: 'flow-1',
                name: 'POST /login',
                sourceId: 'proc-a',
                targetId: 'proc-b',
                method: 'POST',
                path: '/login',
                description: 'Login request',
                vertices: [{ x: 410, y: 200 }, { x: 500, y: 200 }]
            },
            {
                id: 'flow-2',
                name: 'Read user record',
                sourceId: 'proc-b',
                targetId: 'store-1',
                method: 'GET',
                path: '/users/{id}',
                description: 'User lookup',
                vertices: [{ x: 660, y: 200 }, { x: 820, y: 200 }]
            }
        ]
    };
};

export default {
    generateProcessId,
    calculateHorizontalPositions,
    createProcessCell,
    importProcesses,
    generateProcessImportTemplate
};
