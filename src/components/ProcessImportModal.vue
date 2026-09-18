<template>
    <b-modal
        id="process-import-modal"
        ref="processImportModal"
        :title="$t('threatmodel.importProcesses.title')"
        size="lg"
        @hide="resetModal"
    >
        <b-form>
            <!-- JSON Input -->
            <b-form-group
                id="json-group"
                :label="$t('threatmodel.importProcesses.pasteJson')"
                label-for="process-json-textarea"
            >
                <b-form-textarea
                    id="process-json-textarea"
                    v-model="jsonInput"
                    :rows="12"
                    :placeholder="jsonPlaceholder"
                    @input="clearErrors"
                ></b-form-textarea>
            </b-form-group>

            <!-- Validation Errors -->
            <b-alert
                v-if="validationErrors.length > 0"
                variant="danger"
                show
                class="mt-3"
            >
                <strong>{{ $t('threatmodel.importProcesses.validationErrors') }}:</strong>
                <ul class="mt-2 mb-0">
                    <li v-for="(error, idx) in validationErrors" :key="idx">
                        {{ error }}
                    </li>
                </ul>
            </b-alert>

            <!-- Success Message -->
            <b-alert
                v-if="importResult && importResult.matched.length > 0"
                variant="success"
                show
                class="mt-3"
            >
                <strong>{{ $t('threatmodel.importProcesses.matched') }}:</strong>
                <ul class="mt-2 mb-0">
                    <li v-for="(match, idx) in importResult.matched" :key="`match-${idx}`">
                        <strong>{{ match.name }}</strong> ({{ match.type }})
                    </li>
                </ul>
            </b-alert>

            <!-- Errors -->
            <b-alert
                v-if="importResult && importResult.errors.length > 0"
                variant="danger"
                show
                class="mt-3"
            >
                <strong>{{ $t('threatmodel.importProcesses.errors') }}:</strong>
                <ul class="mt-2 mb-0">
                    <li v-for="(error, idx) in importResult.errors" :key="`error-${idx}`">
                        {{ error }}
                    </li>
                </ul>
            </b-alert>

            <!-- Format Info -->
            <b-alert variant="info" show class="mt-3">
                <strong>{{ $t('threatmodel.importProcesses.formatInfo') }}</strong>
                <pre class="format-info">{{ jsonFormatExample }}</pre>
            </b-alert>
        </b-form>

        <template #modal-footer>
            <b-button variant="secondary" @click="hideModal">
                {{ $t('forms.cancel') }}
            </b-button>
            <b-button
                variant="info"
                @click="validateJson"
                :disabled="!jsonInput.trim()"
            >
                {{ $t('threatmodel.importProcesses.validate') }}
            </b-button>
            <b-button
                variant="primary"
                @click="importProcesses"
                :disabled="!isValidated || !importResult || importResult.matched.length === 0"
            >
                {{ $t('threatmodel.importProcesses.import') }}
            </b-button>
        </template>
    </b-modal>
</template>

