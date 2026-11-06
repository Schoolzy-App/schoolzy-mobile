# Parent Gate Requests: pre-merge checklist

None of these checks have been run yet. Automated tests pass. The only known failures are 20 `ParentProfileAppServiceTests` and 5 `tsc` errors, and both existed before this feature.

## Backend and database (worktree `F:\0 Schoolzy LMS\Projects\Schoolzy-LMS-gate-requests`)
- [ ] Apply the migration `20261105201219_AddParentGateRequestFields` to a dev DB yourself.
- [ ] **Staff permission grants.** Check that the roles that use these screens today hold these grants. If they don't, staff get 403 after this branch.
  - `Transport_Updates`: View and Add (Present page: create popup and lists)
  - `HoldingBusUpdates`: View and Edit (Pending page: approve, cancel, edit)
  - `Hol-Bus-001`: View, plus Edit for anyone who edits confirmed rows (Confirmed page and Exit Permit prints)
- [ ] A parent signed in to the web portal gets 403 on `ApproveRequest`, `CancelRequest` and `PrintConfirmation`.
- [ ] **Race test on real SQL Server.** Fire Approve (portal) and Cancel (app) on the same Pending request at the same moment. Exactly one should win, and only the winner should send a push.
- [ ] Portal Pending screen:
  - Both tabs render.
  - The Online tab badge excludes cancelled requests.
  - Approve works on a parent row.
  - Cancel asks for confirmation.
  - Cancelled rows show greyed with no actions.
  - Requests from yesterday never appear.
  - `?tab=online` opens the Online tab. The coordinator notification link uses it.
- [ ] Student Activity Dashboard no longer shows cancelled or expired parent requests as Pending.

## Mobile (device, against the backend above)
1. **Account tile**
   - Shows for an eligible parent, after Relatives.
   - Hidden for an ineligible account, while loading, and offline.
2. **List**
   - Empty state on first use.
   - New requests go under Today with a Pending chip.
   - Older ones go under Earlier.
   - Going offline, then returning from Details, keeps the list visible and shows a "Couldn't refresh" hint.
3. **Add, one child vs several**
   - One child: that child is pre-selected.
   - Several children: none is pre-selected.
   - A child who already has a request today is greyed with the hint "A request already exists today. Contact the school to change it."
4. **Siblings**
   - Submit for one child plus a sibling. Expect 2 Pending rows.
   - Tick sibling B, file B from another device, then Send. Expect the 409 text, B unticked and disabled, and the next Send succeeding without B.
5. **Collector**
   - Father and mother names show.
   - Relative lists only relatives with pickup permission.
   - With no permitted relatives, the hint and the Relatives link appear.
6. **Time**
   - The default is the next quarter hour.
   - The ±15 buttons work.
   - A badly formatted time or a time in the past shows the server's wording.
7. **Notes** stop at 500 characters.
8. **Network drop during submit.** The button turns to Retry, and retrying creates no duplicate.
9. **Details**
   - Pending: the banner shows, plus Cancel with a confirm step. Cancelling updates the screen in place to "Cancelled by you".
   - Confirmed: the confirmation time shows with "To cancel, please contact the school."
   - Expired and Cancelled by school: their own text shows.
   - "Requested by" shows the parent's or relative's name, or is hidden.
10. **Push**
    - Tapping a Confirmed or Cancelled-by-school notification opens that request.
    - Tapping a notification with no request id opens the list.
11. **Bottom-bar tab.** Start with `EXPO_PUBLIC_ENABLE_GATE_REQUESTS_TAB=true`.
    - The Gate tab shows only for eligible parents and opens the list.
    - With the flag off, the bar is unchanged.

## Known follow-ups (not done)
- Pull-to-refresh on the gate screens needs a change to `ScreenTemplate`.
- Two parents submitting the same student at the same moment can both succeed: the duplicate check isn't atomic (a filtered unique index would fix it).
- The Today/Earlier split and the default time use the device clock. An `isToday` flag from the server would fix it.
- Matching the in-flight 409 relies on the message text, because there is no error code.
- The portal School tab's default dates and the dashboard's date windows use the server clock. This predates this feature.
- No native time picker yet. It needs a new dev build.
