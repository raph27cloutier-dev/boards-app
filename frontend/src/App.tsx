import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import {
  Login,
  Signup,
  EventFeed,
  EventDetail,
  Recommendations,
  Profile,
  CreateEvent,
} from './pages';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-text">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes with layout */}
      <Route
        path="/"
        element={
          <Layout>
            <EventFeed />
          </Layout>
        }
      />
      <Route
        path="/events/:id"
        element={
          <Layout>
            <EventDetail />
          </Layout>
        }
      />
      <Route
        path="/recommendations"
        element={
          isAuthenticated ? (
            <Layout>
              <Recommendations />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/profile/:id"
        element={
          <Layout>
            <Profile />
          </Layout>
        }
      />
      <Route
        path="/create-event"
        element={
          isAuthenticated ? (
            <Layout>
              <CreateEvent />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
