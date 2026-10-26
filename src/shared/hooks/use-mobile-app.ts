"use client";

import { useSyncExternalStore } from "react";

const MOBILE_APP_MEDIA_QUERY = "(max-width: 767px), (display-mode: standalone)";

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_APP_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSnapshot(): boolean | null {
  return window.matchMedia(MOBILE_APP_MEDIA_QUERY).matches;
}

function getServerSnapshot(): boolean | null {
  return null;
}

export function useMobileApp() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
