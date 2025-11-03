import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import api from '../lib/api';

interface HostDashboardData {
  totalEvents: number;
  totalRsvps: number;
  totalInteractions: number;
  averageRsvpsPerEvent: string;
  mostPopularEvent: {
    id: string;
    title: string;
    rsvpCount: number;
  } | null;
  recentEvents: Array<{
    id: string;
    title: string;
    startTime: string;
    rsvpCount: number;
    interactionCount: number;
    popularityScore: number;
  }>;
}

export const Analytics: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const { data: analytics, isLoading, error } = useQuery<HostDashboardData>({
    queryKey: ['host-analytics'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/host-dashboard');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Analytics Dashboard</h1>
        <p className="text-gray-400 mb-6">Please log in to view your analytics</p>
        <Link to="/login" className="text-accent-purple hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4 text-red-400">Error Loading Analytics</h1>
        <p className="text-gray-400">Failed to load your analytics data</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Link
          to="/create-event"
          className="px-4 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/90 transition-colors text-sm font-medium"
        >
          Create Event
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-2">Total Events</div>
          <div className="text-3xl font-bold text-accent-purple">{analytics.totalEvents}</div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-2">Total RSVPs</div>
          <div className="text-3xl font-bold text-accent-pink">{analytics.totalRsvps}</div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-2">Total Interactions</div>
          <div className="text-3xl font-bold text-blue-400">{analytics.totalInteractions}</div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-2">Avg RSVPs/Event</div>
          <div className="text-3xl font-bold text-green-400">{analytics.averageRsvpsPerEvent}</div>
        </div>
      </div>

      {/* Most Popular Event */}
      {analytics.mostPopularEvent && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🏆 Most Popular Event</h2>
          <Link
            to={`/events/${analytics.mostPopularEvent.id}`}
            className="text-accent-purple hover:underline text-lg font-medium"
          >
            {analytics.mostPopularEvent.title}
          </Link>
          <p className="text-gray-400 mt-2">
            {analytics.mostPopularEvent.rsvpCount} RSVPs
          </p>
        </div>
      )}

      {/* Recent Events Performance */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Events Performance</h2>
        {analytics.recentEvents.length > 0 ? (
          <div className="space-y-4">
            {analytics.recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 bg-dark-bg rounded-lg hover:bg-dark-border transition-colors"
              >
                <div className="flex-1">
                  <Link
                    to={`/events/${event.id}`}
                    className="font-medium hover:text-accent-purple transition-colors"
                  >
                    {event.title}
                  </Link>
                  <p className="text-sm text-gray-400 mt-1">
                    {format(new Date(event.startTime), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-gray-400">RSVPs</div>
                    <div className="font-bold text-accent-purple">{event.rsvpCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">Views</div>
                    <div className="font-bold text-blue-400">{event.interactionCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">Score</div>
                    <div className="font-bold text-green-400">{event.popularityScore.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No events yet</p>
            <Link to="/create-event" className="text-accent-purple hover:underline mt-2 inline-block">
              Create your first event
            </Link>
          </div>
        )}
      </div>

      {/* Insights */}
      {analytics.totalEvents > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📊 Insights</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                You've hosted <strong className="text-white">{analytics.totalEvents}</strong>{' '}
                {analytics.totalEvents === 1 ? 'event' : 'events'} with a total of{' '}
                <strong className="text-white">{analytics.totalRsvps}</strong>{' '}
                {analytics.totalRsvps === 1 ? 'RSVP' : 'RSVPs'}
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                Your events average{' '}
                <strong className="text-white">{analytics.averageRsvpsPerEvent}</strong> RSVPs per event
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                Total of <strong className="text-white">{analytics.totalInteractions}</strong> interactions
                (views, cosigns, etc.) across all your events
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
