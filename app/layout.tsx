import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteTrademark from "@/components/SiteTrademark";

export const metadata: Metadata = {
  title: "RAGGING? GAME OVER.",
  description: "An anti-ragging awareness quiz game for college orientation events.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#161235",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-game min-h-screen text-white overflow-x-hidden">
        {children}
        <SiteTrademark />
      </body>
    </html>
  );
}
