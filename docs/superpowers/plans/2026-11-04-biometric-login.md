# Biometric Sign-in That Survives Logout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "Sign in with Face ID / Fingerprint" keeps working after the parent logs out, without storing the password and without keeping the logged-out session alive.

**Architecture:** The server issues a separate, device-bound **biometric credential** when the parent turns the setting on. The app stores it in SecureStore behind `requireAuthentication`, so only a successful biometric scan can read it. Logout revokes the session's refresh token as today and never touches the biometric credential. Signing in with biometrics exchanges the credential for a brand-new session. Separately, refresh tokens move from a 60-day sliding lifetime to a 30-day sliding lifetime with a 90-day absolute cap.

**Tech Stack:** Backend: ASP.NET Core (.NET 9), EF Core, xUnit + Moq, `WebApplicationFactory` endpoint tests. Mobile: Expo SDK 55, `expo-secure-store` 55.0.8, `expo-local-authentication` 55.0.8, TypeScript. The mobile app has no unit-test runner, so mobile tasks are verified with `tsc`, `eslint` and the device checklist in Task 9.

**Spec:** The decisions below were agreed in the 2026-11-04 conversation. This section is the spec.

### Agreed decisions

1. Refresh token: **30 days since last use**, capped at **90 days since the original login**. The cap carries across rotations.
2. Face ID uses its own credential (`MobileBiometricCredential`), separate from refresh tokens. It is bound to one `deviceId`. The server stores only its SHA-256 hash.
3. Credential lifetime: **90 days since last use** (sliding). **It is not rotated on use.** This replaces the rotation idea from the conversation. On Android, writing a `requireAuthentication` item shows a second biometric prompt, so rotating on each sign-in would mean two scans. Not rotating also removes the "rotation response lost" failure. The credential can only be read through the device's biometric hardware, so rotation adds little here.
4. One active credential per device. Enrolling on a device revokes every earlier active credential for that `deviceId`, for any user.
5. Revoked by: turning the setting off, a password change, a password reset, and expiry. **Logout does not revoke it.**
6. A failed biometric login never revokes other sessions. There is no reuse detection here. Any failure returns 401 with one generic message.
7. Android: offer the setting only when `getEnrolledLevelAsync()` is `BIOMETRIC_STRONG`. That is what SecureStore requires, so weak face unlock is not offered.
8. One scan per sign-in. The separate `authenticateAsync` prompt is removed, and the SecureStore read is the prompt.
9. The device's biometrics changed, so the stored item can't be read: clear local enrollment, hide the button, and ask the parent to sign in with their password and turn it on again.

## Global Constraints

- Backend repo: `F:\0 Schoolzy LMS\Projects\Schoolzy-LMS`. It is on branch `Dev` with unrelated uncommitted edits to `MobileApp/Schoolzy.Mobile.Api/appsettings.json` and `WebApp/.claude/launch.json`. Create `feature/mobile-biometric-login` from `Dev`, and never stage those two files.
- Mobile repo: this repo, branch `design-polish`.
- **Do not run `dotnet ef database update`.** The connection string points at a shared SQL Server. Only generate the migration files.
- Every response keeps the `{ success, message, errors[], data }` envelope through `AuthResult` / `FromResult`.
- The biometric 401 message is exactly: `Biometric sign-in is no longer valid. Please sign in with your password.`
- Mobile copy uses the capability label (`Face ID` / `Fingerprint`), never a hard-coded "Face ID".
- Do not log raw tokens on the backend or the mobile side. The mobile client logs request and response bodies, so Task 6 adds a `_skipBodyLog` flag for the biometric calls.

## Review Focus

