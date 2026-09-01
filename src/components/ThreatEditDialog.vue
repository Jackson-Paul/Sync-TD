<template>
    <div>
        <b-modal
            v-if="!!threat"
            id="threat-edit"
            size="lg"
            ok-variant="primary"
            header-bg-variant="primary"
            header-text-variant="light"
            :title="modalTitle"
            ref="editModal"
        >
            <b-form>
                <b-form-row>
                    <b-col>
                        <b-form-group
                            id="title-group"
                            :label="$t('threats.properties.title')"
                            label-for="title">
                            <b-form-input
                                id="title"
                                v-model="threat.title"
                                type="text"
                                required
                            ></b-form-input>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                <b-form-row>
                    <b-col>
                        <b-form-group
                            id="threat-type-group"
                            :label="$t('threats.properties.type')"
                            label-for="threat-type">
                            <b-form-select
                                id="threat-type"
                                v-model="threat.type"
                                :options="threatTypes">
                            </b-form-select>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                <b-form-row>
                    <b-col md=5>
                        <b-form-group
                            id="status-group"
                            class="float-left"
                            :label="$t('threats.properties.status')"
                            label-for="status">
                            <b-form-radio-group
                                id="status"
                                v-model="threat.status"
                                :options="statuses"
                                buttons
                            ></b-form-radio-group>
                        </b-form-group>
                    </b-col>

                    <b-col md=2>
                        <b-form-group
                            id="score-group"
                            :label="$t('threats.properties.score')"
                            label-for="score">
                            <b-form-input
                                id="score"
                                v-model="threat.score"
                                type="text"
                            ></b-form-input>
                        </b-form-group>
                    </b-col>

                    <b-col md=5>
                        <b-form-group
                            id="priority-group"
                            class="float-right"
                            :label="$t('threats.properties.priority')"
                            label-for="priority">
                            <b-form-radio-group
                                id="priority"
                                v-model="threat.severity"
                                :options="priorities"
                                buttons
                            ></b-form-radio-group>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                <b-form-row>
                    <b-col md=5>
                        <b-form-group
                            id="is-ai"
                            class="float-left"
                            :label="$t('threats.properties.isai')"
                            label-for="isai-checkbox">

                            <b-form-checkbox
                            id="isai-checkbox"
                            class="float-left"
                            v-model="threat.isai"
                            name="isai-checkbox"
                            >
                            </b-form-checkbox>
                        </b-form-group>
                    </b-col>

                    <b-col md=2>
                        <b-form-group 
                        id="tested-on-group" 
                        :label="$t('threats.properties.testedOn')"
                        label-for="testedOn" 
                        class="mb-0 w-100">

                        <datepicker 
                        v-model="threat.testedOn" 
                        :format="'MM-DD-YYYY'" 
                        :input-class="'form-control'">
                        </datepicker>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                <b-form-row>
                    <b-col>
                        <b-form-group
                            id="description-group"
                            :label="$t('threats.properties.description')"
                            label-for="description">
                            <b-form-textarea
                                id="description"
                                v-model="threat.description"
                                rows="5">
                            </b-form-textarea>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                 <b-form-row>
                    <b-col>
                        <b-form-group
                            id="ticket-link"
                            :label="$t('threats.properties.ticketlink')"
                            label-for="ticketlink">
                            <b-form-input
                                id="ticketlink"
                                v-model="threat.ticketlink"
                            >
                            </b-form-input>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                <b-form-row>
                    <b-col>
                        <b-form-group
                            id="mitigation-group"
                            :label="$t('threats.properties.mitigation')"
                            label-for="mitigation">
                            <b-form-textarea
                                id="mitigation"
                                v-model="threat.mitigation"
                                rows="5">
                            </b-form-textarea>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                <b-form-row>
                    <b-col>
                        <b-form-group
                            id="mitigation-screenshot-group"
                            :label="$t('threats.properties.mitigationScreenshot')"
                            label-for="mitigation-screenshot">
                            <div class="screenshot-upload-area">
                                <div class="screenshot-instructions">
                                    <small class="text-muted">
                                        📋 {{ $t('threats.properties.screenshotInstructions') }}
                                    </small>
                                </div>
                            </div>
                            <div v-if="threat.mitigationScreenshots && threat.mitigationScreenshots.length > 0" class="screenshots-container mt-2">
                                <div v-for="(screenshot, idx) in threat.mitigationScreenshots" :key="idx" class="screenshot-item">
                                    <div class="screenshot-wrapper">
                                        <img 
                                            :src="screenshot.data" 
                                            :alt="screenshot.fileName" 
                                            class="screenshot-thumbnail">
                                    </div>
                                    <div class="screenshot-info">
                                        <small class="text-muted d-block">{{ screenshot.fileName }}</small>
                                        <b-button 
                                            size="sm"
                                            variant="danger"
                                            @click="removeScreenshot(idx)">
                                            {{ $t('forms.delete') }}
                                        </b-button>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-muted mt-2">
                                <small>{{ $t('threats.properties.noScreenshots') }}</small>
                            </div>
                        </b-form-group>
                    </b-col>
                </b-form-row>
            </b-form>

            <template #modal-footer>
                <div class="w-100">
                <b-button
                    v-if="!newThreat"
                    variant="danger"
                    class="float-left"
                    @click="confirmDelete()"
                >
                    {{ $t('forms.delete') }}
                </b-button>
                <b-button
                    v-if="newThreat"
                    variant="danger"
                    class="float-left"
                    @click="immediateDelete()"
                >
                    {{ $t('forms.remove') }}
                </b-button>
                 <b-button
                    variant="secondary"
                    class="float-right"
                    @click="updateThreat()"
                >
                    {{ $t('forms.apply') }}
                </b-button>
                <b-button
                v-if="!newThreat"
                variant="secondary"
                class="float-right mr-2"
                @click="hideModal()"
            >
                {{ $t('forms.cancel') }}
            </b-button>
                </div>
            </template>
        </b-modal>
    </div>
