import { useTheme } from '@/hooks/use-theme';
import { Theme } from '@/types/theme';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useThemeContext } from './theme-provider';

// Mock useTheme hook
vi.mock('@/hooks/use-theme', () => ({
  useTheme: vi.fn(),
}));

describe('ThemeProvider', () => {
  // Mock document.documentElement
  const documentElementMock = {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
  };

  const mockUseTheme = useTheme as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup mocks
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(document, 'documentElement', { value: documentElementMock });

    // Reset mocks
    vi.clearAllMocks();

    // Default mock implementation for useTheme
    mockUseTheme.mockReturnValue({
      theme: 'light' as Theme,
      setTheme: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children components', () => {
    render(
      <ThemeProvider>
        <div data-testid="test-child">Test Child</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('test-child')).toBeDefined();
    expect(screen.getByText('Test Child')).toBeDefined();
  });

  it('should apply light theme classes to document.documentElement', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light' as Theme,
      setTheme: vi.fn(),
    });

    render(<ThemeProvider>Test</ThemeProvider>);

    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('light', 'dark');
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('light');
  });

  it('should apply dark theme classes to document.documentElement', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark' as Theme,
      setTheme: vi.fn(),
    });

    render(<ThemeProvider>Test</ThemeProvider>);

    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('light', 'dark');
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
  });

  it('should apply system theme based on matchMedia when system theme is selected', () => {
    mockUseTheme.mockReturnValue({
      theme: 'system' as Theme,
      setTheme: vi.fn(),
    });

    render(<ThemeProvider>Test</ThemeProvider>);

    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('light', 'dark');
    // matchMedia is mocked to return dark mode
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
  });
});

// Test component for useThemeContext
const TestComponent = () => {
  const { theme, setTheme } = useThemeContext();
  return (
    <div>
      <div data-testid="theme-value">{theme}</div>
      <button onClick={() => setTheme('dark' as Theme)}>Set Dark</button>
    </div>
  );
};

describe('useThemeContext', () => {
  const mockSetTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTheme as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light' as Theme,
      setTheme: mockSetTheme,
    });
  });

  it('should provide theme context to children', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('should throw error when used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // We need to wrap the render in expect to catch the error
    expect(() => {
      render(<TestComponent />);
    }).toThrowError();

    // Restore console.error
    console.error = originalConsoleError;
  });
});
