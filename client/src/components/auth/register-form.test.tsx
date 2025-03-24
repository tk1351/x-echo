import { setupFormTest } from '@/test/setup-form-test';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './register-form';

describe('RegisterForm', () => {
  // テスト間でDOMをクリーンアップ
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders register form with all required fields', () => {
    const { screen } = setupFormTest(<RegisterForm onSubmit={vi.fn()} />);

    expect(screen.getByRole('form', { name: /登録/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /ユーザー名/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /表示名/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /メールアドレス/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登録/i })).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    const mockSubmit = vi.fn();
    const { user, screen } = setupFormTest(<RegisterForm onSubmit={mockSubmit} />);

    // Submit empty form
    const registerButtons = screen.getAllByRole('button', { name: /登録/i });
    await user.click(registerButtons[0]);

    // Check validation errors
    expect(screen.getByText(/ユーザー名は3文字以上である必要があります/i)).toBeInTheDocument();
    expect(screen.getByText(/表示名は必須です/i)).toBeInTheDocument();
    expect(screen.getByText(/有効なメールアドレスを入力してください/i)).toBeInTheDocument();
    expect(screen.getByText(/パスワードは8文字以上である必要があります/i)).toBeInTheDocument();

    // Verify submit function was not called
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error for invalid username format', async () => {
    const mockSubmit = vi.fn();
    const { user, screen } = setupFormTest(<RegisterForm onSubmit={mockSubmit} />);

    // Fill form with invalid username
    await user.type(
      screen.getByRole('textbox', { name: /ユーザー名/i }),
      'user name!'
    );
    await user.type(
      screen.getByRole('textbox', { name: /表示名/i }),
      'Test User'
    );
    await user.type(
      screen.getByRole('textbox', { name: /メールアドレス/i }),
      'test@example.com'
    );
    await user.type(
      screen.getByLabelText(/パスワード/i),
      'password123'
    );

    // Submit form
    const registerButtons = screen.getAllByRole('button', { name: /登録/i });
    await user.click(registerButtons[0]);

    // Check validation error for username
    expect(screen.getByText(/ユーザー名は英数字とアンダースコアのみ使用できます/i)).toBeInTheDocument();

    // Verify submit function was not called
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const mockSubmit = vi.fn();
    const { user, screen } = setupFormTest(<RegisterForm onSubmit={mockSubmit} />);

    // Fill form fields with valid data
    await user.type(
      screen.getByRole('textbox', { name: /ユーザー名/i }),
      'testuser'
    );
    await user.type(
      screen.getByRole('textbox', { name: /表示名/i }),
      'Test User'
    );
    await user.type(
      screen.getByRole('textbox', { name: /メールアドレス/i }),
      'test@example.com'
    );
    await user.type(
      screen.getByLabelText(/パスワード/i),
      'password123'
    );

    // Submit form
    const registerButtons = screen.getAllByRole('button', { name: /登録/i });
    await user.click(registerButtons[0]);

    // Verify submit function was called with correct data
    expect(mockSubmit).toHaveBeenCalled();
    // 最初の引数のみを確認
    const firstArg = mockSubmit.mock.calls[0][0];
    expect(firstArg).toEqual({
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
