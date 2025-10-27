import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { recoAPI, getUserLocation } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { ScoredEvent } from '../types';
import { VIBES } from '../types';
import { format } from 'date-fns';

export const Recommendations: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [when, setWhen] = useState<'now' | 'tonight' | 'weekend' | 'later'>('later');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    getUserLocation().then(setUserLocation);
  }, [isAuthenticated, navigate]);

  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['recommendations', user?.id, selectedVibes, when, userLocation],
    queryFn: async () => {
      if (!user || !userLocation) return [];

      return recoAPI.getFeed({
        userId: user.id,
        location: userLocation,
        radiusKm: 20,
        when,
        vibes: selectedVibes.length > 0 ? selectedVibes : undefined,
        max: 50,
      });
    },
    enabled: !!user && !!userLocation,
  });

  const toggleVibe = (vibe: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">For You</h1>
        <p className="text-gray-400 mt-1">
          Personalized recommendations based on your taste
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Time Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">When?</label>
          <div className="flex flex-wrap gap-2">
            {(['now', 'tonight', 'weekend', 'later'] as const).map((timeOption) => (
              <button
                key={timeOption}
                onClick={() => setWhen(timeOption)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  when === timeOption
                    ? 'bg-accent-purple text-white'
                    : 'bg-dark-card border border-dark-border hover:border-accent-purple'
                }`}
              >
                {timeOption.charAt(0).toUpperCase() + timeOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Vibe Filters */}
        <div>
          <label className="block text-sm font-medium mb-2">Vibes</label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((vibe) => (
              <button
                key={vibe}
                onClick={() => toggleVibe(vibe)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedVibes.includes(vibe)
                    ? 'bg-accent-purple text-white'
                    : 'bg-dark-card border border-dark-border hover:border-accent-purple'
                }`}
              >
                {vibe}
              </button>
            ))}
            {selectedVibes.length > 0 && (
              <button
                onClick={() => setSelectedVibes([])}
                className="px-4 py-2 rounded-full text-sm font-medium bg-dark-card border border-dark-border hover:border-red-500 hover:text-red-400"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-400">Loading recommendations...</div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-400">Failed to load recommendations. Please try again.</div>
        </div>
      ) : recommendations && recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((event, index) => (
            <RecommendationCard key={event.id} event={event} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-64 text-gray-400">
          <p className="text-lg">No recommendations found</p>
          <p className="text-sm mt-2">Try adjusting your filters or RSVP to more events</p>
        </div>
      )}
    </div>
  );
};

interface RecommendationCardProps {
  event: ScoredEvent;
  rank: number;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ event, rank }) => {
  const startDate = new Date(event.startTime);

  return (
    <Link
      to={`/events/${event.id}`}
      className="block bg-dark-card border border-dark-border rounded-lg p-6 hover:border-accent-purple transition-all group"
    >
      <div className="flex gap-6">
        {/* Rank Badge */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center font-bold text-lg">
            #{rank}
          </div>
        </div>

        {/* Event Image */}
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center flex-shrink-0">
            <span className="text-4xl">🎉</span>
          </div>
        )}

        {/* Event Info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {event.vibe.slice(0, 3).map((vibe) => (
                <span
                  key={vibe}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-accent-purple/20 text-accent-purple"
                >
                  {vibe}
                </span>
              ))}
            </div>

            <h3 className="font-bold text-xl group-hover:text-accent-purple transition-colors">
              {event.title}
            </h3>

            <div className="text-sm text-gray-400 mt-1">
              <p>{format(startDate, 'EEE, MMM d • h:mm a')}</p>
              {event.venueName && <p>{event.venueName}</p>}
            </div>
          </div>

          <p className="text-gray-300 line-clamp-2">{event.description}</p>

          {/* Match Score */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-dark-bg rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-purple to-accent-pink"
                  style={{ width: `${Math.min((event.score / 10) * 100, 100)}%` }}
                />
              </div>
              <span className="text-accent-purple font-semibold">
                {event.score.toFixed(1)}
              </span>
            </div>

            {event.distance !== undefined && (
              <span className="text-gray-400">{event.distance.toFixed(1)} km</span>
            )}

            {event._count && (
              <span className="text-gray-400">👥 {event._count.rsvps}</span>
            )}
          </div>

          {/* Reasons */}
          {event.reasons && event.reasons.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.reasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="text-xs text-accent-blue bg-accent-blue/10 px-2 py-1 rounded"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
