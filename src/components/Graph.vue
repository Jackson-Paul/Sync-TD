<template>
    <div>
        <!-- Summary Bar -->
        <div class="td-summary-bar">
            <span class="td-summary-label">Total:</span>
            <span class="td-summary-value">{{ threadStats.total }}</span>
            <span class="td-summary-label">Tested:</span>
            <span class="td-summary-value">{{ threadStats.tested }}</span>
            <span class="td-summary-label">Not tested:</span>
            <span class="td-summary-value">{{ threadStats.notTested }}</span>
            <span class="td-summary-label">Completion:</span>
            <span class="td-summary-value">{{ threadStats.completion }}%</span>
            <span class="td-summary-label">Target:</span>
            <input type="number" min="1" v-model.number="userTargetDays" class="td-summary-input" style="width:60px;" />
            <span class="td-summary-label">days</span>
            <span class="td-summary-label">Started:</span>
            <input type="date" v-model="userStartedDate" class="td-summary-input" style="width:140px;" />
            <span class="td-summary-label">Remaining:</span>
            <span class="td-summary-value">{{ timeStats.remainingDays }} days pending</span>
        </div>
    <b-row>
            <b-col md="2">
                <div ref="stencil_container"></div>
            </b-col>
            <b-col md="10">
                <b-row>
                    <b-col>
                        <h3 class="td-graph-title">{{ diagram.title }}</h3>
                    </b-col>
                    <b-col align="right">
                        <td-graph-buttons
                            :graph="graph"
                            @saved="saved"
                            @closed="closed"
                            @toolColorChanged="setToolColor"
                        />
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <div
                            id="graph-container"
                            ref="graph_container"
                        ></div>
                    </b-col>
                </b-row>
            </b-col>
        </b-row>
        <td-graph-meta @threatSelected="threatSelected" @threatSuggest="threatSuggest" />

        <div>
            <td-keyboard-shortcuts />
            <td-threat-edit-dialog ref="threatEditDialog" />
            <td-threat-suggest-dialog ref="threatSuggestDialog" />
        </div>

                <div
                    v-if="showReminder"
                    class="custom-reminder-notification"
                >
                    <span style="flex: 1;">Remember to save your work regularly!</span>
                    <button class="custom-reminder-close" @click="closeReminder">Close</button>
                </div>
    </div>
</template>

<style lang="scss" scoped>
.td-summary-bar {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    background: #fff;
    border: 2px solid #7a75751f;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    font-size: 0.97rem;
    font-weight: 500;
    margin-bottom: 18px;
    padding: 10px 124px;
    gap: 12px;
}
.td-summary-label {
    color: #0b7bb0;
    font-weight: 700;
    margin-right: 4px;
}
.td-summary-value {
    color: #222;
    font-weight: 700;
    margin-right: 16px;
}
.td-graph-title {
    margin-right: 15px;
}
.td-summary-input {
    font-size: 0.97rem;
    font-weight: 600;
    margin: 0 8px;
    padding: 2px 6px;
    border: 1px solid #e92f2f;
    border-radius: 4px;
    width: 60px;
}

// Fix workspace area always fills available space
    /* No font-size override */
