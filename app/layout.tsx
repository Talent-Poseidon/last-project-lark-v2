import React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MantineAppProvider } from "@/components/providers/mantine-provider";
import { ColorSchemeScript } from "@mantine/core";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Next.js Fullstack Boilerplate",
  description:
    "Next.js + Supabase + Mantine fullstack boilerplate with auth, Google OAuth, admin approval, and dashboard.",
};

export const viewport: Viewport = {
  themeColor: "#1f5efe",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className="font-sans antialiased">
        <MantineAppProvider>{children}</MantineAppProvider>
      </body>
    </html>
  );
}
