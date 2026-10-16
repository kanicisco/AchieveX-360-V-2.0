/**
 * ExportController - CSV & Printable Report Generator
 * Exports filtered or full outlet data with dynamic headers matching current workbook structure.
 */
const ExportController = {
    init() {
        document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportCSV(true));
        document.getElementById('export')?.addEventListener('click', () => this.exportCSV(true));
        document.getElementById('btn-export-all-csv')?.addEventListener('click', () => this.exportCSV(false));
        document.getElementById('btn-print-dashboard')?.addEventListener('click', () => window.print());
        document.getElementById('btn-export-json')?.addEventListener('click', () => this.exportJSON());
    },

    exportCSV(filteredOnly = true) {
        if (!DataManager.activeDataset || DataManager.outlets.length === 0) {
            alert('No active dataset to export.');
            return;
        }

        const dataset = DataManager.activeDataset;
        const records = filteredOnly ? DataManager.getFilteredOutlets() : DataManager.outlets;
        const selectedMonths = DataManager.filters.months.length > 0 ? DataManager.filters.months : (dataset.months || []);
        const selectedCats = DataManager.filters.categories.length > 0 ? DataManager.filters.categories : [];

        // 1. Build Header Row
        const headers = [
            'Distributor Code', 'Distributor Name', 'Region / SSE', 'DSR',
            'Retailer Code', 'Retailer Name', 'URC', 'Activity', 'Slab',
            'Period Target (Rs.)', 'Period Achievement (Rs.)', 'Achievement %'
        ];

        selectedCats.forEach(c => {
            const shortName = c.replace(/^LK\s*[A-Z&]+\s*:\s*/i, '');
            headers.push(`Cat - ${shortName}`);
        });

        const rows = [headers];

        // 2. Populate Data Rows
        records.forEach(o => {
            const m = DataManager.calculateOutletMetrics(o, selectedMonths);
            const pctStr = m.target > 0 ? (m.pct).toFixed(2) + '%' : (m.achievement > 0 ? '100.00%' : '0.00%');

            const row = [
                this.escapeCSV(o.distributor_code),
                this.escapeCSV(o.distributor_name),
                this.escapeCSV(o.sse || o.region),
                this.escapeCSV(o.dsr),
                this.escapeCSV(o.retailer_code),
                this.escapeCSV(o.retailer_name),
                this.escapeCSV(o.urc),
                this.escapeCSV(o.activity),
                this.escapeCSV(o.slab),
                m.target.toFixed(2),
                m.achievement.toFixed(2),
                pctStr
            ];

            selectedCats.forEach(c => {
                const catVal = o.categories ? (o.categories[c] || 0) : 0;
                row.push(catVal.toFixed(2));
            });

            rows.push(row);
        });

        // 3. Convert to CSV String & Download
        const csvContent = "\uFEFF" + rows.map(e => e.join(',')).join('\n'); // UTF-8 BOM for Excel compatibility
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = `${dataset.title.replace(/[^a-z0-9]/gi, '_')}_${filteredOnly ? 'Filtered' : 'All'}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    exportJSON() {
        if (!DataManager.activeDataset || DataManager.outlets.length === 0) {
            alert('No active dataset to export.');
            return;
        }
        const data = {
            dataset: DataManager.activeDataset,
            outlets: DataManager.getFilteredOutlets()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'AchieveX_360_Backup.json');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    escapeCSV(str) {
        if (str === null || str === undefined) return '""';
        const stringified = String(str).replace(/"/g, '""');
        return `"${stringified}"`;
    }
};

window.ExportController = ExportController;
