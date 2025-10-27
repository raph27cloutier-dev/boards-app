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
import ToastContainer from './components/Toast';

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
    <>
      <ToastContainer />
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
          <Layout showBackButton title="Event Details">
            <EventDetail />
          </Layout>
        }
      />
      <Route
        path="/recommendations"
        element={
          isAuthenticated ? (
            <Layout title="For You">
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
          <Layout showBackButton title="Profile">
            <Profile />
          </Layout>
        }
      />
      <Route
        path="/create-event"
        element={
          isAuthenticated ? (
            <Layout showBackButton title="Create Event">
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
    </>
  );
}

export default App;
