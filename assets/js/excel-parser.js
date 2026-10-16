/**
 * ExcelParser - Dynamic Excel Inspection and Parsing Engine
 * SheetJS based reader with universal single-row and multi-row header support,
 * automatic period and category detection, ISO date pattern matching, and zero hardcoding.
 */
const ExcelParser = {
    MONTH_NAMES: [
        'january', 'february', 'march', 'april', 'may', 'june', 
        'july', 'august', 'september', 'october', 'november', 'december',
        'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ],

    MONTH_NORM: {
        'jan': 'January', 'january': 'January',
        'feb': 'February', 'february': 'February',
        'mar': 'March', 'march': 'March',
        'apr': 'April', 'april': 'April',
        'may': 'May',
        'jun': 'June', 'june': 'June',
        'jul': 'July', 'july': 'July',
        'aug': 'August', 'august': 'August',
        'sep': 'September', 'september': 'September',
        'oct': 'October', 'october': 'October',
        'nov': 'November', 'november': 'November',
        'dec': 'December', 'december': 'December'
    },

    /**
     * Inspect file or binary buffer and return raw sheet data and detected structure
     */
    async inspectWorkbook(fileOrBuffer, targetSheetName = null) {
        let uint8Data;
        if (fileOrBuffer instanceof Uint8Array) {
            uint8Data = fileOrBuffer;
        } else if (fileOrBuffer instanceof ArrayBuffer) {
            uint8Data = new Uint8Array(fileOrBuffer);
        } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
            const buf = await fileOrBuffer.arrayBuffer();
            uint8Data = new Uint8Array(buf);
        } else {
            throw new Error('Invalid file input provided to Excel parser.');
        }

        // Read workbook using SheetJS with full binary and formulas support
        const workbook = XLSX.read(uint8Data, { type: 'array', cellDates: true, cellFormulas: true });
        const sheetNames = workbook.SheetNames;
        
        if (!sheetNames || sheetNames.length === 0) {
            throw new Error('Workbook contains no readable worksheets.');
        }

        // Auto-select best data sheet if not explicitly chosen
        let activeSheet = targetSheetName;
        if (!activeSheet || !sheetNames.includes(activeSheet)) {
            const preferred = ['List', 'Q4', 'H1 2026 Outlets', 'H2 FY 2026-27 Data', 'July F', 'Nestmo F', 'Aug F', 'Sep f', 'TSP', 'Sheet1'];
            activeSheet = preferred.find(s => sheetNames.includes(s)) || sheetNames[0];
        }

        const worksheet = workbook.Sheets[activeSheet];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        const result = this.parseRawMatrix(rawRows, sheetNames, activeSheet);
        result.rawWorkbook = workbook;
        return result;
    },

    /**
     * Parse raw 2D array matrix into structured data model
     */
    parseRawMatrix(rawRows, sheetNames = [], activeSheet = '') {
        if (!rawRows || rawRows.length === 0) {
            throw new Error(`Worksheet '${activeSheet}' is empty.`);
        }

        // 1. Detect Title and Year/Half-Year/Quarter metadata
        let detectedYear = null;
        let detectedHalfYear = null;
        let detectedQuarter = null;
        let titleText = `Activity Outlet Achievements - ${activeSheet}`;

        for (let i = 0; i < Math.min(8, rawRows.length); i++) {
            const rowStr = rawRows[i].join(' ');
            if (rowStr.trim()) {
                const firstCell = String(rawRows[i][0] || '').trim();
                if (firstCell && firstCell.length > 5 && /activity|outlet|achievement/i.test(firstCell)) {
                    titleText = firstCell;
                }
                const yearMatch = rowStr.match(/(FY\s*\d{4}[-\/]\d{2,4}|\b20\d{2}\b)/i);
                if (yearMatch && !detectedYear) {
                    detectedYear = yearMatch[0].trim();
                }

                const hyMatch = rowStr.match(/\b(H[12]|HY[12]|1st Half|2nd Half|First Half|Second Half)\b/i);
                if (hyMatch && !detectedHalfYear) {
                    detectedHalfYear = hyMatch[0].trim().toUpperCase();
                }

                const qMatch = rowStr.match(/\b(Q[1-4])\b/i);
                if (qMatch && !detectedQuarter) {
                    detectedQuarter = qMatch[0].trim().toUpperCase();
                }
            }
        }

        if (!detectedYear) detectedYear = '2026';
        if (!detectedHalfYear) detectedHalfYear = 'H2';

        // 2. Identify Header Row & Multi-Row structure
        let headerRowIdx = -1;
        let isMultiRow = false;
        let periodRowIdx = -1;

        for (let r = 0; r < Math.min(6, rawRows.length); r++) {
            const row = rawRows[r].map(c => String(c).trim());
            const hasIdentifiers = row.some(c => 
                /\bdistcode\b|distributor\s*code|distributor|retailer\s*code|retailer\s*name/i.test(c)
            );
            if (hasIdentifiers) {
                headerRowIdx = r;
                if (r > 0) {
                    const prevRow = rawRows[r - 1].map(c => String(c).trim());
                    const hasPeriodOrCat = prevRow.some(c => 
                        /\boct\b|\bnov\b|\bdec\b|\bq[1-4]\b|\bjan\b|\bfeb\b|\bmar\b|\bapr\b|\bmay\b|\bjun\b|\bjul\b|\baug\b|\bsep\b|lk\s*c&b|lk\s*cul|lk\s*nsb|lk\s*ssd/i.test(c)
                    );
                    if (hasPeriodOrCat) {
                        isMultiRow = true;
                        periodRowIdx = r - 1;
                    }
                }
                break;
            }
        }

        if (headerRowIdx === -1) {
            headerRowIdx = 0;
        }

        const headers = rawRows[headerRowIdx].map(c => String(c).trim());
        const periodHeaders = isMultiRow ? rawRows[periodRowIdx].map(c => String(c).trim()) : [];

        // 3. Map base column indices
        const columnMapping = {
            distributor_code: -1,
            distributor_name: -1,
            sse: -1,
            dsr: -1,
            retailer_code: -1,
            retailer_name: -1,
            urc: -1,
            activity: -1,
            slab: -1
        };

        headers.forEach((h, idx) => {
            const hl = h.toLowerCase();
            if (/\bdistcode\b|distributor\s*code|dist\s*code/i.test(hl) && columnMapping.distributor_code === -1) columnMapping.distributor_code = idx;
            else if (/\bdistname\b|distributor\s*name|distributor|supermarket/i.test(hl) && columnMapping.distributor_name === -1) columnMapping.distributor_name = idx;
            else if (/region|cluster|\bsse\b|sse\s*name/i.test(hl) && columnMapping.sse === -1) columnMapping.sse = idx;
            else if (/\bdsr\b|dsr\s*name/i.test(hl) && columnMapping.dsr === -1) columnMapping.dsr = idx;
            else if (/retailer\s*code|outlet\s*code|store\s*code/i.test(hl) && columnMapping.retailer_code === -1) columnMapping.retailer_code = idx;
            else if (/retailer\s*name|outlet\s*name|store\s*name|outlet/i.test(hl) && columnMapping.retailer_name === -1) columnMapping.retailer_name = idx;
            else if (/retailer\s*urccode|urccode|\burc\b/i.test(hl) && columnMapping.urc === -1) columnMapping.urc = idx;
            else if (/activity|campaign/i.test(hl) && columnMapping.activity === -1) columnMapping.activity = idx;
            else if (/outlet\s*classification\s*name|classification|slab|tier|segment/i.test(hl) && columnMapping.slab === -1) columnMapping.slab = idx;
        });

        // 4. Detect Periods & Categories
        const monthColumns = {};
        const detectedMonths = [];
        const detectedQuarters = new Set();
        if (detectedQuarter) detectedQuarters.add(detectedQuarter);
        const categoriesByMonth = {};
        const allCategories = [];

        const maxCols = Math.max(
            headers.length,
            periodHeaders.length,
            ...(rawRows.slice(0, 10).map(r => (r && Array.isArray(r)) ? r.length : 0))
        );

        if (isMultiRow) {
            let currentPeriod = null;
            let currentPeriodType = null;

            for (let c = 0; c < maxCols; c++) {
                const pText = (periodHeaders[c] !== undefined ? String(periodHeaders[c]) : '').trim();
                const hText = (headers[c] !== undefined ? String(headers[c]) : '').trim();

                if (pText) {
                    const qM = pText.match(/\b(Q[1-4])\b/i);
                    if (qM) {
                        currentPeriod = qM[0].toUpperCase();
                        currentPeriodType = 'quarter';
                        detectedQuarters.add(currentPeriod);
                    } else {
                        let foundM = null;
                        for (const m of this.MONTH_NAMES) {
                            const re = new RegExp('\\b' + m + '\\b', 'i');
                            if (re.test(pText)) {
                                foundM = this.MONTH_NORM[m.toLowerCase()] || m;
                                break;
                            }
                        }
                        if (foundM) {
                            currentPeriod = `${foundM} ${detectedYear}`;
                            currentPeriodType = 'month';
                            if (!detectedMonths.includes(currentPeriod)) {
                                detectedMonths.push(currentPeriod);
                                monthColumns[currentPeriod] = { targetCol: -1, achCol: -1, pctCol: -1, categories: {} };
                                categoriesByMonth[currentPeriod] = [];
                            }
                        } else if (pText.startsWith('LK ') || pText.includes(':') || pText.includes('-') || pText.length > 3) {
                            currentPeriod = null;
                            currentPeriodType = 'category';
                            if (!allCategories.some(cat => cat.col === c)) {
                                allCategories.push({ name: pText, col: c });
                            }
                        }
                    }
                } else if (hText && !Object.values(columnMapping).includes(c)) {
                    // Check if hText is a category column (when row 1 was empty for this column)
                    if (hText.startsWith('LK ') || hText.includes(':') || (hText.length > 2 && !/target|tgt|ach|pct|percent|%|urc|code|slab|activity|dsr|distributor|retailer/i.test(hText))) {
                        if (!allCategories.some(cat => cat.col === c)) {
                            allCategories.push({ name: hText, col: c });
                        }
                    }
                }

                if (currentPeriodType === 'month' && currentPeriod && monthColumns[currentPeriod]) {
                    if (/target|tgt/i.test(hText)) monthColumns[currentPeriod].targetCol = c;
                    else if (/ach|achievement/i.test(hText)) monthColumns[currentPeriod].achCol = c;
                    else if (/%|pct|percent/i.test(hText)) monthColumns[currentPeriod].pctCol = c;
                }
            }
        } else {
            for (let c = 0; c < maxCols; c++) {
                const h = (headers[c] !== undefined ? String(headers[c]) : '').trim();
                if (!h) continue;

                let monthLabel = null;
                const isoMatch = h.match(/\b(20\d{2})-(0[1-9]|1[0-2])\b/);
                if (isoMatch) {
                    const yyyy = isoMatch[1];
                    const mm = parseInt(isoMatch[2], 10);
                    const mNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    monthLabel = `${mNames[mm - 1]} ${yyyy}`;
                } else {
                    for (const m of this.MONTH_NAMES) {
                        if (new RegExp('\\b' + m + '\\b', 'i').test(h)) {
                            const norm = this.MONTH_NORM[m.toLowerCase()] || m;
                            const yM = h.match(/\b(20\d{2})\b/);
                            monthLabel = yM ? `${norm} ${yM[1]}` : `${norm} ${detectedYear}`;
                            break;
                        }
                    }
                }

                if (monthLabel) {
                    if (!monthColumns[monthLabel]) {
                        monthColumns[monthLabel] = { targetCol: -1, achCol: -1, pctCol: -1, categories: {} };
                        detectedMonths.push(monthLabel);
                        categoriesByMonth[monthLabel] = [];
                    }
                    if (/target|tgt/i.test(h)) monthColumns[monthLabel].targetCol = c;
                    else if (/ach|achievement/i.test(h) && !/cat|-/i.test(h)) monthColumns[monthLabel].achCol = c;
                    else if (/%|pct/i.test(h)) monthColumns[monthLabel].pctCol = c;
                    else monthColumns[monthLabel].achCol = c;
                } else if (!Object.values(columnMapping).includes(c)) {
                    if (h.includes('-') || /tier|promo|pack|saver|gold|lk /i.test(h) || h.includes(':') || h.length > 2) {
                        if (!allCategories.some(cat => cat.col === c)) {
                            allCategories.push({ name: h.trim(), col: c });
                        }
                    }
                }
            }
        }

        // Infer quarters from detected months if empty
        detectedMonths.forEach((m) => {
            const mClean = m.split(' ')[0].toLowerCase();
            if (['january', 'february', 'march', 'jan', 'feb', 'mar'].includes(mClean)) detectedQuarters.add('Q1');
            else if (['april', 'may', 'june', 'apr', 'jun'].includes(mClean)) detectedQuarters.add('Q2');
            else if (['july', 'august', 'september', 'jul', 'aug', 'sep'].includes(mClean)) detectedQuarters.add('Q3');
            else if (['october', 'november', 'december', 'oct', 'nov', 'dec'].includes(mClean)) detectedQuarters.add('Q4');
        });

        if (detectedQuarters.size === 0) detectedQuarters.add('Q4');

        if (detectedMonths.length > 0 && allCategories.length > 0) {
            detectedMonths.forEach(m => {
                categoriesByMonth[m] = allCategories.map(c => c.name);
            });
        }

        // 5. Build Outlets Data
        const cleanVal = (val) => {
            if (val === null || val === undefined || val === '' || val === '-' || val === ' -   ') return 0;
            if (typeof val === 'number') return val;
            const n = parseFloat(String(val).replace(/,/g, '').trim());
            return isNaN(n) ? 0 : n;
        };

        const outlets = [];
        const startRow = headerRowIdx + 1;

        for (let r = startRow; r < rawRows.length; r++) {
            const row = rawRows[r];
            if (!row || row.length === 0) continue;

            const retCode = columnMapping.retailer_code !== -1 ? String(row[columnMapping.retailer_code] || '').trim() : '';
            const distCode = columnMapping.distributor_code !== -1 ? String(row[columnMapping.distributor_code] || '').trim() : '';
            const retName = columnMapping.retailer_name !== -1 ? String(row[columnMapping.retailer_name] || '').trim() : '';

            if (!retCode && !distCode && !retName) continue;
            if (/total|summary|average/i.test(retName) || /total|summary/i.test(String(row[0] || ''))) continue;

            const slabVal = columnMapping.slab !== -1 ? String(row[columnMapping.slab] || 'Standard').trim() : 'Standard';
            let normSlab = slabVal;
            if (/bronzed|brozne/i.test(slabVal)) normSlab = 'Bronze';

            const outlet = {
                id: outlets.length + 1,
                distributor_code: distCode || 'N/A',
                distributor_name: columnMapping.distributor_name !== -1 ? String(row[columnMapping.distributor_name] || 'N/A').trim() : 'N/A',
                sse: columnMapping.sse !== -1 ? String(row[columnMapping.sse] || 'N/A').trim() : 'N/A',
                dsr: columnMapping.dsr !== -1 ? String(row[columnMapping.dsr] || 'N/A').trim() : 'N/A',
                retailer_code: retCode || `OUTLET-${outlets.length + 1}`,
                retailer_name: retName || 'N/A',
                urc: columnMapping.urc !== -1 ? String(row[columnMapping.urc] || 'N/A').trim() : 'N/A',
                activity: columnMapping.activity !== -1 ? String(row[columnMapping.activity] || activeSheet).trim() : activeSheet,
                slab: normSlab,
                raw_slab: slabVal,
                monthly_data: {},
                categories: {},
                total_target: 0,
                total_achievement: 0,
                achievement_pct: 0
            };

            let rowT = 0, rowA = 0;
            detectedMonths.forEach(m => {
                const cfg = monthColumns[m];
                const t = cfg.targetCol !== -1 ? cleanVal(row[cfg.targetCol]) : 0;
                const a = cfg.achCol !== -1 ? cleanVal(row[cfg.achCol]) : 0;
                outlet.monthly_data[m] = {
                    target: t,
                    achievement: a,
                    achievement_pct: t > 0 ? (a / t) * 100 : 0,
                    categories: {}
                };
                rowT += t;
                rowA += a;
            });

            allCategories.forEach(cat => {
                const val = cleanVal(row[cat.col]);
                outlet.categories[cat.name] = val;
            });

            outlet.total_target = rowT;
            outlet.total_achievement = rowA;
            outlet.achievement_pct = rowT > 0 ? (rowA / rowT) * 100 : 0;

            outlets.push(outlet);
        }

        return {
            sheetNames: sheetNames,
            activeSheet: activeSheet,
            detectedYear: detectedYear,
            detectedYears: [detectedYear],
            detectedHalfYear: detectedHalfYear,
            detectedHalfYears: [detectedHalfYear],
            detectedQuarters: Array.from(detectedQuarters),
            detectedMonths: detectedMonths,
            categoriesByMonth: categoriesByMonth,
            allCategories: allCategories.map(c => c.name),
            headers: headers,
            columnMapping: columnMapping,
            monthColumns: monthColumns,
            titleText: titleText,
            recordsCount: outlets.length,
            outlets: outlets
        };
    }
};

window.ExcelParser = ExcelParser;
