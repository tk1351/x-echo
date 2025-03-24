import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "./layout";

// Mock CSS imports
vi.mock("./globals.css", () => ({}));

// Mock the ThemeProvider component
vi.mock("@/components/theme/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock the next/font/google module
vi.mock("next/font/google", () => ({
  Geist: () => ({
    variable: "mock-font-geist-sans",
  }),
  Geist_Mono: () => ({
    variable: "mock-font-geist-mono",
  }),
}));

describe("RootLayout", () => {
  it("renders header, main, and footer elements", () => {
    render(<RootLayout>Test Content</RootLayout>);

    // Verify header exists
    expect(screen.getByRole("banner")).toBeInTheDocument();

    // Verify main content exists and contains children
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveTextContent("Test Content");

    // Verify footer exists
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("includes skip to content link for accessibility", () => {
    render(<RootLayout>Test Content</RootLayout>);

    const skipLink = screen.getByRole("link", { name: /skip to content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });
});
