import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Private Chat",
  description: "Private E2EE Messaging Platform",
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
