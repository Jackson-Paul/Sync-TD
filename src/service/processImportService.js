/**
 * Service for importing process nodes into a diagram
 * Processes are added as tm.Process elements arranged horizontally
 */

/**
 * Generate a unique ID for a process
 * @returns {string} - Generated ID
 */
const generateProcessId = () => {
    return `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate positions for processes in horizontal flow
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {number} count - Number of processes
 * @param {number} spacing - Space between processes (default 200)
 * @returns {array} - Array of {x, y} positions
 */
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

/**
 * Create a process cell for the diagram
 * @param {string} id - Process ID
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {object} processData - Process data {name, endpoint, parameter, description}
 * @returns {object} - Cell object compatible with diagram
 */
const createProcessCell = (id, x, y, processData) => {
    return {
        id: id,
        shape: 'process',
        position: {
            x: x,
            y: y
        },
        size: {
            width: 100,
            height: 100
        },
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
                {
                    group: 'top',
                    id: `port-${id}-top`
                },
                {
                    group: 'right',
                    id: `port-${id}-right`
                },
                {
                    group: 'bottom',
                    id: `port-${id}-bottom`
                },
                {
                    group: 'left',
                    id: `port-${id}-left`
                }
            ]
        },
        data: {
            id: id,
            name: processData.name || 'Process',
            type: 'tm.Process',
            description: processData.description || '',
            url: processData.url || '',
            parameters: processData.parameters || '',
            method : processData.method || '',
            threats: [],
            hasOpenThreats: false,
            outOfScope: false,
            reasonOutOfScope: '',
            isTrustBoundary: false
        }
    };
};

/**
 * Import processes into a diagram
 * Creates process nodes and arranges them horizontally
 * @param {object} diagram - The diagram to import into
 * @param {object} importData - The parsed import JSON {version, processes}
 * @returns {object} - {matched: [], errors: []}
 */
export const importProcesses = (diagram, importData) => {
    const result = {
        matched: [],
        errors: []
    };

    if (!importData.processes || !Array.isArray(importData.processes)) {
        result.errors.push('No processes found in import data');
        return result;
    }

    if (!diagram.cells) {
        diagram.cells = [];
    }

    try {
        // Calculate positions for new processes (starting from right of existing cells)
        let maxX = 100;
        diagram.cells.forEach(cell => {
            let cellX = cell.x !== undefined ? cell.x : (cell.position ? cell.position.x : 0);
            let cellWidth = cell.width || (cell.size ? cell.size.width : 100);
            if (cellX) {
                maxX = Math.max(maxX, cellX + cellWidth + 50);
            }
        });

        const positions = calculateHorizontalPositions(maxX, 200, importData.processes.length, 200);

        // Create process cells
        importData.processes.forEach((processData, index) => {
            try {
                // Validate process data
                if (!processData.name || !processData.url || !processData.parameters) {
                    result.errors.push(
                        `Process ${index}: Missing required fields (name, endpoint, parameter)`
                    );
                    return;
                }

                const processId = generateProcessId();
                const position = positions[index];

                // Create cell
                const cell = createProcessCell(
                    processId,
                    position.x,
                    position.y,
                    processData
                );

                // Add to diagram
                diagram.cells.push(cell);

                result.matched.push({
                    name: processData.name,
                    endpoint: processData.endpoint,
                    position: { x: position.x, y: position.y }
                });
            } catch (error) {
                result.errors.push(`Process ${index}: ${error.message}`);
            }
        });

        if (result.matched.length === 0 && result.errors.length > 0) {
            // If nothing matched, this is a full failure
            return result;
        }

        if (result.errors.length > 0) {
            // Partial success with some errors
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
        processes: [
            {
                name: 'User Service',
                url: '/api/users',
                method: 'GET',
                parameters: 'userid, region',
                description: 'Handles user management'
            },
            {
                name: 'Auth Service',
                url: '/api/auth',
                method: 'POST',
                parameters: 'csrf token, id_key',
                description: 'Handles authentication'
            },
            {
                name: 'Database',
                url: 'db.example.com',
                method: '',
                parameters: 'Connection Pool',
                description: 'PostgreSQL Database'
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