.b-row {
    min-height: 60vh;
    height: 100%;
}
.b-col {
    /* No font-size override */
    height: 100%;
    display: flex;
    font-size: 1em;
}
.b-row {
    min-height: 60vh;
    height: 100%;
}
.b-col {
    height: 100%;
    display: flex;
    flex-direction: column;
}
#graph-container {
    height: 65vh;
    min-height: 60vh;
    width: 100%;
    flex: 1;
    background: #fff;
}
.custom-reminder-notification {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 340px;
  max-width: 600px;
  background: #fff;
  color: #120e02ff;
  border: 2px solid #e92f2fff;
  border-radius: 8px;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  font-family: inherit;
  font-size: 22px;
  font-weight: 500;
}
.custom-reminder-close {
  background: #fff;
  border: 2px solid #6d4c00;
  color: #222;
  font-weight: 600;
  margin-left: 24px;
  cursor: pointer;
  font-size: 18px;
  padding: 2px 16px;
  border-radius: 4px;
  transition: background 0.2s, border 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.custom-reminder-close:hover {
  background: #648de1ff;
  border: 2px solid #222;
}
</style>

<script>
import TdGraphButtons from '@/components/GraphButtons.vue';
import TdGraphMeta from '@/components/GraphMeta.vue';
import TdKeyboardShortcuts from '@/components/KeyboardShortcuts.vue';
import TdThreatEditDialog from '@/components/ThreatEditDialog.vue';
import TdThreatSuggestDialog from './ThreatSuggestDialog.vue';

import diagramService from '@/service/migration/diagram.js';
import stencil from '@/service/x6/stencil.js';
import tmActions from '@/store/actions/threatmodel.js';

export default {
    name: 'TdGraph',
    components: {
        TdGraphButtons,
        TdGraphMeta,
        TdKeyboardShortcuts,
        TdThreatEditDialog,
        TdThreatSuggestDialog
    },
    computed: {
        diagram() {
            return this.$store.state.threatmodel.selectedDiagram;
        },
        providerType() {
            const selected = this.$store.state.provider.selected;
            return selected && selected.type ? selected.type : '';
        },
        threadStats() { 
            if (!this.diagram || !Array.isArray(this.diagram.cells)) {
                return {
                    total: 0,
                    tested: 0,
                    notTested: 0,
                    completion: 0,
                    bugTotal: 0,
                    bugCompleted: 0,
                    bugNotCompleted: 0
                };
            }

            // Flatten all threats from diagram cells into a single array
            const threats = this.diagram.cells.reduce((arr, cell) => {
                if (cell.data && Array.isArray(cell.data.threats)) {
                    return arr.concat(cell.data.threats);
                }
                return arr;
            }, []);

            if (!threats || threats.length === 0) {
                return {
                    total: 0,
                    tested: 0,
                    notTested: 0,
                    completion: 0,
                    bugTotal: 0,
                    bugCompleted: 0,
                    bugNotCompleted: 0
                };
            }
        
            // Calculate stats from workspace threats
            const total = threats.length;
            const tested = threats.filter(
                t => (t.status === 'Mitigated' && t.testedOn) || (t.status === 'Open' && t.testedOn && t.severity !== 'TBD')
            ).length;
            const notTested = Math.round(total - tested);
            const completion = total > 0 ? Math.round((tested / total) * 100) : 0;
        
            return {
                total,
                tested,
                notTested,
                completion,
                bugTotal: 0,
                bugCompleted: 0,
                bugNotCompleted: 0
            };
        },
        timeStats() {
            const targetDays = this.userTargetDays > 0 ? this.userTargetDays : 1;
            let remainingDays = targetDays;
            let startedAt = this.userStartedDate;
            if (startedAt) {
                const startDate = new Date(startedAt);
                const now = new Date();
                const diffMs = now.setHours(0,0,0,0) - startDate.setHours(0,0,0,0);
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                remainingDays = Math.max(targetDays - diffDays, 0);
                startedAt = startDate.toLocaleDateString();
            } else {
                startedAt = 'Not set';
                remainingDays = targetDays;
            }
            return { targetDays, remainingDays, startedAt };
        }
    },
    data() {
        return {
            graph: null,
            showReminder: true, // notification shown by default
            reminderIntervalId: null, // store interval id
            userTargetDays: 0,
            userStartedDate: '',
        };
    },
        watch: {
            diagram: {
                immediate: true,
                handler(newDiagram) {
                    if (newDiagram) {
                        this.userTargetDays = newDiagram.userTargetDays;
                        this.userStartedDate = newDiagram.userStartedDate || '';
                    }
                }
            }
        },
    created() {
    // ...existing code...
    },
    mounted() {
        this.init();
    // Set diagram background color from diagram.color or default to white
    const diagramColor = this.diagram.color || '#fdfcfc';
    this.setToolColor(diagramColor);
        // Always show the reminder on mount
        this.showReminder = true;
        // Show reminder every 5 minutes, even if user closes it
        this.reminderIntervalId = window.setInterval(() => {
            this.showReminder = false;
            this.$nextTick(() => {
                this.showReminder = true;
            });
        }, 5 * 60 * 1000); // 5 minutes
    },
    methods: {
        init() {
            this.graph = diagramService.edit(this.$refs.graph_container, this.diagram);
            stencil.get(this.graph, this.$refs.stencil_container);
            this.$store.dispatch(tmActions.notModified);
            this.graph.getPlugin('history').on('change', () => {
                const updated = Object.assign({}, this.diagram);
                // Replace cells array to ensure Vue reactivity
                updated.cells = [...this.graph.toJSON().cells];
                this.$store.dispatch(tmActions.diagramModified, updated);
                this.$forceUpdate();
            });
        },
        threatSelected(threatId,state) {
            this.$refs.threatEditDialog.editThreat(threatId,state);
        },
        threatSuggest(type){
            this.$refs.threatSuggestDialog.showModal(type);
        },
        setToolColor(color) {
            // Change the background color of the diagram area
            const container = this.$refs.graph_container;
            if (container) {
                container.style.background = color;
            }
        },
        saved() {
            // ...existing code...
            const updated = Object.assign({}, this.diagram);
            updated.cells = this.graph.toJSON().cells;
            // Save Target and Started fields with DFD JSON
            updated.userTargetDays = this.userTargetDays;
            updated.userStartedDate = this.userStartedDate;
            this.$store.dispatch(tmActions.diagramSaved, updated);
            this.$store.dispatch(tmActions.saveModel);
            // Save reminder notification removed
            localStorage.setItem('showReminder', 'false');
            localStorage.setItem('reminderCountdown', 300);
        },
        async closed() {
            if (!this.$store.getters.modelChanged || await this.getConfirmModal()) {
                await this.$store.dispatch(tmActions.diagramClosed);
                // Fallback: go back one step in history (reliable if route name is unknown)
                this.$router.go(-1);
            }
        },
        getConfirmModal() {
            return this.$bvModal.msgBoxConfirm(this.$t('forms.discardMessage'), {
                title: this.$t('forms.discardTitle'),
                okVariant: 'danger',
                okTitle: this.$t('forms.ok'),
                cancelTitle: this.$t('forms.cancel'),
                hideHeaderClose: true,
                centered: true
            });
        },
        closeReminder() {
            this.showReminder = false;
        },
    },
    
    destroyed() {
        diagramService.dispose(this.graph);
        if (this.reminderIntervalId) {
            clearInterval(this.reminderIntervalId);
            this.reminderIntervalId = null;
        }
    }
};
</script>