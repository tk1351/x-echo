import type { Theme } from "@/types/theme";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "./use-theme";

describe("useTheme", () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  // Mock document.documentElement
  const documentElementMock = {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
  };

  beforeEach(() => {
    // Setup mocks before each test
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(document, "documentElement", {
      value: documentElementMock,
    });

    // Clear mocks
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  it("should use system theme by default", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("system");
  });

  it("should load theme from localStorage if available", () => {
    // Setup localStorage to return 'dark'
    localStorageMock.getItem.mockReturnValueOnce("dark");

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
    expect(documentElementMock.classList.add).toHaveBeenCalledWith("dark");
  });

  it("should update theme and save to localStorage when setTheme is called", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme("light" as Theme);
    });

    expect(result.current.theme).toBe("light");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "light");
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith(
      "light",
      "dark",
    );
    expect(documentElementMock.classList.add).toHaveBeenCalledWith("light");
  });

  it("should apply system theme based on matchMedia when system theme is selected", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme("system" as Theme);
    });

    expect(result.current.theme).toBe("system");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "system");
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith(
      "light",
      "dark",
    );
    // matchMedia is mocked to return dark mode
    expect(documentElementMock.classList.add).toHaveBeenCalledWith("dark");
  });
});
