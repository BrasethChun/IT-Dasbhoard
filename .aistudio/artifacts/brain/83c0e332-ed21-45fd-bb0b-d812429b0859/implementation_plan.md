# Executive Summary & Analytics: Monthly Range Filter

Adds a dedicated, interactive **Monthly Range Filter** to the **Executive Summary & Analytics** sub-view in the IT Expenses & Tracking module. Defaults to all expenses for the selected Fiscal Year, with instant presets (Full Year, Quarters Q1–Q4, Half-years H1–H2), flexible `From Month` / `To Month` pickers, and live recalculation of executive KPIs, monthly burn rate charts, and category/campus expense breakdowns.

---

## User Review & Clarifications Confirmed

> [!IMPORTANT]
> The following product decisions were confirmed during the planning phase:
> 
> 1. **Filter Display & Controls**:
>    - **Quick Presets**: `All FY {selectedFiscalYear} (Default)`, `Q1 (Jan–Mar)`, `Q2 (Apr–Jun)`, `Q3 (Jul–Sep)`, `Q4 (Oct–Dec)`, `H1 (Jan–Jun)`, and `H2 (Jul–Dec)`.
>    - **Month Pickers**: Intuitive `From Month` and `To Month` dropdown pickers constrained within the active Fiscal Year.
>    - **Active Range Indicator & Reset Action**: Clear pill/badge displaying the selected month window (e.g., `Jan 2026 – Jun 2026 (H1)`) with a one-click `✕ Reset to Full Year` button.
> 
> 2. **Dashboard Recalculation Behavior**:
>    - **4 Executive KPI Cards**: Total Realized Spend, CapEx Disbursed, OpEx Disbursed, and Pending Disbursements immediately re-aggregate to the selected month range.
>    - **Monthly Burn Rate Bar Chart**: Displays monthly CapEx and OpEx spend bars for the filtered months in the selected Fiscal Year.
>    - **Spend by Expense Category & Spend by Campus**: Automatically recalibrate totals, percentages, and progress bars to reflect disbursements within the selected month range.
> 
> 3. **Fiscal Year Reset Rules**:
>    - Whenever the user switches the active **Fiscal Year** (e.g. FY 2026 &rarr; FY 2027), the month range filter automatically resets to **All Year (Default)**, guaranteeing users always see the complete annual picture first.

---

## 1. Overview & Core Concept

- **Purpose**: Empower leadership and IT management to conduct focused quarterly, semesterly, or custom monthly financial reviews (e.g. Q1 review, mid-year audit, or multi-month hardware procurement cycle) directly inside the Executive Summary without navigating away or manually entering granular calendar dates.
- **Audience**: CIO, CFO, IT Finance Committee, and Department Heads analyzing budget execution over time.
- **Value**: Combines executive convenience (one-click quarters and half-years) with granular month-level drilldown, updating all visual analytics in real time.

---

## 2. User Experience & Visual Design

### UI Layout within Executive Summary & Analytics

