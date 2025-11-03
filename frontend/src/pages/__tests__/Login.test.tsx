import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/test-utils';
import { Login } from '../Login';
import { authAPI } from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  authAPI: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form', () => {
    render(<Login />);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows demo account helper', () => {
    render(<Login />);

    expect(screen.getByText(/try the demo account/i)).toBeInTheDocument();
    expect(screen.getByText(/raph@boards.app/i)).toBeInTheDocument();
  });

  it('fills form with demo credentials when clicking demo button', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const demoButton = screen.getByText(/raph@boards.app/i);
    await user.click(demoButton);

    expect(screen.getByLabelText(/email/i)).toHaveValue('raph@boards.app');
    expect(screen.getByLabelText(/password/i)).toHaveValue('boards2025');
  });

  it('successfully logs in with valid credentials', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
    };
    const mockToken = 'mock-jwt-token';

    vi.mocked(authAPI.login).mockResolvedValue({
      user: mockUser,
      token: mockToken,
    });

    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message on failed login', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';

    vi.mocked(authAPI.login).mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables submit button during login', async () => {
    const user = userEvent.setup();

    vi.mocked(authAPI.login).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /^login$/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
  });

  it('has link to signup page', () => {
    render(<Login />);

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('requires email and password fields', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});
