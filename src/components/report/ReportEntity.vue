<template>
    <div class="td-threat-data no-print">
        <b-row>
            <b-col>
                <h3 class="entity-title">
                    {{ `${entity.data.name.replaceAll('\n', ' ')} (${dataType})` }}
                    <em v-if="outOfScope">- {{ $t('threatmodel.properties.outOfScope') }}</em>
                </h3>
            </b-col>
        </b-row>
        <b-row v-if="outOfScope">
            <b-col>
                <p class="entity-description"><b>{{ $t('threatmodel.properties.reasonOutOfScope') }}:</b> {{ entity.data.reasonOutOfScope }}</p>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <p class="entity-description"><b>{{ $t('threatmodel.properties.description') }}: </b> {{ entity.data.description }}</p>
                <p class="entity-description"><b>{{ $t('threatmodel.properties.urlMethod') }}: </b> {{ entity.data.method }} {{ entity.data.url }}</p>
                <p class="entity-description"><b>{{ $t('threatmodel.properties.urlParameters') }}: </b> {{ entity.data.parameters }}</p>
                <p class="entity-description" v-if="showProperties">{{ properties }}</p>
            </b-col>
        </b-row>
        <b-row>
            <b-col md="12">
                <div v-for="threat in threatsToDisplay" :key="threat.id" class="threat-card">
                    <div class="threat-card-header">
                        <h4>#{{ threat.number }} - {{ threat.title }}</h4>
                    </div>
                    <div class="threat-card-body">
                        <div class="threat-row">
                            <div class="threat-label"><b>{{ $t('threats.properties.type') }}:</b></div>
                            <div class="threat-value">{{ threat.type }}</div>
                        </div>
                        <div class="threat-row">
                            <div class="threat-label"><b>{{ $t('threats.properties.priority') }}:</b></div>
                            <div class="threat-value">{{ threat.severity }}</div>
                        </div>
                        <div class="threat-row">
                            <div class="threat-label"><b>{{ $t('threats.properties.status') }}:</b></div>
                            <div class="threat-value">{{ threat.status }}</div>
                        </div>
                        <div class="threat-row">
                            <div class="threat-label"><b>{{ $t('threats.properties.score') }}:</b></div>
                            <div class="threat-value">{{ threat.score }}</div>
                        </div>
                        <div class="threat-row">
                            <div class="threat-label"><b>{{ $t('threats.properties.isai') }}:</b></div>
                            <div class="threat-value">{{ threat.isai }}</div>
                        </div>
                        <div class="threat-row" v-if="threat.testedOn">
                            <div class="threat-label"><b>{{ $t('threats.properties.testedOn') }}:</b></div>
                            <div class="threat-value">{{ formatDate(threat.testedOn) }}</div>
                        </div>
                        <div class="threat-row" v-if="threat.description">
                            <div class="threat-label"><b>{{ $t('threats.properties.description') }}:</b></div>
                            <div class="threat-value" style="white-space: pre-wrap;">{{ threat.description }}</div>
                        </div>
                        <div class="threat-row" v-if="threat.mitigation">
                            <div class="threat-label"><b>{{ $t('threats.properties.mitigation') }}:</b></div>
                            <div class="threat-value" style="white-space: pre-wrap;">{{ threat.mitigation }}</div>
                        </div>
                        <div class="threat-row" v-if="threat.mitigationScreenshots && threat.mitigationScreenshots.length > 0">
                            <div class="threat-label"><b>{{ $t('threats.properties.mitigationScreenshot') }}:</b></div>
                            <div class="threat-value">
                                <div class="screenshots-gallery">
                                    <img 
                                        v-for="(screenshot, idx) in threat.mitigationScreenshots" 
                                        :key="idx"
                                        :src="screenshot.data" 
                                        :alt="`Screenshot ${idx + 1} for threat ${threat.number}`" 
                                        class="mitigation-screenshot">
                                </div>
                            </div>
                        </div>
                        <div class="threat-row" v-if="threat.ticketlink">
                            <div class="threat-label"><b>{{ $t('threats.properties.ticketlink') }}:</b></div>
                            <div class="threat-value">
                                <a :href="threat.ticketlink" target="_blank" rel="noopener">{{ threat.ticketlink }}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </b-col>
        </b-row>
    </div>
</template>

<style lang="scss" scoped>
.td-threat-data {
    width: 99%;
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

.threat-card {
    border: 1px solid #e9ecef;
    border-radius: 0.25rem;
    margin-bottom: 1.5rem;
    background-color: #f8f9fa;
}

.threat-card-header {
    padding: 1rem;
    background-color: #e9ecef;
    border-bottom: 1px solid #dee2e6;
    border-radius: 0.25rem 0.25rem 0 0;
}

.threat-card-header h4 {
    margin: 0;
    font-size: 1.1rem;
}

.threat-card-body {
    padding: 1rem;
}

.threat-row {
    display: flex;
    margin-bottom: 0.75rem;
    line-height: 1.5;
}

.threat-row:last-child {
    margin-bottom: 0;
}

.threat-label {
    flex: 0 0 200px;
    font-weight: bold;
    padding-right: 1rem;
    min-width: 150px;
}

.threat-value {
    flex: 1;
    word-break: break-word;
}

.screenshots-gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.mitigation-screenshot {
    max-width: 450px;
    max-height: 350px;
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
    object-fit: contain;
}
</style>

<script>
import threatService from '@/service/threats/index.js';
import moment from 'moment';

export default {
    name: 'TdReportEntity',
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
        threatsToDisplay: function () {
            return threatService.filterForDiagram(this.entity.data, {
                showMitigated: this.showMitigated,
                showOutOfScope: this.showOutOfScope
            });
        },
        tableData: function () {
            return this.threatsToDisplay.map((threat) => {
                const formattedDate = threat.testedOn ? moment(threat.testedOn).format('MM-DD-YYYY') : '';
                return {
                    [this.$t('threats.properties.number')]: threat.number,
                    [this.$t('threats.properties.title')]: threat.title,
                    [this.$t('threats.properties.type')]: threat.type,
                    [this.$t('threats.properties.isai')]: threat.isai,
                    [this.$t('threats.properties.testedOn')]: formattedDate,
                    [this.$t('threats.properties.priority')]: threat.severity,
                    [this.$t('threats.properties.status')]: threat.status,
                    [this.$t('threats.properties.score')]: threat.score,
                    [this.$t('threats.properties.description')]: threat.description,
                    [this.$t('threats.properties.ticketlink')]: threat.ticketlink,
                    [this.$t('threats.properties.mitigation')]: threat.mitigation

                };
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