1. **A second parent on the same phone.** B signs in with a password on a phone where A enabled biometrics. The button must disappear for B and must never sign B in as A. → test in Task 7, Step 3 and checklist item 6.
2. **Biometrics re-enrolled on the device.** On Android `getItemAsync` returns `null`, and on iOS the item is gone. The app must clear enrollment and explain, not show "session expired" in a loop. → Task 7 and checklist items 4 and 5.
3. **Password changed on the web, then Face ID on the phone.** Expect a 401, local enrollment cleared, and a clear message. → Task 3 test `ChangePassword_RevokesBiometricCredentials`, plus checklist item 7.
4. **User cancels the scan.** Nothing happens: no alert, enrollment kept. → Task 7 status `"cancelled"` and checklist item 3.
5. **A biometric-login 401 must not trigger the global refresh-and-sign-out path** in `client.ts`. → Task 6, Step 2.

---

## Backend (repo `Projects/Schoolzy-LMS`)

### Task 1: Refresh-token lifetime — 30-day sliding window, 90-day cap

**Files:**
- Modify: `WebApp/SchoolzyApp.Entity/Entity/Mobile/RefreshToken.cs` (add `public DateTime? SessionStartedAtUtc { get; set; }`)
- Modify: `MobileApp/Schoolzy.Mobile.Application/Auth/AuthAppService.cs:106-121` (`IssueRefreshTokenAsync`) and `:155-167` (rotation in `RefreshTokenAsync`)
- Migration: none in this task. Task 2 generates one migration covering both tasks.
- Test: `MobileApp/tests/Schoolzy.Mobile.Application.Tests/Auth/AuthAppServiceRefreshTokenTests.cs`

**Interfaces:**
- Produces: `internal static class RefreshTokenLifetime { public static readonly TimeSpan Sliding = TimeSpan.FromDays(30); public static readonly TimeSpan Absolute = TimeSpan.FromDays(90); public static DateTime ExpiryFor(DateTime sessionStartedAtUtc, DateTime nowUtc); }` in `MobileApp/Schoolzy.Mobile.Application/Auth/RefreshTokenLifetime.cs`. `ExpiryFor` returns `min(now + Sliding, sessionStarted + Absolute)`.

- [ ] **Step 1: Write the failing tests** in `AuthAppServiceRefreshTokenTests.cs`, reusing the existing arrange code from `RefreshTokenAsync_WithValidActiveToken_RotatesAndReturnsNewTokens`. Capture the added entity with `_refreshTokenRepoMock.Setup(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>())).Callback<RefreshToken, CancellationToken>((t, _) => added = t)`.
  - `RefreshTokenAsync_NewTokenExpiresThirtyDaysOut_WhenSessionIsYoung`: `existing.SessionStartedAtUtc = UtcNow.AddDays(-1)`. Assert `added.ExpiresAtUtc` is within 1 minute of `UtcNow.AddDays(30)`, and `added.SessionStartedAtUtc == existing.SessionStartedAtUtc`.
  - `RefreshTokenAsync_NewTokenIsCappedAtNinetyDaysFromSessionStart`: `SessionStartedAtUtc = UtcNow.AddDays(-80)`. Assert `added.ExpiresAtUtc` is within 1 minute of `UtcNow.AddDays(10)`.
  - `RefreshTokenAsync_LegacyTokenWithoutSessionStart_StartsTheCapNow`: `SessionStartedAtUtc = null`. Assert `added.SessionStartedAtUtc` is within 1 minute of `UtcNow`, and expiry is about 30 days out.
  - Add to `AuthAppServiceLoginTests.cs`: `LoginAsync_IssuesRefreshTokenWithSessionStartAndThirtyDayExpiry`.
- [ ] **Step 2: Run them to see them fail**
  Run: `dotnet test MobileApp/tests/Schoolzy.Mobile.Application.Tests --filter "FullyQualifiedName~RefreshToken|FullyQualifiedName~LoginAsync_IssuesRefreshToken"`
  Expected: FAIL. `SessionStartedAtUtc` does not exist yet, so the build fails.
