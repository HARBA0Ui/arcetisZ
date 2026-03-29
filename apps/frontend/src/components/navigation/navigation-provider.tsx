"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/common/spinner";

type NavigationProgressContextValue = {
  isNavigating: boolean;
  startNavigation: (href?: string | null) => void;
  finishNavigation: () => void;
};

const NavigationProgressContext = createContext<NavigationProgressContextValue | null>(null);

function getClosestAnchor(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  const anchor = target.closest("a[href]");
  return anchor instanceof HTMLAnchorElement ? anchor : null;
}

function getInternalPath(href: string | null | undefined) {
  if (typeof window === "undefined" || !href) {
    return null;
  }

  try {
    const url = new URL(href, window.location.href);

    if (url.origin !== window.location.origin) {
      return null;
    }

    const nextPath = `${url.pathname}${url.search}`;
    const currentPath = `${window.location.pathname}${window.location.search}`;

    if (nextPath === currentPath) {
      return null;
    }

    return nextPath;
  } catch {
    return null;
  }
}

function getInternalAnchorPath(target: EventTarget | null) {
  const anchor = getClosestAnchor(target);

  if (!anchor || anchor.dataset.instantNavigation === "false") {
    return null;
  }

  if (anchor.target && anchor.target !== "_self") {
    return null;
  }

  if (anchor.hasAttribute("download")) {
    return null;
  }

  return getInternalPath(anchor.href);
}

function NavigationProgressOverlay({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[120]">
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-background/25">
        <div className="arcetis-navigation-bar h-full w-2/3 rounded-full bg-gradient-to-r from-orange-500 via-foreground to-orange-500" />
      </div>

      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-border/80 bg-background/88 px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur-xl">
        <Spinner className="h-3.5 w-3.5" />
        <span>Opening page...</span>
      </div>
    </div>
  );
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const prefetchedPathsRef = useRef(new Set<string>());

  const clearPendingTimeout = useCallback(() => {
    if (typeof window === "undefined" || timeoutRef.current === null) {
      return;
    }

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const finishNavigation = useCallback(() => {
    clearPendingTimeout();
    setIsNavigating(false);
  }, [clearPendingTimeout]);

  const startNavigation = useCallback(
    (href?: string | null) => {
      if (typeof window === "undefined") {
        return;
      }

      const nextPath = getInternalPath(href ?? null);

      if (href && !nextPath) {
        return;
      }

      clearPendingTimeout();
      setIsNavigating(true);

      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        setIsNavigating(false);
      }, 2200);
    },
    [clearPendingTimeout]
  );

  useEffect(() => {
    finishNavigation();
  }, [finishNavigation, pathname]);

  useEffect(() => {
    function prefetchTarget(target: EventTarget | null) {
      const nextPath = getInternalAnchorPath(target);

      if (!nextPath || prefetchedPathsRef.current.has(nextPath)) {
        return;
      }

      prefetchedPathsRef.current.add(nextPath);
      void router.prefetch(nextPath);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const nextPath = getInternalAnchorPath(event.target);

      if (!nextPath) {
        return;
      }

      startNavigation(nextPath);
    }

    function handlePointerOver(event: PointerEvent) {
      prefetchTarget(event.target);
    }

    function handleFocusIn(event: FocusEvent) {
      prefetchTarget(event.target);
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("pointerover", handlePointerOver, true);
    document.addEventListener("focusin", handleFocusIn, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("pointerover", handlePointerOver, true);
      document.removeEventListener("focusin", handleFocusIn, true);
    };
  }, [router, startNavigation]);

  useEffect(
    () => () => {
      clearPendingTimeout();
    },
    [clearPendingTimeout]
  );

  return (
    <NavigationProgressContext.Provider
      value={{
        isNavigating,
        startNavigation,
        finishNavigation
      }}
    >
      {children}
      <NavigationProgressOverlay visible={isNavigating} />
    </NavigationProgressContext.Provider>
  );
}

export function useNavigationProgress() {
  const context = useContext(NavigationProgressContext);

  if (!context) {
    throw new Error("useNavigationProgress must be used within NavigationProvider");
  }

  return context;
}
