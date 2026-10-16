# AchieveX 360: Source Workbook Audit & Validation Report

**Workbook File:** `Activity outlet Achievements - 2026 - Q4.xlsb`  
**File Size:** 3,269,833 bytes (3.27 MB)  
**Format:** Microsoft Excel Binary Workbook (.xlsb)  
**Total Worksheets:** 20 worksheets  
**Inspection Date:** 2026-10-16  

---

## 1. Worksheet Inventory & Structural Classification

The workbook contains 20 worksheets categorized into 4 operational tiers:

| Sheet Name | Dimensions | Rows | Columns | Role / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`List`** | `A1:AP6695` | 6,695 (916 active) | 42 | **Master Activity Outlet Sheet**: Outlets, DSRs, Targets, Achievements (Oct, Nov, Dec, Q4), and 20 Category columns |
| **`Oct`** | `A1:N7780` | 7,780 | 14 | Monthly outlet billing records for October 2026 (`2026-10`), with Regions & Outlet Classifications |
| **`Nov`** | `A1:K9126` | 9,126 | 11 | Monthly outlet records for November 2026 |
| **`Dec`** | `A1:J9316` | 9,316 | 10 | Monthly outlet records for December 2026 |
| **`Nestmo  `** | `A1:L16` | 16 (15 active) | 12 | Dedicated outlet sheet for Nestmo activity with monthly columns |
| **`Range 1`** | `A1:CQ7696` | 7,696 | 95 | Detailed outlet master with Cluster (L5), Sector (L6), Status, and 83 Brand/Product category achievements |
| **`NMT 28g`** | `A1:L7876` | 7,876 | 12 | Brand SKU Sheet: Nestomalt 28g monthly achievements (`2026-07`, `2026-08`, `2026-09`) |
| **`Milo 15g`** | `A1:L5679` | 5,679 | 12 | Brand SKU Sheet: Milo 15g monthly achievements |
| **`Nes 25g`** | `A1:L5661` | 5,661 | 12 | Brand SKU Sheet: Nescafe 25g monthly achievements |
| **`Nesc 3in1`** | `A1:L5040` | 5,040 | 12 | Brand SKU Sheet: Nescafe 3-in-1 monthly achievements |
| **`NP 18g`** | `A1:L7341` | 7,341 | 12 | Brand SKU Sheet: Nespray 18g monthly achievements |
| **`Nes 1.2g`** | `A1:L3354` | 3,354 | 12 | Brand SKU Sheet: Nescafe 1.2g monthly achievements |
| **`MM Can`** | `A1:L489` | 489 | 12 | Brand SKU Sheet: Milkmaid Can monthly achievements |
| **`CMP 1kg`** | `A1:L443` | 443 | 12 | Brand SKU Sheet: Coconut Milk Powder 1kg monthly achievements |
| **`Milo RTD`** | `A1:L8266` | 8,266 | 12 | Brand SKU Sheet: Milo Ready-to-Drink monthly achievements |
| **`Nes RTD`** | `A1:L4013` | 4,013 | 12 | Brand SKU Sheet: Nescafe Ready-to-Drink monthly achievements |
| **`Chicken S`**| `A1:L3283` | 3,283 | 12 | Brand SKU Sheet: Maggi Chicken Soup monthly achievements |
| **`April`** | `C2:I11` | 10 | 7 | Historical summary sheet for April reporting |
| **`May 26`** | `C2:N12` | 11 | 12 | Historical summary sheet for May 26 reporting (As @ 18th) |
| **`Sheet1`** | None | 0 | 0 | Blank / empty worksheet |

---

## 2. Master Sheet (`List`) Architecture & Headers

The `List` worksheet utilizes a **two-tier multi-row header structure**:
- **Row 1:** Reporting period labels (`Oct`, `Nov`, `Dec`, `Q4`) and Category Names (Columns W to AP).
- **Row 2:** Detailed attribute and metric headers (`TGT`, `Achv`, `%`).

### Column Breakdown

| Col Index | Excel Col | Row 1 Label | Row 2 Label | Field Role |
| :---: | :---: | :--- | :--- | :--- |
| **0** | A | Activity Outlets Q4- 2026 | Distributor Code | Distributor ID (e.g., `5025287`) |
| **1** | B | *(blank)* | Distributor | Distributor Name (e.g., `Sensic Food Trading`) |
| **2** | C | *(blank)* | DSR | Distributor Sales Rep (e.g., `Ajith Kumar`) |
| **3** | D | *(blank)* | Retailer Old Code | Legacy Retailer Identifier |
| **4** | E | *(blank)* | Retailer Code | Master Outlet Code (e.g., `502528701682`) |
| **5** | F | *(blank)* | Retailer Name | Outlet Commercial Name (e.g., `GUNSIRI HOTEL`) |
| **6** | G | *(blank)* | URC | Unique Retailer Code |
| **7** | H | *(blank)* | Activity | Activity Campaign Name |
| **8** | I | *(blank)* | Slab | Performance Tier / Slab |
| **9–11** | J, K, L | **Oct** | `TGT`, `Achv`, `%` | October Target, Achievement, % |
| **12–14** | M, N, O | **Nov** | `TGT`, `Achv`, `%` | November Target, Achievement, % |
| **15–17** | P, Q, R | **Dec** | `TGT`, `Achv`, `%` | December Target, Achievement, % |
| **18–20** | S, T, U | **Q4** | `TGT`, `Achv`, `%` | Q4 Cumulative Target, Achievement, % |
| **21** | V | *(blank)* | *(blank)* | Column separator |
| **22–41** | W to AP | Category Names | *(blank)* | 20 Product Categories (SUMIFS from `Range 1`) |

