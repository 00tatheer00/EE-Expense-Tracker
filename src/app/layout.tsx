import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "EE Expense Tracker", template: "%s · EE Expense Tracker" },
  description: "Expense management for Emerging Edge, EEST and STYLONE.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0B1A3A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
