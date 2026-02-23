<template>
  <div>
    <!-- Summary Bar -->
    <div class="td-summary-bar" :class="{ 'is-collapsed': isCollapsed }" role="region" aria-label="Summary bar">
      <div id="td-summary-content" class="td-summary-content">
        <span class="td-summary-label">Total:</span>
        <span class="td-summary-value">{{ threadStats.total }}</span>
        <span class="td-summary-label">Tested:</span>
        <span class="td-summary-value">{{ threadStats.tested }}</span>
        <span class="td-summary-label">Not tested:</span>
        <span class="td-summary-value">{{ threadStats.notTested }}</span>
        <span class="td-summary-label">Completion:</span>
        <span class="td-summary-value">{{ threadStats.completion }}%</span>
        <span class="td-summary-label">Target days:</span>
        <input type="number" min="1" v-model.number="userTargetDays" class="td-summary-input" style="width:60px;" />
        <span class="td-summary-label">Started:</span>
        <input type="date" v-model="userStartedDate" class="td-summary-input" style="width:140px;" />
        <span class="td-summary-label">Remaining:</span>
        <span class="td-summary-value">{{ timeStats.remainingDays }} days pending</span>
        <button class="btn btn-sm btn-outline-primary td-import-btn" @click="openImportModal" :title="$t('threatmodel.importThreats.title')">
          <font-awesome-icon icon="upload" class="mr-1"></font-awesome-icon>
          {{ $t('threatmodel.importThreats.title') }}
        </button>
        <button class="btn btn-sm btn-outline-success td-export-btn" @click="openExportModal" :title="$t('threatmodel.exportThreats.tooltip')">
          <font-awesome-icon icon="download" class="mr-1"></font-awesome-icon>
          {{ $t('threatmodel.exportThreats.title') }}
        </button>
        <button class="btn btn-sm btn-outline-info td-import-process-btn" @click="openProcessImportModal" :title="$t('threatmodel.importProcesses.title')">
          <font-awesome-icon icon="plus" class="mr-1"></font-awesome-icon>
          {{ $t('threatmodel.importProcesses.title') }}
        </button>
      </div>

      <!-- ⬇️ Keep your button; bind aria-expanded for accessibility -->
      <button
        class="td-summary-toggle"
        :aria-expanded="(!isCollapsed).toString()"
        aria-controls="td-summary-content"
        title="Collapse/Expand summary"
        @click="isCollapsed = !isCollapsed"
      >
        {{ isCollapsed ? '▸' : '▾' }}
      </button>
    </div>

    <b-row>
      <b-col md="2">
        <div class="td-left-sidebar">
          <div ref="stencil_container"></div>
        </div>
      </b-col>
      <b-col md="10">
        <b-row>
          <b-col>
            <h3 class="td-graph-title">{{ diagram.title }}</h3>
          </b-col>
          <b-col align="right">
            <td-graph-buttons :graph="graph" @saved="saved" @closed="closed" @toolColorChanged="setToolColor" />
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <div id="graph-container" ref="graph_container"></div>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
    <td-graph-meta @threatSelected="threatSelected" @threatSuggest="threatSuggest" />

    <div>
      <td-keyboard-shortcuts />
      <td-threat-edit-dialog ref="threatEditDialog" />
      <td-threat-suggest-dialog ref="threatSuggestDialog" />
      <td-threat-import-modal ref="threatImportModal" @import-threats="handleImportThreats" />
      <td-threat-export-modal ref="threatExportModal" :diagram="diagram" />
      <td-process-import-modal ref="processImportModal" @import-processes="handleImportProcesses" />
    </div>

    <div v-if="showReminder" class="custom-reminder-notification">
      <span style="flex: 1;">Remember to save your work regularly!</span>
      <button class="custom-reminder-close" @click="closeReminder">Close</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Base bar styles (original look + grid layout to prevent clipping) */
.td-summary-bar {
  position: sticky; /* sticky by default */
  top: 0;
  z-index: 1000;

  /* ✅ Use grid so content and toggle don't overlap */
  display: grid;
  grid-template-columns: 1fr auto; /* content grows, toggle stays */
  align-items: center;

  background: #fff;
  border: 2px solid #7a75751f;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-size: 0.98rem;
  font-weight: 500;
  margin-bottom: 18px;
  padding: 10px 12px; /* ⬅️ removed large right padding that caused clipping */
  column-gap: 12px;   /* space between content and toggle */
  overflow: visible;  /* allow dropdown shadows/menus to render */
}

/* Fixed variant (if you set isFixed=true) */
.td-summary-bar.td-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  margin: 0;
  border-radius: 0; /* optional */
}

