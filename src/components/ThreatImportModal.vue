<template>
    <b-modal
        id="threat-import-modal"
        ref="threatImportModal"
        :title="$t('threatmodel.importThreats.title')"
        size="lg"
        @hide="resetModal"
    >
        <b-form>
            <!-- JSON Input -->
            <b-form-group
                id="json-group"
                :label="$t('threatmodel.importThreats.pasteJson')"
                label-for="json-textarea"
            >
                <b-form-textarea
                    id="json-textarea"
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
                <strong>{{ $t('threatmodel.importThreats.validationErrors') }}:</strong>
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
                <strong>{{ $t('threatmodel.importThreats.matched') }}:</strong>
                <ul class="mt-2 mb-0">
                    <li v-for="(match, idx) in importResult.matched" :key="`match-${idx}`">
                        <strong>{{ match.title }}</strong> → {{ match.target }}
                    </li>
                </ul>
            </b-alert>

            <!-- Warnings for Unmatched -->
            <b-alert
                v-if="importResult && importResult.unmatched.length > 0"
                variant="warning"
                show
                class="mt-3"
            >
                <strong>{{ $t('threatmodel.importThreats.unmatched') }}:</strong>
                <ul class="mt-2 mb-0">
                    <li v-for="(unmatch, idx) in importResult.unmatched" :key="`unmatch-${idx}`">
                        <strong>{{ unmatch.title }}</strong> - {{ unmatch.reason }}
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
                <strong>{{ $t('threatmodel.importThreats.errors') }}:</strong>
                <ul class="mt-2 mb-0">
                    <li v-for="(error, idx) in importResult.errors" :key="`error-${idx}`">
                        {{ error }}
                    </li>
                </ul>
            </b-alert>
            <b-alert variant="info" show class="mt-3">
                <strong>{{ $t('threatmodel.importThreats.formatInfo') }}</strong>
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
                {{ $t('threatmodel.importThreats.validate') }}
            </b-button>
            <b-button
                variant="primary"
                @click="importThreats"
                :disabled="!isValidated || !importResult || importResult.matched.length === 0"
            >
                {{ $t('threatmodel.importThreats.import') }}
            </b-button>
        </template>
    </b-modal>
</template>

<script>
import { isValidThreatImport, getThreatImportErrors } from '@/service/schema/ajv.js';

export default {
    name: 'TdThreatImportModal',
    data() {
        return {
            jsonInput: '',
            validationErrors: [],
            isValidated: false,
            importResult: null,
            parsedData: null,
            jsonPlaceholder: `{
    "version": ...,
    "threats": [
        {
            "data": {
                "id": ".....",
                "title": "....",
                "severity": "...",
                "category": "...",
                "description": "...",
                "mitigation": "..."
            }
        }
    ]
}`,
            jsonFormatExample: `{
    "version": "1.0",
    "threats": [
        {
            "data": {
                "id": "4e6a7c1e-2ac4-499a-9999-289e958c49ab",
                "title": "Unauthorized access",
                "severity": "high",
                "category": "Elevation of Privilege",
                "description": "Potential bypass of auth.",
                "mitigation" : "add proper server side authorization"
            }
        },
        {
            "data": {
                "id": "process_1777377939314_v1bbam1i6",
                "title": "SQL Injection Attack",
                "severity": "critical",
                "category": "Tampering",
                "description": "Attacker can inject SQL code.",
                "mitigation" : "Use parameterized queries"
            }
        }
    ]
}`
        };
    },
    methods: {
        showModal() {
            this.$refs.threatImportModal.show();
        },
        hideModal() {
            this.$refs.threatImportModal.hide();
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
                this.validationErrors.push(`${this.$t('threatmodel.importThreats.invalidJson')}: ${e.message}`);
                return;
            }

            // Check schema
            if (!isValidThreatImport(this.parsedData)) {
                const errors = getThreatImportErrors();
                errors.forEach(error => {
                    this.validationErrors.push(`${error.instancePath || 'root'}: ${error.message}`);
                });
                return;
            }

            this.isValidated = true;
            // this.importResult = {
            //     matched: [],
            //     unmatched: [],
            //     errors: []
            // };
            this.importResult = {
                matched: this.parsedData.threats.map(p => ({
                    threats: p.threats,
                    type: 'threats'
                })),
                errors: []
            };


            this.$toast.success(this.$t('threatmodel.importThreats.validationPassed'));
        },
        importThreats() {
            if (!this.isValidated || !this.parsedData) {
                this.$toast.error(this.$t('threatmodel.importThreats.validateFirst'));
                return;
            }

            // Delegate to parent component via event
            this.$emit('import-threats', {
                data: this.parsedData,
                result: this.importResult
            });

            this.hideModal();
        }
    }
};
</script>

<style scoped lang="scss">
#threat-import-modal {
    ::v-deep .modal-dialog {
        max-width: 700px;
    }
}
</style>
