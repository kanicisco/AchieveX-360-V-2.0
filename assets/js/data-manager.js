/**
 * DataManager - Central Data Model, Dynamic Calculations & Persistence Engine
 * Zero hardcoding. Handles multi-level filtering, category union/intersection,
 * period aggregation, discrepancy reconciliation, and IndexedDB/MySQL persistence.
 */
const DataManager = {
    activeDataset: null,
    outlets: [],
    
    // Active UI Filter State
    filters: {
        year: 'ALL',
        halfYear: 'ALL',
        quarter: 'ALL',
        months: [], // Selected month strings, e.g. ['October 2026'] or [] for all
        categoryMode: 'UNION', // 'UNION' or 'INTERSECTION'
        categories: [], // Selected category names
        distributorName: 'ALL',
        sse: 'ALL',
        dsr: 'ALL',
        activity: 'ALL',
        slab: 'ALL',
        statusPct: 'ALL', // 'ALL', '100_PLUS', '80_TO_100', '50_TO_80', 'UNDER_50'
        retailerSearch: '',
        discrepancyMode: false // false = Reconciled (calculated), true = Source Cached
    },

    /**
     * Initialize DataManager & load stored/active dataset
     */
    async init() {
        // If user intentionally cleared data, do not auto-reload default datasets
        if (localStorage.getItem('achievex_dataset_cleared') === 'true') {
            console.log('User previously cleared dataset. Dashboard remaining in empty state.');
            this.activeDataset = null;
            this.outlets = [];
            return false;
        }

        // 1. Try fetching active dataset from PHP MySQL API
        try {
            const resp = await fetch('api/data.php?action=get_active');
            if (resp.ok) {
                const data = await resp.json();
                if (data.success && data.dataset && data.outlets && data.outlets.length > 0) {
                    this.activeDataset = data.dataset;
                    this.activeDataset.all_categories = this.activeDataset.all_categories || this.activeDataset.categories || [];
                    this.activeDataset.categories = this.activeDataset.all_categories;
                    this.outlets = data.outlets;
                    this.syncFiltersWithDataset();
                    console.log('✓ Loaded active dataset from MySQL DB:', this.activeDataset.title);
                    return true;
                }
            }
        } catch (e) {
            console.log('PHP/MySQL API unavailable or offline. Checking local JSON / LocalStorage...');
        }

        // 2. Try loading pre-compiled Q4 master dataset from data/q4_2026_dataset.json
        try {
            const resp = await fetch('data/q4_2026_dataset.json');
            if (resp.ok) {
                const data = await resp.json();
                if (data.dataset && data.outlets && data.outlets.length > 0) {
                    this.activeDataset = data.dataset;
                    this.outlets = data.outlets;
                    this.syncFiltersWithDataset();
                    console.log('✓ Loaded Q4 2026 dataset from data/q4_2026_dataset.json');
                    return true;
                }
            }
        } catch (err) {
            console.log('Static JSON dataset not loaded:', err);
        }

        // 3. Fallback to LocalStorage
        const localData = localStorage.getItem('achievex_360_dataset');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                if (parsed.dataset && parsed.outlets) {
                    this.activeDataset = parsed.dataset;
                    this.outlets = parsed.outlets;
                    this.syncFiltersWithDataset();
                    console.log('✓ Loaded dataset from LocalStorage:', this.activeDataset.title);
                    return true;
                }
            } catch (err) {
                console.error('Error parsing LocalStorage dataset', err);
            }
        }

        return false;
    },

    /**
     * Set new dataset and persist across LocalStorage & MySQL
     */
    async setDataset(parsedData, filename = 'Workbook.xlsx') {
        localStorage.removeItem('achievex_dataset_cleared');
        const detectedMonths = parsedData.detectedMonths || [];
        const detectedYears = parsedData.detectedYears || [parsedData.detectedYear || '2026'];
        const detectedHalfYears = parsedData.detectedHalfYears || [parsedData.detectedHalfYear || 'H2'];
        const detectedQuarters = parsedData.detectedQuarters || ['Q4'];
        const allCats = parsedData.allCategories || [];

        this.activeDataset = {
            id: Date.now(),
            filename: filename,
            title: parsedData.titleText || `Activity Outlet Achievements · ${detectedQuarters.join('/')} ${detectedYears.join('/')}`,
            years: detectedYears,
            half_years: detectedHalfYears,
            quarters: detectedQuarters,
            months: detectedMonths,
            categories_by_month: parsedData.categoriesByMonth || {},
            all_categories: allCats,
            categories: allCats,
            column_mapping: parsedData.columnMapping || {},
            month_columns: parsedData.monthColumns || {},
            records_count: parsedData.outlets.length,
            created_at: new Date().toISOString()
        };

        this.outlets = parsedData.outlets;
        this.syncFiltersWithDataset();

        // Save to LocalStorage for offline compatibility
        try {
            localStorage.setItem('achievex_360_dataset', JSON.stringify({
                dataset: this.activeDataset,
                outlets: this.outlets
            }));
        } catch (e) {
            console.warn('LocalStorage quota exceeded or blocked.', e);
        }

        // Save to MySQL API in background
        try {
            await fetch('api/data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_dataset',
                    dataset: this.activeDataset,
                    outlets: this.outlets
                })
            });
        } catch (e) {
            console.log('MySQL Sync optional/offline mode.');
        }

        return this.activeDataset;
    },

    /**
     * Align filters with active dataset options
     */
    syncFiltersWithDataset() {
        if (!this.activeDataset) return;
        this.filters.year = 'ALL';
        this.filters.halfYear = 'ALL';
        this.filters.quarter = 'ALL';
        this.filters.months = [...(this.activeDataset.months || [])]; // Default: All months selected
        this.filters.categoryMode = 'UNION';
        const cats = this.activeDataset.all_categories || this.activeDataset.categories || [];
        this.filters.categories = [...cats];
        this.filters.distributorName = 'ALL';
        this.filters.sse = 'ALL';
        this.filters.dsr = 'ALL';
        this.filters.activity = 'ALL';
        this.filters.slab = 'ALL';
        this.filters.statusPct = 'ALL';
        this.filters.retailerSearch = '';
        this.filters.discrepancyMode = false;
    },

    /**
     * Get categories applicable for current month selections
     */
    getAvailableCategoriesForSelectedMonths() {
        if (!this.activeDataset) return [];
        const all = this.activeDataset.all_categories || this.activeDataset.categories || [];
        const selectedMonths = this.filters.months.length > 0 ? this.filters.months : (this.activeDataset.months || []);
        const catByMonth = this.activeDataset.categories_by_month || {};

        if (selectedMonths.length === 0 || Object.keys(catByMonth).length === 0) return all;

        if (this.filters.categoryMode === 'INTERSECTION') {
            let intersection = null;
            selectedMonths.forEach(m => {
                const catsInM = catByMonth[m] && catByMonth[m].length > 0 ? catByMonth[m] : all;
                if (intersection === null) {
                    intersection = new Set(catsInM);
                } else {
                    intersection = new Set([...intersection].filter(x => catsInM.includes(x)));
                }
            });
            const res = Array.from(intersection || []);
            return res.length > 0 ? res : all;
        } else {
            const unionSet = new Set();
            selectedMonths.forEach(m => {
                const catsInM = catByMonth[m] && catByMonth[m].length > 0 ? catByMonth[m] : all;
                catsInM.forEach(c => unionSet.add(c));
            });
            return unionSet.size > 0 ? Array.from(unionSet) : all;
        }
    },

    /**
     * Calculate active target & achievement for an outlet given selected months
     */
    calculateOutletMetrics(outlet, selectedMonths) {
        if (!selectedMonths || selectedMonths.length === 0) {
            selectedMonths = this.activeDataset ? (this.activeDataset.months || []) : [];
        }

        let target = 0;
        let achievement = 0;

        // If all months in dataset are selected and source cached mode is requested
        if (this.filters.discrepancyMode && outlet.q4_target_source !== undefined && selectedMonths.length === (this.activeDataset?.months || []).length) {
            target = outlet.q4_target_source;
            achievement = outlet.q4_achievement_source;
        } else {
            selectedMonths.forEach(m => {
                const mData = outlet.monthly_data ? outlet.monthly_data[m] : null;
                if (mData) {
                    if (mData.target !== null && mData.target !== undefined) target += mData.target;
                    if (mData.achievement !== null && mData.achievement !== undefined) achievement += mData.achievement;
                }
            });
        }

        const pct = target > 0 ? (achievement / target) * 100 : (achievement > 0 ? 100 : 0);
        return { target, achievement, pct };
    },

    /**
     * Filter Outlets based on current active filter rules
     */
    getFilteredOutlets() {
        if (!this.outlets || this.outlets.length === 0) return [];
        const f = this.filters;
        const selectedMonths = f.months.length > 0 ? f.months : (this.activeDataset?.months || []);

        return this.outlets.filter(o => {
            // Distributor filter
            if (f.distributorName !== 'ALL' && o.distributor_name !== f.distributorName) return false;

            // SSE / Region filter
            if (f.sse !== 'ALL' && o.sse !== f.sse && o.region !== f.sse) return false;

            // DSR filter
            if (f.dsr !== 'ALL' && o.dsr !== f.dsr) return false;

            // Activity filter
            if (f.activity !== 'ALL' && o.activity !== f.activity) return false;

            // Slab filter (normalized)
            if (f.slab !== 'ALL' && o.slab !== f.slab && o.raw_slab !== f.slab) return false;

            // Text search (Retailer Code, Name, Old Code, URC)
            if (f.retailerSearch && f.retailerSearch.trim() !== '') {
                const q = f.retailerSearch.toLowerCase().trim();
                const matchCode = String(o.retailer_code || '').toLowerCase().includes(q);
                const matchName = String(o.retailer_name || '').toLowerCase().includes(q);
                const matchOld = String(o.retailer_old_code || '').toLowerCase().includes(q);
                const matchUrc = String(o.urc || '').toLowerCase().includes(q);
                if (!matchCode && !matchName && !matchOld && !matchUrc) return false;
            }

            // Target % Status filter
            if (f.statusPct !== 'ALL') {
                const metrics = this.calculateOutletMetrics(o, selectedMonths);
                const pct = metrics.pct;
                if (f.statusPct === '100_PLUS' && pct < 100) return false;
                if (f.statusPct === '80_TO_100' && (pct < 80 || pct >= 100)) return false;
                if (f.statusPct === '50_TO_80' && (pct < 50 || pct >= 80)) return false;
                if (f.statusPct === 'UNDER_50' && pct >= 50) return false;
            }

            return true;
        });
    },

    /**
     * Compute summary KPIs for filtered dataset
     */
    getCalculatedKPIs() {
        const filtered = this.getFilteredOutlets();
        if (!this.activeDataset || filtered.length === 0) {
            return {
                totalTarget: 0,
                totalAchievement: 0,
                achievementPct: '0.00%',
                numericPct: 0,
                totalOutlets: 0,
                achievedCount: 0,
                totalDistributors: 0,
                totalSSE: 0,
                totalDSR: 0,
                totalSlabs: 0,
                totalActivities: 0,
                periodLabel: this.activeDataset ? this.activeDataset.title : 'No Data Loaded'
            };
        }

        const selectedMonths = this.filters.months.length > 0 ? this.filters.months : (this.activeDataset.months || []);

        let totalTarget = 0;
        let totalAchievement = 0;
        let achievedCount = 0;
        const distributorsSet = new Set();
        const sseSet = new Set();
        const dsrSet = new Set();
        const slabsSet = new Set();
        const activitiesSet = new Set();

        filtered.forEach(o => {
            if (o.distributor_name && o.distributor_name !== 'N/A') distributorsSet.add(o.distributor_name);
            if (o.sse && o.sse !== 'N/A') sseSet.add(o.sse);
            else if (o.region && o.region !== 'N/A') sseSet.add(o.region);
            if (o.dsr && o.dsr !== 'N/A') dsrSet.add(o.dsr);
            if (o.slab && o.slab !== 'N/A') slabsSet.add(o.slab);
            if (o.activity && o.activity !== 'N/A') activitiesSet.add(o.activity);

            const m = this.calculateOutletMetrics(o, selectedMonths);
            totalTarget += m.target;
            totalAchievement += m.achievement;
            if (m.target > 0 && m.achievement >= m.target) {
                achievedCount++;
            }
        });

        const numericPct = totalTarget > 0 ? (totalAchievement / totalTarget) * 100 : 0;
        const pctStr = `${numericPct.toFixed(2)}%`;

        let periodLabel = this.activeDataset.title;
        if (selectedMonths.length === 1) {
            periodLabel += ` · ${selectedMonths[0]}`;
        } else if (selectedMonths.length < (this.activeDataset.months || []).length) {
            periodLabel += ` · (${selectedMonths.length} Months Selected)`;
        }

        return {
            totalTarget,
            totalAchievement,
            achievementPct: pctStr,
            numericPct,
            totalOutlets: filtered.length,
            achievedCount,
            totalDistributors: distributorsSet.size,
            totalSSE: sseSet.size,
            totalDSR: dsrSet.size,
            totalSlabs: slabsSet.size,
            totalActivities: activitiesSet.size,
            periodLabel
        };
    },

    /**
     * Compute monthly trend targets and achievements for charts
     */
    getMonthlyTrendData() {
        if (!this.activeDataset) return { labels: [], targets: [], achievements: [], pcts: [] };

        const filtered = this.getFilteredOutlets();
        const months = this.activeDataset.months || [];

        const targets = [];
        const achievements = [];
        const pcts = [];

        months.forEach(m => {
            let tSum = 0;
            let aSum = 0;
            filtered.forEach(o => {
                const mData = o.monthly_data ? o.monthly_data[m] : null;
                if (mData) {
                    if (mData.target) tSum += mData.target;
                    if (mData.achievement) aSum += mData.achievement;
                }
            });

            targets.push(tSum);
            achievements.push(aSum);
            pcts.push(tSum > 0 ? parseFloat(((aSum / tSum) * 100).toFixed(2)) : 0);
        });

        return {
            labels: months.map(m => m.split(' ')[0]),
            fullLabels: months,
            targets,
            achievements,
            pcts
        };
    },

    /**
     * Compute Activity Breakdown targets and achievements for charts
     */
    getActivityBreakdownData() {
        const filtered = this.getFilteredOutlets();
        const selectedMonths = this.filters.months.length > 0 ? this.filters.months : (this.activeDataset?.months || []);
        const actMap = {};

        filtered.forEach(o => {
            const act = o.activity || 'Other';
            if (!actMap[act]) actMap[act] = { target: 0, achievement: 0, count: 0 };
            const m = this.calculateOutletMetrics(o, selectedMonths);
            actMap[act].target += m.target;
            actMap[act].achievement += m.achievement;
            actMap[act].count++;
        });

        const labels = Object.keys(actMap);
        const targets = labels.map(l => actMap[l].target);
        const achievements = labels.map(l => actMap[l].achievement);
        const pcts = labels.map(l => actMap[l].target > 0 ? parseFloat(((actMap[l].achievement / actMap[l].target) * 100).toFixed(2)) : 0);

        return { labels, targets, achievements, pcts, counts: labels.map(l => actMap[l].count) };
    },

    /**
     * Compute Distributor Leaderboard data
     */
    getDistributorLeaderboardData() {
        const filtered = this.getFilteredOutlets();
        const selectedMonths = this.filters.months.length > 0 ? this.filters.months : (this.activeDataset?.months || []);
        const distMap = {};

        filtered.forEach(o => {
            const dist = o.distributor_name || 'Unknown';
            if (!distMap[dist]) distMap[dist] = { target: 0, achievement: 0, count: 0 };
            const m = this.calculateOutletMetrics(o, selectedMonths);
            distMap[dist].target += m.target;
            distMap[dist].achievement += m.achievement;
            distMap[dist].count++;
        });

        // Sort by achievement descending
        const sorted = Object.entries(distMap)
            .sort((a, b) => b[1].achievement - a[1].achievement);

        const labels = sorted.map(s => s[0].length > 20 ? s[0].slice(0, 18) + '...' : s[0]);
        const fullLabels = sorted.map(s => s[0]);
        const achievements = sorted.map(s => s[1].achievement);
        const targets = sorted.map(s => s[1].target);
        const pcts = sorted.map(s => s[1].target > 0 ? parseFloat(((s[1].achievement / s[1].target) * 100).toFixed(2)) : 0);

        return { labels, fullLabels, targets, achievements, pcts };
    },

    /**
     * Compute Slab distribution and achievement data
     */
    getSlabDistributionData() {
        const filtered = this.getFilteredOutlets();
        const selectedMonths = this.filters.months.length > 0 ? this.filters.months : (this.activeDataset?.months || []);
        const slabMap = {};

        filtered.forEach(o => {
            const slab = o.slab || 'Standard';
            if (!slabMap[slab]) slabMap[slab] = { target: 0, achievement: 0, count: 0 };
            const m = this.calculateOutletMetrics(o, selectedMonths);
            slabMap[slab].target += m.target;
            slabMap[slab].achievement += m.achievement;
            slabMap[slab].count++;
        });

        const labels = Object.keys(slabMap);
        const counts = labels.map(l => slabMap[l].count);
        const achievements = labels.map(l => slabMap[l].achievement);
        const pcts = labels.map(l => slabMap[l].target > 0 ? parseFloat(((slabMap[l].achievement / slabMap[l].target) * 100).toFixed(2)) : 0);

        return { labels, counts, achievements, pcts };
    },

    /**
     * Compute Category contribution data (Top categories by volume/value)
     */
    getCategoryContributionData() {
        const filtered = this.getFilteredOutlets();
        const catMap = {};

        filtered.forEach(o => {
            if (o.categories) {
                Object.entries(o.categories).forEach(([catName, val]) => {
                    const cleanName = catName.replace(/^LK\s*[A-Z&]+\s*:\s*/i, '').trim();
                    catMap[cleanName] = (catMap[cleanName] || 0) + (val || 0);
                });
            }
        });

        const sorted = Object.entries(catMap)
            .filter(entry => entry[1] > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        return {
            labels: sorted.map(s => s[0]),
            values: sorted.map(s => s[1])
        };
    },

    /**
     * Clear all stored dataset state
     */
    async clearAllData() {
        this.activeDataset = null;
        this.outlets = [];
        localStorage.setItem('achievex_dataset_cleared', 'true');
        localStorage.removeItem('achievex_360_dataset');
        
        // Reset active filter state
        this.filters.year = 'ALL';
        this.filters.halfYear = 'ALL';
        this.filters.quarter = 'ALL';
        this.filters.months = [];
        this.filters.categories = [];
        this.filters.distributorName = 'ALL';
        this.filters.sse = 'ALL';
        this.filters.dsr = 'ALL';
        this.filters.activity = 'ALL';
        this.filters.slab = 'ALL';
        this.filters.statusPct = 'ALL';
        this.filters.retailerSearch = '';
        this.filters.discrepancyMode = false;

        try {
            await fetch('api/reset.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear_all' })
            });
        } catch (e) {
            console.log('Reset PHP endpoint ignored/offline');
        }
    }
};

window.DataManager = DataManager;