/* Horizontal content layout */
.td-summary-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;

  /* Smooth collapse */
  transition: max-height 0.25s ease, opacity 0.25s ease;
  overflow: hidden;
  max-height: 240px; /* ensure this is >= your actual content height */

  /* ✅ Let this area shrink and wrap instead of clipping */
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: wrap; /* ⬅️ was nowrap */
}

.td-summary-content > * {
  width: auto;
  white-space: nowrap; /* keep inline controls from splitting */
}

/* Collapsed state */
.td-summary-bar.is-collapsed .td-summary-content {
  max-height: 0;
  opacity: 0;
}

/* Toggle button */
.td-summary-toggle {
  appearance: none;
  border: 1px solid #d0d0d0;
  background: #f7f7f7;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-weight: 600;
  color: #333;
}
.td-summary-toggle:focus {
  outline: 2px solid #5b9dd9;
  outline-offset: 2px;
}

/* Spacer used only for fixed variant */
#td-summary-spacer {
  height: 0;
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
  font-size: 0.98rem;
  font-weight: 600;
  margin: 0 8px;
  padding: 2px 6px;
  border: 1px solid #e92f2f;
  border-radius: 4px;
  width: 60px;
}

/* Workspace layout */
.b-row {
  min-height: 60vh;
  height: 100%;
}
.b-col {
  height: 100%;
  display: flex;
  font-size: 1em;
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

.td-left-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px;
}

/* --- Elegant, Medium-Sized Button Style --- */

.td-summary-content .btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  /* softer look */
  padding: 6px 12px;               /* slightly narrower to reduce crowding */
  font-size: 0.85rem;
  font-weight: 600;

  border-radius: 6px;              /* smoother corners */
  border-width: 1.5px;             /* slimmer border */
  background: #fff;
  transition: all 0.18s ease-in-out;

  box-shadow: 0 1px 3px rgba(0,0,0,0.06);  /* elegant subtle shadow */
}

/* Primary (Import) */
.td-import-btn {
  border-color: #0b7bb0;
  color: #0b7bb0;
}
.td-import-btn:hover {
  background: #0b7bb0;
  color: white;
}

/* Success (Export) */
.td-export-btn {
  border-color: #28a745;
  color: #28a745;
}
.td-export-btn:hover {
  background: #28a745;
  color: white;
}