### Detected Activities (7)
1. Authentic Tea Shop (805 outlets)
2. Grocery - Retail (52 outlets)
3. Grocery - Self Service (18 outlets)
4. Nestmo (15 outlets)
5. Activity - WS (14 outlets)
6. ISM - Retail (7 outlets)
7. ISM - Wholesale (5 outlets)

### Detected Slabs (Normalized)
- **Diamond**
- **Platinum**
- **Gold**
- **Silver**
- **Bronze** *(Source workbook contains slight spelling inconsistencies: `Bronzed`, `Brozne`, which are safely normalized to `Bronze`)*
- **Sapphire**
- **Nestmo**

---

## 3. Discrepancy Analysis & Reconciliation

### Discrepancy 1: Stale Cached Values in Q4 Cumulative Achievement Column (Column T)

In the source workbook, Column T (`Q4 Achv`) uses the formula `=K{row}+N{row}+Q{row}` (summing Oct Achv, Nov Achv, and Dec Achv).
Oct Achv (`K`) is dynamically looked up via `=IFERROR(VLOOKUP(E{row}, Oct!G:J, 4, 0), "0")`.

When the workbook was saved as an `.xlsb` binary file, **78 rows had their Oct VLOOKUP refreshed without recalculating the dependent Q4 sum formulas in Column T**. As a result, the cached binary cell value (`cell.v`) in Column T remained at an outdated value (frequently `23.00` or `0.00`).

#### Impact Comparison:

| Metric | Source Cached Value (`cell.v`) | Reconciled Calculated Value (`Oct + Nov + Dec`) | Discrepancy Variance |
| :--- | :--- | :--- | :--- |
| **October Target** | Rs. 388,944,935.38 | Rs. 388,944,935.38 | 0.00 |
| **October Achievement** | Rs. 92,773,614.96 | Rs. 92,773,614.96 | 0.00 (23.85%) |
| **November Target** | Rs. 390,180,145.39 | Rs. 390,180,145.39 | 0.00 |
| **November Achievement** | Rs. 2,963.00 | Rs. 2,963.00 | 0.00 (0.00%) |
| **December Target** | Rs. 389,442,849.76 | Rs. 389,442,849.76 | 0.00 |
| **December Achievement** | Rs. 0.00 | Rs. 0.00 | 0.00 (0.00%) |
| **Q4 Total Target** | **Rs. 1,168,567,930.53** | **Rs. 1,168,567,930.53** | 0.00 |
| **Q4 Total Achievement** | **Rs. 75,749,432.07** | **Rs. 92,776,577.96** | **-Rs. 17,027,145.89** (-18.35%) |
| **Q4 Overall %** | **6.48%** | **7.94%** | **-1.46%** |

#### Examples of Rows with Stale Evaluation:
- **Row 700 (Retailer Code 573495600001):** Oct Achv = 959,275.44, Nov = 23.00, Dec = 0.00. Expected Q4 = 959,298.44. Cached cell.v = 23.00.
- **Row 702 (Retailer Code 573495600388):** Oct Achv = 107,103.46, Nov = 23.00, Dec = 0.00. Expected Q4 = 107,126.46. Cached cell.v = 23.00.
- **Row 706 (Retailer Code 573495600004):** Oct Achv = 714,460.43, Nov = 23.00, Dec = 0.00. Expected Q4 = 714,483.43. Cached cell.v = 23.00.

**Architectural Resolution:**  
The AchieveX 360 dashboard computes cumulative period metrics directly from active period month selections (`oct + nov + dec`), preventing stale cached formula errors while retaining transparency by storing both values in the data model.

---

### Discrepancy 2: Slab Typography & Spelling Variations
In column I (`Slab`), the source file includes variations:
- `Bronzed` (670 rows)
- `Bronze` (3 rows)
- `Brozne` (1 row)

**Resolution:**  
The data ingestion engine automatically normalizes `Bronzed` and `Brozne` to `Bronze` in user-facing filters and analytics, while keeping the raw string for exact fidelity.

---

### Discrepancy 3: Reporting Calendar State (Q4 In-Progress)
- **October 2026:** Fully populated with Rs. 92.77M achievement against Rs. 388.94M target (23.85%).
- **November 2026:** In progress, with Rs. 2,963.00 recorded.
- **December 2026:** Unbilled/Future period, with 0 achievement against Rs. 389.44M target.

The dashboard correctly handles zero-billing and in-progress months, allowing users to toggle between individual months (Oct, Nov, Dec) or view Q4 Cumulative without skewing KPI averages.
