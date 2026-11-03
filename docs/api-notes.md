# API notes from the design pass

Gaps found while matching the app to the design handoff (`design-polish`
branch). The app works around each one today; none needed a backend change
to ship the screens. Checked against `Schoolzy-LMS/MobileApp/Schoolzy.Mobile.Api`.

## Wallet — to settle together with the business rules

### 1. No wallet top-up endpoint
- **Screen:** Finances → wallet card → **Top up**.
- **Today:** the button is shown but disabled. `WalletController` only has
  balance and history reads; `StudentPaymentsController` has `POST wallet`
  (pay *with* the wallet) and `POST online`, but nothing that adds money to it.
- **To decide:** a top-up endpoint, or a top-up as an online payment
  (`POST student-payments/online`) with the "Wallet TopUp" category — in
  which case the app routes Top up to the payment screen.

### 2. Wallet spending isn't in payment history
- **Screen:** Finances → Payment History → **Wallet** chip.
- **Design:** the Wallet chip lists top-ups *and* spending (e.g. "Meals · 4
  orders · From wallet").
- **Today:** the chip uses `GET student-payments/{id}/history?type=2`, which
  only has top-ups. Spending lives in `GET wallet/{id}/history` (meal order
  deductions), a separate paginated list with its own shape.
- **To decide:** whether payment history should include wallet movements
  (with a kind and count of their own), so one list serves every chip.

### 3. `GET /api/mobile/wallet/balances` doesn't exist
`services/api/wallet.ts` → `walletApi.balances()` (used only by the unused
`useWalletBalances` hook) calls `/api/mobile/wallet/balances`, expecting one
row per student. The backend has `GET /api/mobile/wallet/balance`, which
returns a single total (`totalAvailableBalance`). Nothing calls the hook
today; settle it with the wallet work above.

## Smaller gaps

### 4. Newsletter kind on the parent dashboard
- **Screen:** Home → Latest Newsletters.
- **Design:** icon colour by kind — Announcement blue, Letter brand.
- **Today:** `parent/dashboard` newsletters carry no kind, so every row uses
  the brand colour.

### 5. `financial-summary` currency is null
`currency` came back `null` on dev; the app falls back to "EGP".

### 6. No paid date on installments
- **Screen:** Finances → Installments, a paid row.
- **Design:** "Paid 15/03/2026".
- **Today:** `due?all=true` gives paid installments a status but no date
  they were paid, so the row shows its due date instead.

## Reports — no status, acknowledge or forms

### 7. No report status or read state
- **Screen:** Reports → list and detail.
- **Design:** each report carries a status pill — New, Action needed,
  Submitted, Acknowledged — and the date block fills with the brand colour
  when action is needed; titles are bold while new.
- **Today:** `GET students/{id}/reports` has no status or read flag (unlike
  newsletters, which have `isRead` and `MobileNewsletterRead`). The app shows
  every report the same way, with no pill.

### 8. No acknowledge endpoint
- **Design:** an "Acknowledge" button on letters, IGS, monthly and exam
  reports, turning into "Acknowledged".
- **Today:** nothing to call, so the button is left out.

### 9. Admin forms can't be answered
- **Design:** a Form report (category 6, AdminForm) shows its question as
  radio options and a "Submit response" button.
- **Today:** there is no endpoint for a form's questions or for sending an
  answer. Form reports open like any other report.

### 10. No single-report endpoint
The detail screen is built from the list row it was opened from. A
`GET students/{id}/reports/{reportId}` would let it open from a link or a
notification, and carry the form's questions once those exist.
