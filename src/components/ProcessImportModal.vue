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
            jsonPlaceholder: '{"version": "1.0", "processes": [{"name": "...", "url": "...", "parameters": "...", "description": "..."}]}',
            jsonFormatExample: `{
  "version": "1.0",
  "processes": [
    {
      "name": "User Service",
      "url": "/api/users",
      "parameters": "userid, pagenumber",
      "method": "GET",
      "description": "Handles user management"
    },
    {
      "name": "Auth Service",
      "url": "/api/auth",
      "parameters": "csrftoken, authtoken",
      "method" : "POST"
      "description": "Handles authentication"
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

            // Validate structure
            if (!this.parsedData.processes || !Array.isArray(this.parsedData.processes)) {
                this.validationErrors.push('JSON must contain a "processes" array');
                return;
            }

            if (this.parsedData.processes.length === 0) {
                this.validationErrors.push('Processes array cannot be empty');
                return;
            }

            // Validate each process has required fields
            let hasErrors = false;
            this.parsedData.processes.forEach((process, index) => {
                if (!process.name) {
                    this.validationErrors.push(`Process ${index}: Missing required field "name"`);
                    hasErrors = true;
                }
                if (!process.description) {
                    this.validationErrors.push(`Process ${index}: Missing required field "description"`);
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                return;
            }

            this.isValidated = true;
            this.importResult = {
                matched: this.parsedData.processes.map(p => ({
                    name: p.name,
                    type: 'Process'
                })),
                errors: []
            };

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
