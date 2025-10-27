import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.getById(id!),
    enabled: !!id,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['userEvents', id],
    queryFn: () => usersAPI.getEvents(id!),
    enabled: !!id,
  });

  const isOwnProfile = currentUser?.id === id;

  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="text-red-400 text-lg">User not found</div>
        <Link to="/" className="text-accent-purple mt-4 hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || user.username}
              className="w-32 h-32 rounded-full border-4 border-accent-purple"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-5xl font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}

          {/* User Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{user.displayName || user.username}</h1>
              <p className="text-gray-400">@{user.username}</p>
            </div>

            {user.bio && <p className="text-gray-300">{user.bio}</p>}

            <div className="flex flex-wrap gap-4 text-sm">
              {user.homeNeighborhood && (
                <div className="flex items-center space-x-2">
                  <span>📍</span>
                  <span>{user.homeNeighborhood}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span>⭐</span>
                <span>Trust Score: {user.trustScore.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📅</span>
                <span>Joined {format(new Date(user.createdAt), 'MMM yyyy')}</span>
              </div>
            </div>

            {/* Vibes */}
            {user.vibePrefs && user.vibePrefs.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">Vibes</p>
                <div className="flex flex-wrap gap-2">
                  {user.vibePrefs.map((vibe) => (
                    <span
                      key={vibe}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-accent-purple/20 text-accent-purple"
                    >
                      {vibe}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hosted Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {isOwnProfile ? 'Your Events' : 'Hosted Events'}
          </h2>
          {isOwnProfile && (
            <Link
              to="/create-event"
              className="px-4 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/90 transition-colors text-sm font-medium"
            >
              Create Event
            </Link>
          )}
        </div>

        {eventsLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-gray-400">Loading events...</div>
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="poster-card group"
              >
                <div className="relative">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="poster-image"
                    />
                  ) : (
                    <div className="poster-image bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                      <span className="text-4xl">🎉</span>
                    </div>
                  )}

                  <div className="gradient-overlay" />

                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <h3 className="font-bold text-lg line-clamp-2 group-hover:text-accent-purple transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">
                      {format(new Date(event.startTime), 'MMM d, h:mm a')}
                    </p>
                    {event._count && (
                      <p className="text-sm text-gray-400 mt-1">
                        👥 {event._count.rsvps} going
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center h-32 text-gray-400 bg-dark-card border border-dark-border rounded-lg">
            <p>No events hosted yet</p>
            {isOwnProfile && (
              <Link to="/create-event" className="text-accent-purple mt-2 hover:underline">
                Create your first event
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
