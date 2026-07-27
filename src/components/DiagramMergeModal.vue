<template>
  <b-modal id="diagram-merge-modal" ref="diagramMergeModal" title="Merge another DFD into this one" size="lg" @hide="resetModal">
    <b-form>
      <b-form-group label="Source diagram JSON" label-for="merge-json-input">
        <b-form-textarea
          id="merge-json-input"
          v-model="jsonInput"
          :rows="10"
          placeholder="Paste a diagram JSON export or exported process JSON"
          @input="onJsonInput"
        ></b-form-textarea>
      </b-form-group>

      <b-alert v-if="validationErrors.length > 0" variant="danger" show class="mt-3">
        <ul class="mb-0">
          <li v-for="(error, index) in validationErrors" :key="index">{{ error }}</li>
        </ul>
      </b-alert>
    </b-form>

    <template slot="modal-footer">
      <b-button type="button" variant="secondary" @click="hideModal">Cancel</b-button>
      <b-button type="button" variant="primary" @click="mergeDiagrams" :disabled="!canMerge">Merge</b-button>
    </template>
  </b-modal>
</template>

<script>
export default {
    name: 'TdDiagramMergeModal',
    data() {
        return {
            jsonInput: '',
            validationErrors: [],
            sourceDiagram: null,
            targetDiagram: null
        };
    },
    computed: {
        canMerge() {
            return !!this.sourceDiagram;
        }
    },
    methods: {
        showModal(targetDiagram) {
            this.targetDiagram = targetDiagram;
            this.$refs.diagramMergeModal.show();
        },
        hideModal() {
            this.$refs.diagramMergeModal.hide();
        },
        resetModal() {
            this.jsonInput = '';
            this.sourceDiagram = null;
            this.validationErrors = [];
        },
        onJsonInput() {
            if (!this.jsonInput || this.jsonInput.trim().length === 0) {
                this.sourceDiagram = null;
                return;
            }
            this.parseSourceDiagram();
        },
        getProcessOptions(diagram) {
            if (!diagram || !Array.isArray(diagram.cells)) {
                return [];
            }
            return diagram.cells
                .filter((cell) => cell && cell.data && (
                    cell.shape === 'process' ||
                    cell.shape === 'actor' ||
                    cell.shape === 'store' ||
                    cell.data.type === 'tm.Process' ||
                    cell.data.type === 'tm.Actor' ||
                    cell.data.type === 'tm.Store' ||
                    cell.data.type === 'tm.DataStore' ||
                    cell.data.type === 'tm.ExternalEntity'
                ))
                .map((cell) => ({ value: cell.id, text: cell.data.name || cell.id }));
        },
        assignSourceDiagramPositions(diagram) {
            if (!diagram || !Array.isArray(diagram.cells)) {
                return;
            }

            const processCells = diagram.cells.filter((cell) => cell && (
                cell.shape === 'process' ||
                cell.shape === 'actor' ||
                cell.shape === 'store' ||
                cell.data?.type === 'tm.Process' ||
                cell.data?.type === 'tm.Actor' ||
                cell.data?.type === 'tm.Store' ||
                cell.data?.type === 'tm.DataStore' ||
                cell.data?.type === 'tm.ExternalEntity'
            ));
            const alreadyPositions = processCells.some((cell) => cell.position && (cell.position.x !== 0 || cell.position.y !== 0));
            if (alreadyPositions) {
                return;
            }

            const flowCells = diagram.cells.filter((cell) => cell && cell.data?.type === 'tm.Flow');
            const nodeIds = processCells.map((cell) => cell.id || cell.data?.id).filter(Boolean);
            const incoming = {};
            const adjacency = {};

            nodeIds.forEach((id) => {
                incoming[id] = 0;
                adjacency[id] = [];
            });

            flowCells.forEach((flow) => {
                const sourceId = flow.source?.cell || flow.data?.sourceId || flow.data?.source?.cell;
                const targetId = flow.target?.cell || flow.data?.targetId || flow.data?.target?.cell;
                if (sourceId && targetId && nodeIds.includes(sourceId) && nodeIds.includes(targetId)) {
                    adjacency[sourceId].push(targetId);
                    incoming[targetId] = (incoming[targetId] || 0) + 1;
                }
            });

            const roots = nodeIds.filter((id) => incoming[id] === 0);
            const levelMap = {};
            const queue = roots.length ? [...roots] : [...nodeIds];
            queue.forEach((id) => {
                if (levelMap[id] === undefined) {
                    levelMap[id] = 0;
                }
            });

            while (queue.length > 0) {
                const id = queue.shift();
                const nextLevel = (levelMap[id] || 0) + 1;
                adjacency[id].forEach((child) => {
                    if (levelMap[child] === undefined || nextLevel > levelMap[child]) {
                        levelMap[child] = nextLevel;
                    }
                    if (!queue.includes(child)) {
                        queue.push(child);
                    }
                });
            }

            const levels = {};
            nodeIds.forEach((id) => {
                const level = levelMap[id] || 0;
                if (!levels[level]) {
                    levels[level] = [];
                }
                levels[level].push(id);
            });

            const xSpacing = 220;
            const ySpacing = 120;
            Object.keys(levels)
                .sort((a, b) => Number(a) - Number(b))
                .forEach((level) => {
                    levels[level].forEach((id, index) => {
                        const cell = diagram.cells.find((cellItem) => cellItem && (cellItem.id === id || cellItem.data?.id === id));
                        if (cell) {
                            cell.position = {
                                x: Number(level) * xSpacing,
                                y: index * ySpacing
                            };
                        }
                    });
                });
        },
        parseSourceDiagram() {
            this.validationErrors = [];
            try {
                this.sourceDiagram = JSON.parse(this.jsonInput);
            } catch (error) {
                this.validationErrors.push(`Invalid JSON: ${error.message}`);
                this.sourceDiagram = null;
                return false;
            }

            if (this.sourceDiagram && Array.isArray(this.sourceDiagram.processes)) {
                const sourceCells = this.sourceDiagram.processes
                    .filter((process) => process && process.id)
                    .map((process) => {
                        const type = process.type || 'tm.Process';
                        const shape = type === 'tm.Actor'
                            ? 'actor'
                            : type === 'tm.Store' || type === 'tm.DataStore'
                                ? 'store'
                                : 'process';
                        return {
                            id: process.id,
                            shape,
                            position: process.position || { x: 0, y: 0 },
                            size: process.size || { width: 100, height: 100 },
                            attrs: {
                                text: {
                                    text: process.name || process.id
                                },
                                body: {
                                    stroke: '#333333',
                                    strokeWidth: 1,
                                    fill: 'transparent'
                                }
                            },
                            data: {
                                ...process,
                                id: process.id,
                                type: process.type || 'tm.Process',
                                name: process.name || process.id,
                                description: process.description || '',
                                url: process.url || '',
                                method: process.method || '',
                                parameters: process.parameters || '',
                                threats: Array.isArray(process.threats)
                                    ? process.threats
                                    : Array.isArray(process.data && process.data.threats)
                                        ? process.data.threats
                                        : [],
                                hasOpenThreats: (Array.isArray(process.threats) && process.threats.some((threat) => threat && threat.status && threat.status.toLowerCase() === 'open')) ||
                                    (Array.isArray(process.data && process.data.threats) && process.data.threats.some((threat) => threat && threat.status && threat.status.toLowerCase() === 'open')) ||
                                    false,
                                outOfScope: process.outOfScope || false,
                                reasonOutOfScope: process.reasonOutOfScope || ''
                            }
                        };
                    });

                const flowCells = Array.isArray(this.sourceDiagram.flows)
                    ? this.sourceDiagram.flows
                        .filter((flow) => flow && (flow.id || flow.sourceId || (flow.source && flow.source.cell)) && (flow.targetId || (flow.target && flow.target.cell)))
                        .map((flow) => {
                            const sourceId = flow.sourceId || (flow.source && flow.source.cell) || '';
                            const targetId = flow.targetId || (flow.target && flow.target.cell) || '';
                            const flowId = flow.id || `${sourceId}-${targetId}`;

                            return {
                                id: flowId,
                                shape: 'flow',
                                data: {
                                    ...flow,
                                    id: flowId,
                                    type: flow.type || 'tm.Flow',
                                    name: flow.name || '',
                                    method: flow.method || '',
                                    path: flow.path || flow.url || '',
                                    description: flow.description || '',
                                    protocol: flow.protocol || '',
                                    sourceId,
                                    targetId,
                                    threats: Array.isArray(flow.threats) ? flow.threats : []
                                },
                                source: { cell: sourceId },
                                target: { cell: targetId },
                                attrs: flow.attrs || {
                                    line: {
                                        stroke: '#333333',
                                        strokeWidth: 2,
                                        targetMarker: {
                                            name: 'block',
                                            width: 12,
                                            height: 8
                                        }
                                    },
                                    label: {
                                        text: flow.name || ''
                                    }
                                },
                                labels: flow.name ? [{ attrs: { label: { text: flow.name } } }] : []
                            };
                        })
                    : [];

                this.sourceDiagram = {
                    ...this.sourceDiagram,
                    cells: [...sourceCells, ...flowCells]
                };
                this.assignSourceDiagramPositions(this.sourceDiagram);
            }

            const nodes = Array.isArray(this.sourceDiagram.cells)
                ? this.sourceDiagram.cells.filter((cell) => cell && (
                    cell.shape === 'process' ||
                    cell.shape === 'actor' ||
                    cell.shape === 'store' ||
                    cell.data?.type === 'tm.Process' ||
                    cell.data?.type === 'tm.Actor' ||
                    cell.data?.type === 'tm.Store'
                ))
                : [];

            if (nodes.length === 0) {
                this.validationErrors.push('The source diagram must contain at least one process node.');
                this.sourceDiagram = null;
                return false;
            }

            return true;
        },
        mergeDiagrams() {
            if (!this.parseSourceDiagram()) {
                return;
            }

            if (!this.targetDiagram || !this.targetDiagram.cells) {
                this.validationErrors.push('The current diagram is not available for merge.');
                return;
            }

            this.$emit('merge-diagrams', {
                sourceDiagram: this.sourceDiagram,
                mergeMode: 'all'
            });
            this.hideModal();
        }
    }
};
</script>
