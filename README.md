# ⚡ Sledge Field Capture

> **Offline-first React Native + TypeScript prototype** for the Sledge Mobile Engineer take-home task.

A field-capture app for the jobsite: record Daily Logs, RFIs, Punchlist items, Issues and Inspections with no signal. Attach photos and videos from the camera or library. Every capture and its media is saved on the device immediately, shows its sync state (`pending → syncing → synced / error`), and uploads automatically when the connection comes back.

---

## ✨ Features

| Feature | Implementation |
|---|---|
| 🏗 **Construction domain** | Daily Logs, RFIs, Punchlist, Issues, Inspections |
| 📝 **Capture offline** | Forms always available; nothing depends on the network |
| 📷 **Photos & videos** | Camera or library (up to 10 per capture, videos ≤ 60s), copied into app storage |
| ⬆️ **Media upload** | Files upload before the record, with a progress bar; finished files aren't re-sent on retry |
| 💾 **Local persistence** | AsyncStorage, written before a capture is considered saved |
| 🔁 **Four sync states** | `pending`, `syncing`, `synced`, `error`, shown on every card |
| 📡 **Network detection** | `@react-native-community/netinfo` |
| 🔄 **Retry on reconnect** | Queue flushes automatically when the device comes back online |
| ⏱ **Back-off** | Failed uploads retry after 2s, 4s… then move to `error` |
| ✋ **Manual retry** | Retry button on `error` items, plus **Sync now** |
| ✏️ **Edit anytime** | Edit a capture in any state — pending, syncing, failed or synced — and the change syncs |
| 🧪 **Demo switch** | "Simulate server errors" on the Sync tab to show failures on demand |
| 🎨 **Design system** | Token-based dark theme, Lucide icons, 48pt+ touch targets for gloved hands |
| 📱 **Responsive** | Phone, phone landscape, iPad / Android tablets, split view: 1–3 column grid, side rail on wide windows, centred reading width for forms and details |

---

## 🏗 Architecture

