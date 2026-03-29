"use client";

import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastContextValue = {
  push: (input: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toastStyle(type: ToastType) {
  if (type === "success") {
    return "border-emerald-400/40 bg-emerald-500/16";
  }

  if (type === "error") {
    return "border-red-400/40 bg-red-500/16";
  }

  return "border-zinc-300/40 bg-zinc-500/16";
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [viewport, setViewport] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setViewport(document.body);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (input: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, ...input }]);

      window.setTimeout(() => {
        remove(id);
      }, 4200);
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, description) => push({ type: "success", title, description }),
      error: (title, description) => push({ type: "error", title, description }),
      info: (title, description) => push({ type: "info", title, description })
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {viewport
        ? createPortal(
            <div className="pointer-events-none fixed right-4 top-4 z-[2147483647] flex w-[92vw] max-w-sm flex-col gap-2 sm:w-full">
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  className={cn(
                    "pointer-events-auto rounded-lg border bg-card/68 p-3 text-sm shadow-arcetis backdrop-blur-md supports-[backdrop-filter]:bg-card/52 transition-all duration-300",
                    toastStyle(toast.type)
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{toast.title}</p>
                      {toast.description ? (
                        <p className="mt-1 text-xs text-foreground/82">{toast.description}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground hover:bg-accent"
                      onClick={() => remove(toast.id)}
                      aria-label="Close notification"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>,
            viewport
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
