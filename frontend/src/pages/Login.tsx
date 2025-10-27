import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login with:', email);
      await login({ email, password });
      console.log('Login successful!');
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to login. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const useDemoAccount = () => {
    setEmail('raph@boards.app');
    setPassword('boards2025');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 p-2 hover:bg-dark-card rounded-lg transition-all duration-300 flex items-center text-gray-400 hover:text-white btn-press"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
            BOARDS
          </h1>
          <p className="text-gray-400 mt-2">Hyperlocal Happenings for Montréal</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Login</h2>

          {/* Demo Account Helper */}
          <div className="mb-4 p-3 rounded-lg bg-accent-purple/10 border border-accent-purple/20 animate-fade-in">
            <p className="text-sm text-accent-purple mb-2">Try the demo account:</p>
            <button
              type="button"
              onClick={useDemoAccount}
              className="text-xs text-accent-purple hover:underline btn-press"
            >
              Use: raph@boards.app / boards2025
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg bg-dark-bg border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg bg-dark-bg border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 btn-press hover:shadow-lg hover:shadow-accent-purple/50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-accent-purple hover:text-accent-purple/80">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
