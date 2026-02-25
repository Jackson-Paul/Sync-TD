<template>
  <div>
    <!-- Summary Bar -->
    <!-- ⬇️ ADDED :class binding so the collapse CSS can apply -->
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
        <button class="btn btn-sm btn-outline-primary td-import-btn" @click="openImportModal"
          :title="$t('threatmodel.importThreats.title')">
          <font-awesome-icon icon="upload" class="mr-1"></font-awesome-icon>
          {{ $t('threatmodel.importThreats.title') }}
        </button>
        <button class="btn btn-sm btn-outline-success td-export-btn" @click="openExportModal"
          :title="$t('threatmodel.exportThreats.tooltip')">
          <font-awesome-icon icon="download" class="mr-1"></font-awesome-icon>
          {{ $t('threatmodel.exportThreats.title') }}
        </button>
        <button class="btn btn-sm btn-outline-info td-import-process-btn" @click="openProcessImportModal"
          :title="$t('threatmodel.importProcesses.title')">
          <font-awesome-icon icon="plus" class="mr-1"></font-awesome-icon>
          {{ $t('threatmodel.importProcesses.title') }}
        </button>
      </div>

      <!-- ⬇️ Keep your button; bind aria-expanded for accessibility -->
      <button class="td-summary-toggle" :aria-expanded="(!isCollapsed).toString()" aria-controls="td-summary-content"
        title="Collapse/Expand summary" @click="isCollapsed = !isCollapsed">
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

    <!-- ✅ Redesigned reminder toast (non-intrusive, auto-hide, accessible) -->
    <div v-if="showReminder" class="save-toast" role="status" aria-live="polite" @mouseenter="pauseToast"
      @mouseleave="resumeToast">
      <div class="save-toast__icon" aria-hidden="true">💾</div>
      <div class="save-toast__body">
        <div class="save-toast__title">Remember to save your work</div>
        <div class="save-toast__text">Unsaved changes may be lost.</div>
        <div class="save-toast__progress">
          <div class="save-toast__bar" role="progressbar" :aria-valuemin="0" :aria-valuemax="100"
            :aria-valuenow="toastPaused ? undefined : undefined"></div>
        </div>
      </div>
      <button class="save-toast__close" @click="closeReminder" aria-label="Dismiss reminder">✕</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Base bar styles (original look + grid layout to prevent clipping) */
.td-summary-bar {
  position: sticky;
  /* sticky by default */
  top: 0;
  z-index: 1000;

  /* grid so content and toggle don't overlap */
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;

  background: #fff;
  border: 2px solid #7a75751f;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-size: 0.98rem;
  font-weight: 500;
  margin-bottom: 18px;
  padding: 10px 12px;
  column-gap: 12px;
  overflow: visible;
}