/* Info (Import Processes) */
.td-import-process-btn {
  border-color: #17a2b8;
  color: #17a2b8;
}
.td-import-process-btn:hover {
  background: #17a2b8;
  color: white;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.custom-reminder-close:hover {
  background: #648de1ff;
  border: 2px solid #222;
}

/* Optional: tighten spacing on narrower viewports */
@media (max-width: 1200px) {
  .td-summary-content { gap: 8px; }
  .td-summary-input { width: 110px; } /* date input width */
}
@media (max-width: 992px) {
  .td-summary-content { gap: 6px; }
  .td-summary-input { width: 100px; }
}
</style>

<script setup>
import { ref } from 'vue';
/* ⬇️ local reactive state to control collapse */
const isCollapsed = ref(false);
</script>

<script>
import TdGraphButtons from '@/components/GraphButtons.vue';
import TdGraphMeta from '@/components/GraphMeta.vue';
import TdKeyboardShortcuts from '@/components/KeyboardShortcuts.vue';
import TdThreatEditDialog from '@/components/ThreatEditDialog.vue';
import TdThreatSuggestDialog from './ThreatSuggestDialog.vue';
import TdThreatImportModal from '@/components/ThreatImportModal.vue';
import TdThreatExportModal from '@/components/ThreatExportModal.vue';
import TdProcessImportModal from '@/components/ProcessImportModal.vue';

import diagramService from '@/service/migration/diagram.js';
import stencil from '@/service/x6/stencil.js';
import tmActions from '@/store/actions/threatmodel.js';
import threatImportService from '@/service/threatImportService.js';
import processImportService from '@/service/processImportService.js';

export default {
  name: 'TdGraph',
  components: {
    TdGraphButtons,
    TdGraphMeta,
    TdKeyboardShortcuts,
    TdThreatEditDialog,
    TdThreatSuggestDialog,
    TdThreatImportModal,
    TdThreatExportModal,
    TdProcessImportModal
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
        const diffMs = now.setHours(0, 0, 0, 0) - startDate.setHours(0, 0, 0, 0);
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
      showReminder: false,
      reminderIntervalId: null,
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
  mounted() {
    this.init();
    const diagramColor = this.diagram.color || '#fdfcfc';
    this.setToolColor(diagramColor);
    this.showReminder = false;
    this.reminderIntervalId = window.setInterval(() => {
      this.showReminder = false;
      this.$nextTick(() => {
        this.showReminder = true;
      });
    }, 5 * 60 * 1000);
  },
  methods: {
    init() {
      this.graph = diagramService.edit(this.$refs.graph_container, this.diagram);
      stencil.get(this.graph, this.$refs.stencil_container);
      this.$store.dispatch(tmActions.notModified);
      this.graph.getPlugin('history').on('change', () => {
        const updated = Object.assign({}, this.diagram);
        updated.cells = [...this.graph.toJSON().cells];
        this.$store.dispatch(tmActions.diagramModified, updated);
        this.$forceUpdate();
      });
    },
    threatSelected(threatId, state) {
      this.$refs.threatEditDialog.editThreat(threatId, state);
    },
    threatSuggest(type) {
      this.$refs.threatSuggestDialog.showModal(type);
    },
    openImportModal() {
      this.$refs.threatImportModal.showModal();
    },
    openExportModal() {
      this.$refs.threatExportModal.showModal();
    },
    openProcessImportModal() {
      this.$refs.processImportModal.showModal();
    },
    handleImportProcesses(payload) {
      const { data } = payload;
      const diagram = this.diagram;
      if (!diagram) {
        this.$toast.error('No diagram selected');
        return;
      }
      const history = this.graph.getPlugin('history');
      let importResult;
      if (history && history.batch) {
        history.batch(() => {
          importResult = processImportService.importProcesses(diagram, data);
          if (importResult.matched.length > 0) {
            this.graph.fromJSON(diagram);
          }
          const updated = Object.assign({}, diagram);
          updated.cells = [...this.graph.toJSON().cells];
          this.$store.dispatch(tmActions.diagramModified, updated);
          this.$store.dispatch(tmActions.modified);
        });
      } else {
        importResult = processImportService.importProcesses(diagram, data);
        if (importResult.matched.length > 0) {
          this.graph.fromJSON(diagram);
        }
        const updated = Object.assign({}, diagram);
        updated.cells = [...this.graph.toJSON().cells];
        this.$store.dispatch(tmActions.diagramModified, updated);
        this.$store.dispatch(tmActions.modified);
      }
      if (importResult.matched.length > 0) {
        this.$toast.success(`Imported ${importResult.matched.length} process(es)`);
      }
      if (importResult.errors.length > 0) {
        const msg = importResult.errors.length === 1
          ? importResult.errors[0]
          : `${importResult.errors.length} error(s) occurred during import`;
        this.$toast.error(msg);
      }
      this.$forceUpdate();
    },
    handleImportThreats(payload) {
      const { data } = payload;
      const diagram = this.diagram;
      if (!diagram) {
        this.$toast.error('No diagram selected');
        return;
      }
      const history = this.graph.getPlugin('history');
      let importResult;
      if (history && history.batch) {
        history.batch(() => {
          importResult = threatImportService.importThreats(diagram, data);
          const updated = Object.assign({}, diagram);
          updated.cells = [...this.graph.toJSON().cells];
          this.$store.dispatch(tmActions.diagramModified, updated);
          this.$store.dispatch(tmActions.modified);
        });
      } else {
        importResult = threatImportService.importThreats(diagram, data);
        const updated = Object.assign({}, diagram);
        updated.cells = [...this.graph.toJSON().cells];
        this.$store.dispatch(tmActions.diagramModified, updated);
        this.$store.dispatch(tmActions.modified);
      }
      if (importResult.matched.length > 0) {
        this.$toast.success(`Imported ${importResult.matched.length} threat(s)`);
      }
      if (importResult.unmatched.length > 0) {
        const msg = `${importResult.unmatched.length} threat(s) could not be matched and were skipped`;
        this.$toast.warning(msg);
      }
      if (importResult.errors.length > 0) {
        this.$toast.error(`${importResult.errors.length} error(s) occurred during import`);
      }
      this.$forceUpdate();
    },
    setToolColor(color) {
      const container = this.$refs.graph_container;
      if (container) {
        container.style.background = color;
      }
    },
    saved() {
      const updated = Object.assign({}, this.diagram);
      updated.cells = this.graph.toJSON().cells;
      updated.userTargetDays = this.userTargetDays;
      updated.userStartedDate = this.userStartedDate;
      this.$store.dispatch(tmActions.diagramSaved, updated);
      this.$store.dispatch(tmActions.saveModel);
      localStorage.setItem('showReminder', 'false');
      localStorage.setItem('reminderCountdown', 300);
    },
    async closed() {
      if (!this.$store.getters.modelChanged || await this.getConfirmModal()) {
        await this.$store.dispatch(tmActions.diagramClosed);
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