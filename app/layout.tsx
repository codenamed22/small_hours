import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Small Hours - Coffee Shop Simulator",
  description: "A cozy café management game where customers have stories and craft matters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
