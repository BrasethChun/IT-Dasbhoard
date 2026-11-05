# Excel (.xlsx) Export & Column Alignment Plan

Update the Excel (.xlsx) export in **IT Assets Management** to generate a clean, perfectly aligned data table across both **FixAssets** and **Assets Control** sheets.

---

### User Review & Decisions Confirmed
> [!IMPORTANT]
> The following requirements were confirmed by the user:
> 1. **Remove Category Banner Rows**: Discontinue category banner rows (`I. *COMPUTER`, `II. *LAPTOP`) that previously fragmented Column A.
> 2. **Sequential Row Numbering in Column A (`No`)**: Every asset row will have its sequential row number (`1, 2, 3... N`) in Column A.
> 3. **Category Column Position**: Place `CATEGORY` as **Column B**, directly after `No` and immediately before `ASSET CODE` across both FixAssets and Assets Control sheets.
> 4. **Column C Renaming in Assets Control**: Rename Column C from **"AC code in CMS"** to **"ASSET CODE"** to maintain naming consistency with FixAssets.

---

## 1. Overview of Changes

Currently, the export prepends category banner rows (e.g. `I. *COMPUTER`) in Column A, which previously pushed the numeric index `1, 2, 3...` into Column B and caused the remaining data columns (`ASSET CODE`, `ASSET DATE`, `CATEGORY`, `ITEM NAME`, etc.) to shift off-by-one from their table headers.

This update resolves the offset and restructures the workbook:
1. **FixAssets Sheet (Sheet 1)**:
   - Header: Title and subtitle rows.
   - Column layout:
     - `A`: **No** (`1, 2, 3...`)
     - `B`: **CATEGORY** (`COMPUTER`, `LAPTOP`, `SERVER`, etc.)
     - `C`: **ASSET CODE** (`KGPH000001`, `K2PH000034`, etc.)
     - `D`: **ASSET DATE**
     - `E`: **ITEM NAME**
     - `F`: **BRAND**
     - `G`: **MODEL**
     - `H`: **SERIAL NUM**
     - `I`: **KEY SPECIFICATION**
     - `J`: **SUPPLIER**
     - `K`: **ROOM NO/NAME**
     - `L`: **FLOOR**
     - `M`: **CURRENT USER**
     - `N`: **ADMIN PASSWORD**
     - `O`: **USER EMAIL**
     - `P`: **HOSTNAME**
     - `Q`: **IP LAN**
     - `R`: **IP ADDRESS LAN (SECONDARY)**
     - `S`: **IP ADDRESS WAN**
     - `T`: **ISSUE DATE**
     - `U`: **PURCHASE DATE**
     - `V`: **INVOICE REF**
     - `W`: **QUANTITY**
     - `X`: **UNIT PRICE ($)**
     - `Y`: **BEFORE DIS VAT PRICE ($)**
     - `Z`: **GRAND TOTAL ($)**
     - `AA`: **WIN LICENSE**
     - `AB`: **MS LICENSE**
     - `AC`: **MS ACCOUNT EMAIL**
     - `AD`: **MS ACCOUNT PASSWORD**
     - `AE`: **REMARK**
     - `AF`: **STATUS**

2. **Assets Control Sheet (Sheet 2)**:
   - Header: Title and subtitle rows.
   - Column layout:
     - `A`: **No** (`1, 2, 3...`)
     - `B`: **CATEGORY** (`PRINTER`, `CCTV`, `ROUTER`, etc.)
     - `C`: **ASSET CODE** (`KG-AC00001`, etc. - renamed from "AC code in CMS")
     - `D`: **ITEM NAME**
     - `E`: **BRAND**
     - `F`: **MODEL**
     - `G`: **SERIAL NUM**
     - `H`: **KEY SPECIFICATION**
     - `I`: **SUPPLIER**
     - `J`: **ROOM NO/NAME**
     - `K`: **FLOOR**
     - `L`: **CURRENT USER**
     - `M`: **REMARK**
     - `N`: **STATUS**

3. **Import Compatibility (`handleImportExcel`)**:
   - Update the spreadsheet reader to dynamically locate columns by their header names (e.g. `ASSET CODE`, `AC CODE`, `CATEGORY`, `ITEM NAME`), ensuring backward compatibility with previous spreadsheets as well as the new clean format.

---

## 2. Technical Implementation Steps

### Step 1: Update `handleExportExcel` in `pages/dashboard/AssetsModule.tsx` - [COMPLETED]
- Revised `fixedHeader` to `['No', 'CATEGORY', 'ASSET CODE', 'ASSET DATE', ...]`
- Removed category banner push rows (`I. *COMPUTER`).
- Populated rows cleanly using sequential numbering in Column A (index 0), category in Column B (index 1), and asset code in Column C (index 2).
- Revised `controlHeader` to `['No', 'CATEGORY', 'ASSET CODE', 'ITEM NAME', ...]` (renamed from "AC code in CMS" to "ASSET CODE").
- Populated control asset rows cleanly using sequential numbering in Column A, category in Column B, and asset code in Column C.

### Step 2: Update `handleImportExcel` in `pages/dashboard/AssetsModule.tsx` - [COMPLETED]
- Replaced hardcoded column index assumptions with dynamic `getColIdx` helper that inspects header cell titles (`ASSET CODE`, `AC CODE`, `CATEGORY`, `ITEM NAME`, etc.).
- Backwards and forwards compatible with old and new workbook formats.

### Step 3: Verification & Build - [COMPLETED]
- Compiled project with `compile_applet` (0 errors).
- Verified workbook generation with live database data.
- Restarted dev server on port 3000.
