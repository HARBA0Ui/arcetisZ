"use client";

import { useEffect, useRef, useState } from "react";

type SmoothBusyOptions = {
  delayMs?: number;
  minVisibleMs?: number;
};

export function useSmoothBusy(
  isBusy: boolean,
  { delayMs = 180, minVisibleMs = 260 }: SmoothBusyOptions = {}
) {
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof globalThis.setTimeout> | undefined;

    if (isBusy) {
      if (visible) {
        return;
      }

      timeout = globalThis.setTimeout(() => {
        shownAtRef.current = Date.now();
        setVisible(true);
      }, delayMs);

      return () => {
        if (timeout) {
          globalThis.clearTimeout(timeout);
        }
      };
    }

    if (!visible) {
      return;
    }

    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : minVisibleMs;
    const remaining = Math.max(0, minVisibleMs - elapsed);

    timeout = globalThis.setTimeout(() => {
      shownAtRef.current = null;
      setVisible(false);
    }, remaining);

    return () => {
      if (timeout) {
        globalThis.clearTimeout(timeout);
      }
    };
  }, [delayMs, isBusy, minVisibleMs, visible]);

  return visible;
}