The monthly filter bar will be placed cleanly at the top of the `Executive Summary & Analytics` sub-view (immediately above the 4 KPI cards):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 📅 Monthly Filter (FY 2026): [All Year (Default)] [Q1] [Q2] [Q3] [Q4] [H1] [H2]        │
│ From: [ January  ▼ ]  To: [ March    ▼ ]   [✕ Reset to Full Year]   [Active: Q1 Jan-Mar]│
└────────────────────────────────────────────────────────────────────────────────────────┘
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐
│ Total Realized   │ │ CapEx Disbursed  │ │ OpEx Disbursed   │ │ Pending Disbursements  │
│ $18,450.00       │ │ $12,200.00       │ │ $6,250.00        │ │ 2 Invoices ($3,100.00) │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 📊 Monthly IT Expense Disbursement Burn Rate (Filtered: Jan 2026 – Mar 2026)          │
│ [Jan: CapEx/OpEx]  [Feb: CapEx/OpEx]  [Mar: CapEx/OpEx]                                │
└────────────────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────┐  ┌──────────────────────────────────────────┐
│ Spend by Expense Category (Filtered)    │  │ Spend by Operating Campus (Filtered)     │
│ Hardware: $9,500 (51%)                  │  │ K1 Campus: $11,200 (61%)                 │
│ Cloud Infrastructure: $4,800 (26%)      │  │ K2 Campus: $4,900 (27%)                  │
└─────────────────────────────────────────┘  └──────────────────────────────────────────┘
```

### Visual Styling Details
- **Container**: Card styling consistent with SaaS dashboard standards (`bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm`).
- **Presets**: Segmented button group with active state highlight (`bg-emerald-600 text-white shadow-xs font-semibold` when active, `bg-slate-100 hover:bg-slate-200 text-slate-700` when inactive).
- **Pickers**: Styled `<select>` elements for month names (`January` through `December`) formatted cleanly with subtle chevron indicators.
- **Zero-Pill Discipline**: Status and range tags use subtle rectangular badges with soft borders (`bg-emerald-50 text-emerald-800 border-emerald-200/60`).

---

## 3. Technical Architecture & Implementation Steps

### 1. State Management in `ITExpensesModule.tsx`
- Add month range state for Executive Summary:
  ```typescript
  type MonthPreset = 'all-year' | 'q1' | 'q2' | 'q3' | 'q4' | 'h1' | 'h2' | 'custom';
  const [execMonthPreset, setExecMonthPreset] = useState<MonthPreset>('all-year');
  const [execFromMonth, setExecFromMonth] = useState<number>(1); // 1 = January
  const [execToMonth, setExecToMonth] = useState<number>(12);   // 12 = December
  ```
- Calculate corresponding `execFromDate` and `execToDate`:
  - When `execMonthPreset === 'all-year'`: `execFromDate = ''`, `execToDate = ''` (backend interprets empty as full fiscal year).
  - When preset is `q1`: `from = 01-01`, `to = 03-31`.
  - When preset is `q2`: `from = 04-01`, `to = 06-30`.
  - When preset is `q3`: `from = 07-01`, `to = 09-30`.
  - When preset is `q4`: `from = 10-01`, `to = 12-31`.
  - When preset is `h1`: `from = 01-01`, `to = 06-30`.
  - When preset is `h2`: `from = 07-01`, `to = 12-31`.
  - When `custom`: `from = ${selectedFiscalYear}-${pad(fromMonth)}-01`, `to = ${selectedFiscalYear}-${pad(toMonth)}-${lastDayOf(toMonth)}`.

### 2. Integration with Backend Analytics & Transactions
- When `activeSubView === 'analytics'`, query `/api/it-expenses/analytics` and `/api/it-expenses` using `execFromDate` and `execToDate`.
- The backend `/api/it-expenses/analytics` route in `itExpenseServer.ts` already supports `from_date` and `to_date` query parameters:
  - It filters `monthlyChartData` to months between `from_date` and `to_date`.
  - It calculates `totalExpenses`, `totalCapexExpenses`, `totalOpexExpenses`, and `pendingExpenses` over the filtered range.
- `transactions` queried for the active date range dynamically recalculates `categoryBreakdown` and `campusBreakdown` through the existing `useMemo` hooks.

### 3. Fiscal Year Sync
- In `useEffect([selectedFiscalYear, selectedSite])`, reset `execMonthPreset` to `'all-year'`, `execFromMonth = 1`, and `execToMonth = 12`, ensuring every fiscal year initially displays all 12 months.

---

## 4. Verification Plan

1. **Compilation Check**:
   - Run `compile_applet` to ensure zero TypeScript errors or broken imports.
2. **Behavioral Verification**:
   - Select FY 2026 &rarr; Verify default shows "All FY 2026 (Default)".
   - Click "Q1 (Jan–Mar)" preset &rarr; Verify KPIs, burn rate chart (Jan–Mar), and breakdown cards update to Q1 disbursements only.
   - Click "H2 (Jul–Dec)" preset &rarr; Verify analytics shift to H2 disbursements.
   - Adjust "From Month" to "March" and "To Month" to "August" &rarr; Verify "Custom" range activates and displays March through August data.
   - Click "✕ Reset to Full Year" &rarr; Verify all metrics return to full year.
   - Switch Fiscal Year to 2027 &rarr; Verify month filter resets to full year.