- [ ] **Step 3: Implement.** Add the entity property and `RefreshTokenLifetime`. `IssueRefreshTokenAsync` sets `SessionStartedAtUtc = now` and `ExpiresAtUtc = ExpiryFor(now, now)`. Rotation sets `SessionStartedAtUtc = existing.SessionStartedAtUtc ?? now` and `ExpiresAtUtc = ExpiryFor(thatStart, now)`. If the capped expiry is already in the past, return the existing "Refresh token has expired. Please log in again." 401 **before** revoking or adding anything.
- [ ] **Step 4: Run the tests to see them pass.** Same command. Expected: PASS. Also run the whole `Schoolzy.Mobile.Application.Tests` project to confirm there are no regressions.
- [ ] **Step 5: Commit**
  ```bash
  git add WebApp/SchoolzyApp.Entity/Entity/Mobile/RefreshToken.cs MobileApp/Schoolzy.Mobile.Application/Auth/RefreshTokenLifetime.cs MobileApp/Schoolzy.Mobile.Application/Auth/AuthAppService.cs MobileApp/tests/Schoolzy.Mobile.Application.Tests/Auth
  git commit -m "feat(mobile-auth): 30-day sliding refresh tokens capped at 90 days"
  ```

### Task 2: `MobileBiometricCredential` entity and migration

**Files:**
- Create: `WebApp/SchoolzyApp.Entity/Entity/Mobile/MobileBiometricCredential.cs`
- Create: `WebApp/SchoolzyApp.DAL/Configuration/MobileBiometricCredentialConfiguration.cs` (mirror `RefreshTokenConfiguration`)
- Modify: `WebApp/SchoolzyApp.DAL/DBCon/WebAppDbConntext.cs:130` (add `DbSet<...MobileBiometricCredential> MobileBiometricCredentials`)
- Create: migration `AddMobileBiometricLogin`

**Interfaces:**
- Produces: `public class MobileBiometricCredential : BaseEntity { string UserId; string DeviceId; string TokenHash; DateTime ExpiresAtUtc; DateTime? RevokedAtUtc; DateTime? LastUsedAtUtc; string CreatedByIp; }`. Table `MobileBiometricCredential`. Limits: `UserId` 450, `DeviceId` 100, `TokenHash` 128 unique, `CreatedByIp` 64 optional. Indexes on `UserId` and `DeviceId`.

- [ ] **Step 1: Add the entity, configuration and DbSet.**
- [ ] **Step 2: Generate the migration.** It covers this task and `RefreshToken.SessionStartedAtUtc` from Task 1.
  Run: `dotnet ef migrations add AddMobileBiometricLogin --project WebApp/SchoolzyApp.DAL/SchoolzyWebApp.DAL.csproj --startup-project WebApp/SchoolzyApp/SchoolzyWebApp.csproj`
  Expected: the migration creates table `MobileBiometricCredential` and adds a nullable `SessionStartedAtUtc` to `MobileRefreshToken`. If `dotnet ef` fails because the web app build is locked, hand-write the migration and update `WebAppDbConntextModelSnapshot.cs`, as in `20261010032000_AddStudentGoogleAccount`. Record that ruling in the commit body.
- [ ] **Step 3: Build.** Run: `dotnet build SchoolzyApp.sln`. Expected: 0 errors.
- [ ] **Step 4: Commit** with message `feat(mobile-auth): biometric credential table`. Stage only the entity, configuration, DbContext, migration and snapshot files.

### Task 3: Biometric enroll / login / revoke service methods

**Files:**
- Create: `MobileApp/Schoolzy.Mobile.Application/Auth/Dtos/BiometricEnrollRequestDto.cs`, `BiometricEnrollResponseDto.cs`, `BiometricLoginRequestDto.cs`, `BiometricRevokeRequestDto.cs`
- Modify: `MobileApp/Schoolzy.Mobile.Application/Auth/IAuthAppService.cs`, `AuthAppService.cs`
- Test: `MobileApp/tests/Schoolzy.Mobile.Application.Tests/Auth/AuthAppServiceBiometricTests.cs` (new), plus the existing ChangePassword and ResetPassword test files

