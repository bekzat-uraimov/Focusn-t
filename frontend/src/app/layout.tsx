import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FocusDuck — Focus Together. Grow Your Flock.",
  description: "AI-powered focus sessions with friends. Your duck evolves as you study.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
