"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
  PWA_DISMISS_KEY,
  isInstallHintPath,
  isMarketingPath,
} from "@/lib/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __pfInstallPrompt?: BeforeInstallPromptEvent;
  }
}

const SHOW_DELAY_MS = 2500;

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function isDismissed(): boolean {
  return Boolean(readStorage(PWA_DISMISS_KEY));
}

function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isMobile(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const otherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && webkit && !otherIosBrowser;
}

export function InstallPrompt() {
  const pathname = usePathname() || "/";
  const [mode, setMode] = useState<"native" | "ios" | null>(null);
  const promptEvent = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!isInstallHintPath(pathname) || isDismissed() || isStandalone() || !isMobile()) {
      return;
    }

    let cancelled = false;
    let timer = 0;
    let pendingNative = false;
    const allowed = { current: !(isMarketingPath(pathname) && !readStorage(COOKIE_CONSENT_KEY)) };

    const reveal = (next: "native" | "ios") => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!cancelled && allowed.current && !isDismissed()) setMode(next);
      }, SHOW_DELAY_MS);
    };

    const onPrompt = (event: Event) => {
      if (!isMobile() || isDismissed()) return;
      event.preventDefault();
      promptEvent.current = event as BeforeInstallPromptEvent;
      pendingNative = true;
      if (allowed.current) reveal("native");
    };

    const captured = window.__pfInstallPrompt;
    if (captured) {
      promptEvent.current = captured;
      pendingNative = true;
      if (allowed.current) reveal("native");
    }

    window.addEventListener("beforeinstallprompt", onPrompt);

    const onConsent = () => {
      allowed.current = true;
      if (pendingNative || window.__pfInstallPrompt) {
        if (window.__pfInstallPrompt) promptEvent.current = window.__pfInstallPrompt;
        reveal("native");
        return;
      }
      if (isIosSafari()) reveal("ios");
    };

    const onInstalled = () => {
      if (!cancelled) setMode(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    if (allowed.current) {
      if (!pendingNative && isIosSafari()) reveal("ios");
    } else {
      window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [pathname]);

  function dismiss() {
    try {
      window.localStorage.setItem(PWA_DISMISS_KEY, "1");
    } catch {
      /* ignore quota */
    }
    setMode(null);
  }

  async function install() {
    const event = promptEvent.current;
    if (!event) return;
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      /* The browser may reject a second prompt; hide either way. */
    }
    dismiss();
  }

  if (!mode || !isInstallHintPath(pathname)) return null;

  const ios = mode === "ios";

  return (
    <div
      className="fixed inset-x-3 z-40 mx-auto flex max-w-md items-start gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur md:hidden"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-label={`Install ${siteConfig.name}`}
    >
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {ios ? "Add to Home Screen" : `Install ${siteConfig.name}`}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {ios
            ? "In Safari, tap Share, then Add to Home Screen."
            : "Get the full-screen app from your home screen."}
        </p>
        <div className="mt-2 flex gap-2">
          {ios ? (
            <Button type="button" variant="outline" size="sm" onClick={dismiss}>
              Not now
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={install}>
              Install
            </Button>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Dismiss install hint"
        onClick={dismiss}
      >
        <X />
      </Button>
    </div>
  );
}