</template>

<script>
import { mapState } from 'vuex';

import { CELL_DATA_UPDATED } from '@/store/actions/cell.js';
import tmActions from '@/store/actions/threatmodel.js';
import dataChanged from '@/service/x6/graph/data-changed.js';
import threatModels from '@/service/threats/models/index.js';
import Datepicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';

export default {
    name: 'TdThreatEditDialog',
    components: { Datepicker },
    computed: {
        ...mapState({
            cellRef: (state) => state.cell.ref,
            threatTop: (state) => state.threatmodel.data.detail.threatTop
        }),
        threatTypes() {
            if (!this.cellRef || !this.threat || !this.threat.modelType) {
                return [];
            }

            const res = [];
            const threatTypes = threatModels.getThreatTypesByElement(this.threat.modelType, this.cellRef.data.type);
            Object.keys(threatTypes).forEach((type) => {
                res.push(this.$t(type));
            }, this);
            if(!res.includes(this.threat.type))
                res.push(this.threat.type);
            return res;
        },
        statuses() {
            return [
                { value: 'NotApplicable', text: this.$t('threats.status.notApplicable') },
                { value: 'Open', text: this.$t('threats.status.open') },
                { value: 'Mitigated', text: this.$t('threats.status.mitigated') }
            ];
        },
        priorities() {
            return [
                { value: 'TBD', text: this.$t('threats.priority.tbd') },
                { value: 'Low', text: this.$t('threats.priority.low') },
                { value: 'Medium', text: this.$t('threats.priority.medium') },
                { value: 'High', text: this.$t('threats.priority.high') },
                { value: 'Critical', text: this.$t('threats.priority.critical') }
            ];
        },
        modalTitle() { return this.$t('threats.edit') + ' #' + this.number; }
    },
    data() {
        return {
            threat: {
                isai: null,
                ticketlink: '',
                testedOn: new Date(),
                mitigationScreenshots: []
            },
            modelTypes: [
                'CIA',
                'DIE',
                'LINDDUN',
                'PLOT4ai',
                'STRIDE'
            ],
            number: 0,
            pasteEventListener: null
        };
    },
    mounted() {
        // Add paste event listener when modal is shown
        this.pasteEventListener = this.handlePaste.bind(this);
    },
    beforeDestroy() {
        // Clean up paste event listener
        if (this.pasteEventListener) {
            document.removeEventListener('paste', this.pasteEventListener);
        }
    },
    methods: {
        editThreat(threatId,state) {
            const crnthreat = this.cellRef.data.threats.find(x => x.id === threatId);
            this.threat = {
                ...crnthreat,
                testedOn: crnthreat.testedOn ? new Date(crnthreat.testedOn) : null,
                mitigationScreenshots: crnthreat.mitigationScreenshots ? [...crnthreat.mitigationScreenshots] : []
            };
            if (!this.threat) {
                // this should never happen with a valid threatId
                console.warn('Trying to access a non-existent threatId: ' + threatId);
            } else {
                this.number = this.threat.number;
                this.newThreat = state==='new';
                this.$refs.editModal.show();
                // Add paste event listener when modal is shown
                this.$nextTick(() => {
                    document.addEventListener('paste', this.pasteEventListener);
                });
            }
        },
        updateThreat() {
            const threatRef = this.cellRef.data.threats.find(x => x.id === this.threat.id);
            if (threatRef) {
                const objRef = this.cellRef.data;
                if(!objRef.threatFrequency){
                    const tmpfreq = threatModels.getFrequencyMapByElement(this.threat.modelType,this.cellRef.data.type);
                    if(tmpfreq!==null)
                        objRef.threatFrequency = tmpfreq;
                }
                if(objRef.threatFrequency){
                    Object.keys(objRef.threatFrequency).forEach((k)=>{
                        if(this.$t(`threats.model.${this.threat.modelType.toLowerCase()}.${k}`)===this.threat.type)
                            objRef.threatFrequency[k]++;
                    });
                }
                threatRef.status = this.threat.status;
                threatRef.severity = this.threat.severity;
                threatRef.title = this.threat.title;
                threatRef.type = this.threat.type;
                threatRef.description = this.threat.description;
                threatRef.mitigation = this.threat.mitigation;
                threatRef.modelType = this.threat.modelType;
                threatRef.new = false;
                threatRef.number = this.number;
                threatRef.isai = this.threat.isai;
                threatRef.testedOn = this.threat.testedOn;
                threatRef.ticketlink = this.threat.ticketlink;
                threatRef.score = this.threat.score;
                threatRef.mitigationScreenshots = this.threat.mitigationScreenshots;
                this.$store.dispatch(CELL_DATA_UPDATED, this.cellRef.data);
                this.$store.dispatch(tmActions.modified);
                dataChanged.updateStyleAttrs(this.cellRef);
            }
            this.hideModal();
        },
        deleteThreat() {
            if(!this.threat.new){
                const threatMap = this.cellRef.data.threatFrequency;
                if (threatMap) {
                    Object.keys(threatMap).forEach((k)=>{
                        if(this.$t(`threats.model.${this.threat.modelType.toLowerCase()}.${k}`)===this.threat.type)
                            threatMap[k]--;
                    });
                }
            }
            this.cellRef.data.threats = this.cellRef.data.threats.filter(x => x.id !== this.threat.id);
            this.cellRef.data.hasOpenThreats = this.cellRef.data.threats.length > 0;
            this.$store.dispatch(CELL_DATA_UPDATED, this.cellRef.data);
            this.$store.dispatch(tmActions.modified);
            dataChanged.updateStyleAttrs(this.cellRef);
        },
        hideModal() {
            this.$refs.editModal.hide();
            // Remove paste event listener when modal is hidden
            document.removeEventListener('paste', this.pasteEventListener);
        },
        onScreenshotSelected(file) {
            if (file) {
                this.screenshotFileName = file.name;
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.threat.mitigationScreenshot = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        },
        handlePaste(event) {
            const items = event.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            // Generate filename for pasted image
                            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                            const ext = blob.type.split('/')[1] || 'png';
                            const fileName = `pasted-screenshot-${timestamp}.${ext}`;
                            
                            // Add to screenshots array
                            if (!this.threat.mitigationScreenshots) {
                                this.threat.mitigationScreenshots = [];
                            }
                            this.threat.mitigationScreenshots.push({
                                data: e.target.result,
                                fileName: fileName
                            });
                        };
                        reader.readAsDataURL(blob);
                        event.preventDefault();
                        break;
                    }
                }
            }
        },
        removeScreenshot(index) {
            if (this.threat.mitigationScreenshots) {
                this.threat.mitigationScreenshots.splice(index, 1);
            }
        },
        async confirmDelete() {
            const confirmed = await this.$bvModal.msgBoxConfirm(this.$t('threats.confirmDeleteMessage'), {
                title: this.$t('threats.confirmDeleteTitle'),
                okTitle: this.$t('forms.delete'),
                cancelTitle: this.$t('forms.cancel'),
                okVariant: 'danger'
            });

            if (!confirmed) { return; }

            this.deleteThreat();
            this.hideModal();
        },
        async immediateDelete() {
            this.deleteThreat();
            this.hideModal();
        }
    }
};

</script>

<style scoped>
.screenshot-upload-area {
    margin-bottom: 1rem;
}

.screenshot-instructions {
    padding: 0.75rem;
    background-color: #e7f3ff;
    border-left: 3px solid #2196F3;
    border-radius: 0.25rem;
}

.screenshots-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
}

.screenshot-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.screenshot-wrapper {
    width: 100%;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
    background-color: #f8f9fa;
    overflow: hidden;
}

.screenshot-thumbnail {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.screenshot-info {
    margin-top: 0.5rem;
    width: 100%;
}

.screenshot-info small {
    word-break: break-word;
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.7rem;
}
</style>
