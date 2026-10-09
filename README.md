# ⚡ Sledge Field Capture

> **Offline-first React Native + TypeScript prototype** for the Sledge Mobile & Multi-Platform Engineer take-home task.

A field-capture app that works 100% offline, persists data locally, displays all four sync states, and automatically retries on reconnect. Designed specifically for the construction domain (gloves on, spotty signal, real-world conditions).

---

## ✨ Features

| Feature | Implementation |
|---|---|
| 🏗 **Domain-Specific** | Daily Logs, RFIs, Punchlist, Issues, Inspections |
| 📝 **Field capture offline** | Forms available at all times; data stored instantly |
| 💾 **Local persistence** | `@react-native-async-storage/async-storage` |
| 🔁 **Sync states** | `pending → syncing → synced / error` with animated badges |
| 📡 **Network detection** | `@react-native-community/netinfo` listener |
| 🔄 **Auto-retry on reconnect** | Queue flushed automatically when online |
| ✋ **Manual retry** | Per-item retry button for `error` state items |
| 🎨 **Dark-mode UI** | Optimized for jobsite visibility (high contrast) |

---

## 🏗 Architecture

```
src/
├── types/          index.ts           — FieldCapture, SyncStatus, AppState
├── services/
│   ├── StorageService.ts              — AsyncStorage CRUD wrapper
│   └── SyncService.ts                 — Upload (swap for real API)
├── hooks/
│   └── useSync.ts                     — Core sync logic + NetInfo listener
├── components/
│   ├── SyncBadge.tsx                  — Animated status badge
│   ├── CaptureCard.tsx                — Spring-animated list item
│   ├── CaptureForm.tsx                — Domain-specific bottom sheet form
│   └── NetworkBanner.tsx              — Slide-in connectivity banner
└── screens/
    └── HomeScreen.tsx                 — Main screen tying it all together
```

---

## 🔄 Sync State Machine

```
          [User saves form]
                │
                ▼
           ┌─────────┐
           │ PENDING │ ◄────────────── (offline or queue waiting)
           └────┬────┘
                │  (network available)
                ▼
           ┌─────────┐
           │ SYNCING │
           └────┬────┘
          ┌─────┴──────┐
          ▼            ▼
      ┌────────┐  ┌────────┐
      │ SYNCED │  │  ERROR │ ──► (manual retry or auto-retry on reconnect)
      └────────┘  └────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node ≥ 18, Ruby ≥ 3 (iOS), JDK 17+ (Android)
- Xcode 15+ (iOS) or Android Studio (Android)

### Install & Run

```bash
# Clone
git clone <repo-url>
cd SledgeFieldCapture

# Install JS dependencies
npm install

# iOS (first time)
cd ios && bundle exec pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

---

## 🧪 Demonstrating Offline Behaviour

1. **Go offline**: Toggle Airplane Mode or use the iOS Simulator's Network Link Conditioner.
2. **Capture data**: Tap **+**, fill in the form (e.g., a Daily Log or RFI), save → status shows **Pending**.
3. **Back online**: Disable Airplane Mode → the app auto-detects reconnection and begins syncing → status transitions `Pending → Syncing → Synced` (or `Error` ~20% of the time to demonstrate failure handling).
4. **Retry**: Tap **↺ Retry** on any `Error` card to queue it again.
5. **Manual sync**: Tap **Sync now** in the stats bar when online with pending items.

---

## 🔌 Plugging in a Real API

Replace the body of `SyncService.uploadCapture()` in [`src/services/SyncService.ts`](./src/services/SyncService.ts):

```ts
await fetch('https://api.getsledge.com/captures', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(capture),
});
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `@react-native-async-storage/async-storage` | Offline-first local storage |
| `@react-native-community/netinfo` | Network state detection |
| `uuid` + `react-native-get-random-values` | RFC-compliant unique IDs |

---

*Built for the Sledge Mobile & Multi-Platform Engineer take-home challenge.*
