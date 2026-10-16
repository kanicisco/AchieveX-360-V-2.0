/**
 * TableController - Dynamic Outlet Achievement Performance Data Table
 * Searchable, sortable, paginated data table with two-tier sticky headers,
 * 100%+ target highlights, dynamic category columns, and zero hardcoded fields.
 */
const TableController = {
    currentPage: 1,
    pageSize: 15,
    sortColumn: 'total_achievement',
    sortAsc: false,

    init() {
        this.bindEvents();
        window.addEventListener('achievex_filter_changed', () => {
            this.currentPage = 1;
            this.renderTable();
        });
    },

    bindEvents() {
        // Page size selector
        document.getElementById('table-page-size')?.addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value, 10);
            this.currentPage = 1;
            this.renderTable();
        });

        // Pagination buttons
        document.getElementById('prev')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTable();
            }
        });

        document.getElementById('next')?.addEventListener('click', () => {
            const filtered = DataManager.getFilteredOutlets();
            const totalPages = this.pageSize === -1 ? 1 : Math.ceil(filtered.length / this.pageSize);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderTable();
            }
        });
    },

    sort(colName) {
        if (this.sortColumn === colName) {
            this.sortAsc = !this.sortAsc;
        } else {
            this.sortColumn = colName;
            this.sortAsc = (colName === 'distributor_name' || colName === 'retailer_name');
        }
        this.renderTable();
    },

    getSortIcon(colName) {
        if (this.sortColumn !== colName) return '<span class="text-muted ms-1" style="font-size:10px;opacity:0.4;">⇅</span>';
        return this.sortAsc ? '<span class="text-primary ms-1">▲</span>' : '<span class="text-primary ms-1">▼</span>';
    },

    formatCurrency(num) {
        if (num === null || num === undefined || num === 0) return '-';
        return 'Rs. ' + Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    renderTable() {
        const groupHeads = document.getElementById('groupheads');
        const heads = document.getElementById('heads');
        const tbody = document.getElementById('body');
        const resultCountEl = document.getElementById('result');
        const rangeEl = document.getElementById('range');

        if (!groupHeads || !heads || !tbody) return;

        if (!DataManager.activeDataset || DataManager.outlets.length === 0) {
            groupHeads.innerHTML = '';
            heads.innerHTML = '';
            tbody.innerHTML = `
                <tr>
                    <td colspan="15" class="text-center py-5 text-muted">
                        <div class="py-4">
                            <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                            <h6 class="fw-bold text-secondary">No Data Loaded</h6>
                            <p class="small text-muted mb-3">All records have been cleared. Upload an Excel workbook (.xlsb, .xlsx) via Admin Panel or restore the default dataset.</p>
                            <button type="button" class="btn btn-outline-primary btn-sm rounded-pill px-3 me-2" onclick="document.getElementById('adminOpen')?.click();">
                                <i class="bi bi-gear-fill me-1"></i> Open Admin Panel
                            </button>
                            <button type="button" class="btn btn-primary btn-sm rounded-pill px-3" onclick="AdminMapper.restoreOriginalQ4();">
                                <i class="bi bi-arrow-repeat me-1"></i> Restore Default Data
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            if (resultCountEl) resultCountEl.innerText = '0 Outlets';
            if (rangeEl) rangeEl.innerText = 'Showing 0 of 0';
            const prevBtn = document.getElementById('prev');
            const nextBtn = document.getElementById('next');
            if (prevBtn) prevBtn.classList.add('disabled');
            if (nextBtn) nextBtn.classList.add('disabled');
            return;
        }

        const dataset = DataManager.activeDataset;
        let filtered = DataManager.getFilteredOutlets();
        const selectedMonths = (DataManager.filters.months && DataManager.filters.months.length > 0)
            ? DataManager.filters.months
            : (dataset.months || []);
        const allDatasetCats = dataset.all_categories || dataset.categories || [];
        const selectedCats = DataManager.filters.categories.length > 0 ? DataManager.filters.categories : allDatasetCats;

        // 1. Sort Outlets
        filtered.sort((a, b) => {
            let valA, valB;
            const mA = DataManager.calculateOutletMetrics(a, selectedMonths);
            const mB = DataManager.calculateOutletMetrics(b, selectedMonths);

            if (this.sortColumn === 'distributor_name') { valA = a.distributor_name; valB = b.distributor_name; }
            else if (this.sortColumn === 'retailer_name') { valA = a.retailer_name; valB = b.retailer_name; }
            else if (this.sortColumn === 'retailer_code') { valA = a.retailer_code; valB = b.retailer_code; }
            else if (this.sortColumn === 'dsr') { valA = a.dsr; valB = b.dsr; }
            else if (this.sortColumn === 'activity') { valA = a.activity; valB = b.activity; }
            else if (this.sortColumn === 'slab') { valA = a.slab; valB = b.slab; }
            else if (this.sortColumn === 'total_target') { valA = mA.target; valB = mB.target; }
            else if (this.sortColumn === 'total_achievement') { valA = mA.achievement; valB = mB.achievement; }
            else if (this.sortColumn === 'achievement_pct') { valA = mA.pct; valB = mB.pct; }
            else {
                valA = a[this.sortColumn] || 0;
                valB = b[this.sortColumn] || 0;
            }

            if (typeof valA === 'string') {
                return this.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return this.sortAsc ? (valA - valB) : (valB - valA);
        });

        // 2. Render Two-Tier Table Headers
        let periodHeaderTitle = 'Q4 Cumulative Performance';
        if (selectedMonths.length === 1) {
            periodHeaderTitle = `${selectedMonths[0]} Performance`;
        } else if (selectedMonths.length < (dataset.months || []).length) {
            periodHeaderTitle = `Selected Months (${selectedMonths.length}) Performance`;
        }

        // Header Row 1 (Group Heads)
        groupHeads.innerHTML = `
            <th rowspan="2" class="sortable text-center" style="width:40px;">#</th>
            <th rowspan="2" onclick="TableController.sort('distributor_name')" class="sortable">Distributor ${this.getSortIcon('distributor_name')}</th>
            <th rowspan="2" onclick="TableController.sort('retailer_name')" class="sortable">Retailer Outlet ${this.getSortIcon('retailer_name')}</th>
            <th rowspan="2" onclick="TableController.sort('retailer_code')" class="sortable">Retailer Code ${this.getSortIcon('retailer_code')}</th>
            <th rowspan="2" onclick="TableController.sort('dsr')" class="sortable">DSR ${this.getSortIcon('dsr')}</th>
            <th rowspan="2" onclick="TableController.sort('activity')" class="sortable">Activity ${this.getSortIcon('activity')}</th>
            <th rowspan="2" onclick="TableController.sort('slab')" class="sortable">Slab ${this.getSortIcon('slab')}</th>
            <th colspan="3" class="text-center group-period-hdr" style="background:#dbeafe;color:#1e40af;font-weight:800;border-left:2px solid #93c5fd;border-right:2px solid #93c5fd;">
                ${periodHeaderTitle}
            </th>
            ${selectedCats.length > 0 ? `
            <th colspan="${selectedCats.length}" class="text-center group-cat-hdr" style="background:#fef3c7;color:#92400e;font-weight:800;border-right:2px solid #fde68a;">
                Category Achievements (Rs.)
            </th>` : ''}
        `;

        // Header Row 2 (Sub Heads)
        let subHeadHTML = `
            <th onclick="TableController.sort('total_target')" class="sortable text-end" style="border-left:2px solid #93c5fd;">Target ${this.getSortIcon('total_target')}</th>
            <th onclick="TableController.sort('total_achievement')" class="sortable text-end">Achievement ${this.getSortIcon('total_achievement')}</th>
            <th onclick="TableController.sort('achievement_pct')" class="sortable text-end" style="border-right:2px solid #93c5fd;">% Ach ${this.getSortIcon('achievement_pct')}</th>
        `;

        selectedCats.forEach(cat => {
            const shortName = cat.replace(/^LK\s*[A-Z&]+\s*:\s*/i, '');
            subHeadHTML += `<th class="text-end" style="font-size:11px;min-width:110px;" title="${cat}">${shortName}</th>`;
        });

        heads.innerHTML = subHeadHTML;

        // 3. Pagination calculations
        const totalItems = filtered.length;
        const effectivePageSize = this.pageSize === -1 ? totalItems : this.pageSize;
        const totalPages = Math.ceil(totalItems / effectivePageSize) || 1;

        if (this.currentPage > totalPages) this.currentPage = totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        const startIdx = (this.currentPage - 1) * effectivePageSize;
        const pageItems = filtered.slice(startIdx, startIdx + effectivePageSize);

        // Update range label & result count
        if (resultCountEl) {
            resultCountEl.innerText = `${totalItems.toLocaleString()} matching outlets (from ${DataManager.outlets.length.toLocaleString()} total)`;
        }

        if (rangeEl) {
            if (totalItems === 0) {
                rangeEl.innerText = '0 - 0 of 0';
            } else {
                const endIdx = Math.min(startIdx + effectivePageSize, totalItems);
                rangeEl.innerText = `Showing ${startIdx + 1}–${endIdx} of ${totalItems.toLocaleString()} outlets (Page ${this.currentPage} of ${totalPages})`;
            }
        }

        // 4. Render Table Body Rows
        if (pageItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${7 + 3 + selectedCats.length}" class="empty text-center py-5">
                        <div class="text-muted mb-2" style="font-size:32px;">🔍</div>
                        <h6 class="text-muted fw-bold">No matching outlets found</h6>
                        <small class="text-muted">Try adjusting your filters, month selection, or search query.</small>
                    </td>
                </tr>
            `;
            return;
        }

        let bodyHTML = '';
        pageItems.forEach((o, idx) => {
            const metrics = DataManager.calculateOutletMetrics(o, selectedMonths);
            const is100Plus = metrics.target > 0 && metrics.achievement >= metrics.target;
            const pctVal = metrics.target > 0 ? metrics.pct : (metrics.achievement > 0 ? 100 : 0);
            const pctStr = pctVal.toFixed(1) + '%';
            
            // User specified Slab display format:
            // 1. 100%+ values: Bold Black text on Green background with Star (⭐) included
            // 2. All other values: Bold Dark Blue text on Light Blue background
            const slabClass = is100Plus ? 'pct-slab-green' : 'pct-slab-blue';
            const rowHighlight = is100Plus ? 'style="background: rgba(16, 185, 129, 0.06);"' : '';

            bodyHTML += `
                <tr ${rowHighlight}>
                    <td class="text-center text-muted" style="font-size:11px;">${startIdx + idx + 1}</td>
                    <td>
                        <div class="fw-bold">${o.distributor_name}</div>
                        <small class="text-muted" style="font-size:10px;">Code: ${o.distributor_code}</small>
                    </td>
                    <td>
                        <div class="fw-semibold text-primary">${o.retailer_name}</div>
                        <small class="text-muted" style="font-size:10px;">URC: ${o.urc || 'N/A'}</small>
                    </td>
                    <td><code>${o.retailer_code}</code></td>
                    <td><small>${o.dsr || '—'}</small></td>
                    <td><span class="badge bg-light text-dark border">${o.activity}</span></td>
                    <td><span class="slab slab-${String(o.slab).toLowerCase()}">${o.slab}</span></td>
                    
                    <!-- Period Metrics -->
                    <td class="text-end fw-semibold" style="border-left: 2px solid #e2e8f0;">${this.formatCurrency(metrics.target)}</td>
                    <td class="text-end fw-bold ${is100Plus ? 'text-success' : ''}">${this.formatCurrency(metrics.achievement)}</td>
                    <td class="text-end" style="border-right: 2px solid #e2e8f0;">
                        <span class="slab pct-slab ${slabClass}" style="${is100Plus ? 'background-color:#86efac; color:#000000; border-color:#4ade80; font-weight:800;' : 'background-color:#dbeafe; color:#1e3a8a; border-color:#bfdbfe; font-weight:800;'}">${pctStr}${is100Plus ? ' ⭐' : ''}</span>
                    </td>

                    <!-- Dynamic Category Columns -->
                    ${selectedCats.map(cat => {
                        const val = o.categories ? (o.categories[cat] || 0) : 0;
                        return `<td class="text-end" style="color: ${val > 0 ? 'var(--text-primary)' : 'var(--text-muted)'};">${this.formatCurrency(val)}</td>`;
                    }).join('')}
                </tr>
            `;
        });

        tbody.innerHTML = bodyHTML;
    }
};

window.TableController = TableController;
