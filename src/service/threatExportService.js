/**
 * Service for exporting process/node and flow data from a diagram
 * Exports data in a format compatible with threat import
 */

/**
 * Extract process nodes from diagram
 * Returns array of {id, name, description, type, url, method, parameters, threats}
 * @param {object} diagram - The diagram containing cells
 * @param {boolean} includeThreats - Whether to include full threat details (array) or just count
 * @returns {array} - Array of process objects
 */
export const extractProcesses = (diagram, includeThreats = false) => {
    if (!diagram || !diagram.cells) return [];
    
    return diagram.cells
        .filter(cell => {
            // Include Actor, Process, Store, Data Store, and External Entity types
            return cell.data && 
                   (cell.data.type === 'tm.Actor' || 
                    cell.data.type === 'tm.Process' || 
                    cell.data.type === 'tm.Store' ||
                    cell.data.type === 'tm.DataStore' ||
                    cell.data.type === 'tm.ExternalEntity');
        })
        .map(cell => {
            const process = {
                id: cell.id || '',
                name: cell.data.name || '',
                description: cell.data.description || '',
                type: cell.data.type || '',
                url: cell.data.url || '',
                method: cell.data.method || '',
                parameters: cell.data.parameters || '',
                domainName: cell.data.domainName || '',
                position: cell.position || cell.data.position || { x: 0, y: 0 },
                size: cell.size || cell.data.size || { width: 100, height: 100 }
            };
            
            if (includeThreats && Array.isArray(cell.data.threats)) {
                process.threats = cell.data.threats;
            } else {
                process.threats = Array.isArray(cell.data.threats) ? cell.data.threats.length : 0;
            }
            
            return process;
        });
};

/**
 * Extract flows from diagram
 * Returns array of {id, method, path, description, type, sourceId, targetId, threats}
 * @param {object} diagram - The diagram containing cells
 * @param {boolean} includeThreats - Whether to include full threat details (array) or just count
 * @returns {array} - Array of flow objects
 */
export const extractFlows = (diagram, includeThreats = false) => {
    if (!diagram || !diagram.cells) return [];
    
    return diagram.cells
        .filter(cell => {
            return cell.data && cell.data.type === 'tm.Flow';
        })
        .map(cell => {
            const flow = {
                id: cell.id || '',
                name: cell.data.name || '',
                method: cell.data.method || '',
                path: cell.data.url || cell.data.path || '',
                description: cell.data.description || '',
                protocol: cell.data.protocol || '',
                sourceId: cell.source?.cell || '',
                targetId: cell.target?.cell || ''
            };
            
            if (includeThreats && Array.isArray(cell.data.threats)) {
                flow.threats = cell.data.threats;
            } else {
                flow.threats = Array.isArray(cell.data.threats) ? cell.data.threats.length : 0;
            }
            
            return flow;
        });
};

/**
 * Generate export data in JSON format
 * @param {object} diagram - The diagram to export from
 * @param {string} includeType - 'all', 'processes', or 'flows'
 * @param {boolean} includeThreats - Whether to include full threat details (array) or just count
 * @returns {object} - Export data object
 */
export const generateExportData = (diagram, includeType = 'all', includeThreats = false) => {
    const processes = includeType === 'flows' ? [] : extractProcesses(diagram, includeThreats);
    const flows = includeType === 'processes' ? [] : extractFlows(diagram, includeThreats);
    
    return {
        version: '1.0',
        exportDate: new Date().toISOString(),
        diagramTitle: diagram.title || 'Untitled Diagram',
        diagramId: diagram.id || '',
        processes,
        flows,
        summary: {
            totalProcesses: processes.length,
            totalFlows: flows.length,
            totalItems: processes.length + flows.length
        }
    };
};

/**
 * Convert export data to formatted JSON string
 * @param {object} exportData - The export data object
 * @returns {string} - Formatted JSON string
 */
export const formatExportJson = (exportData) => {
    return JSON.stringify(exportData, null, 2);
};

/**
 * Copy text to clipboard (browser)
 * @param {string} text - Text to copy
 * @returns {Promise} - Promise that resolves when copy is complete
 */
export const copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return { success: true };
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return { success: true };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Download export data as JSON file
 * @param {object} exportData - The export data object
 * @param {string} filename - Output filename
 */
export const downloadExportJson = (exportData, filename = 'diagram-export.json') => {
    const jsonString = formatExportJson(exportData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export default {
    extractProcesses,
    extractFlows,
    generateExportData,
    formatExportJson,
    copyToClipboard,
    downloadExportJson
};
