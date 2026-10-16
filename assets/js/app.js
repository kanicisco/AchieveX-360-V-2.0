/**
 * App - Core Application Entry Point
 * Orchestrates module initialization, theme toggling, watermark controls,
 * and global event coordination between filters, charts, and tables.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Controllers
    FilterController.init();
    ChartController.init();
    TableController.init();
    AdminMapper.init();
    ExportController.init();

    // 2. Initialize Watermark & Theme Toggles
    initWatermarkController();
    initThemeController();

    // 3. Initialize DataManager & Bootstrap Active Dataset
    const loaded = await DataManager.init();

    if (!loaded) {
        if (localStorage.getItem('achievex_dataset_cleared') === 'true') {
            console.log('Dashboard initialized in cleared state (user cleared data).');
            FilterController.renderAllFilterOptions();
            refreshDashboardUI();
        } else {
            console.log('No existing dataset found. Loading default Q4 2026 dataset...');
            await AdminMapper.restoreOriginalQ4(true);
        }
    } else {
        FilterController.renderAllFilterOptions();
        refreshDashboardUI();
    }

    // 4. Listen for Global Events
    window.addEventListener('achievex_dataset_updated', () => {
        FilterController.renderAllFilterOptions();
        refreshDashboardUI();
    });

    window.addEventListener('achievex_filter_changed', () => {
        refreshDashboardUI();
    });
});

/**
 * Global Dashboard UI Refresh Function
 * Dynamically updates Title, Metadata Badges, KPI Cards, Charts & Table
 */
