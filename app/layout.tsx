import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeFlow — Natural Language Automation",
  description:
    "Describe your task. VibeFlow writes and runs Python scripts to handle it. No code, no wires.",
  keywords: ["automation", "AI agents", "LangGraph", "Python sandbox", "production workflows"],
  openGraph: {
    title: "VibeFlow",
    description: "The natural language interface for your digital life.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
