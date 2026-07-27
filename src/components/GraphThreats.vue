<template>
    <b-card class="threat-card">
        <b-card-text>
            <b-row class="align-items-center mb-2">
                <b-col>
                    <a href="javascript:void(0)" @click="threatSelected()" v-if="!!number">#{{ number }} {{ title || 'Unknown Threat' }}</a>
                    <a href="javascript:void(0)" @click="threatSelected()" v-else>{{ title || 'Unknown Threat' }}</a>
                </b-col>
                <b-col cols="auto">
                    <b-badge :variant="severityVariant" class="severity-badge" v-if="severity">
                        {{ severity }}
                    </b-badge>
                    <b-badge variant="secondary" class="severity-badge" v-else>
                        TBD
                    </b-badge>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    {{ type }}
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <p v-if="isai" class="ai-badge-text">{{ $t('threats.properties.isai') }}</p>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <font-awesome-icon
                        icon="check"
                        class="threat-icon green-icon"
                        :title="status"
                        v-if="status !== 'Open'" />
                    <font-awesome-icon
                        icon="exclamation-triangle"
                        class="threat-icon red-icon"
                        :title="status"
                        v-if="status === 'Open'" />
                    <font-awesome-icon
                        icon="circle"
                        class="threat-icon red-icon"
                        :title="severity"
                        v-if="severity === 'High'" />
                    <font-awesome-icon
                        icon="circle"
                        class="threat-icon yellow-icon"
                        :title="severity"
                        v-if="severity === 'Medium'" />
                    <font-awesome-icon
                        icon="circle"
                        class="threat-icon green-icon"
                        :title="severity"
                        v-if="severity === 'Low'" />
                </b-col>
                <b-col align-h="end">
                    <b-badge v-if="!!modelType">{{ modelType }}</b-badge>
                </b-col>
            </b-row>
        </b-card-text>
    </b-card>
</template>

<style lang="scss" scoped>
.threat-card {
    font-size: 14px;
}

.threat-title {
    margin-bottom: 5px;
}

.threat-icon {
    margin: 2px;
}

.green-icon {
    color: $green;
}

.red-icon {
    color: $red;
}

.yellow-icon {
    color: $yellow;
}

.severity-badge {
    margin-left: 0.5rem;
    text-transform: uppercase;
    font-size: 0.75rem;
}

.ai-badge-text {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
}

</style>

<script>
export default {
    name: 'TdGraphThreats',
    props: {
        id: { type: String },
        status: { type: String },
        severity: { type: String },
        description: { type: String },
        title: { type: String },
        type: { type: String },
        mitigation: { type: String },
        modelType: { type: String },
        number: { type: Number },
        isai: {type: Boolean},
        ticketLink:{type: String},
        testedOn:{type: Date}
    },
    computed: {
        severityVariant() {
            switch ((this.severity || '').toLowerCase()) {
            case 'high':
                return 'danger';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'secondary';
            }
        }
    },
    methods: {
        threatSelected() {
            this.$emit('threatSelected', this.id,'old');
        }
    }
};

</script>