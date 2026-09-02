<template>
    <div class="report-box print-only">
        <div class="entity-title">
            {{ `${entity.data.name.replaceAll('\n', ' ')} (${dataType})` }}
            <em v-if="outOfScope">- {{ $t('threatmodel.properties.outOfScope') }}</em>
        </div>
        <p class="entity-description" v-if="outOfScope"><b>{{ $t('threatmodel.properties.reasonOutOfScope') }}:</b> {{ entity.data.reasonOutOfScope }}</p>
        <p class="entity-description"><b>{{ $t('threatmodel.properties.description') }}: </b> {{ entity.data.description }}</p>
        <p class="entity-description"><b>{{ $t('threatmodel.properties.urlMethod') }}: </b> {{ entity.data.method }} {{ entity.data.url }}</p>
        <p class="entity-description"><b>{{ $t('threatmodel.properties.urlParameters') }}: </b> {{ entity.data.parameters }}</p>
        <p class="entity-description" v-if="showProperties">{{ properties }}</p>
        <div v-for="threat in threats" :key="threat.id" class="threat-box">
            <div class="threat-number"><strong>#{{ threat.number }} - {{ threat.title }}</strong></div>
            <table class="threat-details-table">
                <tr>
                    <th>{{ $t('threats.properties.type') }}</th>
                    <td>{{ threat.type }}</td>
                </tr>
                <tr>
                    <th>{{ $t('threats.properties.priority') }}</th>
                    <td>{{ threat.severity }}</td>
                </tr>
                <tr>
                    <th>{{ $t('threats.properties.status') }}</th>
                    <td>{{ threat.status }}</td>
                </tr>
                <tr>
                    <th>{{ $t('threats.properties.score') }}</th>
                    <td>{{ threat.score }}</td>
                </tr>
                <tr>
                    <th>{{ $t('threats.properties.isai') }}</th>
                    <td>{{ threat.isai }}</td>
                </tr>
                <tr v-if="threat.testedOn">
                    <th>{{ $t('threats.properties.testedOn') }}</th>
                    <td>{{ formatDate(threat.testedOn) }}</td>
                </tr>
                <tr v-if="threat.description">
                    <th>{{ $t('threats.properties.description') }}</th>
                    <td>{{ threat.description }}</td>
                </tr>
                <tr v-if="threat.mitigation">
                    <th>{{ $t('threats.properties.mitigation') }}</th>
                    <td>{{ threat.mitigation }}</td>
                </tr>
                <tr v-if="threat.mitigationScreenshots && threat.mitigationScreenshots.length > 0">
                    <th>{{ $t('threats.properties.mitigationScreenshot') }}</th>
                    <td>
                        <div class="screenshots-gallery">
                            <img 
                                v-for="(screenshot, idx) in threat.mitigationScreenshots" 
                                :key="idx"
                                :src="screenshot.data" 
                                :alt="`Screenshot ${idx + 1} for threat ${threat.number}`" 
                                class="mitigation-screenshot">
                        </div>
                    </td>
                </tr>
                <tr v-if="threat.ticketlink">
                    <th>{{ $t('threats.properties.ticketlink') }}</th>
                    <td><a :href="threat.ticketlink" target="_blank" rel="noopener">{{ threat.ticketlink }}</a></td>
                </tr>
            </table>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.report-box {
    display: flex;
    flex-direction: column;
    white-space: pre-wrap;
}

.entity-title {
    font-size: 24px;
    margin-top: 50px;
    margin-bottom: 15px;
    font-weight: bold;
}

.entity-description {
    padding: 15px;
    white-space: pre-wrap;
}

.threat-box {
    margin-bottom: 2rem;
    page-break-inside: avoid;
}

.threat-number {
    padding: 10px;
    background-color: #f0f0f0;
    border-left: 4px solid #333;
    margin-bottom: 10px;
    font-size: 14px;
}

.threat-details-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
}

.threat-details-table th {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
    font-weight: bold;
    width: 150px;
}

.threat-details-table td {
    border: 1px solid #ddd;
    padding: 8px;
    word-break: break-word;
}

.screenshots-gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.mitigation-screenshot {
    max-width: 180px;
    max-height: 140px;
    border: 1px solid #ddd;
    object-fit: contain;
}
</style>

<script>
import threatService from '@/service/threats/index.js';
import moment from 'moment';

export default {
    name: 'TdPrintReportEntity',
    props: {
        entity: Object,
        outOfScope: {
            type: Boolean,
            default: false
        },
        showMitigated: {
            type: Boolean,
            default: true
        },
        showOutOfScope: {
            type: Boolean,
            default: true
        },
        showProperties: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        dataType: function () {
            const entityType = this.entity.data.type.replace('tm.', '').replace('td.', '');
            return this.$t(`threatmodel.shapes.${this.toCamelCase(entityType)}`);
        },
        threats: function () {
            return threatService.filterForDiagram(this.entity.data, {
                showMitigated: this.showMitigated,
                showOutOfScope: this.showOutOfScope
            });
        },
        properties: function () {
            let properties = '';
            if (this.entity.data.bidirection) {
                properties += this.$t('threatmodel.properties.bidirection')  + ', ';
            }
            if (this.entity.data.handlesCardPayment) {
                properties += this.$t('threatmodel.properties.handlesCardPayment')  + ', ';
            }
            if (this.entity.data.handlesGoodsOrServices) {
                properties += this.$t('threatmodel.properties.handlesGoodsOrServices')  + ', ';
            }
            if (this.entity.data.isALog) {
                properties += this.$t('threatmodel.properties.isALog')  + ', ';
            }
            if (this.entity.data.isEncrypted) {
                properties += this.$t('threatmodel.properties.isEncrypted')  + ', ';
            }
            if (this.entity.data.isSigned) {
                properties += this.$t('threatmodel.properties.isSigned')  + ', ';
            }
            if (this.entity.data.isWebApplication) {
                properties += this.$t('threatmodel.properties.isWebApplication')  + ', ';
            }
            if (this.entity.data.privilegeLevel) {
                properties += this.$t('threatmodel.properties.privilegeLevel') + ': ' + this.entity.data.privilegeLevel + ', ';
            }
            if (this.entity.data.providesAuthentication) {
                properties += this.$t('threatmodel.properties.providesAuthentication')  + ', ';
            }
            if (this.entity.data.protocol) {
                properties += this.$t('threatmodel.properties.protocol') + ' (' + this.entity.data.protocol  + '), ';
            }
            if (this.entity.data.publicNetwork) {
                properties += this.$t('threatmodel.properties.publicNetwork')  + ', ';
            }
            if (this.entity.data.storesCredentials) {
                properties += this.$t('threatmodel.properties.storesCredentials')  + ', ';
            }
            if (this.entity.data.storesInventory) {
                properties += this.$t('threatmodel.properties.storesInventory')  + ', ';
            }
            if (properties.length > 2) {
                properties = properties.slice(0, -2);
            }
            return this.$t('threatmodel.properties.title') + ': ' + properties;
        }
    },
    methods: {
        toCamelCase(str) {
            // https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
            return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (ltr, idx) => idx === 0 ? ltr.toLowerCase() : ltr.toUpperCase()).replace(/\s+/g, '');
        },
        formatDate(date) {
            return date ? moment(date).format('MM-DD-YYYY') : '';
        }
    }
};

</script>