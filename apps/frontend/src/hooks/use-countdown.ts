"use client";

import { useEffect, useMemo, useState } from "react";

type CountdownState = {
  isReady: boolean;
  totalSeconds: number;
  shortLabel: string;
  longLabel: string;
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatShortLabel(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function formatLongLabel(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} day${days === 1 ? "" : "s"}`);
  }

  if (hours > 0 || days > 0) {
    parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  }

  if (minutes > 0 || hours > 0 || days > 0) {
    parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  }

  parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);

  return parts.join(", ");
}

function getRemainingSeconds(target: string | null | undefined) {
  if (!target) {
    return 0;
  }

  const targetTime = new Date(target).getTime();
  if (Number.isNaN(targetTime)) {
    return 0;
  }

  return Math.max(Math.ceil((targetTime - Date.now()) / 1000), 0);
}

export function useCountdown(target: string | null | undefined): CountdownState {
  const [mounted, setMounted] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const update = () => {
      setTotalSeconds(getRemainingSeconds(target));
    };

    update();

    if (!target) {
      return;
    }

    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [mounted, target]);

  return useMemo(() => {
    if (!mounted) {
      return {
        isReady: false,
        totalSeconds: 0,
        shortLabel: "",
        longLabel: ""
      };
    }

    if (!target || totalSeconds <= 0) {
      return {
        isReady: true,
        totalSeconds: 0,
        shortLabel: "Ready now",
        longLabel: "Ready now"
      };
    }

    return {
      isReady: false,
      totalSeconds,
      shortLabel: formatShortLabel(totalSeconds),
      longLabel: formatLongLabel(totalSeconds)
    };
  }, [mounted, target, totalSeconds]);
}
