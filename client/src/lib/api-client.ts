import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/auth';

const API_BASE_URL = 'http://localhost:8080';

/**
 * Sends a login request to the API
 * @param credentials User login credentials
 * @returns Authentication response with tokens and user data
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Login failed');
  }

  return response.json();
}

/**
 * Sends a registration request to the API
 * @param credentials User registration data
 * @returns Success message
 */
export async function registerUser(credentials: RegisterCredentials): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Registration failed');
  }

  return response.json();
}

/**
 * Sends a logout request to the API
 * @param token Access token for authentication
 * @returns Success message
 */
export async function logoutUser(token: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Logout failed');
  }

  return response.json();
}
