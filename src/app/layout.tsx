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
  weight: ["400", "500", "600", "700", "800"],
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
        className={`${jakarta.variable} ${geistMono.variable} antialiased`}
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
              <Toaster position="top-right" richColors closeButton />
            </ThemeProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
