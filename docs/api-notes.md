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

## Complaints

### 11. No complaint reference number
- **Design:** every complaint shows a reference like "CMP-2026-0026" (list
  card, detail, success screen).
- **Today:** neither the list nor the detail carries one, and the format
  appears nowhere in the backend. The app shows the id ("#26") instead.
- **To decide:** add a `reference` field, so the app shows whatever format
  the school uses.

### 12. School notes arrive as HTML
`coordinatorNotes`, `resolution` and `rejectionReason` come as HTML from the
web editor ("<p>test</p>"). The app strips the tags. A plain-text twin, like
the existing `descriptionText`, would be safer.

## Account (Settings)

The Account handoff (`Account-Handoff/02-API.md`) assumes endpoints that
don't exist. The screen is built from existing ones instead:
`parent/profile`, `home/current-user`, `students`,
`parent-profile/students/guardians`, `parent-profile/relatives`,
`complaints` (summary) and `document-requests`.

### 13. No notifications on/off setting
- **Design:** a Notifications tile with a switch ("On · all children").
- **Today:** there is no `PATCH parent/settings` or any stored preference,
  so the tile shows **on and read-only** until there is.

### 14. No password-changed date
- **Design:** "Changed 3 months ago" under Change password.
- **Today:** nothing returns it, so the line is left out.

### 15. No delete-account endpoint
- **Design:** a Delete account tile with a destructive confirm.
- **Today:** there is no `DELETE parent/account`. The tile stays, behind a
  destructive confirm, and for now it only signs out. App Store
  and Play require real in-app deletion for apps with sign-up.

### 16. Complaints "reply waiting"
- **Design:** "Open · reply waiting" when the school has replied unread.
- **Today:** there's no unread-reply flag, so the line says "Open".

### 17. One call for the whole screen
The handoff's `GET parent/account-summary` would replace seven requests
with one. Worth adding when the endpoints above are.

## Agenda & Timesheet

The handoff (`Agenda-Timesheet-Handoff/03-API.md`) assumes fields the
existing endpoints don't have. The screens work without them:

### 18. Timetable periods have no room or colour
The sub line is the teacher alone (design: "{teacher} · {room}"), and the
colour bar comes from the subject name (Maths blue, English burgundy…),
grey otherwise. A `room` and `colorKey` per period would match the design.

### 19. Agenda items have no teacher or period
The sub line is the subject plus due date / start time (design: "{subject} ·
{teacher}" or "{subject} · Period n").

### 20. No school calendar
Weekends (Sun, Sat) are dimmed by rule. A `calendar?from=&to=` with
`isSchoolDay` would also cover holidays.
