# Parent Gate Requests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parents submit same-day gate pickup requests (one student plus optional siblings) from the mobile app. The school confirms them, or either side cancels, from a new "Online requests" tab in the portal's Bus & Gate Pending screen. Coordinators and parents are notified.

**Architecture:** Parent requests are ordinary `BusHolding` rows tagged `Source = Parent`, so confirmed ones reach the gate/Confirmed screen and printouts unchanged. Status is derived on read from `IsConfirmd`, `IsCancelled`, `CancelledBy` and the school-local date: Pending, Confirmed, CancelledByParent, CancelledBySchool or Expired. A new mobile API (`api/mobile/gate-requests`) reuses `ServiceBusHolding` validation. Notifications run as Hangfire jobs in the WebApp host, following the complaint jobs. The mobile app adds three screens reached from the Account (Settings) hub.

**Tech Stack:** Backend: ASP.NET Core (.NET 9), EF Core, Hangfire, xUnit + Moq, `WebApplicationFactory` endpoint tests, Razor + jQuery portal. Mobile: Expo SDK 55, React Native 0.83, TypeScript, @tanstack/react-query 5, react-navigation 7. The mobile app has no unit-test runner, so mobile tasks are verified with `npx tsc --noEmit`, `npx eslint` and the device checklist in Task 10.

**Spec:** `docs/superpowers/specs/2026-11-05-parent-gate-requests-design.md` (this repo). Read it before starting any task.

## Global Constraints

- **Backend repo:** `F:\0 Schoolzy LMS\Projects\Schoolzy-LMS`.
  - Create `feature/parent-gate-requests` from `origin/Dev`; backend PRs target `Dev`.
  - The working tree has unrelated uncommitted edits to `MobileApp/Schoolzy.Mobile.Api/appsettings.json`, `WebApp/.claude/launch.json` and `WebApp/SchoolzyApp/appsettings.json`, plus an untracked `docs/scripts/`. Never stage them; stash them if switching branches requires it.
- **Mobile repo:** this repo, branch `feature/parent-gate-requests`, already created from `design-polish`.
- **Do not run `dotnet ef database update`.** Only generate migration files.
- Mobile responses keep the `{ success, message, errors[], data }` envelope via `AuthResult<T>` and `FromResult`.
- Every create/cancel endpoint honours the `Idempotency-Key` header through `IIdempotencyCoordinator`, as `ComplaintAppService.CreateAsync` does.
- **"Today"** everywhere in this feature, and in `ServiceBusHolding`'s existing day checks, comes from the configured school time zone (`IServiceAppTimeZone.GetTimeZone()`), never `DateTime.Today` or `TimeZoneInfo.Local`.
- Gate only: mobile-created rows always have `IsBusChange = false` and `BusId = null`.
- Mobile copy is fixed by the spec:
  - Success view: `Request sent. Waiting for the school to confirm. It isn't valid at the gate until confirmed.`
  - Pending banner: `Waiting for school confirmation. The school may call you if there's an issue.`
  - Confirmed note: `To cancel, please contact the school.`
  - Expired: `This request wasn't confirmed on its day.`
  - Cancelled by school: `The school cancelled this request. Please contact the school if needed.`
- Notification type numbers (backend enum and mobile enum must match): `GateRequestSubmitted = 14`, `GateRequestConfirmed = 15`, `GateRequestCancelled = 16`.

## Review Focus

1. **Cancel and approve racing.** A parent cancels while staff click Approve at the same moment. Exactly one wins, and the loser gets a clear error, never a row that is both cancelled and confirmed. → Task 3 tests `ApproveAsync_Fails_WhenCancelled` and `CancelParentRequestAsync_Fails_WhenConfirmed`, plus the row-version/concurrency note in Task 3 Step 3.
2. **Sibling approve includes a cancelled sibling.** Staff approve with `applyToSiblings` while one sibling's request was cancelled by the parent. The cancelled one must stay cancelled. → Task 3 test `ApproveAsync_WithSiblings_SkipsCancelledSiblings`.
3. **Relative's pickup permission revoked after submit.** The request keeps the stored names, and approval still works (staff decide). But a *new* create naming that relative must fail. → Task 5 test `CreateAsync_Fails_WhenRelativeLacksPermissionForAnySelectedStudent`.
4. **Requests near midnight.** A request submitted at 23:50 school time is Expired at 00:00 school time even if the server clock is in another zone. → Task 3 test `GetStatus_IsExpired_AfterSchoolMidnight_EvenWhenServerDateIsStillYesterday`.
5. **A parent who loses mandate after submitting** (the school changes it). They must no longer see or cancel that student's requests. → Task 5 test `CancelAsync_Fails_WhenCallerNoLongerHoldsMandate`.

---

## Backend (repo `Projects/Schoolzy-LMS`)

### Task 1: `BusHolding` fields, enums and migration

