<template>
    <b-modal
        id="threat-export-modal"
        ref="threatExportModal"
        :title="$t('threatmodel.exportThreats.title')"
        size="lg"
        @show="loadExportData"
    >
        <div class="export-container">
            <!-- Export Type Selection -->
            <b-form-group
                :label="$t('threatmodel.exportThreats.exportType')"
                class="mb-4"
            >
                <div class="export-type-row">
                    <b-form-radio-group
                        v-model="exportType"
                        :options="exportTypeOptions"
                        @change="loadExportData"
                    ></b-form-radio-group>
                    <div class="include-threats-inline">
                        <b-form-checkbox
                            v-model="includeThreats"
                            @change="loadExportData"
                            :title="$t('threatmodel.exportThreats.includeThreatsTooltip')"
                        >
                            {{ $t('threatmodel.exportThreats.includeThreats') }}
                        </b-form-checkbox>
                    </div>
                </div>
            </b-form-group>

            <!-- Export Data Display -->
            <b-form-group
                :label="$t('threatmodel.exportThreats.data')"
                label-for="export-textarea"
            >
                <b-form-textarea
                    id="export-textarea"
                    v-model="exportJsonString"
                    :rows="12"
                    readonly
                    class="export-textarea"
                ></b-form-textarea>
            </b-form-group>

            <!-- Summary Stats -->
            <b-alert variant="info" show class="mt-3 mb-0">
                <div class="stats-grid">
                    <div v-if="exportType !== 'flows'" class="stat-item">
                        <strong>{{ $t('threatmodel.exportThreats.totalProcesses') }}:</strong>
                        <span>{{ exportData.summary.totalProcesses }}</span>
                    </div>
                    <div v-if="exportType !== 'processes'" class="stat-item">
                        <strong>{{ $t('threatmodel.exportThreats.totalFlows') }}:</strong>
                        <span>{{ exportData.summary.totalFlows }}</span>
                    </div>
                    <div class="stat-item">
                        <strong>{{ $t('threatmodel.exportThreats.totalItems') }}:</strong>
                        <span>{{ exportData.summary.totalItems }}</span>
                    </div>
                </div>
            </b-alert>

            <!-- Success Message -->
            <b-alert
                v-if="copySuccess"
                variant="success"
                show
                class="mt-3 mb-0"
            >
                ✓ {{ $t('threatmodel.exportThreats.copiedToClipboard') }}
            </b-alert>
        </div>

        <template #modal-footer>
            <b-button variant="secondary" @click="hideModal">
                {{ $t('forms.cancel') }}
            </b-button>
            <b-button
                variant="info"
                @click="downloadJson"
                :title="$t('threatmodel.exportThreats.downloadTooltip')"
            >
                <font-awesome-icon icon="download" class="mr-2"></font-awesome-icon>
                {{ $t('threatmodel.exportThreats.download') }}
            </b-button>
            <b-button
                variant="primary"
                @click="copyToClipboardAction"
                :title="$t('threatmodel.exportThreats.copyTooltip')"
            >
                <font-awesome-icon icon="copy" class="mr-2"></font-awesome-icon>
                {{ $t('threatmodel.exportThreats.copyToClipboard') }}
            </b-button>
        </template>
    </b-modal>
</template>

<script>
import threatExportService from '@/service/threatExportService.js';

export default {
    name: 'TdThreatExportModal',
    props: {
        diagram: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            exportType: 'all',
            includeThreats: false,
            exportTypeOptions: [
                { value: 'all', text: 'All (Processes & Flows)' },
                { value: 'processes', text: 'Processes Only' },
                { value: 'flows', text: 'Flows Only' }
            ],
            exportData: {
                version: '1.0',
                exportDate: '',
                diagramTitle: '',
                diagramId: '',
                processes: [],
                flows: [],
                summary: {
                    totalProcesses: 0,
                    totalFlows: 0,
                    totalItems: 0
                }
            },
            exportJsonString: '',
            copySuccess: false
        };
    },
    methods: {
        showModal() {
            this.$refs.threatExportModal.show();
        },
        hideModal() {
            this.$refs.threatExportModal.hide();
        },
        loadExportData() {
            this.copySuccess = false;
            this.exportData = threatExportService.generateExportData(
                this.diagram,
                this.exportType,
                this.includeThreats
            );
            this.exportJsonString = threatExportService.formatExportJson(this.exportData);
        },
        async copyToClipboardAction() {
            const result = await threatExportService.copyToClipboard(this.exportJsonString);
            if (result.success) {
                this.copySuccess = true;
                this.$toast.success(this.$t('threatmodel.exportThreats.copiedSuccess'));
                // Hide success message after 3 seconds
                setTimeout(() => {
                    this.copySuccess = false;
                }, 3000);
            } else {
                this.$toast.error(`${this.$t('threatmodel.exportThreats.copyError')}: ${result.error}`);
            }
        },
        downloadJson() {
            const filename = `${this.diagram.title || 'diagram'}-export-${new Date().getTime()}.json`;
            threatExportService.downloadExportJson(this.exportData, filename);
            this.$toast.success(this.$t('threatmodel.exportThreats.downloadSuccess'));
        }
    }
};
</script>

<style scoped lang="scss">
.export-container {
    width: 100%;
}

.export-textarea {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    
    &:focus {
        background: #fff;
        border-color: #80bdff;
    }
}

.export-type-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 24px;
}

.include-threats-inline {
    display: flex;
    align-items: center;
    min-width: 220px;
}

.include-threats-inline .custom-control {
    margin-bottom: 0;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    
    .stat-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        strong {
            color: #0b7bb0;
            font-size: 0.9rem;
        }
        
        span {
            font-size: 1.1rem;
            font-weight: 700;
            color: #222;
        }
    }
}

::v-deep .modal-dialog {
    max-width: 750px;
}
</style>
