import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import TopBar from "@/components/TopBar";
import BackgroundManager from "./BackgroundManager";

export const metadata: Metadata = {
  title: "FootyClash",
  description:
    "A standalone versus-style footy draft game with solo, local, AI, and online modes.",
  icons: {
    icon: "/favicon.ico",
  },
  other: {
    "google-adsense-account": "ca-pub-XXXXXXXXXXXXXXXX",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body className="text-white">
        <BackgroundManager />
        <TopBar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}