**Files:**
- Modify: `WebApp/SchoolzyApp.Entity/Entity/CLassManagement/BusHolding.cs`
- Create: `WebApp/SchoolzyApp.Entity/Entity/CLassManagement/Enum/BusHoldingSource.cs`, `.../Enum/BusHoldingCancelledBy.cs`, `.../Enum/BusHoldingStatus.cs`
- Modify: `WebApp/SchoolzyApp.Entity/DTO/CLassManagement/BusDto/CreateBusHoldingDto.cs` (add `Source`, keep the existing `StudentRelativeId`)
- Create: the migration in the project the existing BusHolding migrations live in (find with `grep -rl BusHoldings WebApp/SchoolzyApp.Migration* WebApp/SchoolzyApp.DAL`)
- Test: `WebApp/tests/SchoolzyWebApp.Tests.Service/Services/ClassManagement/ServiceBusHoldingTests.cs`

**Interfaces:**
- Produces:
  - `enum BusHoldingSource { School = 0, Parent = 1 }`
  - `enum BusHoldingCancelledBy { Parent = 1, School = 2 }`
  - `enum BusHoldingStatus { Pending = 1, Confirmed = 2, CancelledByParent = 3, CancelledBySchool = 4, Expired = 5 }`
  - On `BusHolding`: `BusHoldingSource Source` (default `School`), `bool IsCancelled`, `BusHoldingCancelledBy? CancelledBy`, `DateTime? CancelledDateTimeUtc`, `string? CancelledByUserId`, `long? StudentRelativeId` (nav `StudentRelatives? StudentRelative`).
  - On `CreateBusHoldingDto`: `BusHoldingSource Source { get; set; } = BusHoldingSource.School;`

- [ ] **Step 1: Write the failing test** `CreateAsync_PersistsSourceAndStudentRelativeId`: valid parent DTO with `Source = Parent` and `StudentRelativeId = 77`. Capture the added entity and assert `Source == Parent` and `StudentRelativeId == 77`. Add `CreateAsync_DefaultsSourceToSchool` for a DTO that doesn't set it.
- [ ] **Step 2: Run** `dotnet test WebApp/tests/SchoolzyWebApp.Tests.Service --filter "FullyQualifiedName~ServiceBusHoldingTests.CreateAsync_"`. Expected: the new tests fail to compile or FAIL.
- [ ] **Step 3: Add the enums and properties, set `entity.Source` and `entity.StudentRelativeId` in `CreateAsync` (`ServiceBusHolding.cs:364-460`), and configure the FK** (`StudentRelativeId` → `StudentRelatives.Id`, `OnDelete(Restrict)`). Add an index on `(Source, IsConfirmd, IsCancelled, CreatedDateTime)`.
- [ ] **Step 4: Generate the migration** `AddParentGateRequestFields` with `dotnet ef migrations add` (never `database update`). Check that the generated SQL adds only these columns, the FK and the index, with `Source` default 0 and `IsCancelled` default false.
- [ ] **Step 5: Run the tests** from Step 2. Expected: PASS, and the whole `ServiceBusHoldingTests` class still passes.
- [ ] **Step 6: Commit** `feat(bus-holding): add source, cancellation and relative link fields`.

### Task 2: School time zone for `ServiceBusHolding` day logic

**Files:**
- Modify: `WebApp/SchoolzyApp.Service/Repository/CLassManagement/ServiceBusHolding.cs`
  - constructor (`:29`) gains `IServiceAppTimeZone appTimeZone, TimeProvider timeProvider`
  - `LocalDayStartUtc` (`:708`) and the local-date helper above it (`~:695-706`) become instance methods using the school zone
  - every `DateTime.Today` (`:339, 366, 464, 489-490, 781`) becomes `SchoolToday()`
