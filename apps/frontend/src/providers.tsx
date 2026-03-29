"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";
import { useState, type ComponentType, type PropsWithChildren } from "react";
import { ToastProvider } from "@/components/common/toast-center";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { NavigationProvider } from "@/components/navigation/navigation-provider";

const ThemeProvider = NextThemesProvider as ComponentType<PropsWithChildren<ThemeProviderProps>>;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnMount: false,
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000
          }
        }
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <NavigationProvider>
            <ToastProvider>{children}</ToastProvider>
          </NavigationProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