<script>
export default {
    name: 'TdProcessImportModal',
    data() {
        return {
            jsonInput: '',
            validationErrors: [],
            isValidated: false,
            importResult: null,
            parsedData: null,
            jsonPlaceholder: '{"version": "1.0", "actors": [{"id": "actor-1", "name": "Customer", "description": "Customer"}], "processes": [{"id": "proc-a", "name": "Checkout", "description": "Checkout processing", "outOfScope": true, "reasonOutOfScope": "Legacy compatibility", "position": {"x": 260, "y": 140}}], "stores": [{"id": "store-1", "name": "Orders DB", "description": "Storage", "position": {"x": 620, "y": 180}}], "trustBoundaries": [{"id": "tb-1", "name": "Public network", "description": "Public zone", "position": {"x": 180, "y": 40}}], "boundaries": [{"id": "boundary-1", "sourceId": "actor-1", "targetId": "proc-a", "vertices": [{"x": 120, "y": 130}]}], "flows": [{"sourceId": "proc-a", "targetId": "store-1", "name": "Write order", "vertices": [{"x": 420, "y": 200}]}]}',
            jsonFormatExample: `{
  "version": "1.0",
  "actors": [
    {
      "id": "actor-1",
      "name": "Customer",
      "description": "End user",
      "outOfScope": false,
      "reasonOutOfScope": "",
      "position": { "x": 40, "y": 80 },
      "size": { "width": 140, "height": 80 }
    }
  ],
  "processes": [
    {
      "id": "proc-a",
      "name": "Checkout",
      "position": { "x": 260, "y": 140 },
      "size": { "width": 150, "height": 120 },
      "url": "/api/checkout",
      "parameters": "cart, payment",
      "method": "POST",
      "description": "Handles the checkout flow",
      "outOfScope": true,
      "reasonOutOfScope": "Legacy compatibility"
    }
  ],
  "stores": [
    {
      "id": "store-1",
      "name": "Orders DB",
      "position": { "x": 620, "y": 180 },
      "size": { "width": 150, "height": 80 },
      "description": "Stores order records",
      "outOfScope": false,
      "reasonOutOfScope": ""
    }
  ],
  "trustBoundaries": [
    {
      "id": "tb-1",
      "name": "Public network",
      "position": { "x": 180, "y": 40 },
      "size": { "width": 640, "height": 360 },
      "description": "Public trust boundary",
      "outOfScope": false,
      "reasonOutOfScope": ""
    }
  ],
  "boundaries": [
    {
      "id": "boundary-1",
      "sourceId": "actor-1",
      "targetId": "proc-a",
      "vertices": [
        { "x": 120, "y": 130 },
        { "x": 220, "y": 130 },
        { "x": 220, "y": 180 }
      ]
    }
  ],
  "flows": [
    {
      "id": "flow-1",
      "name": "Write order",
      "sourceId": "proc-a",
      "targetId": "store-1",
      "method": "POST",
      "path": "/orders",
      "description": "Stores the order details",
      "vertices": [
        { "x": 420, "y": 200 },
        { "x": 560, "y": 200 }
      ]
    }
  ]
}`
        };
    },
    methods: {
        showModal() {
            this.$refs.processImportModal.show();
        },
        hideModal() {
            this.$refs.processImportModal.hide();
        },
        resetModal() {
            this.jsonInput = '';
            this.validationErrors = [];
            this.isValidated = false;
            this.importResult = null;
            this.parsedData = null;
        },
        clearErrors() {
            this.validationErrors = [];
            this.isValidated = false;
            this.importResult = null;
        },
        validateJson() {
            this.validationErrors = [];
            this.isValidated = false;
            this.importResult = null;

            // Check JSON syntax
            try {
                this.parsedData = JSON.parse(this.jsonInput);
            } catch (e) {
                this.validationErrors.push(`${this.$t('threatmodel.importProcesses.invalidJson')}: ${e.message}`);
                return;
            }

            const processes = Array.isArray(this.parsedData.processes) ? this.parsedData.processes : [];
            const actors = Array.isArray(this.parsedData.actors) ? this.parsedData.actors : [];
            const stores = Array.isArray(this.parsedData.stores) ? this.parsedData.stores : [];
            const trustBoundaries = Array.isArray(this.parsedData.trustBoundaries) ? this.parsedData.trustBoundaries : [];
            const boundaries = Array.isArray(this.parsedData.boundaries) ? this.parsedData.boundaries : [];
            const flows = Array.isArray(this.parsedData.flows) ? this.parsedData.flows : [];

            if (processes.length === 0 && actors.length === 0 && stores.length === 0 && trustBoundaries.length === 0 && boundaries.length === 0 && flows.length === 0) {
                this.validationErrors.push('JSON must contain at least one supported import section such as "processes", "actors", "stores", "trustBoundaries", "boundaries", or "flows"');
                return;
            }

            let hasErrors = false;
            processes.forEach((process, index) => {
                if (!process.name) {
                    this.validationErrors.push(`Process ${index}: Missing required field "name"`);
                    hasErrors = true;
                }
                if (!process.description) {
                    this.validationErrors.push(`Process ${index}: Missing required field "description"`);
                    hasErrors = true;
                }
            });

            actors.forEach((actor, index) => {
                if (!actor.name) {
                    this.validationErrors.push(`Actor ${index}: Missing required field "name"`);
                    hasErrors = true;
                }
            });

            stores.forEach((store, index) => {
                if (!store.name) {
                    this.validationErrors.push(`Store ${index}: Missing required field "name"`);
                    hasErrors = true;
                }
            });

            trustBoundaries.forEach((boundary, index) => {
                if (!boundary.name) {
                    this.validationErrors.push(`Trust Boundary ${index}: Missing required field "name"`);
                    hasErrors = true;
                }
            });

            boundaries.forEach((boundary, index) => {
                if (!boundary.sourceId && !boundary.source && !boundary.from) {
                    this.validationErrors.push(`Boundary ${index}: Missing required source reference (sourceId or source)`);
                    hasErrors = true;
                }
                if (!boundary.targetId && !boundary.target && !boundary.to) {
                    this.validationErrors.push(`Boundary ${index}: Missing required target reference (targetId or target)`);
                    hasErrors = true;
                }
            });

            flows.forEach((flow, index) => {
                if (!flow.sourceId && !flow.source && !flow.from) {
                    this.validationErrors.push(`Flow ${index}: Missing required source reference (sourceId or source)`);
                    hasErrors = true;
                }
                if (!flow.targetId && !flow.target && !flow.to) {
                    this.validationErrors.push(`Flow ${index}: Missing required target reference (targetId or target)`);
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                return;
            }

            this.isValidated = true;
            const matched = [];
            processes.forEach((process) => matched.push({ name: process.name, type: 'Process' }));
            flows.forEach((flow) => matched.push({ name: flow.name || flow.description || 'Flow', type: 'Flow' }));
            this.importResult = { matched, errors: [] };

            this.$toast.success(this.$t('threatmodel.importProcesses.validationPassed'));
        },
        importProcesses() {
            if (!this.isValidated || !this.parsedData) {
                this.$toast.error(this.$t('threatmodel.importProcesses.validateFirst'));
                return;
            }

            // Delegate to parent component via event
            this.$emit('import-processes', {
                data: this.parsedData,
                result: this.importResult
            });

            this.hideModal();
        }
    }
};
</script>

<style scoped lang="scss">
#process-import-modal {
    ::v-deep .modal-dialog {
        max-width: 700px;
    }
}

.format-info {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 12px;
    font-size: 0.85rem;
    max-height: 200px;
    overflow-y: auto;
    margin: 8px 0 0 0;
    color: #222;
}
</style>
