/**
 * FilterController - Dynamic Filter UI Renderer & Event Handler
 * Zero hardcoding. All choices populated dynamically from active dataset.
 */
const FilterController = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Year filter
        document.getElementById('filter-year')?.addEventListener('change', (e) => {
            DataManager.filters.year = e.target.value;
            this.onFilterChange();
        });

        // Half-Year filter
        document.getElementById('filter-halfyear')?.addEventListener('change', (e) => {
            DataManager.filters.halfYear = e.target.value;
            this.onFilterChange();
        });

        // Quarter filter
        document.getElementById('filter-quarter')?.addEventListener('change', (e) => {
            DataManager.filters.quarter = e.target.value;
            this.onFilterChange();
        });

        // Month filter (select single month or ALL)
        document.getElementById('filter-month')?.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'ALL') {
                DataManager.filters.months = [...(DataManager.activeDataset?.months || [])];
            } else {
                DataManager.filters.months = [val];
            }
            this.updateCategoryFilterUI();
            this.onFilterChange();
        });

        // Category Mode Toggle (Union vs Intersection)
        document.querySelectorAll('input[name="cat-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                DataManager.filters.categoryMode = e.target.value;
                this.updateCategoryFilterUI();
                this.onFilterChange();
            });
        });

        // Distributor Name filter
        document.getElementById('filter-distributor')?.addEventListener('change', (e) => {
            DataManager.filters.distributorName = e.target.value;
            this.onFilterChange();
        });

        // SSE / Region filter
        document.getElementById('filter-sse')?.addEventListener('change', (e) => {
            DataManager.filters.sse = e.target.value;
            this.onFilterChange();
        });

        // DSR filter
        document.getElementById('filter-dsr')?.addEventListener('change', (e) => {
            DataManager.filters.dsr = e.target.value;
            this.onFilterChange();
        });

        // Activity filter
        document.getElementById('filter-activity')?.addEventListener('change', (e) => {
            DataManager.filters.activity = e.target.value;
            this.onFilterChange();
        });

        // Slab filter
        document.getElementById('filter-slab')?.addEventListener('change', (e) => {
            DataManager.filters.slab = e.target.value;
            this.onFilterChange();
        });

        // Achievement % Status filter
        document.getElementById('filter-status-pct')?.addEventListener('change', (e) => {
            DataManager.filters.statusPct = e.target.value;
            this.onFilterChange();
        });

        // Retailer Search input (with 200ms debounce)
        let searchTimeout;
        document.getElementById('filter-retailer-search')?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                DataManager.filters.retailerSearch = e.target.value;
                this.onFilterChange();
            }, 200);
        });

        // Reset Filters Button
        document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
            DataManager.syncFiltersWithDataset();
            this.renderAllFilterOptions();
            this.onFilterChange();
        });

        // Category Select All / Clear buttons
        document.getElementById('catAll')?.addEventListener('click', () => {
            const availableCats = DataManager.getAvailableCategoriesForSelectedMonths();
            DataManager.filters.categories = [...availableCats];
            this.updateCategoryFilterUI();
            this.onFilterChange();
        });

        document.getElementById('catClear')?.addEventListener('click', () => {
            DataManager.filters.categories = [];
            this.updateCategoryFilterUI();
            this.onFilterChange();
        });

        // Discrepancy Reconciliation Mode Toggle
        document.getElementById('discrepancyToggle')?.addEventListener('change', (e) => {
            DataManager.filters.discrepancyMode = e.target.checked;
            const badge = document.getElementById('discrepancyModeLabel');
            if (badge) {
                badge.innerText = e.target.checked ? 'Source Cached Values (Un-recalculated)' : 'Reconciled Sums (Oct + Nov + Dec)';
                badge.className = e.target.checked ? 'badge bg-warning text-dark' : 'badge bg-success';
            }
            this.onFilterChange();
        });
    },

    onFilterChange() {
        window.dispatchEvent(new CustomEvent('achievex_filter_changed'));
    },

    /**
     * Re-render all filter controls based on current DataManager dataset
     */
    renderAllFilterOptions() {
        const dataset = DataManager.activeDataset;
        const outlets = DataManager.outlets || [];

        if (!dataset || outlets.length === 0) {
            const yearSelect = document.getElementById('filter-year');
            if (yearSelect) yearSelect.innerHTML = '<option value="ALL">All Years (None)</option>';

            const hySelect = document.getElementById('filter-halfyear');
            if (hySelect) hySelect.innerHTML = '<option value="ALL">All Half-Years (None)</option>';

            const qSelect = document.getElementById('filter-quarter');
            if (qSelect) qSelect.innerHTML = '<option value="ALL">All Quarters (None)</option>';

            const mSelect = document.getElementById('filter-month');
            if (mSelect) mSelect.innerHTML = '<option value="ALL">All Months (None)</option>';

            const distSelect = document.getElementById('filter-distributor');
            if (distSelect) distSelect.innerHTML = '<option value="ALL">All Distributors (0)</option>';

            const sseSelect = document.getElementById('filter-sse');
            if (sseSelect) sseSelect.innerHTML = '<option value="ALL">All SSEs (0)</option>';

            const dsrSelect = document.getElementById('filter-dsr');
            if (dsrSelect) dsrSelect.innerHTML = '<option value="ALL">All DSRs (0)</option>';

            const actSelect = document.getElementById('filter-activity');
            if (actSelect) actSelect.innerHTML = '<option value="ALL">All Activities (0)</option>';

            const slabSelect = document.getElementById('filter-slab');
            if (slabSelect) slabSelect.innerHTML = '<option value="ALL">All Slabs (0)</option>';

            const searchInput = document.getElementById('searchRetailer');
            if (searchInput) searchInput.value = '';

            this.updateCategoryFilterUI();
            return;
        }

        // 1. Year
        const yearSelect = document.getElementById('filter-year');
        if (yearSelect) {
            yearSelect.innerHTML = `<option value="ALL">All Years (${dataset.years.join(', ')})</option>` +
                dataset.years.map(y => `<option value="${y}" ${DataManager.filters.year === y ? 'selected' : ''}>${y}</option>`).join('');
        }

        // 2. Half-Year
        const hySelect = document.getElementById('filter-halfyear');
        if (hySelect) {
            hySelect.innerHTML = `<option value="ALL">All Half-Years (${dataset.half_years.join(', ')})</option>` +
                dataset.half_years.map(hy => `<option value="${hy}" ${DataManager.filters.halfYear === hy ? 'selected' : ''}>${hy}</option>`).join('');
        }

        // 3. Quarter
        const qSelect = document.getElementById('filter-quarter');
        if (qSelect) {
            qSelect.innerHTML = `<option value="ALL">All Quarters (${dataset.quarters.join(', ')})</option>` +
                dataset.quarters.map(q => `<option value="${q}" ${DataManager.filters.quarter === q ? 'selected' : ''}>${q}</option>`).join('');
        }

        // 4. Month
        const mSelect = document.getElementById('filter-month');
        if (mSelect) {
            const months = dataset.months || [];
            const isAllSelected = DataManager.filters.months.length === months.length || DataManager.filters.months.length === 0;
            let options = `<option value="ALL" ${isAllSelected ? 'selected' : ''}>All Months (Cumulative ${dataset.quarters.join('/')})</option>`;
            months.forEach(m => {
                const isSel = !isAllSelected && DataManager.filters.months.includes(m);
                options += `<option value="${m}" ${isSel ? 'selected' : ''}>${m}</option>`;
            });
            mSelect.innerHTML = options;
        }

        // 5. Distributor Name
        const distSet = new Set();
        outlets.forEach(o => { if (o.distributor_name && o.distributor_name !== 'N/A') distSet.add(o.distributor_name); });
        const distList = Array.from(distSet).sort();
        const distSelect = document.getElementById('filter-distributor');
        if (distSelect) {
            distSelect.innerHTML = `<option value="ALL">All Distributors (${distList.length})</option>` +
                distList.map(d => `<option value="${d}" ${DataManager.filters.distributorName === d ? 'selected' : ''}>${d}</option>`).join('');
        }

        // 6. SSE / Region
        const sseSet = new Set();
        outlets.forEach(o => { 
            if (o.sse && o.sse !== 'N/A') sseSet.add(o.sse);
            else if (o.region && o.region !== 'N/A') sseSet.add(o.region);
        });
        const sseList = Array.from(sseSet).sort();
        const sseSelect = document.getElementById('filter-sse');
        if (sseSelect) {
            sseSelect.innerHTML = `<option value="ALL">All SSEs / Regions (${sseList.length})</option>` +
                sseList.map(s => `<option value="${s}" ${DataManager.filters.sse === s ? 'selected' : ''}>${s}</option>`).join('');
        }

        // 7. DSR
        const dsrSet = new Set();
        outlets.forEach(o => { if (o.dsr && o.dsr !== 'N/A') dsrSet.add(o.dsr); });
        const dsrList = Array.from(dsrSet).sort();
        const dsrSelect = document.getElementById('filter-dsr');
        if (dsrSelect) {
            dsrSelect.innerHTML = `<option value="ALL">All DSRs (${dsrList.length})</option>` +
                dsrList.map(d => `<option value="${d}" ${DataManager.filters.dsr === d ? 'selected' : ''}>${d}</option>`).join('');
        }

        // 8. Activity
        const actSet = new Set();
        outlets.forEach(o => { if (o.activity && o.activity !== 'N/A') actSet.add(o.activity); });
        const actList = Array.from(actSet).sort();
        const actSelect = document.getElementById('filter-activity');
        if (actSelect) {
            actSelect.innerHTML = `<option value="ALL">All Activities (${actList.length})</option>` +
                actList.map(a => `<option value="${a}" ${DataManager.filters.activity === a ? 'selected' : ''}>${a}</option>`).join('');
        }

        // 9. Slab
        const slabSet = new Set();
        outlets.forEach(o => { if (o.slab && o.slab !== 'N/A') slabSet.add(o.slab); });
        const slabList = Array.from(slabSet).sort();
        const slabSelect = document.getElementById('filter-slab');
        if (slabSelect) {
            slabSelect.innerHTML = `<option value="ALL">All Slabs (${slabList.length})</option>` +
                slabList.map(s => `<option value="${s}" ${DataManager.filters.slab === s ? 'selected' : ''}>${s}</option>`).join('');
        }

        // 10. Update Category Chips
        this.updateCategoryFilterUI();
    },

    /**
     * Render category checkbox pills
     */
    updateCategoryFilterUI() {
        const catBox = document.getElementById('category');
        if (!catBox) return;

        if (!DataManager.activeDataset || DataManager.outlets.length === 0) {
            catBox.innerHTML = '<small class="text-muted fst-italic p-2">No active dataset loaded.</small>';
            return;
        }

        const availableCats = DataManager.getAvailableCategoriesForSelectedMonths();
        catBox.innerHTML = '';

        if (availableCats.length === 0) {
            catBox.innerHTML = '<small class="text-muted fst-italic p-2">No category breakdown columns in active selection.</small>';
            return;
        }

        availableCats.forEach(catName => {
            const isChecked = DataManager.filters.categories.includes(catName);
            const label = document.createElement('label');
            label.className = isChecked ? 'active' : '';
            
            // Format clean label without redundant LK prefix
            const displayName = catName.replace(/^LK\s*[A-Z&]+\s*:\s*/i, '');

            label.innerHTML = `
                <input type="checkbox" value="${catName}" ${isChecked ? 'checked' : ''}>
                <span title="${catName}">${displayName}</span>
            `;

            label.querySelector('input').addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!DataManager.filters.categories.includes(catName)) {
                        DataManager.filters.categories.push(catName);
                    }
                    label.classList.add('active');
                } else {
                    DataManager.filters.categories = DataManager.filters.categories.filter(c => c !== catName);
                    label.classList.remove('active');
                }
                this.onFilterChange();
            });

            catBox.appendChild(label);
        });
    }
};

window.FilterController = FilterController;
