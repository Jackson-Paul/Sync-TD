<template>
    <div class="page print-only">
        <div class="page-title">
            {{ $t('report.executiveSummary') }}
        </div>
        <div class="page-subtitle td-description">
            {{ $t('threatmodel.description') }}
        </div>
        <div class="mt-2 td-summary">
            {{ summary || $t('report.notProvided') }}
        </div>
        <div class="page-subtitle td-report-summary">
            {{ $t('report.summary') }}
        </div>
        <div v-if="hasContentMismatch" class="td-content-warning">
            {{ $t('report.threatStats.contentWarning', { total: total }) }}
        </div>
        <div class="mt-2">
            <table class="table td-summary-table">
                <tr>
                    <th>{{ $t('report.threatStats.total') }}</th>
                    <td class="td-summary-total">{{ total }}</td>
                </tr>
                <tr>
                    <th>{{ $t('report.threatStats.mitigated') }}</th>
                    <td class="td-summary-mitigated">{{ mitigated }}</td>
                </tr>
                <tr>
                    <th>{{ $t('report.threatStats.notMitigated') }}</th>
                    <td class="td-summary-not-mitigated">{{ notMitigated }}</td>
                </tr>
                <tr>
                    <th>{{ $t('report.threatStats.descriptionProvided') }}</th>
                    <td :class="{ 'td-summary-mismatch': descriptionProvided < total }">{{ descriptionProvided }}</td>
                </tr>
                <tr>
                    <th>{{ $t('report.threatStats.mitigationProvided') }}</th>
                    <td :class="{ 'td-summary-mismatch': mitigationProvided < total }">{{ mitigationProvided }}</td>
                </tr>
                <tr>
                    <th>{{ $t('report.threatStats.openHigh') }}</th>
                    <td class="td-summary-open-high">{{ openHigh }}</td>
                </tr>
                <tr>
                    <th>{{ $t('report.threatStats.openMedium') }}</th>
                    <td class="td-summary-open-medium">{{ openMedium }}</td>
                </tr>
                <tr>
                    <th>{{ $t('report.threatStats.openLow') }}</th>
                    <td class="td-summary-open-low">{{ openLow }}</td>
                </tr>
                <tr>
                    <th>{{ $t('report.threatStats.openUnknown') }}</th>
                    <td class="td-summary-open-unknown">{{ openUnknown }}</td>
                </tr>
            </table>
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
        </div>
    </div>
</template>

<style lang="scss" scoped>
.page {
    display: flex;
    flex-direction: column;
    white-space: pre-wrap;
}

.td-content-warning {
    padding: 10px;
    color: #721c24;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    font-weight: 600;
}

.td-summary-mismatch {
    color: #721c24;
    background-color: #f8d7da !important;
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
    name: 'TdPrintExecutiveSummary',
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
            return this.statusProvided !== this.total ||
                this.descriptionProvided !== this.total ||
                this.mitigationProvided !== this.total;
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
        }
    }
};

</script>