- Modify: DI registration of `TimeProvider` in `WebApp/SchoolzyApp/Program.cs` and `MobileApp/Schoolzy.Mobile.Application/DependencyInjection.cs`, only if it isn't already registered (`TimeProvider.System`)
- Test: `ServiceBusHoldingTests.cs` (update its constructor; use `Microsoft.Extensions.Time.Testing.FakeTimeProvider` if it's referenced, otherwise a small `TimeProvider` subclass in `SchoolzyWebApp.Tests.Shared`)

**Interfaces:**
- Produces, on `ServiceBusHolding`: `private DateTime SchoolToday()` and `private DateTime SchoolDayStartUtc(DateTime schoolLocalDay)`. Also `internal DateTime ToSchoolLocal(DateTime createdUtcOrUnspecified)`, which treats `CreatedDateTime` exactly as today's `ToLocal` helper does but converts to the school zone.

- [ ] **Step 1: Write the failing tests**, with the zone `"Egypt Standard Time"` (Windows id) and a fake now of `2026-11-05T22:30:00Z` (00:30 on 2026-11-06 in Cairo, UTC+2):
  - `CreateAsync_DuplicateCheck_UsesSchoolDay`: an existing holding created at `2026-11-05T21:00:00Z` (23:00 on the 5th in Cairo). Assert the create succeeds, because it's a different school day.
  - `CreateConfirme_DateMustBeToday_UsesSchoolDay`: a holding created at `2026-11-05T22:10:00Z` (00:10 on the 6th in Cairo). Assert there's no `DateMustBeToday` failure.
- [ ] **Step 2: Run** the filter `ServiceBusHoldingTests`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** by injecting `IServiceAppTimeZone` and `TimeProvider` and routing every day computation through `SchoolToday()` / `SchoolDayStartUtc()`. `ConfirmHolding`'s `ConfirmTime` uses school-local time-of-day.
- [ ] **Step 4: Run** the full `SchoolzyWebApp.Tests.Service` project. Expected: PASS.
- [ ] **Step 5: Commit** `fix(bus-holding): compute "today" in the configured school time zone`.

### Task 3: Status, cancel and approve guards in `ServiceBusHolding`

**Files:**
- Create: `WebApp/SchoolzyApp.Service/Repository/CLassManagement/BusHoldingStatusRules.cs`
- Modify: `WebApp/SchoolzyApp.Service/IRepository/CLassManagement/IServiceBusHolding.cs` (find it with `grep -rl "interface IServiceBusHolding"`), `ServiceBusHolding.cs`
- Test: `ServiceBusHoldingTests.cs`, plus a new `BusHoldingStatusRulesTests.cs` next to it

**Interfaces:**
- Consumes: Task 1 enums and fields; Task 2 `SchoolToday()` / `ToSchoolLocal()`.
- Produces:
  - `public static class BusHoldingStatusRules { public static BusHoldingStatus GetStatus(bool isConfirmed, bool isCancelled, BusHoldingCancelledBy? cancelledBy, DateTime createdSchoolLocal, DateTime schoolToday); }` Order of precedence: cancelled (by whom), then Confirmed, then Expired (`createdSchoolLocal.Date < schoolToday`), otherwise Pending.
  - On `IServiceBusHolding`:
    - `Task<ServiceResult<IReadOnlyList<long>>> CancelParentRequestsAsync(IReadOnlyCollection<long> busHoldingIds, BusHoldingCancelledBy by, string? userId, CancellationToken ct)`. All or nothing; each id must be a parent-source, non-deleted, non-cancelled, unconfirmed row created on the school's today. Failure codes: `HoldingRecordNotFound`, `NotParentRequest`, `AlreadyCancelled`, `AlreadyConfirmed`, `RequestExpired`.
    - `Task<BusHoldingStatus> GetStatusAsync(long busHoldingId, CancellationToken ct)` (used by the portal and mobile).
  - Behaviour changes to existing methods:
    - The duplicate check in `CreateAsync` ignores `IsCancelled` rows.
    - `ApproveAsync` and `CreateConfirme` fail with `HoldingRecordCancelled` on a cancelled row, and with `RequestExpired` on a parent row from an earlier school day.
    - With `applyToSiblings`, cancelled siblings are skipped.
    - `GetSiblingBusHoldings` (`:241`) excludes cancelled rows.
    - `UpdateRequestDetails` (`:614`) and `CreateConfirme` refuse cancelled rows. When either changes the collector, it sets `StudentRelativeId` to the new relative link, or to `null` when the collector isn't a relative (spec §6.4).

- [ ] **Step 1: Write the failing tests:**
  - `BusHoldingStatusRulesTests`: one case per status, plus `GetStatus_IsExpired_AfterSchoolMidnight_EvenWhenServerDateIsStillYesterday` (`createdSchoolLocal = 2026-11-05 23:50`, `schoolToday = 2026-11-06` → `Expired`) and `GetStatus_CancelledBeatsConfirmed` (defensive).
  - `ServiceBusHoldingTests`:
    - `CancelParentRequestsAsync_CancelsPendingParentRows` asserts `IsCancelled`, `CancelledBy == Parent`, `CancelledByUserId`, and `CancelledDateTimeUtc` set.
    - `CancelParentRequestsAsync_Fails_WhenConfirmed` (`AlreadyConfirmed`)
    - `CancelParentRequestsAsync_Fails_WhenSchoolSourced` (`NotParentRequest`)
    - `CancelParentRequestsAsync_Fails_WhenFromEarlierDay` (`RequestExpired`)
    - `CancelParentRequestsAsync_IsAllOrNothing` (one bad id → no row changed)
    - `ApproveAsync_Fails_WhenCancelled` (`HoldingRecordCancelled`)
    - `ApproveAsync_Fails_WhenParentRowFromEarlierDay` (`RequestExpired`)
    - `ApproveAsync_WithSiblings_SkipsCancelledSiblings`
    - `CreateAsync_AllowsResubmit_WhenTodaysRequestWasCancelled`
    - `UpdateRequestDetails_ClearsStudentRelativeId_WhenCollectorChangedToFather`
    - `UpdateRequestDetails_Fails_WhenCancelled`
- [ ] **Step 2: Run** the filters `BusHoldingStatusRulesTests|ServiceBusHoldingTests`. Expected: FAIL.
- [ ] **Step 3: Implement.** For the cancel/approve race: both paths re-read the row inside the save and check the opposite flag before writing. If `BaseEntity` or the DbContext exposes a concurrency token, use it and map `DbUpdateConcurrencyException` to `ConcurrentUpdate`. Otherwise use a guarded update (`ExecuteUpdateAsync` with `Where(!IsConfirmd && !IsCancelled)`, checking affected rows). Pick the one matching existing repository patterns and say which in the commit message.
- [ ] **Step 4: Run** the full `SchoolzyWebApp.Tests.Service`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(bus-holding): parent request status, cancellation and approve guards`.

### Task 4: Gate request notifications

**Files:**
- Modify: `WebApp/SchoolzyApp.Entity/Entity/Notifications/AppNotification.cs` (add `GateRequestSubmitted = 14, GateRequestConfirmed = 15, GateRequestCancelled = 16`)
- Create: `WebApp/SchoolzyApp.Service/IRepository/BusHolding/IGateRequestJobScheduler.cs`
- Create: `WebApp/SchoolzyApp.Service/Jobs/Schedulers/HangfireGateRequestJobScheduler.cs`
- Create: `WebApp/SchoolzyApp.Service/Jobs/Notifications/GateRequests/GateRequestSubmittedNotificationJob.cs`, `GateRequestConfirmedNotificationJob.cs`, `GateRequestCancelledNotificationJob.cs`, `GateRequestRecipients.cs`
- Modify: `ServiceBusHolding.cs` (inject the scheduler; enqueue after a successful approve or school cancel of parent rows), `WebApp/SchoolzyApp/Program.cs:196-197` and `MobileApp/Schoolzy.Mobile.Application/DependencyInjection.cs:104` (register the scheduler and jobs beside the complaint ones)
- Test: `WebApp/tests/SchoolzyWebApp.Tests.Service/Jobs/GateRequests/*Tests.cs` (mirror any existing complaint job tests' location if one exists)

**Interfaces:**
- Produces:
  - `interface IGateRequestJobScheduler { void EnqueueSubmitted(IReadOnlyList<long> busHoldingIds); void EnqueueConfirmed(IReadOnlyList<long> busHoldingIds); void EnqueueCancelledBySchool(IReadOnlyList<long> busHoldingIds); }`, queue `"notifications"`.
  - `GateRequestRecipients.ResolveParentUserIdsAsync(IUnitOfWork uow, long studentId, CancellationToken ct) : Task<IReadOnlyList<string>>`. Mandate `Father` → father's `UserId`. `Mother` → mother's. `Relative` → the `UserId` of the relative behind `EducationalMandateRelativeId`. `None`/null → father and mother. Skip null user ids; de-duplicate.
- Behaviour:
  - **Submitted:** one `SendToManyOnceAsync` to active `UserType == "Coordinators"`, `ReferenceId = busHoldingIds[0]`, `actionUrl: "/HoldingBusUpdates/ShowIndexPending?tab=online"`. Title EN `New gate request: {student names joined by ", "}` / AR `طلب استلام جديد: {names}`. Body EN `A parent submitted a gate pickup request for today. Please review it.` / AR `قام ولي أمر بتقديم طلب استلام لليوم. يرجى المراجعة.`
  - **Confirmed:** to the union of recipients across the students, one notification per user per call, `ReferenceId = busHoldingIds[0]`. Title EN `Gate request confirmed` / AR `تم تأكيد طلب الاستلام`. Body EN `The school confirmed your gate request for {names}.` / AR `أكدت المدرسة طلب الاستلام لـ {names}.`
  - **Cancelled by school:** same recipients. Title EN `Gate request cancelled` / AR `تم إلغاء طلب الاستلام`. Body EN `The school cancelled your gate request for {names}. Please contact the school if needed.` / AR `ألغت المدرسة طلب الاستلام لـ {names}. يرجى التواصل مع المدرسة عند الحاجة.`
  - `ServiceBusHolding` enqueues **Confirmed** only for rows with `Source == Parent`, passing all ids confirmed in that call. It enqueues **CancelledBySchool** only when `by == School`.

- [ ] **Step 1: Write the failing tests:**
  - `ResolveParentUserIds_MandateNone_ReturnsBothParents`
  - `_MandateMother_ReturnsMotherOnly`
  - `_MandateRelative_ReturnsRelativeUser`
  - `ConfirmedJob_SendsOncePerRecipient_ForSiblingGroup`
  - `SubmittedJob_NotifiesActiveCoordinatorsOnly`
  - In `ServiceBusHoldingTests`: `ApproveAsync_EnqueuesConfirmed_ForParentRowsOnly` and `CancelParentRequestsAsync_BySchool_EnqueuesCancelled`, with a mocked scheduler.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** following `ComplaintSubmittedNotificationJob` and `HangfireComplaintJobScheduler`.
- [ ] **Step 4: Run** the full service test project. Expected: PASS.
- [ ] **Step 5: Commit** `feat(notifications): gate request submitted/confirmed/cancelled jobs`.

### Task 5: Mobile API `api/mobile/gate-requests`

**Files:**
- Create: `MobileApp/Schoolzy.Mobile.Application/DTOs/GateRequests/*.cs`
- Create: `MobileApp/Schoolzy.Mobile.Application/Interfaces/GateRequests/IGateRequestAppService.cs`
- Create: `MobileApp/Schoolzy.Mobile.Application/Services/GateRequests/GateRequestAppService.cs`
- Create: `MobileApp/Schoolzy.Mobile.Api/Controllers/GateRequestsController.cs`
- Modify: `MobileApp/Schoolzy.Mobile.Application/DependencyInjection.cs`, plus the validators folder if create DTOs use FluentValidation there
- Test: `MobileApp/tests/Schoolzy.Mobile.Application.Tests/GateRequests/GateRequestAppServiceTests.cs`, `MobileApp/tests/Schoolzy.Mobile.Api.Tests/GateRequests/GateRequestsEndpointTests.cs`

**Interfaces:**
- Consumes:
  - `IStudentAccessService.GetAccessibleStudentSeasonsQueryAsync(activeAcademicYearOnly: true, ct)`. This *is* the mandate rule: a season is accessible only to whoever holds its mandate.
  - `IServiceBusHolding.GetCreatePendingRequestLookupsAsync(studentSeasonId, lang, ct)`, `GetSiblingStudentSeasons(studentSeasonId, collectPerson, studentRelativeId, …)`, `CreateAsync(dto, ct)`, `CancelParentRequestsAsync(...)`
  - `BusHoldingStatusRules.GetStatus`, `IGateRequestJobScheduler.EnqueueSubmitted`, `IIdempotencyCoordinator`, `SchoolTime.Today/Now`
- Produces (JSON is camelCase; enums are serialized as numbers, matching complaints):
  - `GET /eligibility` → `GateEligibilityDto { bool canUse }`. True if any accessible active season exists.
  - `GET /students` → `List<GateStudentDto { long studentSeasonId, string name, string? className, bool hasRequestToday }>`
  - `GET /create-options?studentSeasonId=` → `GateCreateOptionsDto`:
    - `List<GateStudentDto> siblings` (sibling seasons ∩ accessible, excluding the selected one)
    - `List<LookupDto{int id,string name}> holdingTypes`
    - `List<LookupDto> collectPersonTypes` (only Father/Mother/Relative; drop Driver and Other)
    - `List<GateRelativeDto { long studentRelativeId, string name, string? relativeTypeName }> permittedRelatives`
    - `string? fatherName, motherName`
  - `GET /?pageNumber=1&pageSize=20` → `GateRequestPageDto { List<GateRequestListItemDto> items, int totalCount }`. Rows for accessible seasons, `Source == Parent`, last 30 school days, newest first.
  - `GateRequestListItemDto`: `long id, long studentSeasonId, string studentName, int type, string typeName, int collectPerson, string collectPersonName, string? time ("HH:mm"), int status (BusHoldingStatus), string statusName, DateTime createdAtUtc, string? requestedByName`
  - `GET /{id}` → `GateRequestDetailDto`: the list fields plus `string? notes, DateTime? confirmedAtUtc, DateTime? cancelledAtUtc, bool canCancel`. `canCancel` is true only when status is Pending.
  - `POST /` with body `CreateGateRequestDto { List<long> studentSeasonIds, int type, int collectPerson, long? studentRelativeId, string time ("HH:mm"), string? notes }` and an `Idempotency-Key` header → `AuthResult<List<long>>`
  - `POST /{id}/cancel` with an `Idempotency-Key` header → `AuthResult<GateRequestDetailDto>`
- Create rules:
  - Each season must be accessible (else 403 `"You can't create a request for this student."`).
  - `collectPerson ∈ {Father, Mother, Relative}`.
  - `Relative` requires `studentRelativeId`, and `HasPermission` on that relative for **every** selected student.
  - `time` must parse and be ≥ school-local now (`"Pickup time can't be in the past."`).
  - `notes` ≤ 500 chars.
  - Map `HoldingRecordExistsToday` to 409 naming the student(s): `"{name} already has a gate request today."`
  - Fill `CollectPersonNameEn/Ar` from the father/mother/relative names, and set `Source = Parent`, `IsBusChange = false`.
  - After commit, `EnqueueSubmitted(ids)`.
- Cancel rules:
  - The row's season must be accessible (else 404, so other families' ids aren't revealed).
  - Map service codes to 409 messages: `AlreadyConfirmed` → `"This request is already confirmed. To cancel, please contact the school."`, `RequestExpired` → `"This request has expired."`, `AlreadyCancelled` → `"This request is already cancelled."`

- [ ] **Step 1: Write the failing application tests:**
  - `CreateAsync_CreatesOneRowPerStudent_WithParentSource`
  - `CreateAsync_Fails_WhenStudentNotAccessible`
  - `CreateAsync_Fails_WhenRelativeLacksPermissionForAnySelectedStudent`
  - `CreateAsync_Fails_WhenTimeInPast`
  - `CreateAsync_RejectsDriverAndOther`
  - `CreateAsync_Maps_HoldingRecordExistsToday_To409WithName`
  - `CreateAsync_EnqueuesSubmittedOnce`
  - `CreateAsync_ReplaysCachedResponse_ForSameIdempotencyKey`
  - `CancelAsync_Fails_WhenCallerNoLongerHoldsMandate` (404)
  - `CancelAsync_Maps_AlreadyConfirmed_To409`
  - `GetAllAsync_DerivesExpired_ForYesterdaysPending`
  - `GetCreateOptions_ExcludesSiblingsWithoutMandate`
- [ ] **Step 2: Write the failing endpoint tests** in `GateRequestsEndpointTests` using `MobileApiWebApplicationFactory`: `Post_WithoutAuth_Returns401` and `GetEligibility_ReturnsEnvelope`.
- [ ] **Step 3: Run** `dotnet test MobileApp/tests/Schoolzy.Mobile.Application.Tests --filter GateRequest` and the Api test project. Expected: FAIL.
- [ ] **Step 4: Implement** following `ComplaintsController` / `ComplaintAppService` (transaction → idempotency start → service → complete → commit → enqueue). Add XML doc comments so Swagger shows the status numbers.
- [ ] **Step 5: Run** both test projects in full. Expected: PASS.
- [ ] **Step 6: Commit** `feat(mobile-api): gate requests endpoints for parents`.

### Task 6: Portal — Online requests tab and Cancel

**Files:**
- Modify: `WebApp/SchoolzyApp.Entity/DTO/StudentSearchDTO.cs` (add `BusHoldingSource? SourceFilter`)
- Modify: `WebApp/SchoolzyApp.Service/Repository/CLassManagement/StrategyServ/BusHoldingStrategy .cs:40-60` (filename has a space) and `ServiceBusHolding.cs:~990` (apply `SourceFilter`)
  - Source `School`: exclude cancelled rows.
  - Source `Parent`: include cancelled rows; today only (`CreatedDateTime >= SchoolDayStartUtc(SchoolToday())`); project status for display.
- Modify: `ServiceBusHolding.BuildPendingSmartTable` (`:640-691`): show a "Parent request" badge and submit time for parent rows. Cancelled rows are greyed with a "Cancelled by parent"/"Cancelled by school" badge and get no Approve/Edit/Cancel actions. Pending parent rows get a **Cancel** action.
- Modify: `WebApp/SchoolzyApp/Controllers/HoldingBusUpdatesController.cs`
  - `ShowIndexPending` (`:159`) reads `tab` (`school` default | `online`) into `SourceFilter`, and passes the count of today's pending parent rows for the badge.
  - Add `[HttpPost] CancelRequest(long busHoldingId, CancellationToken ct)`, same permission as `ApproveRequest`, calling `CancelParentRequestsAsync([id], School, userId, ct)`.
- Modify: `WebApp/SchoolzyApp/Views/HoldingBusUpdates/ShowIndexPending.cshtml` (tabs above the grid, keep `IsBusChangeFilter`, JS for Cancel with confirm text `Cancel this parent request? The parent will be notified.`), `Views/Shared/Components/SmartTable/Dismissal.cshtml` (badge/greyed styles)
- Modify: the portal resource files that hold `HoldingRecordExistsToday`-style keys (find with `grep -rl HoldingRecordExistsToday WebApp --include=*.resx`). Add `HoldingRecordCancelled`, `RequestExpired`, `NotParentRequest`, `AlreadyCancelled`, `AlreadyConfirmed`, `ConcurrentUpdate` and the tab labels `School requests` / `Online requests` (AR `طلبات المدرسة` / `الطلبات الأونلاين`).
- Test: `WebApp/tests/SchoolzyWebApp.Tests.Controller/...HoldingBusUpdates*` (follow the existing controller-test layout), plus `ServiceBusHoldingTests`

**Interfaces:**
- Consumes: Task 3 `CancelParentRequestsAsync`, `GetStatus`; Task 2 school-day helpers.

- [ ] **Step 1: Write the failing tests:**
  - `SearchIndex_PendingBus_SourceSchool_ExcludesParentRows`
  - `SearchIndex_PendingBus_SourceParent_IncludesTodaysCancelled_ExcludesYesterdays`
  - Controller: `CancelRequest_CallsServiceWithSchool` and `CancelRequest_ReturnsLocalizedError_OnAlreadyConfirmed`
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** the filter, table, controller and view changes.
- [ ] **Step 4: Run** the WebApp test projects. Expected: PASS. Then run the portal locally and check by hand:
  - Both tabs render.
  - The badge count is right.
  - Approve works on a parent row.
  - Cancel greys the row.
  - A cancelled row has no actions.
- [ ] **Step 5: Commit** `feat(portal): online parent requests tab with cancel on bus & gate pending`.

---

## Mobile (this repo)

### Task 7: Gate request data layer

**Files:**
- Create: `types/api/gateRequests.ts`, `services/api/gateRequests.ts`, `services/mappers/gateRequests.ts`, `hooks/queries/useGateRequests.ts`
- Modify: `services/api/config.ts` (endpoints beside the complaints block `:115-128`), `services/api/index.ts`, `services/mappers/index.ts`, `hooks/queries/index.ts`, `hooks/queries/queryKeys.ts`, `types/api/notifications.ts:66-80` (add 14/15/16), `types/api/index.ts`

**Interfaces:**
- Consumes: Task 5 DTO shapes (camelCase, as listed there).
- Produces:
  - `type GateRequestStatus = "pending" | "confirmed" | "cancelledByParent" | "cancelledBySchool" | "expired"`, mapped from server `status` 1-5.
  - `type GateStatusTone = "warning" | "success" | "neutral"` and `gateStatusTone(s)` (pending → warning, confirmed → success, the rest → neutral).
  - `gateStatusLabel(s)`: `Pending`, `Confirmed`, `Cancelled by you`, `Cancelled by school`, `Expired`.
  - `interface GateRequest { id: number; studentSeasonId: number; studentName: string; typeName: string; collectPersonName: string; time: string | null; status: GateRequestStatus; createdAt: Date; requestedByName: string | null }`
  - `interface GateRequestDetail extends GateRequest { notes: string | null; confirmedAt: Date | null; cancelledAt: Date | null; canCancel: boolean }`
  - Hooks:
    - `useGateEligibility()`
    - `useGateStudents()`
    - `useGateCreateOptions(studentSeasonId?: number)` (disabled without an id)
    - `useGateRequests()` → `{ today: GateRequest[]; earlier: GateRequest[] }`, split by the school day the server returned (`createdAt` local date vs device today is acceptable for grouping only)
    - `useGateRequest(id)`
    - `useCreateGateRequest()` (built on `useIdempotentMutation`, invalidates list and students)
    - `useCancelGateRequest(id)` (built on `useIdempotentMutation`, invalidates list and detail)
  - `queryKeys.gateRequests.{ all, list, detail(id), eligibility, students, createOptions(id) }`
  - `NotificationType.GateRequestSubmitted = 14, GateRequestConfirmed = 15, GateRequestCancelled = 16`

- [ ] **Step 1: Implement the types, API calls and mapper** following `services/api/complaints.ts` and `services/mappers/complaints.ts`. All endpoints are under `/api/mobile/gate-requests` with `api-version=1.0`, as for other `/api/mobile/*` calls.
- [ ] **Step 2: Implement the hooks** following `hooks/queries/useComplaints.ts:119-133` for the idempotent create.
- [ ] **Step 3: Verify** `npx tsc --noEmit` and `npx eslint types services hooks`. Expected: no errors.
- [ ] **Step 4: Commit** `feat(gate-requests): api client, mapper and query hooks`.

### Task 8: Screens and Account entry

**Files:**
- Create: `screens/main/GateRequestsScreen.tsx`, `screens/main/AddGateRequestScreen.tsx`, `screens/main/GateRequestDetailsScreen.tsx`, `components/gateRequests/GateStatusChip.tsx`
- Modify: `navigation/types.ts:192-221` (`GateRequests: undefined; AddGateRequest: undefined; GateRequestDetails: { requestId: number }`), `navigation/RootNavigator.tsx` (register the three), `screens/main/AccountScreen.tsx` (a "Gate Requests" `<Tile>` after Relatives `:202`, rendered only when `useGateEligibility().data?.canUse`, subtitle `Early pickup & who collects`)
- Add `constants/tokens.ts` entries only if `Palette.status.{warning,success,neutral}` (`:79-87`) don't fit the chip.

**Interfaces:**
- Consumes: the Task 7 hooks, types and labels; `ChildOption` (`components/form/FormParts.tsx:196`); `ScreenTemplate`; `StackTabBar`.
- Behaviour (from spec §6.5):
  - **List:** Today / Earlier sections, a `GateStatusChip` per row (student, collector, time), a "New request" button, and an empty state.
  - **Add:**
    - Student uses `ChildOption`, auto-selected when there's only one.
    - Students with `hasRequestToday` are shown disabled with the hint `Already has a request today`.
    - Sibling checkboxes come from `createOptions.siblings`.
    - Reason radio uses `holdingTypes`.
    - Collector radio uses `collectPersonTypes` (labels with the father/mother names). Relative shows a picker of `permittedRelatives`. If there are none, show the hint `No relatives have pickup permission yet.` with a link to `Relatives`.
    - Time uses a time input; default is the next quarter hour; past times are rejected client-side with the server's message text.
    - Notes are optional, max 500.
    - Submit → the success view with the exact spec copy → "View request" `replace("GateRequestDetails", { requestId: ids[0] })`.
  - **Details:**
    - Fields plus "Requested by".
    - Pending: the exact banner copy, and a `Cancel request` button → confirm dialog `Cancel this request?` → `useCancelGateRequest`.
    - Confirmed: confirmation time plus `To cancel, please contact the school.`
    - Expired and Cancelled by school: their exact copy.
    - Server 409 messages are shown verbatim.

- [ ] **Step 1: Build the list screen and status chip.** Run `npx tsc --noEmit`. Expected: clean.
- [ ] **Step 2: Build the add screen.** Run `npx tsc --noEmit`. Expected: clean.
- [ ] **Step 3: Build the details screen, navigation entries and Account tile.** Run `npx tsc --noEmit && npx eslint screens navigation components`. Expected: clean.
- [ ] **Step 4: Run** the app against a backend that has Tasks 1-5. Submit for one child plus a sibling, see two Pending rows, cancel one, and confirm the other in the portal.
- [ ] **Step 5: Commit** `feat(gate-requests): list, create and detail screens from Account`.

### Task 9: Push routing and the optional bottom-bar tab

**Files:**
- Modify: `services/notificationRouting.ts` (route `GateRequestConfirmed`/`GateRequestCancelled` with a `referenceId` → `GateRequestDetails`, without one → `GateRequests`; `GateRequestSubmitted` is staff-only, so return null), `hooks/usePushNotifications.ts:22-39` (invalidate `queryKeys.gateRequests.all` on `GateRequest*` types)
- Modify: `constants/featureFlags.ts:52-67` (`gateRequestsTab`, default `false`, env `EXPO_PUBLIC_ENABLE_GATE_REQUESTS_TAB`), `apps/*.ts` variant defaults (`false`), `navigation/FloatingTabBar.tsx:55-80` (a conditional `TABS` entry `{ name: "GateRequests", label: "Gate", Icon: <a phosphor door/gate icon>, pushesRoute: "GateRequests" }`), `navigation/TabNavigator.tsx:51-61` (register the placeholder tab under the same flag, as the Requests tab does)

**Interfaces:**
- Consumes: Task 7 `NotificationType` values and query keys; Task 8 routes.

- [ ] **Step 1: Implement the routing and invalidation.** Run `npx tsc --noEmit`. Expected: clean.
- [ ] **Step 2: Implement the flag and tab.** Run with `EXPO_PUBLIC_ENABLE_GATE_REQUESTS_TAB=true npx expo start` and check that the tab appears and opens the list. Without the flag, the bar is unchanged.
- [ ] **Step 3: Commit** `feat(gate-requests): push routing and optional bottom-bar tab`.

### Task 10: End-to-end device checklist

Run on one Android device and one iPhone against a local backend and portal with all tasks merged locally. Record the results in the PR description.

1. A parent without mandate on any child: no Account tile and no tab.
2. With mandate None, father and mother both see the father's request. The mother can cancel it while Pending. Both get the confirm push.
3. Mandate Mother: the father doesn't see the student in Add.
4. One child plus a sibling: the coordinator gets **one** notification, and the portal Online tab shows two rows with the badge count 2.
5. Staff approve with siblings, so the parent gets **one** push. Tapping it opens the details screen, which shows Confirmed and has no cancel button.
6. The parent cancels while Pending: the portal row greys out "Cancelled by parent" with no actions. Approving via a stale page fails with a message.
7. Staff cancel a parent request: the parent gets a push, and the details show the school-cancel copy.
8. Resubmitting the same student after a cancel succeeds. Submitting again while one is Pending shows `{name} already has a gate request today.`
9. A past pickup time is rejected.
10. Leave one Pending past school midnight (or set the school zone to make it so): the app shows Expired, it's gone from the portal Online tab, and Approve isn't possible.
11. A relative without permission is not offered. Toggle permission on in Relatives, then return to Add, and the relative now appears.
12. Confirmed parent requests appear in the security Confirmed screen and print like school requests.
