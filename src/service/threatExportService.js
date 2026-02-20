/**
 * Service for exporting process/node and flow data from a diagram
 * Exports data in a format compatible with threat import
 */

/**
 * Extract process nodes from diagram
 * Returns array of {id, name, description, type}
 * @param {object} diagram - The diagram containing cells
 * @returns {array} - Array of process objects
 */
export const extractProcesses = (diagram) => {
    if (!diagram || !diagram.cells) return [];
    
    return diagram.cells
        .filter(cell => {
            // Include Actor, Process, Data Store, and External Entity types
            return cell.data && 
                   (cell.data.type === 'tm.Actor' || 
                    cell.data.type === 'tm.Process' || 
                    cell.data.type === 'tm.DataStore' ||
                    cell.data.type === 'tm.ExternalEntity');
        })
        .map(cell => ({
            id: cell.id || '',
            name: cell.data.name || '',
            description: cell.data.description || '',
            type: cell.data.type || '',
            threats: Array.isArray(cell.data.threats) ? cell.data.threats.length : 0
        }));
};

/**
 * Extract flows from diagram
 * Returns array of {id, method, path, description, type}
 * @param {object} diagram - The diagram containing cells
 * @returns {array} - Array of flow objects
 */
export const extractFlows = (diagram) => {
    if (!diagram || !diagram.cells) return [];
    
    return diagram.cells
        .filter(cell => {
            return cell.data && cell.data.type === 'tm.Flow';
        })
        .map(cell => ({
            id: cell.id || '',
            method: cell.data.method || '',
            path: cell.data.url || '',
            description: cell.data.description || '',
            protocol: cell.data.protocol || '',
            threats: Array.isArray(cell.data.threats) ? cell.data.threats.length : 0
        }));
};

/**
 * Generate export data in JSON format
 * @param {object} diagram - The diagram to export from
 * @param {string} includeType - 'all', 'processes', or 'flows'
 * @returns {object} - Export data object
 */
export const generateExportData = (diagram, includeType = 'all') => {
    const processes = includeType === 'flows' ? [] : extractProcesses(diagram);
    const flows = includeType === 'processes' ? [] : extractFlows(diagram);
    
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
