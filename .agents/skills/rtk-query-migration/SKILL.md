---
name: rtk-query-migration
description: Use when fetching or mutating server data in this app, or when touching any existing createAsyncThunk, *.thunk.ts, or data slice. Defines the server-state vs client-state split and the progressive migration to RTK Query.
---

# State Management and RTK Query Migration

## Strict separation

- **Server state = 100% RTK Query**, in `src/libs/state/redux/api/` (`baseApi`, `kidChurchApi`, `churchApi`). Every read (query) and mutation against the microservices lives there. Use declarative `tagTypes` for invalidation; RTK Query gives in-flight deduplication, auto-invalidation, refetch on reconnect, and offline-queue sync.
- **Client state = Redux slices**, ONLY for device preferences and persisted session context: `authSlice` (tokens/profile), `printerModeSlice`, `volunteerContextSlice`, active meeting/campus selection. Never put server fetching logic in these slices.

## Mandatory migration rule

- **New screens/flows:** consume generated hooks directly (`useGet...Query`, `use...Mutation`). Do NOT create new `createAsyncThunk` or new slices for server data.
- **Existing screens you modify:** replace their `dispatch(Thunk)` + `useAppSelector` data reads with the matching RTK Query hook.
- **Retire legacy code:** when a `*.thunk.ts` or data slice has no remaining consumers, remove it cleanly from `store.ts`.

## Never

- Alter API contract params or payload fields (e.g. `registrationChurchMeetingId`) unless the user explicitly asks.
- Add `active: boolean` to models; use `state` with `EntityState`.
- Run independent async calls sequentially; use `Promise.all`.

## Reminder

Master catalogs (campuses, meetings, kid groups, medical conditions, printers) already avoid redundant 304 requests via Redux `condition` guards and HTTP in-memory caching. Preserve that behavior when migrating them.
