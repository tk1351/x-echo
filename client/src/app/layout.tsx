import { ThemeProvider } from "@/components/theme/theme-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X-Echo",
  description: "A Twitter clone built with Next.js and Hono",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          {/* Skip link for accessibility */}
          <a href="#main-content" className="skip-to-content">
            Skip to content
          </a>

          {/* Header */}
          <header className="border-b border-color-border py-4">
            <div className="container mx-auto px-4">
              <h1 className="text-xl font-bold">X-Echo</h1>
            </div>
          </header>

          {/* Main content */}
          <main
            id="main-content"
            className="flex-grow container mx-auto px-4 py-6"
          >
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-color-border py-6">
            <div className="container mx-auto px-4">
              <p>
                &copy; {new Date().getFullYear()} X-Echo. All rights reserved.
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
