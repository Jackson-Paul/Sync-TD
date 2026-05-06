/**
 * Normalize a URL path according to DFD engine rules:
 * - Replace numeric segments with {id}
 * - Collapse duplicate slashes
 * - Strip trailing slash except for root
 * @param {string} path - The URL path to normalize
 * @returns {string} - The normalized path
 */
export const normalizePath = (path) => {
    if (!path) return '';
    
    // Replace numeric segments with {id}
    let normalized = path.replace(/\/\d+(?=\/|$)/g, '/{id}');
    
    // Collapse duplicate slashes
    normalized = normalized.replace(/\/+/g, '/');
    
    // Strip trailing slash except for root
    if (normalized !== '/' && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }
    
    return normalized;
};

/**
 * Canonicalize a node name:
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove punctuation
 * @param {string} name - The node name to canonicalize
 * @returns {string} - The canonicalized name
 */
export const canonicalizeName = (name) => {
    if (!name) return '';
    
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
};

/**
 * Simple hash function for browser environment
 * Generates a deterministic hash from a string
 * @param {string} str - String to hash
 * @returns {string} - First 8 chars of hash
 */
const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
};

/**
 * Generate a deterministic threat ID from threat data
 * Uses: "threat|" + method + "|" + path + "|" + title
 * @param {string} method - The HTTP method (for flows)
 * @param {string} path - The path/url
 * @param {string} title - The threat title
 * @returns {string} - First 8 chars of hash
 */
export const generateThreatId = (method, path, title) => {
    const seed = `threat|${method || ''}|${path || ''}|${title || ''}`;
    return simpleHash(seed);
};

/**
 * Map severity category to Threat Dragon severity enum
 * @param {string} category - The import category
 * @returns {string} - One of: TBD, Low, Medium, High, Critical
 */
export const mapSeverity = (severity) => {
    if (!severity) return 'TBD';
    
    const lower = severity.toLowerCase();
    if (lower === 'critical' || lower === 'high') return 'High';
    if (lower === 'medium') return 'Medium';
    if (lower === 'low') return 'Low';
    
    return 'TBD';
};

/**
 * Find a matching flow in the diagram by method and normalized path
 * @param {object} diagram - The diagram containing cells
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - URL path
 * @returns {object|null} - The matching flow cell or null
 */
export const findMatchingFlow = (diagram, method, path) => {
    if (!diagram || !diagram.cells) return null;
    
    const normalizedPath = normalizePath(path);
    
    return diagram.cells.find(cell => {
        // Check if it's a flow (has method and url properties)
        if (!cell.data || cell.data.type !== 'tm.Flow') return false;
        
        const cellMethod = cell.data.method || '';
        const cellUrl = cell.data.url || '';
        const normalizedCellUrl = normalizePath(cellUrl);
        
        return cellMethod === method && normalizedCellUrl === normalizedPath;
    });
};

/**
 * Find a matching node in the diagram by canonicalized name
 * @param {object} diagram - The diagram containing cells
 * @param {string} nodeName - The node name to match
 * @returns {object|null} - The matching node cell or null
 */
export const findMatchingNode = (diagram, nodeName) => {
    if (!diagram || !diagram.cells || !nodeName) return null;
    
    const canonicalized = canonicalizeName(nodeName);
    
    return diagram.cells.find(cell => {
        if (!cell.data || !cell.data.name) return false;
        
        const cellName = canonicalizeName(cell.data.name);
        return cellName === canonicalized;
    });
};


/**
 * Find a matching node in the diagram by id
 * Supports both UUID format (e.g., "4e6a7c1e-2ac4-499a-9999-289e958c49ab") 
 * and process format (e.g., "process_1777377939314_v1bbam1i6")
 * Checks both cell.id and cell.data.id to handle all ID formats
 * @param {object} diagram - The diagram containing cells
 * @param {string} id - The node ID to match (UUID or process format)
 * @returns {object|null} - The matching node cell or null
 */
export const findMatchingNodebyID = (diagram, id) => {
    if (!diagram || !diagram.cells || !id) return null;
    
    // Try exact match first (case-sensitive) - check both cell.id and cell.data.id
    let found = diagram.cells.find(cell => 
        (cell.id === id) || (cell.data && cell.data.id === id)
    );
    if (found) return found;
    
    // Try case-insensitive match
    const lowerCaseId = id.toLowerCase();
    found = diagram.cells.find(cell => {
        const cellIdMatch = cell.id && cell.id.toLowerCase() === lowerCaseId;
        const cellDataIdMatch = cell.data && cell.data.id && cell.data.id.toLowerCase() === lowerCaseId;
        return cellIdMatch || cellDataIdMatch;
    });
    if (found) return found;
    
    // Try canonicalized match (removes special chars, normalizes spacing)
    const canonicalizedImportId = canonicalizeName(id);
    found = diagram.cells.find(cell => {
        // Check canonicalized cell.id
        const cellId = cell.id ? canonicalizeName(cell.id) : '';
        if (cellId === canonicalizedImportId) return true;
        
        // Check canonicalized cell.data.id
        if (cell.data && cell.data.id) {
            const cellDataId = canonicalizeName(cell.data.id);
            if (cellDataId === canonicalizedImportId) return true;
        }
        
        return false;
    });
    
    return found || null;
};