```
src/
├── types/index.ts                 — FieldCapture, SyncStatus, labels
├── services/
│   ├── SyncEngine.ts              — Offline queue: state, retries, back-off (no React)
│   ├── StorageService.ts          — AsyncStorage snapshots, writes run in order
│   ├── MediaService.ts            — Camera / library picking, copies files into Documents
│   └── SyncService.ts             — Upload transport (mock; real fetch shown in comments)
├── hooks/useSync.ts               — Wires SyncEngine to React + NetInfo
├── theme/                         — Design tokens + responsive layout (size classes)
├── context/SyncContext.tsx        — One shared engine for every screen
├── navigation/                    — Tabs (Captures, Sync) + stack (Detail, New)
├── screens/                       — Home, Sync queue, Capture detail, New capture
└── components/                    — SyncBadge, CaptureCard, CaptureForm, AttachmentThumb, NetworkBanner
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
- A capture's **photos/videos upload first**, then the record (which references their URLs). Each finished file is saved with its remote URL, so a retry **resumes** instead of re-uploading a 50 MB video.
- A failure while the device is **offline** doesn't use up an attempt (the signal dropped; the server didn't fail).
- **Reconnecting** retries everything immediately, including `error` items.
- If the app is killed mid-upload, items left in `syncing` go back to `pending` on next launch.
- **Edits work in every state.** Each edit bumps a local `version`; a capture needs syncing while `version > syncedVersion`. A synced or failed capture goes back to `pending` (with fresh attempts). If it's edited **mid-upload**, that upload finishes and the capture is re-queued, so the newer version is sent next — no edit is ever lost.

---

## 🧭 Decisions & tradeoffs

| Decision | Why | In production I'd… |
|---|---|---|
| **AsyncStorage**, one JSON snapshot | Fewest moving parts for a prototype; writes are queued so a slower write can never overwrite a newer one | Move to SQLite (e.g. op-sqlite) with a row per capture once volumes grow or photos/attachments arrive |
| **Media copied into `Documents/attachments`** | The picker returns files in temp/cache folders the OS can purge — unacceptable for something that might wait days to sync | Same, plus compress videos before upload and clean up files after a successful sync if the server is the source of truth |
| **Store file *names*, not absolute paths** | On iOS the app container path changes on reinstall/update; the path is rebuilt at runtime | Same |
| **Resume at file granularity** | Simple and covers the common case (many photos, one fails) | Chunked/resumable uploads (tus or S3 multipart) for long videos on weak signal |
| **Engine as a plain class**, not Redux/Zustand | Sync is a state machine with timers, not UI state; a class is easy to unit-test with fake timers | Keep it, and add background sync (BackgroundFetch / WorkManager) |
| **Sequential uploads** | Predictable order, gentle on weak connections, simple to reason about | Small concurrency limit (2–3) for large queues |
| **Idempotency key = capture id** | A retry after a lost response can't create a duplicate on the server | Server must honour `Idempotency-Key` |
| **Exponential back-off with jitter** | Avoids hammering a struggling server; jitter stops many devices retrying at once | Tune from real error data; respect `Retry-After` |
| **Edits tracked with `version` / `syncedVersion`** | One rule covers every state, including editing during an upload | Upload as `PUT /captures/{id}` (create and update are the same call); send `If-Match` with the server's version and surface a "changed on server" state on conflict |
| **Last write wins** | Fine while one person owns a capture | Field-level merge, or prompt when an RFI was answered in the office meanwhile |

---

## 🔭 Next steps

- **Apple Watch companion.** React Native doesn't run on watchOS, so this would be a small SwiftUI watch app talking to the phone over WatchConnectivity (bridged with `react-native-watch-connectivity`). Scope: a complication showing unsynced captures ("3 waiting"), quick voice-note captures via dictation that queue on the watch and hand off to the phone as `pending`, and an alert when a capture fails to sync.

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

### Running on a physical iPhone
Open `ios/SledgeFieldCapture.xcworkspace`, pick your own team under **Signing & Capabilities** (and change the bundle id if needed), then `npm run ios -- --device`. The Simulator has no camera — use **🖼️ Library** there.

### Tests

```bash
npm test
```

---

## 🧪 Demonstrating Offline Behaviour

1. **Go offline**: Airplane Mode on a device, or turn off the Mac's Wi-Fi when using the iOS Simulator. A red banner appears.
2. **Capture**: tap **+**, fill in a Daily Log or RFI, add a photo or video (📷 / 🎥 / 🖼️), save → card shows **Pending** with thumbnails.
3. **Persistence**: kill and relaunch the app → captures are still there.
4. **Reconnect**: turn the network back on → cards go **Syncing** (with an "Uploading media · 45%" bar) **→ Synced** automatically. Open a capture to view the photo or play the video; each file shows ☁️ Uploaded.
5. **Errors**: on the **Sync** tab, turn on **Simulate server errors** and add a capture → uploads fail part-way, retry with back-off ("1 failed · retrying") and then show **Error**.
6. **Retry**: turn the switch off and tap **↺ Retry** (or **Sync now**) → **Synced**.
7. **Edit**: open a synced capture, tap **Edit**, change something and save → it goes back to **Pending → Syncing → Synced**, and the card shows *Edited*.

---

## 🔌 Plugging in a Real API

Replace the mock bodies of `SyncService.uploadAttachment()` and `SyncService.uploadCapture()` in [`src/services/SyncService.ts`](./src/services/SyncService.ts) with the code in the comments there (a streamed multipart upload with progress, and a JSON `fetch`). Throw `new SyncError(message, false)` for responses that shouldn't be retried (e.g. 4xx validation errors).

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `@react-native-async-storage/async-storage` | Local persistence |
| `@react-native-community/netinfo` | Network state detection |
| `@react-navigation/*` | Tabs + stack navigation |
| `react-native-image-picker` | Camera + library for photos and videos |
| `@dr.pogodin/react-native-fs` | Copy media into app storage (and streamed uploads for a real API) |
| `react-native-video` | Video playback on the capture detail screen |
| `uuid` + `react-native-get-random-values` | Unique capture ids (also the idempotency key) |