**Interfaces:**
- Consumes: `MobileBiometricCredential` (Task 2) and `ITokenService.GenerateRefreshTokenValue()` / `HashToken()`. Reuse them for the credential value.
- Produces:
  - `BiometricEnrollRequestDto { string DeviceId }` → `BiometricEnrollResponseDto { string BiometricToken; DateTime ExpiresAtUtc }`
  - `BiometricLoginRequestDto { string DeviceId; string BiometricToken }` → the existing `LoginResponseDto`
  - `BiometricRevokeRequestDto { string DeviceId }`
  - `Task<AuthResult<BiometricEnrollResponseDto>> EnrollBiometricAsync(string userId, BiometricEnrollRequestDto request, string ipAddress, CancellationToken ct)`
  - `Task<AuthResult<LoginResponseDto>> BiometricLoginAsync(BiometricLoginRequestDto request, string ipAddress, CancellationToken ct)`
  - `Task<AuthResult> RevokeBiometricAsync(string userId, BiometricRevokeRequestDto request, CancellationToken ct)`
  - A private `Task<AuthResult<LoginResponseDto>> IssueSessionAsync(IdentityUser user, string loginIdentifier, string ipAddress, CancellationToken ct)`, extracted from `LoginAsync` lines 69–99 (profile resolution, access token and refresh token). Both `LoginAsync` and `BiometricLoginAsync` call it.
  - A constant `internal static readonly TimeSpan BiometricLifetime = TimeSpan.FromDays(90);`

- [ ] **Step 1: Write the failing tests** in `AuthAppServiceBiometricTests.cs`. Use the mock setup style from `AuthAppServiceRefreshTokenTests`, with `Mock<IRepository<MobileBiometricCredential>>`.
  - `Enroll_StoresHashOnly_AndReturnsRawToken`: the added entity has `TokenHash == "hash-of-raw"`, `DeviceId == "dev-1"`, and `ExpiresAtUtc` about `UtcNow + 90d`. The response `BiometricToken == "raw"`.
  - `Enroll_RevokesEarlierActiveCredentialsForSameDevice_AnyUser`: the repo returns an active credential for `("other-user","dev-1")`. After the call, its `RevokedAtUtc` is set.
  - `BiometricLogin_ValidCredential_ReturnsSession_AndSlidesExpiry`: the result is OK with an access token. `LastUsedAtUtc` is about now and `ExpiresAtUtc` is about now + 90d. **No new credential is added** (`AddAsync` is never called on the biometric repo).
  - `BiometricLogin_Fails401_WhenUnknown | Revoked | Expired | DeviceIdMismatch`: one `[Theory]`. Each case returns `Unauthorized` with the exact Global Constraints message. **The refresh-token repo receives no writes** (no family revocation).
  - `BiometricLogin_LockedOutUser_Returns423`: mirrors the lockout check in `LoginAsync`.
  - `Revoke_RevokesOnlyCallersCredentialForDevice`.
  - In the existing ChangePassword and ResetPassword test files: `ChangePassword_RevokesBiometricCredentials` and `ResetPassword_RevokesBiometricCredentials`.
