# Kalkulator UP/TUP — local rebuild

## Run

```sh
npm install
npm run dev
```

Open the URL Vite prints. For Vercel, import this directory as a Vite project: build command `npm run build`, output directory `dist`. No PHP or database is needed for this local version.

Click **Muat contoh Excel** to populate the 23 transactions from `UP TUP Kalkulator.xlsx`. The matching annual score is **89.72%**. `npm test` compares the calculator against the workbook's cached results; `npm run build` checks the deployable output.

## What the HAR contains

The HAR has **10 requests** from one visit to `/`: one complete HTML page, the building photo (`kemenkeu.jpg`), ministry logo (`logo-kemenkeu.png`), Tailwind CSS runtime (3.4.17), SheetJS/XLSX (0.18.5), Google Fonts CSS and one Inter WOFF2 file. The favicon request redirects to a 404. No transaction API call, account response, PHP source, database record, or PDF contents were captured. The original page linked to `panduan-pengisian.pdf`; this rebuild provides a local HTML guide because the PDF is absent from the HAR.

### Visual design

- Full-width Kementerian Keuangan hero: dark blue diagonal panel, gold stripe, building photo, ministry logo and title.
- Light gray page background, centered 1400px content, white rounded cards, thin pale blue borders, restrained shadows.
- Main colors: navy `#0B2545`, hero blue `#1B4A8A`, action blue `#2C6ECB`, gold `#D9A441`, background `#F3F5F8`, green `#157A5C`, red `#B3261E`.
- Inter typeface, responsive grid, pill badges, tabular numerals, horizontal table scrolling, print landscape layout.
- Tailwind utility classes from the captured page and local copies of the captured scripts/assets. The HAR names Lora and JetBrains Mono in its font request, but only Inter was downloaded during the recorded visit.

### Page components and actions

- **Login / Daftar modal:** 6-digit numeric Satker username, password visibility toggle, security question and answer on registration, forgot-password flow. Modal may be closed to use guest mode.
- **Satker badge:** current code and logout; guest prompt opens the login modal.
- **Data Awal Tahun:** UP starting amount and estimated performance score.
- **Transaction form:** SPM kind, SP2D date, rupiah amount; save, edit, cancel, delete and clear all.
- **History:** 18 columns: row number, month, SPM kind, GUP number, SP2D date, transaction amount, total UP/TUP, timeliness status, GUP/UP percentage, calendar-day gap, days in previous month, ideal GUP, maximum next GUP date, monthly-normalized GUP percentage, TUP deposit percentage, timeliness value, notes and actions.
- **Summary:** mean monthly GUP percentage, mean TUP deposit percentage, mean timeliness value, weighted final score.
- **Output:** browser print to PDF, two-sheet Excel export (history and summary), and one-click sample load from the supplied workbook.

### Login and persistence visible in the captured code

The original browser code calls `backend/register.php`, `login.php`, `get_question.php`, `reset_password.php`, `save_data.php`, and `get_data.php`. Registration posts `username`, `password`, `securityQuestion`, `securityAnswer`; login posts `username` and `password`; recovery looks up the question by username then posts the answer and new password. Saved data consists of `nilaiUpAwal`, transaction rows, and `rowId`. Guest data used `localStorage` key `kalkulator-uptup-guest-data`; a logged-in username was stored under `Satker-username`. The actual server validation, password storage, and database schema cannot be determined from the HAR.

This rebuild stores accounts and each Satker's transactions in **this browser's localStorage**. Password and security answers are stored as salted SHA-256 hashes. It supports the presentation and local use, but browser storage does not provide real shared authentication or cross-device syncing. Existing accounts/data on InfinityFree cannot be recovered from the HAR. For actual shared use later, add a hosted auth/database service; Prisma alone would not provide one.

### Workbook rules used

The workbook has one sheet with 23 filled transactions, 16 calculation columns, and a cached final score of `0.89720010005813922`. Transaction kinds are UP, GUP, GUP Nihil/Setor, TUP, PTUP and Setoran TUP. GUP total uses the last applicable UP/GUP balance; GUP Nihil/Setor reduces it. TUP is its own balance, reduced by deposits and PTUP. GUP time difference is measured from the preceding UP/GUP; PTUP and TUP deposit dates are measured from the preceding TUP. Timely means the gap does not exceed the days in the applicable previous month. Ideal GUP is `min(gap / month days × total UP, total UP)`. Monthly GUP is `min(GUP / total UP × month days / gap, 100%)`. TUP deposit percentage is `100% − deposit / TUP`. The final score is `50% × mean timeliness + 25% × mean deposit + 25% × mean monthly GUP`, with a 100% deposit component when there are scored transactions but no deposits. The note field flags values below 50%, late GUP, non-ideal GUP and three consecutive non-ideal GUP entries.

The captured page already had these calculations. The workbook comparison revealed one missing case in that JavaScript: a zero-balance GUP Nihil/Setor row must receive a timeliness value. That is corrected here. `npm test` checks every populated numeric, status and note field from the workbook and its final score.
