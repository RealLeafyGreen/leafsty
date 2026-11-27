import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import LeafstyContextMenu from "../components/LeafstyContextMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

<Script
  src="https://unpkg.com"
  crossOrigin="anonymous"
  strategy="lazyOnload"
/>

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leafsty — End-to-End Encrypted Chat",
  description: "Private, encrypted spaces, direct messages, and calls.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#071410] text-emerald-50`}
      >
        {children}
         <LeafstyContextMenu />
        <Script
          src="https://unpkg.com"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
