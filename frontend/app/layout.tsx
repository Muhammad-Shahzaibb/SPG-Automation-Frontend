"use client";

import { ThemeProvider } from "@/components/common/theme-provider";
import { QueryProvider } from "@/hooks/use-query-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/components/common/toast-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_NAME, COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/constants";
import "../styles/globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{`${APP_NAME} | ${COMPANY_NAME}`}</title>
        <meta name="description" content={`${COMPANY_TAGLINE} — ${COMPANY_NAME}`} />
        <link rel="icon" href="/muntq-logo-black.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider>
                {children}
                <ToastProvider />
              </TooltipProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
