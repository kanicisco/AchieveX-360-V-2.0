# AchieveX 360 · Activity Outlet Achievements Dashboard

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github&style=for-the-badge)](https://pages.github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success?style=for-the-badge&logo=pwa)](manifest.json)
[![Zero Backend Required](https://img.shields.io/badge/Backend-Zero%20Dependency%20(Client--Side)-indigo?style=for-the-badge)]()

**AchieveX 360** is an enterprise-grade, Excel-driven dynamic analytics platform built for FMCG sales monitoring, outlet performance tracking, and distributor target vs. achievement analysis.

Designed to be hosted **directly on GitHub Pages with zero server setup**, all parsing, filtering, aggregation, and visualizations run 100% client-side in the browser using SheetJS, Chart.js, and browser storage.

---

## 🚀 Quick GitHub Pages Deployment Guide

Deploy your own live dashboard on GitHub Pages in under **2 minutes**:

### Step 1: Push this folder to a GitHub Repository
Open a terminal inside this `github-pages` folder and run:

```bash
git init
git add .
git commit -m "Initial commit of AchieveX 360 for GitHub Pages"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```

### Step 2: Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** (top navigation).
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
5. Under **Branch**, select `main` and folder `/ (root)`.
6. Click **Save**.

Within ~60 seconds, your dashboard will be live at:
```
https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/
```

---

## 🌟 Key Features

1. **100% Client-Side & Serverless Architecture**:
   - Runs out-of-the-box on GitHub Pages without requiring PHP, Node.js, or MySQL.
   - Built-in pre-compiled master dataset (`data/q4_2026_dataset.json`) loads automatically on first visit.
   - Offline fallback using browser `LocalStorage` and Service Worker (`sw.js`).

2. **Universal Excel Workbook Engine**:
   - Drag & drop any `.xlsb`, `.xlsx`, `.xls`, or `.csv` workbook into the Admin panel.
   - Dynamically discovers header rows, periods (Years, Half-Years, Quarters, Months), and product category breakdown columns with zero hardcoded column indices.

3. **Two-Tier Table with Slab Format `% Ach`**:
   - Sticky two-tier headers grouping Period Performance and 20 Product Category columns.
   - **`% Ach` Pill in Slab Display Format**:
     - **100%+ Targets Met**: Vibrant Green background (`#86efac`), **Bold Black text**, and celebratory star (`⭐`).
     - **Under 100% Values**: Soft Light Blue background (`#dbeafe`), **Bold Dark Blue text**.
   - Sortable columns, page size selection (15, 25, 50, 100, All), and live retailer search.

4. **Multi-Month & Category Union/Intersection**:
   - Filter by single month or multi-month periods (e.g. October, November, December).
   - Dynamic category pill filters with toggle between **Union** (any month) and **Intersection** (active in all selected months).

5. **Discrepancy Audit & Reconciliation**:
   - Built-in audit reconciling static source formula errors against real transactional sums.
   - One-click toggle between **Reconciled (Actual Sums)** and **Source Cached** values.

6. **Export & Print**:
   - Instant export to formatted **CSV**, **Excel (.xlsx)**, or **Print-ready PDF report** with active filters applied.

7. **PWA & Dark Theme**:
   - Fully responsive on desktop, tablet, and mobile.
   - Installable as a Progressive Web App (PWA).
   - High-contrast Dark Theme with persistent user preference.

---

## 📁 Repository Structure

```text
├── index.html                           # Main Application Dashboard
├── 404.html                             # Single-page fallback for GitHub Pages
├── .nojekyll                            # Disables Jekyll processing on GitHub Pages
├── manifest.json                        # PWA Web App Manifest
├── sw.js                                # Offline Service Worker
├── LICENSE                              # MIT License
├── Activity outlet Achievements...xlsb   # Source Master Workbook for reference
│
├── assets/
│   ├── css/
│   │   └── style.css                    # Design system, themes & Slab formatting
│   └── js/
│       ├── excel-parser.js              # Universal multi-row Excel parsing engine
│       ├── data-manager.js              # Central data model, filters & storage
│       ├── charts.js                    # Chart.js analytics & visual doughnut/bars
│       ├── filters.js                   # Dynamic multi-level filter controls
│       ├── table.js                     # Two-tier sortable table with Slab pills
│       ├── admin-mapper.js              # Workbook upload & inspection modal
│       ├── export.js                    # CSV, Excel, and Print export handlers
│       └── app.js                       # Application bootstrap & lifecycle
│
├── data/
│   ├── q4_2026_dataset.json             # Pre-compiled Q4 dataset (916 outlets, 20 cats)
│   ├── q4_discrepancies.json            # Reconciled discrepancy audit data
│   ├── Sample_H1_2026_Dashboard.xlsx    # Sample test workbook
│   └── Sample_FY_2026_2027_H2_...xlsx   # Sample test workbook
│
└── docs/
    ├── AUDIT_AND_DISCREPANCIES.md       # Discrepancy analysis & calculation truth
    ├── DATA_FORMAT.md                   # Column structure & workbook expectations
    ├── PRIVACY_AND_SECURITY.md          # Client-side data privacy guarantees
    └── TROUBLESHOOTING.md               # User troubleshooting guide
```

---

## 🔒 Privacy & Data Security
* All file processing, parsing, and data filtering occur entirely within your browser's local sandbox memory.
* When hosted on GitHub Pages, **no sales or customer data is transmitted to any external server**.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
