# Wheewise Mobile (Capacitor shell)

A thin iOS + Android shell that wraps the deployed Wheewise web app. The
shell ships **no bundled JS/HTML** — it loads `https://wheewise.in` (or your
override) over HTTPS into a native WebView. This keeps the native binary
tiny and means every web deploy reaches mobile users immediately, without a
TestFlight / Play Store release cycle.

The trade-off: **the app does not work offline.** That's fine for an MVP
(every flow needs the backend anyway), but is the first thing to revisit if
offline browsing becomes a requirement.

## First-time setup

```bash
cd mobile

# 1. Install Capacitor deps (uses workspace root or a fresh install)
npm install

# 2. Add native projects (only needs to run once; commits ios/ and android/)
#    On macOS you need Xcode + CocoaPods (`brew install cocoapods`).
#    Android: install Android Studio, then accept SDK licences.
npm run add:ios
npm run add:android

# 3. Open in IDE
npm run open:ios       # opens Xcode
npm run open:android   # opens Android Studio
```

## Pointing at a deployed environment

```bash
# Production
WHEEWISE_MOBILE_URL=https://wheewise.in npx cap sync

# Local dev (default — assumes the Next dev server is on :3017)
npx cap sync
```

The URL is baked into the native bundle at sync time. To change it later,
re-sync and rebuild the iOS/Android project.

## Replacing splash + icon assets

1. Drop a 1024×1024 PNG named `icon.png` into `mobile/resources/`.
2. Drop a 2732×2732 PNG named `splash.png` (centred logo on solid bg).
3. Run `npx @capacitor/assets generate --iconBackgroundColor "#0a0a0a"
   --splashBackgroundColor "#0a0a0a"` to fan out into platform-specific
   sizes (the tool is dev-only; install with `npm i -D @capacitor/assets`).

## Building for stores

Out of scope of this scaffolding. You'll need:

- **iOS:** Apple Developer Program ($99/yr), App Store Connect listing,
  provisioning profile, signed `.ipa` via Xcode → Archive.
- **Android:** Google Play developer account ($25 one-time), signed AAB via
  Android Studio → Build → Generate Signed Bundle.

## Known limitations vs a true native app

| Concern | Status |
|---|---|
| Push notifications | Not wired. `@capacitor/push-notifications` is intentionally not yet a dep — needs FCM/APNs backend before it does anything useful. |
| Deep linking (`/vehicle/[id]` from a shared link opens in-app) | Plugin available (`@capacitor/app`) but not wired. Add when launch demands it. |
| Offline support | None. The shell shows the WebView's own offline page. Add a service worker on the web side if needed. |
| Biometric auth | Add `@capacitor/biometric-auth` when dealer login frequency justifies it. |
| App store metadata, screenshots, signing | Manual; see "Building for stores" above. |
| In-app purchases | Out of scope; Razorpay handles all payments via WebView. |
