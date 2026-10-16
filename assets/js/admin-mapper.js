/**
 * AdminMapper - Excel Structure Inspection, Multi-Sheet Mapper & Admin Management
 * Handles file dropzone, native file dialogs, live Excel structure preview,
 * discrepancy viewer modal, safe replacement, and dataset reset/restore.
 */
const AdminMapper = {
    stagedWorkbookData: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Admin modal trigger button
        document.getElementById('adminOpen')?.addEventListener('click', () => {
            const adminModal = new bootstrap.Modal(document.getElementById('adminModal'));
            adminModal.show();
        });

        // Discrepancy modal trigger button
        document.getElementById('btn-view-discrepancies')?.addEventListener('click', () => {
            this.showDiscrepancyModal();
        });

        // File Input listener
        const fileInput = document.getElementById('adminFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                    e.target.value = '';
                }
            });
        }

        // Drag & Drop handlers
        const dropzone = document.getElementById('excel-dropzone');
        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('border-primary', 'bg-light');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('border-primary', 'bg-light');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-primary', 'bg-light');
                if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                    this.handleFileUpload(e.dataTransfer.files[0]);
                }
            });
        }

        // Sample loader buttons
        document.getElementById('btn-load-sample-1')?.addEventListener('click', () => this.loadSampleFile('data/Sample_H1_2026_Dashboard.xlsx'));
        document.getElementById('btn-load-sample-2')?.addEventListener('click', () => this.loadSampleFile('data/Sample_FY_2026_2027_H2_Dashboard.xlsx'));

        // Restore Original Q4 dataset button
        document.getElementById('btn-restore-original')?.addEventListener('click', () => this.restoreOriginalQ4());

        // Clear dataset button
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearDataset());
        document.getElementById('btn-clear-dataset')?.addEventListener('click', () => this.clearDataset());

        // Confirm replacement button in modal
        document.getElementById('btn-confirm-import')?.addEventListener('click', () => this.commitStagedDataset());
    },

    showNotification(msg, type = 'info') {
        const statusEl = document.getElementById('adminStatus');
        if (statusEl) {
            statusEl.innerHTML = `<span class="text-${type}">${msg}</span>`;
        }
        // Native browser toast / alert if significant
        if (type === 'danger') alert('Import Notice: ' + msg);
    },

    async handleFileUpload(file) {
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        const validExts = ['xlsx', 'xls', 'xlsb', 'csv'];
        if (!validExts.includes(ext)) {
            this.showNotification(`Unsupported file format .${ext}. Please upload .xlsx, .xls, .xlsb, or .csv`, 'danger');
            return;
        }

        try {
            this.showNotification(`Inspecting workbook <strong>${file.name}</strong>...`, 'info');

            // 1. Upload to server background in XAMPP
            const formData = new FormData();
            formData.append('excel_file', file);
            try {
                fetch('api/upload.php', { method: 'POST', body: formData });
            } catch (e) {
                console.log('Upload endpoint offline.');
            }

            // 2. Parse workbook client-side via SheetJS
            const parsed = await ExcelParser.inspectWorkbook(file);
            this.stagedWorkbookData = parsed;
            this.showInspectionModal(parsed, file.name);
            this.showNotification(`Successfully inspected ${file.name}. Review preview below before committing.`, 'success');
        } catch (err) {
            console.error('Error parsing uploaded file', err);
            this.showNotification(`Upload Error: ${err.message || 'Could not parse workbook'}`, 'danger');
        }
    },

    showInspectionModal(parsed, filename) {
        const previewEl = document.getElementById('import-preview-area');
        if (!previewEl) return;

        let sheetOptions = parsed.sheetNames.map(s => 
            `<option value="${s}" ${s === parsed.activeSheet ? 'selected' : ''}>${s}</option>`
        ).join('');

        previewEl.innerHTML = `
            <div class="alert alert-primary mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1 fw-bold"><i class="bi bi-file-earmark-check me-2"></i> ${filename}</h6>
                        <small>Detected Period: <strong>${parsed.detectedHalfYear} ${parsed.detectedYear} (${parsed.detectedQuarters.join(', ')})</strong> | Outlets: <strong>${parsed.recordsCount.toLocaleString()}</strong></small>
                    </div>
                    <div>
                        <label class="form-label mb-0 me-2 small fw-bold">Active Sheet:</label>
                        <select id="stage-sheet-select" class="form-select form-select-sm d-inline-block w-auto">
                            ${sheetOptions}
                        </select>
                    </div>
                </div>
            </div>

            <div class="row g-2 mb-3">
                <div class="col-md-4">
                    <div class="border rounded p-2 bg-light">
                        <small class="text-muted fw-bold d-block">Detected Months</small>
                        <strong class="text-primary">${parsed.detectedMonths.join(', ') || 'N/A'}</strong>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="border rounded p-2 bg-light">
                        <small class="text-muted fw-bold d-block">Mapped Outlets</small>
                        <strong class="text-success">${parsed.recordsCount.toLocaleString()} records</strong>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="border rounded p-2 bg-light">
                        <small class="text-muted fw-bold d-block">Categories Found</small>
                        <strong class="text-warning">${(parsed.allCategories || []).length} categories</strong>
                    </div>
                </div>
            </div>

            <div class="table-responsive border rounded" style="max-height: 260px;">
                <table class="table table-sm table-striped table-hover mb-0" style="font-size:11px;">
                    <thead class="table-light sticky-top">
                        <tr>
                            <th>#</th>
                            <th>Distributor</th>
                            <th>Outlet Name</th>
                            <th>Code</th>
                            <th>Activity</th>
                            <th>Slab</th>
                            <th class="text-end">Target</th>
                            <th class="text-end">Achievement</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parsed.outlets.slice(0, 10).map((o, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${o.distributor_name}</td>
                                <td class="fw-bold">${o.retailer_name}</td>
                                <td><code>${o.retailer_code}</code></td>
                                <td><span class="badge bg-light text-dark border">${o.activity}</span></td>
                                <td>${o.slab}</td>
                                <td class="text-end">Rs. ${o.total_target.toLocaleString()}</td>
                                <td class="text-end fw-bold text-success">Rs. ${o.total_achievement.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-3">
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('import-preview-area').innerHTML = ''">Cancel Preview</button>
                <button type="button" id="btn-commit-preview" class="btn btn-primary btn-sm fw-bold">Confirm & Apply to Dashboard</button>
            </div>
        `;

        // Bind sheet switch in preview
        document.getElementById('stage-sheet-select')?.addEventListener('change', async (e) => {
            const sheet = e.target.value;
            if (this.stagedWorkbookData && this.stagedWorkbookData.rawWorkbook) {
                const ws = this.stagedWorkbookData.rawWorkbook.Sheets[sheet];
                const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                const reParsed = ExcelParser.parseRawMatrix(rawRows, this.stagedWorkbookData.sheetNames, sheet);
                reParsed.rawWorkbook = this.stagedWorkbookData.rawWorkbook;
                this.stagedWorkbookData = reParsed;
                this.showInspectionModal(reParsed, filename);
            }
        });

        document.getElementById('btn-commit-preview')?.addEventListener('click', () => {
            this.commitStagedDataset();
        });
    },

    async commitStagedDataset() {
        if (!this.stagedWorkbookData) return;
        await DataManager.setDataset(this.stagedWorkbookData, this.stagedWorkbookData.activeSheet + '.xlsx');
        
        // Refresh entire UI immediately
        if (window.FilterController && FilterController.renderAllFilterOptions) {
            FilterController.renderAllFilterOptions();
        }
        if (typeof refreshDashboardUI === 'function') {
            refreshDashboardUI();
        }
        window.dispatchEvent(new CustomEvent('achievex_dataset_updated'));
        this.showNotification('Dataset replaced successfully! Dashboard refreshed with category breakdown.', 'success');
        
        // Close admin modal if open
        const modalEl = document.getElementById('adminModal');
        if (modalEl && window.bootstrap && bootstrap.Modal) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }

        const previewEl = document.getElementById('import-preview-area');
        if (previewEl) previewEl.innerHTML = '';
    },

    async restoreOriginalQ4(force = false) {
        if (!force && !confirm('Restore the original Q4 2026 Activity Outlet Achievements dataset?')) return;
        try {
            this.showNotification('Restoring original Q4 2026 dataset...', 'info');
            const resp = await fetch('data/q4_2026_dataset.json');
            const data = await resp.json();
            await DataManager.setDataset({
                titleText: data.dataset.title,
                detectedYears: data.dataset.years,
                detectedHalfYears: data.dataset.half_years,
                detectedQuarters: data.dataset.quarters,
                detectedMonths: data.dataset.months,
                categoriesByMonth: data.dataset.categories_by_month,
                allCategories: data.dataset.all_categories,
                outlets: data.outlets
            }, 'Activity outlet Achievements - 2026 - Q4.xlsb');

            window.dispatchEvent(new CustomEvent('achievex_dataset_updated'));
            this.showNotification('Original Q4 2026 dataset restored successfully!', 'success');

            const modalEl = document.getElementById('adminModal');
            if (modalEl && window.bootstrap && bootstrap.Modal) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) {
                    setTimeout(() => modalInstance.hide(), 500);
                }
            }
        } catch (e) {
            alert('Could not restore dataset: ' + e.message);
        }
    },

    async loadSampleFile(samplePath) {
        try {
            this.showNotification(`Loading sample ${samplePath}...`, 'info');
            const resp = await fetch(samplePath);
            const buf = await resp.arrayBuffer();
            const parsed = await ExcelParser.inspectWorkbook(buf);
            this.stagedWorkbookData = parsed;
            this.showInspectionModal(parsed, samplePath.split('/').pop());
        } catch (e) {
            alert('Failed to load sample: ' + e.message);
        }
    },

    async clearDataset() {
        if (!confirm('Clear all currently loaded dashboard data? This will reset all filters and metrics.')) return;
        
        this.showNotification('Clearing data across LocalStorage and database...', 'info');
        await DataManager.clearAllData();

        // Clear preview area & file input in admin modal
        const previewEl = document.getElementById('import-preview-area');
        if (previewEl) previewEl.innerHTML = '';
        this.stagedWorkbookData = null;

        const fileInput = document.getElementById('adminFile');
        if (fileInput) fileInput.value = '';

        // Notify dashboard to re-render empty state
        window.dispatchEvent(new CustomEvent('achievex_dataset_updated'));
        this.showNotification('✓ All dataset records cleared successfully.', 'warning');

        // Dismiss modal after brief visual confirmation
        const modalEl = document.getElementById('adminModal');
        if (modalEl && window.bootstrap && bootstrap.Modal) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
                setTimeout(() => modalInstance.hide(), 600);
            }
        }
    },

    /**
     * Show Discrepancy Inspection Modal with 78 documented uncalculated rows
     */
    async showDiscrepancyModal() {
        let discrepancies = [];
        try {
            const resp = await fetch('data/q4_discrepancies.json');
            if (resp.ok) discrepancies = await resp.json();
        } catch (e) {}

        const modalBody = document.getElementById('discrepancy-modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="alert alert-warning mb-3">
                <h6 class="fw-bold mb-1"><i class="bi bi-exclamation-triangle-fill me-2"></i> 78 Rows Detected with Stale Cached Q4 Evaluation</h6>
                <p class="mb-1 small">
                    In the source workbook <code>Activity outlet Achievements - 2026 - Q4.xlsb</code>, Column T (Q4 Achv) uses <code>=K{row}+N{row}+Q{row}</code>.
                    When Oct Achv (Col K) was updated via VLOOKUP from the <code>Oct</code> sheet, the dependent sum formula was not recalculated before saving as XLSB.
                </p>
                <div class="small fw-bold">
                    Source Cached Total: <span class="text-danger">Rs. 75,749,432.07</span> vs Reconciled Total: <span class="text-success">Rs. 92,776,577.96</span> (Variance: -Rs. 17,027,145.89).
                </div>
            </div>

            <div class="table-responsive" style="max-height: 380px;">
                <table class="table table-sm table-striped table-hover mb-0" style="font-size:11px;">
                    <thead class="table-light sticky-top">
                        <tr>
                            <th>Row</th>
                            <th>Retailer Code</th>
                            <th>Retailer Name</th>
                            <th class="text-end">Oct Achv</th>
                            <th class="text-end">Nov Achv</th>
                            <th class="text-end">Dec Achv</th>
                            <th class="text-end">Expected (Sum)</th>
                            <th class="text-end">Cached cell.v</th>
                            <th class="text-end">Variance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${discrepancies.map(d => `
                            <tr>
                                <td>${d.row}</td>
                                <td><code>${d.retailerCode}</code></td>
                                <td class="fw-bold">${d.retailerName}</td>
                                <td class="text-end">Rs. ${d.octAchv.toLocaleString()}</td>
                                <td class="text-end">Rs. ${d.novAchv.toLocaleString()}</td>
                                <td class="text-end">Rs. ${d.decAchv.toLocaleString()}</td>
                                <td class="text-end fw-bold text-success">Rs. ${d.calculatedQ4Achv.toLocaleString()}</td>
                                <td class="text-end fw-bold text-danger">Rs. ${d.sourceCachedQ4Achv.toLocaleString()}</td>
                                <td class="text-end text-danger fw-bold">+Rs. ${d.difference.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('discrepancyModal'));
        modal.show();
    }
};

window.AdminMapper = AdminMapper;
