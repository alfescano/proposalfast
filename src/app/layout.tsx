import type { Metadata, Viewport } from "next";
import { Geist, Newsreader } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/providers";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-heading",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "proposal software",
    "client proposals",
    "e-signature",
    "proposal tracking",
    "agency proposals",
  ],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "black",
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    // Next emits the standard mobile-web-app-capable tag. Safari still
    // reads the Apple-prefixed one for Home Screen standalone mode.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${newsreader.variable} antialiased`}>
        <Script id="pwa-install-capture" strategy="beforeInteractive">
          {`(function () {
  var hidden = ["/admin", "/forgot-password", "/invite", "/login", "/register", "/reset-password", "/verify-email"];
  function blocked(path) {
    if (path === "/p" || path.indexOf("/p/") === 0) return true;
    for (var i = 0; i < hidden.length; i++) {
      if (path === hidden[i] || path.indexOf(hidden[i] + "/") === 0) return true;
    }
    return false;
  }
  window.addEventListener("beforeinstallprompt", function (event) {
    try {
      if (localStorage.getItem("pf_pwa_install_dismissed")) return;
    } catch (err) {}
    if (!window.matchMedia("(max-width: 767px)").matches || blocked(location.pathname)) return;
    event.preventDefault();
    window.__pfInstallPrompt = event;
  });
})();`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
