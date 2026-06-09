import type { CapacitorConfig } from "@capacitor/cli";

// Default to the local dev server so `npx cap run ios` Just Works on a dev
// machine where `npm run dev` is up on port 3017. For staging/prod builds,
// override with WHEEWISE_MOBILE_URL=https://wheewise.in before `cap sync`.
const SERVER_URL = process.env.WHEEWISE_MOBILE_URL ?? "http://localhost:3017";

const config: CapacitorConfig = {
  appId: "in.wheewise.app",
  appName: "Wheewise",
  // No bundled web assets — the shell loads the deployed Next.js app over HTTPS.
  // This keeps the native binary tiny (<5MB) and gets new features to users
  // as soon as the web app deploys, without a TestFlight / Play Store release.
  webDir: "www",
  server: {
    url: SERVER_URL,
    // cleartext only matters in dev (localhost over HTTP). Production uses https.
    cleartext: SERVER_URL.startsWith("http://"),
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0a0a0a",
  },
  android: {
    backgroundColor: "#0a0a0a",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0a0a0a",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0a",
    },
  },
};

export default config;
