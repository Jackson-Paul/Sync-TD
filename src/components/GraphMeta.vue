<template>
    <b-row>
        <b-col md="6">
            <b-card :header="`${$t('threatmodel.properties.title')}`">
                <b-card-body>
                    <td-graph-properties />
                </b-card-body>
            </b-card>
        </b-col>
        <b-col md="6">
            <b-card header-tag="header">
                <template #header>
                    {{ $t('threatmodel.threats') }}
                    <b-btn
                        v-if="selectedThreats.length > 0"
                        @click="deleteSelectedThreats()"
                        variant="danger"
                        size="sm"
                        class="float-right ml-2"
                        :title="`Delete ${selectedThreats.length} selected threat(s)`"
                    >
                        <font-awesome-icon icon="trash" class="mr-1"></font-awesome-icon>
                        Delete ({{ selectedThreats.length }})
                    </b-btn>
                    <b-btn
                        :disabled="disableNewThreat"
                        @click="newThreat()"
                        v-if="!!cellRef"
                        variant="primary"
                        size="sm"
                        class="float-right"
                    >
                        <font-awesome-icon icon="plus" class="mr-1"></font-awesome-icon>
                        {{ $t('threats.newThreat') }}
                    </b-btn>
                </template>
                <b-card-body>
                    <b-card-text v-if="!!cellRef">
                        <b-row>
                            <b-col
                                md="4"
                                v-for="(threat, idx) in threats || []"
                                :key="idx"
                            >
                                <div style="position: relative;">
                                    <b-form-checkbox
                                        :id="`threat-checkbox-${threat.id}`"
                                        v-model="selectedThreats"
                                        :value="threat.id"
                                        style="position: absolute; top: 5px; right: 5px; z-index: 10;"
                                    />
                                    <td-graph-threats
                                        :id="threat.id"
                                        :status="threat.status"
                                        :severity="threat.severity"
                                        :description="threat.description"
                                        :title="threat.title"
                                        :type="threat.type"
                                        :isai="threat.isai"
                                        :testedOn="threat.testedOn"
                                        :mitigation="threat.mitigation"
                                        :modelType="threat.modelType"
                                        :number=threat.number
                                        @threatSelected="threatSelected" />
                                </div>
                            </b-col>
                        </b-row>
                    </b-card-text>
                    <b-card-text
                        v-if="!cellRef || !cellRef.data">
                        {{ $t('threats.emptyThreat') }}
                    </b-card-text>
                </b-card-body>
            </b-card>
            <a href="javascript:void(0)"
                v-if="!disableNewThreat"
                @click="AddThreatByType()"
                class="new-threat-by-type m-2"
            >
                    <font-awesome-icon icon="plus"></font-awesome-icon>
                    {{ $t('threats.newThreatByType') }}
            </a>
            <a href="javascript:void(0)"
                v-if="!disableNewThreat"
                @click="AddThreatByContext()"
                class="new-threat-by-type m-2"
            >
                    <font-awesome-icon icon="plus"></font-awesome-icon>
                    {{ $t('threats.newThreatByContext') }}
            </a>
        </b-col>
    </b-row>
</template>

<style lang="scss" scoped>
.new-threat-by-type {
    color: $orange;
    font-size: 16px;
    padding: 15px;
}
.props-header {
    a {
        font-size: 12px;
        font-weight: bolder;
        text-decoration: none;
        margin-left: 5px;
    }
}
.down-icon {
    margin-left: 3px;
}
.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}
</style>

<script>
import { mapState } from 'vuex';

import { createNewTypedThreat } from '@/service/threats/index.js';
import { CELL_DATA_UPDATED, CELL_UNSELECTED } from '@/store/actions/cell.js';
import dataChanged from '@/service/x6/graph/data-changed.js';
import tmActions from '@/store/actions/threatmodel.js';
import TdGraphProperties from '@/components/GraphProperties.vue';
import TdGraphThreats from '@/components/GraphThreats.vue';

export default {
    name: 'TdGraphMeta',
    data() {
        return {
            selectedThreats: []
        };
    },
    computed: mapState({
        cellRef: (state) => state.cell.ref,
        threats: (state) => state.cell.threats,
        diagram: (state) => state.threatmodel.selectedDiagram,
        threatTop: (state) => state.threatmodel.data.detail.threatTop,
        disableNewThreat: function (state) {
            if (!state.cell?.ref?.data) {
                return true;
            }
            return state.cell.ref.data.outOfScope || state.cell.ref.data.isTrustBoundary || state.cell.ref.data.type === 'tm.Text';
        }
    }),
    components: {
        TdGraphProperties,
        TdGraphThreats
    },
    watch: {
        cellRef() {
            this.selectedThreats = [];
        }
    },
    async mounted() {
        this.init();
    },
    methods: {
        init() {
            this.$store.dispatch(CELL_UNSELECTED);
            this.selectedThreats = [];
        },
        threatSelected(threatId,state) {
            console.debug('selected threat ID: ' + threatId);
            this.$emit('threatSelected', threatId,state);
        },
        newThreat() {
            const threat = createNewTypedThreat(this.diagram.diagramType, this.cellRef.data.type,this.threatTop+1);
            console.debug('new threat ID: ' + threat.id);
            this.cellRef.data.threats.push(threat);
            this.cellRef.data.hasOpenThreats = this.cellRef.data.threats.length > 0;
            this.$store.dispatch(tmActions.update, { threatTop: this.threatTop+1 });
            this.$store.dispatch(tmActions.modified);
            this.$store.dispatch(CELL_DATA_UPDATED, this.cellRef.data);
            dataChanged.updateStyleAttrs(this.cellRef);
            this.threatSelected(threat.id,'new');
        },
        AddThreatByType(){
            this.$emit('threatSuggest','type');
        },
        AddThreatByContext(){
            this.$emit('threatSuggest','context');
        },
        deleteSelectedThreats() {
            if (this.selectedThreats.length === 0) {
                this.$toast.warning('No threats selected for deletion');
                return;
            }

            this.$bvModal.msgBoxConfirm(`Delete ${this.selectedThreats.length} threat(s)?`, {
                title: 'Confirm Delete',
                okVariant: 'danger',
                okTitle: 'Delete',
                cancelTitle: 'Cancel'
            }).then(value => {
                if (value) {
                    // Remove selected threats from cellRef
                    this.cellRef.data.threats = this.cellRef.data.threats.filter(
                        threat => !this.selectedThreats.includes(threat.id)
                    );
                    
                    // Update hasOpenThreats flag
                    this.cellRef.data.hasOpenThreats = this.cellRef.data.threats.length > 0;
                    
                    // Clear selection
                    this.selectedThreats = [];
                    
                    // Dispatch updates
                    this.$store.dispatch(CELL_DATA_UPDATED, this.cellRef.data);
                    this.$store.dispatch(tmActions.modified);
                    dataChanged.updateStyleAttrs(this.cellRef);
                    
                    this.$toast.success('Threat(s) deleted successfully');
                }
            });
        }
    },
};

</script>
