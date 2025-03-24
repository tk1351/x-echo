import { describe, it, expect, vi } from 'vitest';
import { setupFormTest } from '@/test/setup-form-test';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  it('renders login form with all required fields', () => {
    const { screen } = setupFormTest(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByRole('form', { name: /ログイン/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /ユーザー名またはメールアドレス/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    const mockSubmit = vi.fn();
    const { user, screen } = setupFormTest(<LoginForm onSubmit={mockSubmit} />);

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /ログイン/i }));

    // Check validation errors
    expect(screen.getByText(/ユーザー名またはメールアドレスは必須です/i)).toBeInTheDocument();
    expect(screen.getByText(/パスワードは必須です/i)).toBeInTheDocument();

    // Verify submit function was not called
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const mockSubmit = vi.fn();
    const { user, screen } = setupFormTest(<LoginForm onSubmit={mockSubmit} />);

    // Fill form fields
    await user.type(
      screen.getByRole('textbox', { name: /ユーザー名またはメールアドレス/i }),
      'testuser'
    );

    await user.type(
      screen.getByLabelText(/パスワード/i),
      'password123'
    );

    // Submit form
    await user.click(screen.getByRole('button', { name: /ログイン/i }));

    // Verify submit function was called with correct data
    expect(mockSubmit).toHaveBeenCalledWith({
      identifier: 'testuser',
      password: 'password123'
    });
  });

  it('handles keyboard navigation correctly', async () => {
    const { user, screen } = setupFormTest(<LoginForm onSubmit={vi.fn()} />);

    // Navigate through form elements using Tab key
    await user.tab(); // First focusable element (identifier field)
    expect(screen.getByRole('textbox', { name: /ユーザー名またはメールアドレス/i })).toHaveFocus();

    await user.tab(); // Password field
    expect(screen.getByLabelText(/パスワード/i)).toHaveFocus();

    await user.tab(); // Login button
    expect(screen.getByRole('button', { name: /ログイン/i })).toHaveFocus();

    // Submit form using Enter key
    await user.keyboard('{Enter}');

    // Check validation errors
    expect(screen.getByText(/ユーザー名またはメールアドレスは必須です/i)).toBeInTheDocument();
    expect(screen.getByText(/パスワードは必須です/i)).toBeInTheDocument();
  });
});
