import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jamjar",
  description: "A shared grocery list and pantry tracker.",
  manifest: "/jamjar/manifest.webmanifest",
  icons: {
    icon: "/jamjar/favicon.svg",
    shortcut: "/jamjar/favicon.svg",
    apple: "/jamjar/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#17242d",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}<script type="module" src="/jamjar/firebase-client.js" /></body>
    </html>
  );
}
