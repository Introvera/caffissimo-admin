import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ReduxProvider } from "@/components/providers/redux-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caffissimo Admin",
  description: "Multi-branch coffee shop admin panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.className} ${jakarta.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
              storageKey="caffissimo-theme"
              themes={["light", "dark"]}
            >
              {children}
              <Toaster
                position="top-right"
                expand={true}
                visibleToasts={6}
                toastOptions={{
                  style: {
                    borderRadius: "12px",
                    fontFamily: "var(--font-jakarta), sans-serif",
                  },
                  classNames: {
                    toast: "group w-full max-w-[380px] p-4 rounded-xl border flex gap-3 text-body shadow-lg transition-all duration-300 pointer-events-auto " +
                           "bg-white border-zinc-200 text-zinc-900 " +
                           "dark:bg-[#1c1c1f] dark:border-zinc-800 dark:text-zinc-50",
                    title: "font-semibold text-body leading-tight text-zinc-950 dark:text-zinc-50",
                    description: "text-caption text-zinc-500 dark:text-zinc-400 mt-1 leading-snug",
                    closeButton: "absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors border-none bg-transparent cursor-pointer p-0",
                    actionButton: "text-caption font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors bg-transparent border-none",
                  }
                }}
              />
            </ThemeProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