/* Fixed variant (if you set isFixed=true) */
.td-summary-bar.td-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  margin: 0;
  border-radius: 0;
  /* optional */
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
  max-height: 240px;
  /* ensure this is >= your actual content height */

  /* Let this area shrink and wrap instead of clipping */
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.td-summary-content>* {
  width: auto;
  white-space: nowrap;
  /* keep inline controls from splitting */
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

/* --- Buttons in summary bar --- */
.td-summary-content .btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 6px;
  border-width: 1.5px;
  background: #fff;
  transition: all 0.18s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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

/* ===============================
   ✅ Redesigned Save Reminder Toast
   =============================== */
.save-toast {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1100;

  display: flex;
  align-items: flex-start;
  gap: 12px;

  min-width: 280px;
  max-width: 360px;

  background: #ffffff;
  color: #1f2328;
  border: 1px solid rgba(12, 12, 13, 0.08);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  padding: 12px 12px 10px 12px;

  animation: toast-in 160ms ease-out both;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translate3d(0, 12px, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.save-toast__icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: #e7f3ff;
  color: #0b7bb0;
  display: grid;
  place-items: center;
  font-size: 16px;
  user-select: none;
  flex: 0 0 auto;
}

.save-toast__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1 1 auto;
}

.save-toast__title {
  font-weight: 700;
  font-size: 14px;
  line-height: 1.2;
}

.save-toast__text {
  font-size: 13px;
  color: #4a4f55;
}

.save-toast__progress {
  margin-top: 6px;
  height: 3px;
  width: 100%;
  background: #eef1f4;
  border-radius: 999px;
  overflow: hidden;
}

.save-toast__bar {
  height: 100%;
  background: linear-gradient(90deg, #0b7bb0, #28a745);
  width: 0%;
  transition: width 120ms linear;
}

.save-toast__close {
  appearance: none;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 16px;
  padding: 2px;
  margin-left: 4px;
  line-height: 1;
  cursor: pointer;
  border-radius: 6px;
}

.save-toast__close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #111827;
}

.save-toast__close:focus {
  outline: 2px solid #5b9dd9;
  outline-offset: 2px;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .save-toast {
    animation: none;
  }

  .save-toast__bar {
    transition: none;
  }
}

/* Optional dark mode (if body/class toggles a dark theme) */
:deep(.dark) .save-toast,
:deep([data-theme="dark"]) .save-toast {
  background: #1f2937;
  color: #e5e7eb;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

:deep(.dark) .save-toast__icon,
:deep([data-theme="dark"]) .save-toast__icon {
  background: #083B55;
  color: #b9e6ff;
}

:deep(.dark) .save-toast__text,
:deep([data-theme="dark"]) .save-toast__text {
  color: #cbd5e1;
}

:deep(.dark) .save-toast__progress,
:deep([data-theme="dark"]) .save-toast__progress {
  background: #334155;
}

.save-toast__bar {
  height: 100%;
  background: linear-gradient(90deg, #0b7bb0, #28a745);
  width: 0%;
  animation: toast-progress var(--toast-duration, 6000ms) linear forwards;
}

@keyframes toast-progress {
  from {
    width: 0%;
  }

  to {
    width: 100%;
  }
}

/* Pause animation on hover of toast */
.save-toast:hover .save-toast__bar {
  animation-play-state: paused;
}
</style>

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
      // Graph & UI
      graph: null,
      isCollapsed: false,

      // Reminder toast state
      showReminder: false,
      progress: 0,
      toastPaused: false,
      reminderIntervalId: null,
      toastTimerId: null,
      toastTickId: null,

      // Toast timing (ms)
      TOAST_DURATION_MS: 6000, // total visible time
      // TICK_MS: 120,            // UI refresh cadence

      // User inputs
      userTargetDays: 0,
      userStartedDate: ''
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
    },
    // When the toast becomes visible, start its timers; when hidden, clear them.
    showReminder(val) {
      if (val) {
        this.startToastTimers();
      } else {
        this.clearToastTimers();
      }
    }
  },
  mounted() {
    this.init();

    const diagramColor = (this.diagram && this.diagram.color) || '#fdfcfc';
    this.setToolColor(diagramColor);

    this.showReminder = false;

    // Show reminder periodically (NOTE: set to 1000ms per your pasted code; change to 300000 for 5 minutes)
    this.reminderIntervalId = window.setInterval(() => {
      // Toggle to restart the toast and progress
      this.showReminder = false;
      this.$nextTick(() => {
        this.progress = 0;      // reset bar
        this.toastPaused = false;
        this.showReminder = true;
      });
    }, 5* 60 * 1000);
  },
  beforeDestroy() {
    diagramService.dispose(this.graph);
    if (this.reminderIntervalId) {
      clearInterval(this.reminderIntervalId);
      this.reminderIntervalId = null;
    }
    this.clearToastTimers();
  },
  methods: {
    /* =====================
       Graph & App Methods
       ===================== */
    init() {
      this.graph = diagramService.edit(this.$refs.graph_container, this.diagram);
      stencil.get(this.graph, this.$refs.stencil_container);
      this.$store.dispatch(tmActions.notModified);
      const history = this.graph.getPlugin('history');
      if (history && typeof history.on === 'function') {
        history.on('change', () => {
          const updated = Object.assign({}, this.diagram);
          updated.cells = [...this.graph.toJSON().cells];
          this.$store.dispatch(tmActions.diagramModified, updated);
          this.$forceUpdate();
        });
      }
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

    /* =====================
   Toast & Reminder (CSS-animation driven)
   ===================== */
    startToastTimers() {
      this.clearToastTimers();

      // Ensure DOM for the toast is mounted before touching elements
      this.$nextTick(() => {
        const bar = this.$el && this.$el.querySelector('.save-toast__bar');
        if (bar) {
          // Set/update the CSS variable for duration (must match TOAST_DURATION_MS)
          bar.style.setProperty('--toast-duration', `${this.TOAST_DURATION_MS}ms`);

          // Restart the CSS animation from 0 -> 100
          bar.style.animation = 'none';
          // Force reflow so the browser registers the change
          // eslint-disable-next-line no-unused-expressions
          bar.offsetWidth;
          bar.style.animation = '';
          // Ensure running state at start
          bar.style.animationPlayState = 'running';
        }

        // Timing bookkeeping for precise pause/resume
        this.toastPaused = false;
        this._toastStartTs = Date.now();                 // when current run started
        this._toastRemainingMs = this.TOAST_DURATION_MS; // countdown we’ll adjust on pause

        // Single timeout to auto-dismiss
        this.toastTimerId = window.setTimeout(() => {
          this.closeReminder();
        }, this._toastRemainingMs);
      });
    },

    clearToastTimers() {
      if (this.toastTimerId) {
        clearTimeout(this.toastTimerId);
        this.toastTimerId = null;
      }
    },

    pauseToast() {
      if (this.toastPaused) return;
      this.toastPaused = true;

      const bar = this.$el && this.$el.querySelector('.save-toast__bar');
      if (bar) {
        bar.style.animationPlayState = 'paused';
      }

      if (this._toastStartTs) {
        const elapsed = Date.now() - this._toastStartTs;
        this._toastRemainingMs = Math.max(0, this._toastRemainingMs - elapsed);
      }

      this.clearToastTimers();
    },

    resumeToast() {
      if (!this.toastPaused) return;
      this.toastPaused = false;

      const bar = this.$el && this.$el.querySelector('.save-toast__bar');
      if (bar) {
        bar.style.animationPlayState = 'running';
      }

      this._toastStartTs = Date.now();
      const remaining = Math.max(0, this._toastRemainingMs || 0);
      this.toastTimerId = window.setTimeout(() => {
        this.closeReminder();
      }, remaining || 1);
    },

    closeReminder() {
      this.showReminder = false;
      this.clearToastTimers();

      // Optional: reset bar so next show animates cleanly from start
      const bar = this.$el && this.$el.querySelector('.save-toast__bar');
      if (bar) {
        bar.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        bar.offsetWidth;
        bar.style.animation = '';
        bar.style.removeProperty('--toast-duration');
      }
    }
  }
};
</script>
