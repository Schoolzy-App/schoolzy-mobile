# Parent Gate Requests: Design

**Date:** 2026-11-05
**Repos touched:**
- Mobile app: `F:\0 Schoolzy LMS\Mobile App\Mobile App Project` (Expo / React Native)
- Backend + school portal: `F:\0 Schoolzy LMS\Projects\Schoolzy-LMS` (ASP.NET Core: `WebApp\` portal, `MobileApp\` mobile API)

## 1. Intent

Today a parent who wants to collect a child early, or have a permitted relative collect the child, has to phone the school. A staff member then creates the request in the portal's Bus & Gate module (Present screen → *Create pending request*). It lands as **Pending**, someone approves it, it becomes **Confirmed**, and gate security sees it in the Confirmed screen.

We want the parent to create that same gate request themselves from the mobile app. The school still decides: nothing is valid at the gate until the school confirms it. These requests are almost always for **today** and need an answer **today**, so the coordinator is notified right away. The parent is notified when the request is confirmed.

## 2. Goals

1. A parent can submit a gate pickup request from the mobile app for one child, optionally adding siblings. This creates one request per student in a single submit, as the portal does.
2. The parent picks who collects: father, mother, or a relative who already has pickup permission for that student. The choice is limited by educational mandate (الولاية التعليمية), using the same rules as the portal.
3. The parent clearly sees that a new request is **Pending, awaiting school confirmation**.
4. The parent can cancel a request **only while it is Pending**. Once it is Confirmed the app shows no cancel button, only a note to contact the school.
5. The school sees parent requests in a **new "Online requests" tab** on the Bus & Gate Pending screen and confirms them with the existing Approve action.
6. Coordinators get a notification when a parent submits a request.
7. The parent gets a push notification when the school confirms.
8. A request still Pending at the end of its day shows as **Expired**.

## 3. Non-goals (for now)

- **Bus change from mobile.** Parents can't see or choose buses. A parent who needs a bus change calls the school or uses the existing generic Requests feature. The mobile flow is gate-only (`IsBusChange = false`).
- **School "rejecting" with a reason.** There is no reject action or reason field. The school can **cancel** a parent request while it is Pending, the same idea as the parent cancelling (§5). Normally the school phones the parent first.
- **Parent cancelling a Confirmed request.** This happens by phone with the school only.
- **Requests for a future date.** Same-day only, matching the portal (there is no date field; the day is `CreatedDateTime`).
- **Editing a submitted request from mobile.** To change it, cancel while Pending and submit a new one.
- **Pinning arbitrary Settings items to the bottom bar.** This is a later, general feature. See §6.6 for the one hook we add now.
- **Localizing the mobile UI.** The app is English-only today. Server-provided labels may be Arabic, as elsewhere.

## 4. Anti-goals (would be a failure even if it "works")

- Any path that lets a parent create a request for a student they **don't hold educational mandate for**, or name a collector the portal wouldn't allow (for example a relative without `HasPermission`). The server must enforce this; hiding things in the UI is not enough.
- A parent believing a Pending request is approved. Pending must read as "not yet valid at the gate".
- Parent requests silently mixed into the school's existing pending list, so staff can't tell where they came from.
- A cancelled request that staff can still approve.

## 5. Lifecycle

| Status | Meaning | How it's reached | Parent can cancel? |
|---|---|---|---|
| **Pending** | Submitted by the parent, awaiting the school | Parent submits | Yes |
| **Confirmed** | School approved; valid at the gate | Staff Approve in the portal | No. The app shows "To cancel, please contact the school." |
| **Cancelled by parent** | Parent withdrew it while Pending | Parent taps Cancel | — |
| **Cancelled by school** | Staff cancelled it while Pending | Staff tap Cancel in the portal (replaces Delete for parent requests) | — |
| **Expired** | Never confirmed and its day has passed | Derived: not confirmed, not cancelled, `CreatedDateTime` date < today in the school's configured time zone | — |

There are no other transitions. Confirmed, both Cancelled states and Expired are final.

**Who sees and acts on a request (agreed).** Visibility follows the educational mandate, not who created the request. When the mandate is None and both father and mother qualify, both see all gate requests for those children, either can cancel one that is Pending, and the confirmation and cancellation pushes go to both. When the mandate is held by one parent, or by a relative, only that person sees and acts. The detail screen shows "Requested by".

**Expired in the portal (agreed).** Expired requests drop out of the portal's working lists: the Online tab shows only today's requests. They remain in the database, and the parent's history shows them as Expired.

## 6. How it works

### 6.1 Backend: data (`BusHolding`)

The existing table stays the single source of truth, so confirmed parent requests flow to the security/Confirmed screen and print with no changes there. Add:

- `Source` (enum `BusHoldingSource`: `School = 0` default, `Parent = 1`). This drives the new tab and lets reports tell origins apart.
- `IsCancelled` (bool), `CancelledBy` (enum: `Parent = 1`, `School = 2`), `CancelledDateTimeUtc`, `CancelledByUserId`. Cancellation applies only to Pending, parent-source requests, by either party.
- `StudentRelativeId` (nullable FK to `StudentRelatives`). Store the chosen relative link, not only the name, so the parent app can show who was chosen and so a later permission revoke can be audited. *(Builder's call whether to backfill nothing; existing rows stay null.)*
- `RequestedByParentId` / `RequestedByRelativeId` as needed to know which mobile user created it. `CreatedById` may already be enough. *Builder's call.*

**Expired is derived, not stored.** No scheduled job: status is computed on read from `IsConfirmd`, `IsCancelled` and the date. *(My call: it avoids a Hangfire job and timezone drift.)*

Existing portal queries for the Pending list must **exclude cancelled rows**. Existing "already has a request today" checks must **ignore cancelled rows**, so a parent can cancel and resubmit.

Migration: add an EF migration. Follow the existing repo rule: **never run `dotnet ef database update`**.

### 6.2 Backend: mobile API (`MobileApp\Schoolzy.Mobile.Api`)

A new controller `GateRequestsController`, route `api/mobile/gate-requests`, following `ComplaintsController` / `ComplaintAppService` (JWT, `ApiResponse<T>` envelope `{success,message,errors[],data}`, `Idempotency-Key` header with `IIdempotencyCoordinator` in a transaction, then enqueue a Hangfire notification job after commit).

| Method | Path | Purpose |
|---|---|---|
| GET | `/eligibility` | Whether the caller can use the module at all: `{ canUse, reason? }`. `canUse` is true if they hold educational mandate for at least one active student. |
| GET | `/create-options?studentSeasonId=` | For one student: its siblings that the caller also holds mandate for (same `FatherId`, same academic year, active, as `GetSiblingStudentSeasons`); allowed collect-person types for that student (as `FilterCollectPersonTypesForStudent`); permitted relatives (as `BuildPermittedRelatives`); father/mother names; whether a request already exists today for each student. |
| GET | `/students` | Students the caller holds educational mandate for (students without it are excluded). |
| GET | `/` | The caller's gate requests, newest first, paged, with derived status. Default to the last 30 days *(my call)*. |
| GET | `/{id}` | Detail. |
| POST | `/` | Create. Body: `studentSeasonIds[]`, `type` (HoldingType), `collectPerson`, `studentRelativeId?`, `time`, `notes?`. Creates one row per student with `Source = Parent`, `IsBusChange = false`, `IsConfirmd = false`. Returns the created ids. |
| POST | `/{id}/cancel` | Cancels a Pending parent request. Fails with a clear message if it's Confirmed, already cancelled, or expired. |

Server-side rules on create (reuse `ServiceBusHolding` validation; don't duplicate it):
- Every `studentSeasonId` must be accessible to the caller **and** the caller must hold educational mandate for it (`StudentAccessService` rules: if the mandate is Father/Mother only that parent; if Relative only the linked relative; if None, either parent).
- `collectPerson` must be allowed for every selected student (`ValidateCollectPersonForStudentsAsync`). A relative must have `HasPermission = true` for every selected student.
- Reject with the existing "HoldingRecordExistsToday" error if any selected student already has a non-cancelled request today, naming which student.
- `time` is required and must not be in the past (school local time). *(My call.)*

Cancelling a sibling group: each request is cancelled individually *(my call)*. The detail screen offers "Cancel" per request. Revisit if parents ask for one-tap group cancel.

### 6.3 Backend: notifications

Add `NotificationType` values `GateRequestSubmitted` and `GateRequestConfirmed`, and mirror them in the mobile enum.

- **On create:** enqueue a job modelled on `ComplaintSubmittedNotificationJob`. Notify all active `AppUser` with `UserType == "Coordinators"`, the same recipients complaints use, with no stage scoping *(my call)*. One notification per submit (not per sibling), `ReferenceId` = first created id, `ActionUrl` → Pending screen, Online tab.
- **On confirm:** in the portal's `ApproveAsync` / `CreateConfirme` path, when a confirmed row has `Source = Parent`, enqueue a job modelled on `ComplaintFollowUpSentNotificationJob`. It notifies the requesting user (parent, or relative with mandate) by push. When siblings are approved together, send **one** notification covering them *(my call)*.
- **On school cancel:** add `NotificationType` `GateRequestCancelled`. Push to the parent(s): "The school cancelled your gate request for <student>. Please contact the school if needed." *(Wording is my call.)*
- **Recipients on the parent side:** everyone who holds the mandate for the student (both parents when the mandate is None), not only the creator.
- Jobs run in the WebApp host (FCM is a no-op in the Mobile API host), via the existing Hangfire "notifications" queue.

### 6.4 School portal (`WebApp`)

On `HoldingBusUpdates/ShowIndexPending`, add tabs above the grid:
- **School requests**: today's list, filtered to `Source = School`.
- **Online requests (from parents)**: `Source = Parent`, not cancelled, with a count badge. Rows show the same columns plus a "Parent request" marker and submit time.

Cancelled parent requests should be visible but not actionable *(my call: show them in the Online tab, greyed, with a "Cancelled by parent" badge and no Approve/Edit, so a staff member who saw it earlier understands why it disappeared from action)*. The Approve action rejects a cancelled row server-side too.

The existing All / Bus Change / Gate filter stays. Approve, sibling-approve and Edit behave exactly as now, with these exceptions for `Source = Parent` rows:

- **Today only.** The Online tab lists only today's parent requests (by `CreatedDateTime`). Approve and confirm-with-edit **reject a parent row from an earlier day**, so Expired is truly final. *(My call.)*
- **Edit stays available.** After phoning the parent, staff may need to adjust the time, collector or notes before confirming. The parent's detail screen always shows the current stored values. Any edit path that changes the collector must also update or clear `StudentRelativeId` so it never contradicts the collector names. *(My call.)*

- **Cancel replaces Delete.** For a Pending parent request, the row action is **Cancel** (with a confirm prompt), not Delete. It sets `IsCancelled = true` and `CancelledBy = School`, and notifies the parent(s) (§6.3). School-created requests keep their existing Delete. *(Scope of the change is my call.)*

**Which clock defines "today" (agreed).** The system already has a configured school time zone in Settings (e.g. Egypt), exposed in code via `IServiceAppTimeZone` / `SchoolTime`. All "today" logic in this module uses that setting: Expired, the not-in-the-past time check, the Online tab, Approve's earlier-day guard, **and** the existing "already has a request today" check and `CreateConfirme`'s `DateMustBeToday` in `ServiceBusHolding`, which use the server clock today. Switching those two keeps every check in agreement. For schools whose configured zone matches the server, nothing changes.

### 6.5 Mobile app

**Entry point.** A new tile **"Gate Requests"** on `AccountScreen` (the real Settings hub; `SettingsScreen.tsx` is an unused stub), placed near Relatives. It's hidden when `/eligibility` says `canUse = false`.

**Screens** (follow the existing Requests/Complaints patterns and `Palette` tokens):

1. **GateRequestsScreen (list).** Sections Today / Earlier, status chip per row (Pending = warning, Confirmed = success, Cancelled by you / Cancelled by school = neutral, Expired = neutral), "New request" button, empty state explaining what the module is for.
2. **AddGateRequestScreen.** In order:
   - Student, using `ChildOption` rows; auto-selected if only one.
   - Siblings: checkboxes for the eligible siblings from `/create-options`.
   - Reason: Early checkout / Sick leave / Other (HoldingType).
   - Who will collect: Father / Mother / Relative, only the allowed types. If Relative, a picker of permitted relatives. If none are permitted, show a hint linking to Relatives to grant permission.
   - Time.
   - Notes (optional).
   - Submit uses `useIdempotentMutation`. The success view reads: **"Request sent. Waiting for the school to confirm. It isn't valid at the gate until confirmed."**, then View request.
3. **GateRequestDetailsScreen.** Status chip and the fields. When Pending: a banner "Waiting for school confirmation. The school may call you if there's an issue." and a **Cancel request** button with a confirm dialog. When Confirmed: confirmation time plus the note "To cancel, please contact the school." When Expired: "This request wasn't confirmed on its day." When Cancelled by school: "The school cancelled this request. Please contact the school if needed."

Route `GateRequestCancelled` pushes to GateRequestDetails as well.

**Notifications.** Add the two types in `types/api/notifications.ts`, route `GateRequestConfirmed` → GateRequestDetails in `services/notificationRouting.ts`, and invalidate gate-request queries in `hooks/usePushNotifications.ts`.

**Data layer.** `services/api/gateRequests.ts`, a mapper (derived status → UI tone), `hooks/queries/useGateRequests.ts`, and new query keys, as in the existing modules.

### 6.6 Bottom-bar hook

Add a feature flag `gateRequestsTab` (default off, per app variant, env-overridable like `requestsTab`). When it's on, `FloatingTabBar` shows a tab whose `pushesRoute` is `GateRequests`, using the same mechanism as the Requests tab. This is the first concrete step toward letting Settings items appear in the bottom bar. The general pinning feature is out of scope.

## 7. Constraints

- Keep the `ApiResponse` envelope and the idempotency pattern. Don't change behaviour for school-created requests.
- The mobile app has no unit-test runner. Verify with `tsc` and eslint plus a device checklist. The backend follows its existing test conventions.
- Work on feature branches in both repos. The mobile repo is currently on `design-polish` and the backend on `feat/auto-student-code`; branch from each repo's main.

## 8. Left to the builder

- Exact column/enum naming and the migration.
- Whether to extend `ServiceBusHolding.CreateAsync` with a source parameter or wrap it in a new service method, as long as the validation is shared rather than copied.
- Paging details, list page size, and exact copy beyond the key messages quoted above.
- Visual layout within existing design tokens.

## 9. Calls I made (please check)

1. Expired is computed on read, not by a scheduled job.
2. Cancelled parent requests stay visible (greyed) in the portal's Online tab.
3. Cancelling is per student request, not per sibling group.
4. One coordinator notification per submit and one parent notification per approve, even with siblings.
5. Requested time can't be in the past.
6. Reason (Early checkout / Sick leave / Other) is shown to the parent, reusing the portal's HoldingType.
7. The entry tile is hidden entirely for parents without educational mandate on any child.
8. Parents only see children they hold educational mandate for.
9. The bottom-bar tab is behind a feature flag, off by default.
10. The portal's Online tab shows only today's requests, and Approve refuses parent requests from an earlier day.
11. Staff can still edit a parent request before confirming it. The parent sees the edited values.
12. Coordinator notifications go to all active coordinators, as for complaints.
13. School-side Cancel replaces Delete only for parent requests. School-created requests keep Delete.
14. A school cancel pushes a notification to the parent(s).