- [ ] **Step 2: Run them to see them fail.**
  Run: `dotnet test MobileApp/tests/Schoolzy.Mobile.Application.Tests --filter "FullyQualifiedName~Biometric"`. Expected: build FAIL (the methods don't exist).
- [ ] **Step 3: Implement.** Look the credential up by `TokenHash`, then check `DeviceId`, `RevokedAtUtc`, `ExpiresAtUtc` and `IsDeleted`. Every failure returns the same 401 message. `RevokeActiveRefreshTokensAsync` gets a sibling, `RevokeActiveBiometricCredentialsAsync(userId, ct)`, and `ChangePasswordAsync` / `ResetPasswordAsync` call both. `LogoutAsync` is unchanged.
- [ ] **Step 4: Run the tests to see them pass.** Same filter, then the whole project. Expected: PASS, including the existing `LoginAsync` tests after the `IssueSessionAsync` extraction.
- [ ] **Step 5: Commit** with message `feat(mobile-auth): biometric credential enroll, login and revoke`.

### Task 4: Endpoints, validators, Swagger, API notes

**Files:**
- Modify: `MobileApp/Schoolzy.Mobile.Api/Controllers/AuthController.cs`
- Create: `MobileApp/Schoolzy.Mobile.Api/Validators/Auth/BiometricEnrollRequestValidator.cs`, `BiometricLoginRequestValidator.cs`, `BiometricRevokeRequestValidator.cs`
- Modify: `MobileApp/MOBILE-API-CHANGES.md` (add a "Biometric sign-in" section with the three routes, the bodies, the 401 message, and the migration name)
- Test: `MobileApp/tests/Schoolzy.Mobile.Api.Tests/Auth/BiometricEndpointTests.cs` (new; copy `SeedParentAndLoginAsync` from `RefreshTokenEndpointTests`)

**Interfaces:**
- Produces these routes:
  - `[Authorize] POST /api/v1/auth/biometric/enroll`
  - `[AllowAnonymous] POST /api/v1/auth/biometric/login`
  - `[Authorize] POST /api/v1/auth/biometric/revoke`
- Validators: `DeviceId` NotEmpty, MaxLength 100. `BiometricToken` NotEmpty.

- [ ] **Step 1: Write the failing endpoint tests.**
  - `Enroll_ThenLogout_ThenBiometricLogin_Returns200WithNewSession`. This is the core scenario: logout must not kill biometrics.
  - `BiometricLogin_AfterChangePassword_Returns401`
  - `BiometricLogin_AfterRevoke_Returns401`
  - `BiometricLogin_WrongDeviceId_Returns401`
  - `Enroll_WithoutAuth_Returns401`
  - `Enroll_EmptyDeviceId_Returns400`
- [ ] **Step 2: Run them to see them fail.** Run: `dotnet test MobileApp/tests/Schoolzy.Mobile.Api.Tests --filter "FullyQualifiedName~Biometric"`. Expected: FAIL with 404s.
- [ ] **Step 3: Add the three actions.** Use the existing `FromResult`, `ClientIp` and `CurrentUserId` helpers. Add the validators.
- [ ] **Step 4: Run both test projects in full.** Run: `dotnet test MobileApp/tests/Schoolzy.Mobile.Api.Tests` and `dotnet test MobileApp/tests/Schoolzy.Mobile.Application.Tests`. Expected: all PASS.
- [ ] **Step 5: Commit** with message `feat(mobile-auth): biometric endpoints`.

---

## Mobile (this repo)

Verification for every mobile task: `npx tsc --noEmit` returns 0 errors, and `npx eslint <changed files>` has no new errors.

### Task 5: Device id and biometric storage service

**Files:**
- Create: `services/deviceId.ts`
- Rewrite: `services/biometric.ts`

**Interfaces:**
- `getDeviceId(): Promise<string>`. It reads `device_id` from SecureStore without auth. If missing, it generates 32 random hex characters with `Math.random` (the id is not a secret), saves it and returns it.
- In `services/biometric.ts`:
  - `getBiometricCapability(): Promise<BiometricCapability>` keeps its shape. **On Android**, `available` also requires `await LocalAuthentication.getEnrolledLevelAsync() === SecurityLevel.BIOMETRIC_STRONG`, and `type` is `"fingerprint"` whenever `FINGERPRINT` is supported. iOS is unchanged.
  - `getEnrollment(): Promise<{ identifier: string } | null>` reads the non-auth key `biometric_enrollment`, which holds JSON `{ identifier }` (the lower-cased, trimmed login identifier).
  - `storeBiometricToken(token: string, identifier: string, label: string): Promise<void>` writes `biometric_token` with `{ requireAuthentication: true, authenticationPrompt: \`Turn on ${label} sign-in\`, keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY }`, then writes `biometric_enrollment`.
  - `readBiometricToken(label: string): Promise<{ status: "ok"; token: string } | { status: "cancelled" } | { status: "invalidated" }>`. A resolved `null` means `"invalidated"`, and any thrown error means `"cancelled"`. Never clear anything on a throw.
  - `getLastLoginIdentifier(): Promise<string | null>` / `setLastLoginIdentifier(identifier: string): Promise<void>` use the non-auth key `last_login_identifier`, holding the lower-cased, trimmed identifier from the last password login. Logout does not clear it.
  - `clearBiometricEnrollment(): Promise<void>` deletes `biometric_token` and `biometric_enrollment` (deleting does not prompt).
  - Remove `isBiometricEnabled`, `setBiometricEnabled`, `authenticateBiometric`, and the `biometric_login_enabled` key. The cleanup in `clearBiometricEnrollment` also deletes the legacy key.

- [ ] **Step 1: Implement both files.** Update the header comment of `biometric.ts` to describe the credential model. Remove the "refresh token already in the keychain" text.
- [ ] **Step 2: Verify.** Run `npx tsc --noEmit`. Expected: errors **only** in `hooks/useBiometricSetting.ts`, `screens/auth/LoginScreen.tsx` and `contexts/AuthContext.tsx`, the old callers. Tasks 6–8 fix those.
- [ ] **Step 3: Commit** with message `feat(biometric): device-bound credential storage`. Run `tsc` to completion only at the end of Task 8. Committing a red `tsc` here is acceptable because the next tasks complete the change on the same branch.

### Task 6: API calls and the 401 interceptor

**Files:**
- Modify: `services/api/config.ts:45` (add `biometricEnroll`, `biometricLogin` and `biometricRevoke` routes from Task 4)
- Modify: `services/api/auth.ts` (three new methods)
- Modify: `services/api/client.ts:212` (`isRefreshCall`)

**Interfaces:**
- `authApi.biometricEnroll(deviceId: string): Promise<string>` returns `data.biometricToken`, and throws `ApiError` if it is missing.
- `authApi.biometricLogin(deviceId: string, biometricToken: string): Promise<AuthSession>` uses the same token and user extraction and persistence as `login`.
- `authApi.biometricRevoke(deviceId: string): Promise<void>`
- `authApi.logout()` is unchanged. Confirm `tokenStorage.clear()` does not touch the `biometric_*` keys.

- [ ] **Step 1: Add the routes and methods.** The requests send no token in any log line. Check how `requestRaw` logs bodies. If it logs request or response bodies, add a `_skipBodyLog` flag to `RetriableConfig` and honour it in both interceptors.
- [ ] **Step 2: Rename `isRefreshCall` to `isAuthCall`.** It becomes true for the refresh-token, login and biometric-login URLs, so a 401 from those never triggers refresh-and-sign-out.
- [ ] **Step 3: Verify** with `tsc`. Expected: the same remaining errors as in Task 5, nothing new.
- [ ] **Step 4: Commit** with message `feat(biometric): enroll/login/revoke API calls`.

### Task 7: AuthContext and LoginScreen

**Files:**
- Modify: `contexts/AuthContext.tsx`
- Modify: `screens/auth/LoginScreen.tsx:29, 66-81, 162-180`

**Interfaces:**
- Remove `hasStoredSession` and `resumeSession` from `AuthContextValue`.
- Add `loginWithBiometric(label: string): Promise<"ok" | "cancelled" | "invalidated" | "rejected">`. The flow: `readBiometricToken`, then `biometricLogin(await getDeviceId(), token)`, then set user and authenticated state and register push, the same as `login`.
  - An `ApiError` with status 401 → `clearBiometricEnrollment()`, then return `"rejected"`.
  - `"invalidated"` → `clearBiometricEnrollment()`, then return `"invalidated"`.
  - A network error → rethrow.
- `login(email, password)`: after success, compute `id = email.trim().toLowerCase()`. If `getEnrollment()` returns a different identifier, call `clearBiometricEnrollment()`. This covers Review Focus item 1. Then call `setLastLoginIdentifier(id)`.

- [ ] **Step 1: Implement the context changes.**
- [ ] **Step 2: Update LoginScreen.** The button shows when `biometricReady && biometricAvailable && biometricEnabled`, where `enabled` now means "enrolled" (Task 8). Handler outcomes:
  - `"cancelled"`: do nothing.
  - `"invalidated"`: `Alert.alert(\`${label} changed\`, \`Sign in with your password, then turn ${label} sign-in on again in Account.\`)`, then call `refresh()` from the hook so the button hides.
  - `"rejected"`: `Alert.alert(\`${label} sign-in turned off\`, "Your password may have changed. Sign in with your password, then turn it on again in Account.")`, then call `refresh()`.
  - A network error: the existing generic network alert.
- [ ] **Step 3: Verify** with `tsc`. Expected: errors only in `hooks/useBiometricSetting.ts` and the `refresh` reference in `LoginScreen.tsx`, which Task 8 adds.
- [ ] **Step 4: Commit** with message `feat(biometric): sign in with the device credential`.

### Task 8: `useBiometricSetting` and the Account toggle

**Files:**
- Modify: `hooks/useBiometricSetting.ts`
- Modify: `screens/main/AccountScreen.tsx:327-345` (only if the toggle needs a busy state)

**Interfaces:**
- `useBiometricSetting()` returns `{ available, type, label, enabled, ready, busy, toggle, refresh }`. `enabled = (await getEnrollment()) !== null`. `refresh()` re-reads it.
- `toggle(true)`:
  1. Sets `busy`.
  2. Calls `authApi.biometricEnroll(deviceId)`.
  3. Calls `storeBiometricToken(token, await getLastLoginIdentifier(), label)`. On Android this shows the scan prompt.
  4. Sets `enabled`.
  - If any step throws: call `clearBiometricEnrollment()`, show `Alert.alert("Couldn't turn on " + label, "Please try again.")`, and leave the switch off.
  - If `getLastLoginIdentifier()` is null (only possible for a session from before this release), don't call the API. Show `Alert.alert("Sign in again", "Sign out and back in with your password, then turn " + label + " on.")`.
- `toggle(false)`: `clearBiometricEnrollment()` first (local and instant), then a best-effort `authApi.biometricRevoke(deviceId)` with errors logged and swallowed.
- Not optimistic any more. The switch moves only after enrollment succeeds, because enrolling needs the network and a scan.

- [ ] **Step 1: Implement.** While `busy`, disable the `Switch` in AccountScreen.
- [ ] **Step 2: Verify.** Run `npx tsc --noEmit`. Expected: **0 errors.** Then run `npx eslint services hooks contexts screens/auth screens/main/AccountScreen.tsx`. Expected: no new errors.
- [ ] **Step 3: Commit** with message `feat(biometric): Account toggle enrolls and revokes the credential`.

### Task 9: Device verification (iPhone + a real Samsung)

This needs a dev build (`npx expo run:ios` / `run:android`), not Expo Go, against a local mobile API that has the Task 2 migration applied to a **local** database. Record each item as pass or fail in the PR description.

1. Turn the setting on in Account, then log out. The login screen shows "Sign in with {label}". One scan signs in.
2. Kill the app and relaunch after logging out. The button is still there and works.
3. Cancel the scan. Nothing happens and the button stays.
4. iOS: add a new appearance in Face ID settings, then try. You get the "{label} changed" alert, the button hides, and the password works.
5. Android: add a new fingerprint, then try. Same as item 4.
6. Parent A enrolls and logs out. Parent B signs in with a password. After B logs out, the button is gone.
7. Change the password from the web app, then try Face ID. You get the "sign-in turned off" alert.
8. Samsung with face unlock only (no fingerprint): the Account toggle is hidden.
9. Turn the setting off in Account. The server row shows `RevokedAtUtc` set, and the button is gone after logout.
10. Airplane mode, then scan. You get the network alert, and the enrollment is kept.
