"use client";

import { useEffect, useRef, useState } from "react";

type DeferredSectionProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
  className?: string;
  rootMargin?: string;
};

export function DeferredSection({
  children,
  fallback,
  className,
  rootMargin = "320px 0px"
}: DeferredSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady || typeof window === "undefined") {
      return;
    }

    const node = containerRef.current;

    if (!node || !("IntersectionObserver" in window)) {
      setIsReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        setIsReady(true);
        observer.disconnect();
      },
      { rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [isReady, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {isReady ? children : fallback}
    </div>
  );
}
