import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secure Trade · End-to-end encrypted B2B marketplace",
  description:
    "Cross-border B2B catalog with end-to-end encrypted checkout, RLS-backed orders, and Zod-validated APIs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
