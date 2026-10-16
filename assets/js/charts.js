/**
 * ChartController - Interactive Visual Analytics Engine
 * Chart.js powered charts with dynamic theme, responsive resize, and currency formatting.
 */
const ChartController = {
    instances: {},

    init() {
        window.addEventListener('achievex_filter_changed', () => this.renderAllCharts());
        window.addEventListener('resize', () => {
            Object.values(this.instances).forEach(chart => {
                if (chart && typeof chart.resize === 'function') chart.resize();
            });
        });
    },

    renderAllCharts() {
        this.destroyChart('monthlyTrendChart');
        this.destroyChart('activityChart');
        this.destroyChart('distributorChart');
        this.destroyChart('slabChart');

        if (!DataManager.activeDataset || DataManager.outlets.length === 0) {
            ['monthlyTrendChart', 'activityChart', 'distributorChart', 'slabChart'].forEach(id => {
                const canvas = document.getElementById(id);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                }
            });
            return;
        }

        this.renderMonthlyTrendChart();
        this.renderActivityChart();
        this.renderDistributorChart();
        this.renderSlabChart();
    },

    destroyChart(chartId) {
        if (this.instances[chartId]) {
            try {
                this.instances[chartId].destroy();
            } catch (e) {}
            delete this.instances[chartId];
        }
    },

    isDarkMode() {
        return document.documentElement.getAttribute('data-bs-theme') === 'dark' || 
               document.documentElement.getAttribute('data-theme') === 'dark';
    },

    formatCurrency(val) {
        if (val === null || val === undefined) return 'Rs. 0';
        return 'Rs. ' + Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    },

    /**
     * 1. Monthly Target vs Achievement Combo Chart
     */
    renderMonthlyTrendChart() {
        this.destroyChart('monthlyTrendChart');
        const canvas = document.getElementById('monthlyTrendChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = DataManager.getMonthlyTrendData();
        const isDark = this.isDarkMode();
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

        this.instances['monthlyTrendChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Target',
                        data: data.targets,
                        backgroundColor: 'rgba(59, 130, 246, 0.65)',
                        borderColor: '#2563eb',
                        borderWidth: 1.5,
                        borderRadius: 6,
                        order: 2
                    },
                    {
                        label: 'Achievement',
                        data: data.achievements,
                        backgroundColor: 'rgba(16, 185, 129, 0.75)',
                        borderColor: '#10b981',
                        borderWidth: 1.5,
                        borderRadius: 6,
                        order: 3
                    },
                    {
                        label: 'Achievement %',
                        data: data.pcts,
                        type: 'line',
                        borderColor: '#f59e0b',
                        backgroundColor: '#f59e0b',
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        yAxisID: 'y1',
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: textColor, font: { family: 'Inter', size: 12, weight: 600 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                if (ctx.dataset.yAxisID === 'y1') return ` Achievement %: ${ctx.parsed.y}%`;
                                return ` ${ctx.dataset.label}: ${this.formatCurrency(ctx.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { family: 'Inter', weight: 600 } }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            callback: (v) => v >= 1000000 ? (v / 1000000).toFixed(0) + 'M' : (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)
                        },
                        title: { display: true, text: 'Amount (Rs.)', color: textColor, font: { size: 11 } }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: textColor, callback: (v) => v + '%' },
                        title: { display: true, text: 'Percentage (%)', color: textColor, font: { size: 11 } }
                    }
                }
            }
        });
    },

    /**
     * 2. Activity Performance Breakdown Chart
     */
    renderActivityChart() {
        this.destroyChart('activityChart');
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = DataManager.getActivityBreakdownData();
        const isDark = this.isDarkMode();
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

        this.instances['activityChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Target',
                        data: data.targets,
                        backgroundColor: 'rgba(99, 102, 241, 0.6)',
                        borderColor: '#6366f1',
                        borderWidth: 1.5,
                        borderRadius: 6
                    },
                    {
                        label: 'Achievement',
                        data: data.achievements,
                        backgroundColor: 'rgba(13, 148, 136, 0.75)',
                        borderColor: '#0d9488',
                        borderWidth: 1.5,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Horizontal bars
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: textColor, font: { family: 'Inter', size: 12, weight: 600 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${ctx.dataset.label}: ${this.formatCurrency(ctx.parsed.x)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            callback: (v) => v >= 1000000 ? (v / 1000000).toFixed(0) + 'M' : (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { family: 'Inter', size: 11, weight: 600 } }
                    }
                }
            }
        });
    },

    /**
     * 3. Distributor Leaderboard Chart
     */
    renderDistributorChart() {
        this.destroyChart('distributorChart');
        const canvas = document.getElementById('distributorChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = DataManager.getDistributorLeaderboardData();
        const isDark = this.isDarkMode();
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

        this.instances['distributorChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Achievement',
                        data: data.achievements,
                        backgroundColor: 'rgba(37, 99, 235, 0.75)',
                        borderColor: '#2563eb',
                        borderWidth: 1.5,
                        borderRadius: 6
                    },
                    {
                        label: 'Target',
                        data: data.targets,
                        backgroundColor: 'rgba(203, 213, 225, 0.45)',
                        borderColor: '#94a3b8',
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: textColor, font: { family: 'Inter', size: 12, weight: 600 } }
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => data.fullLabels[items[0].dataIndex],
                            label: (ctx) => ` ${ctx.dataset.label}: ${this.formatCurrency(ctx.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, maxRotation: 45, minRotation: 0, font: { size: 10 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            callback: (v) => v >= 1000000 ? (v / 1000000).toFixed(0) + 'M' : (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)
                        }
                    }
                }
            }
        });
    },

    /**
     * 4. Slab Distribution & Performance Doughnut Chart
     */
    renderSlabChart() {
        this.destroyChart('slabChart');
        const canvas = document.getElementById('slabChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = DataManager.getSlabDistributionData();
        const isDark = this.isDarkMode();
        const textColor = isDark ? '#94a3b8' : '#64748b';

        const slabColors = [
            '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#84cc16'
        ];

        this.instances['slabChart'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.counts,
                    backgroundColor: slabColors.slice(0, data.labels.length),
                    borderWidth: isDark ? 2 : 1,
                    borderColor: isDark ? '#1e293b' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '62%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: textColor, font: { family: 'Inter', size: 11, weight: 600 }, boxWidth: 14 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const idx = ctx.dataIndex;
                                const count = data.counts[idx];
                                const ach = this.formatCurrency(data.achievements[idx]);
                                const pct = data.pcts[idx];
                                return ` ${data.labels[idx]}: ${count} outlets (${pct}% Ach)`;
                            }
                        }
                    }
                }
            }
        });
    }
};

window.ChartController = ChartController;
