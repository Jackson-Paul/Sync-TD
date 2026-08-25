<template>
    <div class="td-executive-summary no-print">
        <b-row>
            <b-col>
                <b-card :header="$t('report.executiveSummary')">
                    <h3 class="td-description-title">{{ $t('threatmodel.description') }}</h3>
                    <p class="td-summary">{{ summary || $t('report.notProvided') }}</p>

                    <h3 class="td-report-summary">{{ $t('report.summary') }}</h3>
                    <b-alert
                        v-if="hasContentMismatch"
                        show
                        variant="danger"
                        class="td-content-warning">
                        {{ $t('report.threatStats.contentWarning', { total: total }) }}
                    </b-alert>
                    <b-table
                        class="td-executive-summary-data"
                        :fields="null"
                        :items="tableRows"
                        :tbody-tr-attr="getDataTestId"
                        :tbody-tr-class="getRowClass"
                        striped
                    ></b-table>
                    <div v-if="missingMitigations.length" class="td-missing-mitigations">
                        <h4>{{ $t('report.threatStats.missingMitigations') }}</h4>
                        <ul>
                            <li v-for="threat in missingMitigations" :key="threat.threatId || threat.reportNumber">
                                <strong>#{{ threat.reportNumber }}</strong> {{ threat.title || $t('report.notProvided') }}
                            </li>
                        </ul>
                    </div>
                    <div v-if="missingDescriptions.length" class="td-missing-mitigations">
                        <h4>{{ $t('report.threatStats.missingDescriptions') }}</h4>
                        <ul>
                            <li v-for="threat in missingDescriptions" :key="threat.threatId || threat.reportNumber">
                                <strong>#{{ threat.reportNumber }}</strong> {{ threat.title || $t('report.notProvided') }}
                            </li>
                        </ul>
                    </div>
                </b-card>
            </b-col>
        </b-row>
    </div>
</template>

<style lang="scss" scoped>
.td-summary {
    white-space: pre-wrap;
}

.td-content-warning {
    margin-bottom: 12px;
    color: #721c24;
    background-color: #f8d7da;
    border-color: #f5c6cb;
}

.td-executive-summary-data ::v-deep .td-summary-mismatch td {
    background-color: #f8d7da;
    color: #721c24;
    font-weight: 600;
}

.td-missing-mitigations {
    margin-top: 16px;
}

.td-missing-mitigations h4 {
    font-size: 1rem;
}
</style>

<script>
export default {
    name: 'TdExecutiveSummary',
    props: {
        summary: {
            type: String,
            required: false
        },
        threats: {
            type: Array,
            required: true
        }
    },
    computed: {
        tableRows: function () {
            return [
                { name: this.$t('report.threatStats.total'), value: this.total },
                { name: this.$t('report.threatStats.mitigated'), value: this.mitigated },
                { name: this.$t('report.threatStats.notMitigated'), value: this.notMitigated },
                { name: this.$t('report.threatStats.descriptionProvided'), value: this.descriptionProvided },
                { name: this.$t('report.threatStats.mitigationProvided'), value: this.mitigationProvided },
                { name: this.$t('report.threatStats.openCritical'), value: this.openCritical },
                { name: this.$t('report.threatStats.openHigh'), value: this.openHigh },
                { name: this.$t('report.threatStats.openMedium'), value: this.openMedium },
                { name: this.$t('report.threatStats.openLow'), value: this.openLow },
                { name: this.$t('report.threatStats.openTbd'), value: this.openTbd },
                { name: this.$t('report.threatStats.openUnknown'), value: this.openUnknown }
            ];
        },
        total: function () {
            return this.threats.length;
        },
        mitigated: function () {
            return this.threats
                .filter(threat => threat.status.toLowerCase() === 'mitigated')
                .length;
        },
        notMitigated: function () {
            return this.threats
                .filter(threat => threat.status.toLowerCase() !== 'mitigated')
                .length;
        },
        descriptionProvided: function () {
            return this.threats.filter(threat => !!String(threat.description || '').trim()).length;
        },
        mitigationProvided: function () {
            return this.threats.filter(threat => !!String(threat.mitigation || '').trim()).length;
        },
        missingMitigations: function () {
            return this.threatsWithReportNumbers.filter(threat => !String(threat.mitigation || '').trim());
        },
        missingDescriptions: function () {
            return this.threatsWithReportNumbers.filter(threat => !String(threat.description || '').trim());
        },
        threatsWithReportNumbers: function () {
            return this.threats.map((threat, index) => ({
                ...threat,
                reportNumber: threat.number !== undefined && threat.number !== null
                    ? threat.number
                    : index + 1
            }));
        },
        hasContentMismatch: function () {
            return this.descriptionProvided !== this.total ||
                this.mitigationProvided !== this.total;
        },
        openCritical: function () {
            return this.getOpenThreats()
                .filter(threat => threat.severity.toLowerCase() === 'critical')
                .length;
        },
        openHigh: function () {
            return this.getOpenThreats()
                .filter(threat => threat.severity.toLowerCase() === 'high')
                .length;
        },
        openMedium: function() {
            return this.getOpenThreats()
                .filter(threat => threat.severity.toLowerCase() === 'medium')
                .length;
        },
        openLow: function() {
            return this.getOpenThreats()
                .filter(threat => threat.severity.toLowerCase() === 'low')
                .length;
        },
        openTbd: function() {
            return this.getOpenThreats()
                .filter(threat => threat.severity.toLowerCase() === 'tbd')
                .length;
        },
        openUnknown: function() {
            return this.getOpenThreats()
                .filter(threat => !threat.severity)
                .length;
        }
    },
    methods: {
        getOpenThreats() {
            return this.threats
                .filter(threat => threat.status && threat.status.toLowerCase() === 'open');
        },
        getDataTestId(item) {
            return {
                'data-test-id': item.name
            };
        },
        getRowClass(item) {
            const contentLabels = [
                this.$t('report.threatStats.descriptionProvided'),
                this.$t('report.threatStats.mitigationProvided')
            ];
            return contentLabels.includes(item.name) && item.value < this.total
                ? 'td-summary-mismatch'
                : '';
        }
    }
};

</script>