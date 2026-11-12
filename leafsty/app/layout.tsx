import type { Metadata } from "next";
import "./globals.css";
import { DiscordContextProvider } from "../types/DiscordContext";

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
    <html lang="en">
      <body>
        <DiscordContextProvider>{children}</DiscordContextProvider>
      </body>
    </html>
  );
}