/**
 * Create a threat object compatible with Threat Dragon schema
 * @param {object} importedThreat - The threat from import JSON
 * @param {string} threatId - Generated threat ID
 * @param {string} modelType - The diagram model type (STRIDE, CIA, etc.)
 * @returns {object} - Threat object ready for insertion
 */
export const createThreatObject = (importedThreat, threatId, modelType) => {
    const { data } = importedThreat;
    
    return {
        id: threatId,
        title: data.title || '',
        description: data.description || '',
        severity: mapSeverity(data.severity),
        status: 'Open',
        type: data.category || 'Other',
        mitigation: data.mitigation || '',
        modelType: modelType || 'STRIDE',
        isai: true  // Mark as AI-imported
    };
};

/**
 * Get all available cell IDs in a diagram
 * @param {object} diagram - The diagram
 * @returns {array} - Array of all cell IDs
 */
export const getAvailableCellIds = (diagram) => {
    if (!diagram || !diagram.cells) return [];
    return diagram.cells
        .filter(cell => cell.data && cell.data.id)
        .map(cell => cell.data.id);
};

/**
 * Import threats into a diagram
 * Matches threats to flows/nodes and returns summary with matched/unmatched
 * @param {object} diagram - The diagram to import into
 * @param {object} importData - The parsed import JSON {version, threats}
 * @returns {object} - {matched: [], unmatched: [], errors: []}
 */
export const importThreats = (diagram, importData) => {
    const result = {
        matched: [],
        unmatched: [],
        errors: []
    };
    
    if (!importData.threats || !Array.isArray(importData.threats)) {
        result.errors.push('No threats found in import data');
        return result;
    }
    
    const modelType = diagram.diagramType || 'STRIDE';
    const availableIds = getAvailableCellIds(diagram);
    
    importData.threats.forEach((threat, index) => {
        try {
            const { data } = threat;
            
            if (!data) {
                result.unmatched.push({
                    title: data?.title || `Threat ${index}`,
                    reason: 'Invalid threat structure (missing data)'
                });
                return;
            }

            if (!data.id) {
                result.unmatched.push({
                    title: data.title || `Threat ${index}`,
                    reason: 'Threat missing required ID field'
                });
                return;
            }
            
            let targetCell = null;
            let targetType = '';

            targetCell = findMatchingNodebyID(diagram, data.id);
            if (!targetCell) {
                result.unmatched.push({
                    title: data.title,
                    reason: `No cell found matching ID: ${data.id}. Available IDs: ${availableIds.join(', ')}`
                });

                return;
            }

            // Validate cell structure
            if (!targetCell.data) {
                result.unmatched.push({
                    title: data.title,
                    reason: `Matched cell has no data property`
                });

                return;
            }
            
            // Generate threat ID
            const threatId = generateThreatId(
                data.category || '',
                data.id || '',
                data.title
            );
            
            // Create threat object
            const threatObj = createThreatObject(threat, threatId, modelType);
            
            // Initialize threats array if needed
            if (!targetCell.data.threats) {
                targetCell.data.threats = [];
            }
            
            // Check if threat already exists (by ID or content)
            const exists = targetCell.data.threats.some(t => t.id === threatId);
            if (!exists) {
                targetCell.data.threats.push(threatObj);
                targetCell.data.hasOpenThreats = true;
                
                result.matched.push({
                    title: data.title,
                    targetType,
                });
            } else {
                result.unmatched.push({
                    title: data.title,
                    reason: 'Threat with this ID already exists on target'
                });
            }
        } catch (error) {
            console.error(`Error importing threat ${index}:`, error);
            result.errors.push(`Error importing threat ${index}: ${error.message}`);
        }
    });

    return result;
};

export default {
    normalizePath,
    canonicalizeName,
    generateThreatId,
    mapSeverity,
    findMatchingFlow,
    findMatchingNode,
    findMatchingNodebyID,
    getAvailableCellIds,
    createThreatObject,
    importThreats
};
