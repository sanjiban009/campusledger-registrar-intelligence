# CampusLedger | Registrar Intelligence

CampusLedger is a university operations portfolio project for the Office of the Registrar. It brings together student services, academic readiness, admissions, market research and case follow-up in a single offline dashboard.

## Run locally

Extract the ZIP and open `index.html` in a browser. No installation, server or internet connection is required. The dashboard uses HTML, CSS and JavaScript. The data workbook is in `data/CampusLedger_Dataset.xlsx`.

## Publish on GitHub Pages

1. Create a repository such as `campusledger-registrar-intelligence`.
2. Upload all extracted files and folders to the repository root. Keep `index.html` at the root.
3. In **Settings → Pages**, choose **Deploy from a branch**, then select **main** and **/(root)** and save.
4. Open the URL GitHub Pages displays after deployment.

## Dashboard views

| View | What to review |
|---|---|
| Registrar’s overview | Backlog, SLA compliance, monthly demand and upcoming academic milestones |
| Student services | Turnaround, service bottlenecks, case-level due dates and CSV export |
| Academic readiness | Registration, exam eligibility, marks and results with owners |
| Admissions & market research | Programme funnel, district demand, seat utilisation and peer benchmarks |
| Forecast & action centre | Priority queue, local action statuses, next-week forecast and intake classification |

## Demo walkthrough

1. Open **Student services** and select **Transcript**. Review the overdue cases by stage and export the open register.
2. Open **Forecast & action centre**. Update a priority case to **In progress**, then try “I need my official transcript” in the intake classifier.
3. Switch the school and observe the forecast and action queue recalculate.
4. Open **Admissions & market research** and select **B.Sc Data Science** to compare the programme funnel and benchmark rows.

## Data and KPI definitions

- All records and peer observations are generated for a fictional case study. The snapshot is **20 November 2026**. The benchmark includes fictional fees, eligibility, specialisations and deadlines.
- Indian financial years run from 1 April to 31 March. **Matched FYTD** uses the same 20 November cutoff for each financial year. **Available FY** uses the earlier of year-end and the dataset cutoff.
- Receipts are counted by opening date and closures by completion date. Backlog is measured at the reporting cutoff and includes carry-in. Service type filters service views and service KPIs.
- The SLA deadline adds policy working days to the opening date, excluding the opening day and weekends. The model omits public holidays. Closed cases are compliant when the closure date is on or before the deadline. Open cases due by the snapshot close are overdue.
- SLA risk uses stage-based rules. Open cases are flagged when the working days remaining are at most four for intake, three for verification or one for approval. Workflow events after the selected cutoff are excluded from snapshot status.
- Academic milestones show pending items from the available baseline through completion, with a 14-day lookahead within the selected FY. Admissions counts use synthetic monthly allocation cohorts. Seat utilisation uses allocated seats for those cohorts.
- The seven-day forecast is the rounded mean of the four trailing seven-day arrival totals ending at the snapshot. The local classifier matches service keywords and sends ambiguous inputs to manual review. Both are transparent demonstration methods.
- The action register stores demo follow-up statuses in browser storage where available. It has no shared assignments, notifications or writeback to a university system.
- The Excel workbook contains the same raw demo records as the static site data. Workbook edits do not update the site automatically.

## Reproduce the demo data

Run `python3 scripts/generate.py` from the project directory. This regenerates `data/dataset.js` from a fixed random seed. The supplied workbook was generated with the `@oai/artifact-tool` runtime using `scripts/export-workbook.mjs`; the workbook is bundled for users without that runtime.
