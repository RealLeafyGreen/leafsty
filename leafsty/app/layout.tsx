import type { Metadata } from "next";
import "./globals.css";
import { DiscordContextProvider } from "../types/DiscordContext";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Leafsty",
  description: "End-to-End Encrypted Chat",
  icons: {
    icon: "/favicon.ico?v=2",
    shortcut: "/favicon.ico?v=2",
  },
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
       <Script id="leafsty-theme-init" strategy="beforeInteractive">
  {`try{if(localStorage.getItem('leafsty_theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}`}
</Script> 
      </head>
      <body>{children}</body>
    </html>
  );
}

