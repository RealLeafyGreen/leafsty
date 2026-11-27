import type { Metadata } from "next";
import "./globals.css";
import LeafstyContextMenu from "../components/LeafstyContextMenu";
import LeafstyOfflineManager from "../components/LeafstyOfflineManager";

export const metadata: Metadata = {
  title: "Leafsty",
  description: "End-to-End Encrypted Workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LeafstyContextMenu />
        <LeafstyOfflineManager />
        {children}
      </body>
    </html>
  );
}
