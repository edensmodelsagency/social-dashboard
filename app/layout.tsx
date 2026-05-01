import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Analytics Dashboard",
  description: "Instagram & TikTok analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  );
}
