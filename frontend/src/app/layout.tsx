import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "focusn't",
  description: "Focus sessions that build your galaxy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
