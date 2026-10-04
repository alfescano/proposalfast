import { config as loadEnv } from "dotenv";
import type { CapacitorConfig } from "@capacitor/cli";
import {
  CAPACITOR_APP_ID,
  CAPACITOR_APP_NAME,
  capacitorAllowNavigation,
  resolveCapacitorServerUrl,
} from "./native/server-url";

// `cap sync` does not load .env on its own. Next.js does, so a
// CAPACITOR_SERVER_URL entry in .env should apply here too.
loadEnv();

const serverUrl = resolveCapacitorServerUrl();

const config: CapacitorConfig = {
  appId: CAPACITOR_APP_ID,
  appName: CAPACITOR_APP_NAME,
  webDir: "native/www",
  backgroundColor: "#f6f1e8",
  zoomEnabled: false,
  appendUserAgent: "ProposalFastShell",
  android: {
    allowMixedContent: false,
    backgroundColor: "#f6f1e8",
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#f6f1e8",
    preferredContentMode: "mobile",
  },
  server: {
    url: serverUrl,
    androidScheme: "https",
    cleartext: false,
    allowNavigation: capacitorAllowNavigation(serverUrl),
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      launchFadeOutDuration: 200,
      backgroundColor: "#f6f1e8",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_INSIDE",
      showSpinner: false,
    },
    StatusBar: {
      // LIGHT = dark icons on the paper background. DARK would be light icons.
      style: "LIGHT",
      backgroundColor: "#f6f1e8",
      overlaysWebView: false,
    },
    SystemBars: {
      // Pad the WebView when the site does not set viewport-fit=cover.
      insetsHandling: "native",
      style: "LIGHT",
    },
  },
};

export default config;
