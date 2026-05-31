import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FocusForest — Grow your focus",
  description: "Social focus rooms with AI-powered attention monitoring",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
