# ⚡ Sledge Field Capture

> **Offline-first React Native + TypeScript prototype** for the Sledge Mobile Engineer take-home task.

A field-capture app for the jobsite: record Daily Logs, RFIs, Punchlist items, Issues and Inspections with no signal. Every capture is saved on the device immediately, shows its sync state (`pending → syncing → synced / error`), and uploads automatically when the connection comes back.

---

## ✨ Features

| Feature | Implementation |
|---|---|
| 🏗 **Construction domain** | Daily Logs, RFIs, Punchlist, Issues, Inspections |
| 📝 **Capture offline** | Forms always available; nothing depends on the network |
| 💾 **Local persistence** | AsyncStorage, written before a capture is considered saved |
| 🔁 **Four sync states** | `pending`, `syncing`, `synced`, `error`, shown on every card |
| 📡 **Network detection** | `@react-native-community/netinfo` |
| 🔄 **Retry on reconnect** | Queue flushes automatically when the device comes back online |
| ⏱ **Back-off** | Failed uploads retry after 2s, 4s… then move to `error` |
| ✋ **Manual retry** | Retry button on `error` items, plus **Sync now** |
| 🧪 **Demo switch** | "Simulate server errors" on the Sync tab to show failures on demand |
| 🎨 **High-contrast dark UI** | Readable outdoors on a jobsite |

---

## 🏗 Architecture

```
src/
├── types/index.ts                 — FieldCapture, SyncStatus, labels
├── services/
│   ├── SyncEngine.ts              — Offline queue: state, retries, back-off (no React)
│   ├── StorageService.ts          — AsyncStorage snapshots, writes run in order
│   └── SyncService.ts             — Upload transport (mock; real fetch shown in comments)
├── hooks/useSync.ts               — Wires SyncEngine to React + NetInfo
├── context/SyncContext.tsx        — One shared engine for every screen
├── navigation/                    — Tabs (Captures, Sync) + stack (Detail, New)
├── screens/                       — Home, Sync queue, Capture detail, New capture
└── components/                    — SyncBadge, CaptureCard, CaptureForm, NetworkBanner
__tests__/SyncEngine.test.ts       — Unit tests for the sync rules
```

All sync behaviour lives in **`SyncEngine`**, a plain TypeScript class. React only renders its state (via `useSyncExternalStore`). That keeps the risky logic in one place and lets it be tested without a device.

---

## 🔄 Sync State Machine

```
              [User saves capture]
                       │  persisted to device first
                       ▼
                 ┌───────────┐
      ┌─────────►│  PENDING  │◄──────────────┐
      │          └─────┬─────┘               │
      │                │ online              │ failed, attempts left
      │                ▼                     │ (retry after 2s, 4s, …)
      │          ┌───────────┐               │
      │          │  SYNCING  │───────────────┘
      │          └─────┬─────┘
      │        ┌───────┴────────┐
      │        ▼                ▼
      │   ┌─────────┐     ┌──────────┐
      │   │ SYNCED  │     │  ERROR   │  3 failed attempts, or a non-retryable error
      │   └─────────┘     └────┬─────┘
      │                        │
      └────────────────────────┘
        manual Retry / Sync now / reconnect
```

**Rules**
- A capture is written to storage **before** it counts as saved; new captures start `pending`.
- Only **one sync run** happens at a time. Requests during a run queue one more pass, so nothing uploads twice.
- Uploads go **one at a time, oldest first**.
- A failure while the device is **offline** doesn't use up an attempt (the signal dropped; the server didn't fail).
- **Reconnecting** retries everything immediately, including `error` items.
- If the app is killed mid-upload, items left in `syncing` go back to `pending` on next launch.

---

## 🧭 Decisions & tradeoffs

| Decision | Why | In production I'd… |
|---|---|---|
| **AsyncStorage**, one JSON snapshot | Fewest moving parts for a prototype; writes are queued so a slower write can never overwrite a newer one | Move to SQLite (e.g. op-sqlite) with a row per capture once volumes grow or photos/attachments arrive |
| **Engine as a plain class**, not Redux/Zustand | Sync is a state machine with timers, not UI state; a class is easy to unit-test with fake timers | Keep it, and add background sync (BackgroundFetch / WorkManager) |
| **Sequential uploads** | Predictable order, gentle on weak connections, simple to reason about | Small concurrency limit (2–3) for large queues |
| **Idempotency key = capture id** | A retry after a lost response can't create a duplicate on the server | Server must honour `Idempotency-Key` |
| **Exponential back-off with jitter** | Avoids hammering a struggling server; jitter stops many devices retrying at once | Tune from real error data; respect `Retry-After` |
| **Last write wins, no editing after save** | Out of scope for the brief | Version field + server-side conflict resolution |

---

## 🚀 Getting Started

### Prerequisites
- Node ≥ 22.11, Ruby ≥ 3 (iOS), JDK 17+ (Android)
- Xcode 16+ (iOS) or Android Studio (Android)

### Install & Run

```bash
npm install

# iOS
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios

# Android
npm run android
```

### Tests

```bash
npm test
```

---

## 🧪 Demonstrating Offline Behaviour

1. **Go offline**: Airplane Mode on a device, or turn off the Mac's Wi-Fi when using the iOS Simulator. A red banner appears.
2. **Capture**: tap **+**, fill in a Daily Log or RFI, save → card shows **Pending**.
3. **Persistence**: kill and relaunch the app → captures are still there.
4. **Reconnect**: turn the network back on → cards go **Syncing → Synced** automatically.
5. **Errors**: on the **Sync** tab, turn on **Simulate server errors** and add a capture → it retries with back-off ("1 failed · retrying") and then shows **Error**.
6. **Retry**: turn the switch off and tap **↺ Retry** (or **Sync now**) → **Synced**.

---

## 🔌 Plugging in a Real API

Replace the body of `SyncService.uploadCapture()` in [`src/services/SyncService.ts`](./src/services/SyncService.ts) with the `fetch` call shown in the comments there. Throw `new SyncError(message, false)` for responses that shouldn't be retried (e.g. 4xx validation errors).

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `@react-native-async-storage/async-storage` | Local persistence |
| `@react-native-community/netinfo` | Network state detection |
| `@react-navigation/*` | Tabs + stack navigation |
| `uuid` + `react-native-get-random-values` | Unique capture ids (also the idempotency key) |
