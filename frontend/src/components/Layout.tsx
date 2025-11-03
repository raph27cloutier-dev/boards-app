import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BackToTop from './BackToTop';

interface LayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, showBackButton = false, title }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pb-20">
      {/* Top Header */}
      <nav className="sticky top-0 z-50 border-b border-dark-border bg-dark-bg/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex h-14 items-center justify-between">
            {/* Left: Back button or Logo */}
            <div className="flex items-center space-x-3">
              {showBackButton ? (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-dark-card rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : (
                <Link to="/" className="flex items-center space-x-2">
                  <div className="text-2xl font-bold bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
                    BOARDS
                  </div>
                </Link>
              )}
              {title && <h1 className="text-lg font-semibold">{title}</h1>}
            </div>

            {/* Right: User menu or Login button */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to={`/profile/${user?.id}`}
                  className="flex items-center space-x-2"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName || user.username}
                      className="h-8 w-8 rounded-full border-2 border-accent-purple"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-sm font-bold">
                      {user?.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/90 font-medium transition-all duration-300"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl">
        {children}
      </main>

      {/* Bottom Navigation (Instagram-style) */}
      {isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-dark-border bg-dark-bg/95 backdrop-blur">
          <div className="mx-auto max-w-2xl px-4">
            <div className="flex items-center justify-around h-16">
              {/* Home */}
              <Link
                to="/"
                className={`p-3 rounded-lg transition-colors ${
                  isActive('/') ? 'text-accent-purple' : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-7 h-7" fill={isActive('/') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>

              {/* Recommendations */}
              <Link
                to="/recommendations"
                className={`p-3 rounded-lg transition-colors ${
                  isActive('/recommendations') ? 'text-accent-purple' : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-7 h-7" fill={isActive('/recommendations') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </Link>

              {/* Create Event (Center - larger) */}
              <Link
                to="/create-event"
                className="p-4 rounded-full bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all animate-pulse-subtle"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </Link>

              {/* Analytics */}
              <Link
                to="/analytics"
                className={`p-3 rounded-lg transition-colors ${
                  isActive('/analytics') ? 'text-accent-purple' : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-7 h-7" fill={isActive('/analytics') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Link>

              {/* Profile */}
              <Link
                to={`/profile/${user?.id}`}
                className={`p-2 rounded-lg transition-colors ${
                  location.pathname.includes('/profile') ? 'text-accent-purple' : 'text-gray-400 hover:text-white'
                }`}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile"
                    className={`h-7 w-7 rounded-full ${
                      location.pathname.includes('/profile') ? 'ring-2 ring-accent-purple' : ''
                    }`}
                  />
                ) : (
                  <div className={`h-7 w-7 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-xs font-bold ${
                    location.pathname.includes('/profile') ? 'ring-2 ring-accent-purple' : ''
                  }`}>
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </nav>
      )}

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};
