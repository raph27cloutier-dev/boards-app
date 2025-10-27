import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-dark-border bg-dark-bg/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
                BOARDS
              </div>
              <div className="text-xs text-gray-500">MTL</div>
            </Link>

            {/* Navigation Links */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-1">
                <NavLink to="/" active={isActive('/')}>
                  Feed
                </NavLink>
                <NavLink to="/recommendations" active={isActive('/recommendations')}>
                  For You
                </NavLink>
                <NavLink to="/create-event" active={isActive('/create-event')}>
                  Create
                </NavLink>
              </div>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to={`/profile/${user?.id}`}
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName || user.username}
                        className="h-8 w-8 rounded-full border-2 border-accent-purple"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-accent-purple flex items-center justify-center text-sm font-semibold">
                        {user?.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline text-sm">
                      {user?.displayName || user?.username}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm rounded-lg border border-dark-border hover:bg-dark-card transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm rounded-lg hover:bg-dark-card transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 text-sm rounded-lg bg-accent-purple hover:bg-accent-purple/90 transition-colors font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          {isAuthenticated && (
            <div className="flex md:hidden space-x-1 pb-3">
              <NavLink to="/" active={isActive('/')} mobile>
                Feed
              </NavLink>
              <NavLink to="/recommendations" active={isActive('/recommendations')} mobile>
                For You
              </NavLink>
              <NavLink to="/create-event" active={isActive('/create-event')} mobile>
                Create
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>Boards &copy; 2025 - Hyperlocal Happenings for Montréal</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
  mobile?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, active, children, mobile }) => (
  <Link
    to={to}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-accent-purple text-white'
        : 'hover:bg-dark-card'
    } ${mobile ? 'flex-1 text-center' : ''}`}
  >
    {children}
  </Link>
);
