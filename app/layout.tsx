import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RefTracker } from "@/components/RefTracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
  fallback: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Eyethu Property Group — Affordable homes in the Western Cape",
    template: "%s | Eyethu Property Group",
  },
  description:
    "Find your first home in the Western Cape with Eyethu Property Group — affordable houses, townhouses and apartments, including secure gated communities across Cape Town.",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: "Eyethu Property Group",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Suspense fallback={null}>
          <RefTracker />
        </Suspense>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