function refreshDashboardUI() {
    const dataset = DataManager.activeDataset;
    const outlets = DataManager.outlets || [];

    // 1. Elements
    const titleEl = document.getElementById('dashboard-title');
    const subtitleEl = document.getElementById('headerSubtitle');
    const badgePeriodEl = document.getElementById('badge-active-period');
    const badgeFileEl = document.getElementById('badge-active-file');
    const badgeTimestampEl = document.getElementById('badge-last-updated');
    const sourceCountEl = document.getElementById('sourceCount');

    // Counts (support both naming conventions in template)
    const countEl = document.getElementById('count') || document.getElementById('kpi-matching-outlets');
    const achCountEl = document.getElementById('achievedCount') || document.getElementById('kpi-100plus-outlets');
    const distEl = document.getElementById('dist') || document.getElementById('kpi-total-distributors');
    const sseEl = document.getElementById('sse') || document.getElementById('kpi-total-sse');
    const dsrEl = document.getElementById('dsr') || document.getElementById('kpi-total-dsr');
    const slabsEl = document.getElementById('slabs') || document.getElementById('kpi-total-slabs');
    const actEl = document.getElementById('activities') || document.getElementById('kpi-total-activities');

    // Target, Achievement, % (if present in DOM)
    const targetEl = document.getElementById('kpi-total-target');
    const achEl = document.getElementById('kpi-total-ach');
    const pctEl = document.getElementById('kpi-ach-pct');
    const pctBar = document.getElementById('kpi-pct-bar');

    // Handle Empty / Cleared Dataset State
    if (!dataset || outlets.length === 0) {
        if (titleEl) titleEl.innerText = 'AchieveX 360 · Activity Outlet Achievements';
        if (subtitleEl) subtitleEl.innerText = 'No Dataset Loaded · Upload an Excel workbook in Admin Panel or restore default data';
        if (badgePeriodEl) badgePeriodEl.innerHTML = '📅 Period: <strong>None</strong>';
        if (badgeFileEl) badgeFileEl.innerHTML = '📁 Source: <strong>No file loaded</strong>';
        if (badgeTimestampEl) badgeTimestampEl.innerHTML = '🕒 Status: <strong>Data Cleared</strong>';
        if (sourceCountEl) sourceCountEl.innerText = '0 total outlets in dataset';

        if (countEl) countEl.innerText = '0';
        if (achCountEl) achCountEl.innerText = '0';
        if (distEl) distEl.innerText = '0';
        if (sseEl) sseEl.innerText = '0';
        if (dsrEl) dsrEl.innerText = '0';
        if (slabsEl) slabsEl.innerText = '0';
        if (actEl) actEl.innerText = '0';

        if (targetEl) targetEl.innerText = 'Rs. 0.00';
        if (achEl) achEl.innerText = 'Rs. 0.00';
        if (pctEl) {
            pctEl.innerText = '0.00%';
            pctEl.className = 'text-muted fw-bold';
        }
        if (pctBar) {
            pctBar.style.width = '0%';
            pctBar.className = 'progress-bar bg-secondary';
        }

        // Render Empty Charts & Table
        ChartController.renderAllCharts();
        TableController.renderTable();
        return;
    }

    // 2. Update Dynamic Titles & Badges for Active Dataset
    if (titleEl) titleEl.innerText = dataset.title;
    if (subtitleEl) {
        const periodStr = `${dataset.half_years?.join('/') || 'H2'} · ${dataset.years?.join('/') || '2026'} | Quarter ${dataset.quarters?.join('/') || 'Q4'}`;
        subtitleEl.innerText = `${periodStr} · Activity Outlet Achievements Explorer`;
    }

    if (badgePeriodEl) {
        badgePeriodEl.innerHTML = `📅 Year: <strong>${dataset.years?.join(', ') || '2026'}</strong> | Half-Year: <strong>${dataset.half_years?.join(', ') || 'H2'}</strong> | Quarter: <strong>${dataset.quarters?.join(', ') || 'Q4'}</strong>`;
    }

    if (badgeFileEl) {
        badgeFileEl.innerHTML = `📁 Source: <strong>${dataset.filename || 'Activity outlet Achievements - 2026 - Q4.xlsb'}</strong>`;
    }

    if (badgeTimestampEl) {
        const dt = dataset.created_at ? new Date(dataset.created_at) : new Date();
        badgeTimestampEl.innerHTML = `🕒 Refreshed: <strong>${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>`;
    }

    if (sourceCountEl) {
        sourceCountEl.innerText = `${DataManager.outlets.length.toLocaleString()} total outlets in dataset`;
    }

    // 3. Update Dynamic KPI Cards
    const kpis = DataManager.getCalculatedKPIs();

    if (targetEl) targetEl.innerText = `Rs. ${kpis.totalTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (achEl) achEl.innerText = `Rs. ${kpis.totalAchievement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    if (pctEl) {
        pctEl.innerText = kpis.achievementPct;
        pctEl.className = kpis.numericPct >= 100 ? 'text-success fw-bold' : (kpis.numericPct >= 80 ? 'text-primary fw-bold' : 'text-danger fw-bold');
    }
    if (pctBar) {
        pctBar.style.width = `${Math.min(kpis.numericPct, 100)}%`;
        pctBar.className = `progress-bar ${kpis.numericPct >= 100 ? 'bg-success' : (kpis.numericPct >= 80 ? 'bg-primary' : (kpis.numericPct >= 50 ? 'bg-warning' : 'bg-danger'))}`;
    }

    if (countEl) countEl.innerText = kpis.totalOutlets.toLocaleString();
    if (achCountEl) achCountEl.innerText = kpis.achievedCount.toLocaleString();
    if (distEl) distEl.innerText = kpis.totalDistributors.toLocaleString();
    if (sseEl) sseEl.innerText = kpis.totalSSE.toLocaleString();
    if (dsrEl) dsrEl.innerText = kpis.totalDSR.toLocaleString();
    if (slabsEl) slabsEl.innerText = kpis.totalSlabs.toLocaleString();
    if (actEl) actEl.innerText = kpis.totalActivities.toLocaleString();

    // 4. Render Visual Analytics & Data Table
    ChartController.renderAllCharts();
    TableController.renderTable();
}

/**
 * Background Watermark Controller
 */
function initWatermarkController() {
    let watermarkState = 1; // 0: Off, 1: On, 2: Subtle, 3: High
    const wmEl = document.getElementById('screenWatermark');
    const wmBtn = document.getElementById('watermarkToggle');
    if (wmBtn && wmEl) {
        wmBtn.onclick = () => {
            watermarkState = (watermarkState + 1) % 4;
            const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark';
            if (watermarkState === 1) {
                wmEl.style.display = 'flex';
                wmEl.style.opacity = isDark ? '0.095' : '0.07';
                wmBtn.innerHTML = '💧 Watermark: On';
            } else if (watermarkState === 2) {
                wmEl.style.display = 'flex';
                wmEl.style.opacity = '0.035';
                wmBtn.innerHTML = '💧 Watermark: Subtle';
            } else if (watermarkState === 3) {
                wmEl.style.display = 'flex';
                wmEl.style.opacity = '0.16';
                wmBtn.innerHTML = '💧 Watermark: High';
            } else {
                wmEl.style.display = 'none';
                wmBtn.innerHTML = '💧 Watermark: Off';
            }
        };
    }
}

/**
 * Dark / Light Theme Controller
 */
function initThemeController() {
    const themeBtn = document.getElementById('themeToggle') || document.getElementById('btn-theme-toggle');
    const wmEl = document.getElementById('screenWatermark');

    const toggleTheme = () => {
        const current = document.documentElement.getAttribute('data-bs-theme') || document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', next);
        document.documentElement.setAttribute('data-theme', next);

        if (themeBtn) {
            themeBtn.innerHTML = next === 'dark' ? '☀️ Light Theme' : '🌙 Dark Theme';
        }

        if (wmEl && wmEl.style.display !== 'none') {
            wmEl.style.opacity = next === 'dark' ? '0.095' : '0.07';
        }

        ChartController.renderAllCharts();
    };

    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
}
