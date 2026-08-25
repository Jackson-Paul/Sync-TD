<template>
    <div v-if="!!model && model.summary">
        <b-row class="mb-4" id="title_row">
            <b-col>
                <td-threat-model-summary-card />
            </b-col>
        </b-row>

        <!-- Description -->
        <b-row class="mb-4">
            <b-col>
                <b-card
                    :header="$t('threatmodel.description')">
                    <b-row class="tm-card">
                        <b-col>
                            <p id="tm_description">{{ model.summary.description }}</p>
                        </b-col>
                    </b-row>
                </b-card>
            </b-col>
        </b-row>

        <!-- DFD summary -->
        <b-row class="mb-4">
            <b-col>
                <div class="td-dfd-summary" role="region" aria-label="DFD summary">
                    <span class="td-dfd-summary-label">Total:</span>
                    <strong>{{ dfdStats.total }}</strong>
                    <span class="td-dfd-summary-label">Tested:</span>
                    <strong>{{ dfdStats.tested }}</strong>
                    <span class="td-dfd-summary-label">Not tested:</span>
                    <strong>{{ dfdStats.notTested }}</strong>
                    <span class="td-dfd-summary-label">Completion:</span>
                    <strong>{{ dfdStats.completion }}%</strong>
                </div>
            </b-col>
        </b-row>

        <!-- Diagrams -->
        <b-row class="mb-4">
            <b-col
                class="tm_diagram"
                lg="3"
                v-for="(diagram, idx) in model.detail.diagrams"
                :key="idx"
            >
                <b-card>
                    <template #header>
                        <h6 class="diagram-header-text">
                            <a href="javascript:void(0)" @click="editDiagram(diagram)" class="diagram-edit">
                                {{ diagram.title }}
                            </a>
                        </h6>
                    </template>
                    <a href="javascript:void(0)" @click="editDiagram(diagram)">
                        <!-- "thumbnail": "./public/content/images/thumbnail.jpg", -->                        <b-img-lazy
                            class="m-auto d-block td-diagram-thumb"
                            :src="require(`../assets/${diagram.thumbnail ? diagram.thumbnail.split('/').pop() : 'thumbnail.jpg'}`)"
                            :alt="diagram.title" />
                    </a>
                    <h6 v-if=diagram.description class="diagram-description-text">
                        {{ diagram.description }}
                    </h6>
                </b-card>
            </b-col>
        </b-row>
        <b-row>
            <b-col class="text-right">
                <b-btn-group>
                    <td-form-button
                        id="td-edit-btn"
                        :isPrimary="true"
                        :onBtnClick="onEditClick"
                        icon="edit"
                        :text="$t('forms.edit')" />
                    <td-form-button
                        id="td-report-btn"
                        :onBtnClick="onReportClick"
                        icon="file-alt"
                        :text="$t('forms.report')" />
                    <td-form-button
                        id="td-close-btn"
                        :onBtnClick="onCloseClick"
                        icon="times"
                        :text="$t('forms.closeModel')" />
                </b-btn-group>
            </b-col>
        </b-row>
    </div>
</template>

<style lang="scss" scoped>
.tm-card {
    font-size: 14px;
    white-space: pre-wrap;
}
.diagram-header-text a {
    color: $black;
}

.diagram-description-text a {
    color: $black;
}

.td-diagram-thumb {
    max-width: 200px;
    max-height: 160px;
}

.td-dfd-summary {
    display: flex;
    align-items: center;
    gap: 18px;
    border-top: 4px solid $danger;
    border-radius: 4px;
    padding: 14px 16px;
    background-color: $white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    font-size: 18px;
}

.td-dfd-summary-label {
    color: $info;
    font-weight: 600;
}
</style>

<script>
import { mapState } from 'vuex';

import { getProviderType } from '@/service/provider/providers.js';
import TdFormButton from '@/components/FormButton.vue';
import TdThreatModelSummaryCard from '@/components/ThreatModelSummaryCard.vue';
import tmActions from '@/store/actions/threatmodel.js';

export default {
    name: 'ThreatModel',
    components: {
        TdFormButton,
        TdThreatModelSummaryCard
    },
    computed: mapState({
        model: (state) => state.threatmodel.data,
        providerType: (state) => getProviderType(state.provider.selected),
        version: (state) => state.packageBuildVersion,
        dfdStats() {
            const threats = (this.model.detail.diagrams || []).flatMap(diagram =>
                (diagram.cells || []).flatMap(cell => cell.data && Array.isArray(cell.data.threats) ? cell.data.threats : [])
            );
            const tested = threats.filter(threat =>
                threat.testedOn && (threat.status === 'Mitigated' ||
                    (threat.status === 'Open' && threat.severity !== 'TBD'))
            ).length;
            const total = threats.length;

            return {
                total,
                tested,
                notTested: total - tested,
                completion: total > 0 ? Math.round((tested / total) * 100) : 0
            };
        }
    }),
    methods: {
        onEditClick(evt) {
            evt.preventDefault();
            this.$router.push({ name: `${this.providerType}ThreatModelEdit`, params: this.$route.params });
        },
        onReportClick(evt) {
            evt.preventDefault();
            this.$router.push({ name: `${this.providerType}Report`, params: this.$route.params });
        },
        onCloseClick(evt) {
            evt.preventDefault();
            this.$store.dispatch(tmActions.clear);
            this.$router.push('/dashboard');
        },
        getThumbnailUrl(diagram) {
            if (!diagram || !diagram.diagramType) {
                return '../assets/thumbnail.jpg';
            }
            return `../assets/thumbnail.${diagram.diagramType.toLowerCase()}.jpg`;
        },
        editDiagram(diagram) {
            this.$store.dispatch(tmActions.diagramSelected, diagram);
            const path = `${this.$route.path}/edit/${encodeURIComponent(diagram.title)}`;
            this.$router.push(path);
        }
    },
    mounted() {
        // make sure we are compatible with version 1.x and early 2.x
        let threatTop = this.model.detail.threatTop === undefined ? 100 : this.model.detail.threatTop;
        let diagramTop = this.model.detail.diagramTop === undefined ? 10 : this.model.detail.diagramTop;
        let update = { diagramTop: diagramTop, version: this.version, threatTop: threatTop };
        console.debug('updates: ' + JSON.stringify(update));
        this.$store.dispatch(tmActions.update, update);
        // if a diagram has just been closed, the history insists on marking the model as modified
        this.$store.dispatch(tmActions.notModified);
    }
};
</script>
