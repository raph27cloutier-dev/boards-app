import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { eventsAPI, getUserLocation } from '../lib/api';
import type { Event } from '../types';
import { VIBES } from '../types';
import { format } from 'date-fns';
import { EventListSkeleton } from '../components/LoadingSkeleton';
import { NoEventsFound, NoSearchResults } from '../components/EmptyState';

export const EventFeed: React.FC = () => {
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location on mount
  React.useEffect(() => {
    getUserLocation().then(setUserLocation);
  }, []);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events', selectedVibes, searchQuery, userLocation],
    queryFn: async () => {
      const params: any = {};

      if (userLocation) {
        params.near = `${userLocation.lat},${userLocation.lng}`;
        params.radiusKm = 20;
      }

      if (selectedVibes.length > 0) {
        params.vibes = selectedVibes.join(',');
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      return eventsAPI.getAll(params);
    },
    enabled: !!userLocation,
  });

  const toggleVibe = (vibe: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Discover Events</h1>
          <p className="text-gray-400 mt-1">
            {events?.length || 0} events in Montréal
          </p>
        </div>

        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20 transition-all duration-300 focus:scale-105 focus:shadow-lg focus:shadow-accent-purple/20"
          />
        </div>
      </div>

      {/* Vibe Filters */}
      <div className="flex flex-wrap gap-2">
        {VIBES.map((vibe) => (
          <button
            key={vibe}
            onClick={() => toggleVibe(vibe)}
            className={`filter-button ${
              selectedVibes.includes(vibe)
                ? 'filter-button-active'
                : 'filter-button-inactive'
            }`}
          >
            {vibe}
          </button>
        ))}
        {selectedVibes.length > 0 && (
          <button
            onClick={() => setSelectedVibes([])}
            className="px-4 py-2 rounded-full text-sm font-medium bg-dark-card border border-red-500/50 text-red-400 hover:border-red-500 hover:bg-red-500/20 transition-all duration-300 btn-press animate-scale-in"
          >
            Clear Filters ({selectedVibes.length})
          </button>
        )}
      </div>

      {/* Event Grid */}
      {isLoading ? (
        <EventListSkeleton />
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-400 animate-fade-in">Failed to load events. Please try again.</div>
        </div>
      ) : events && events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>
      ) : (
        searchQuery ? (
          <NoSearchResults searchQuery={searchQuery} />
        ) : (
          <NoEventsFound onClearFilters={selectedVibes.length > 0 ? () => setSelectedVibes([]) : undefined} />
        )
      )}
    </div>
  );
};

interface EventCardProps {
  event: Event;
  index: number;
}

const EventCard: React.FC<EventCardProps> = ({ event, index }) => {
  const startDate = new Date(event.startTime);
  const staggerClass = `stagger-${Math.min(index % 8 + 1, 8)}`;

  return (
    <Link to={`/events/${event.id}`} className={`poster-card group animate-slide-up ${staggerClass}`}>
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

        {/* Gradient Overlay */}
        <div className="gradient-overlay" />

        {/* Event Info Overlay */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {event.vibe.slice(0, 3).map((vibe) => (
                <span
                  key={vibe}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm"
                >
                  {vibe}
                </span>
              ))}
            </div>

            <h3 className="font-bold text-lg line-clamp-2 group-hover:text-accent-purple transition-colors">
              {event.title}
            </h3>

            <div className="text-sm text-gray-300 space-y-1">
              <p>{format(startDate, 'EEE, MMM d • h:mm a')}</p>
              {event.venueName && <p className="line-clamp-1">{event.venueName}</p>}
              {event.neighborhood && (
                <p className="text-accent-purple">{event.neighborhood}</p>
              )}
              {event.distance !== undefined && (
                <p className="text-gray-400">{event.distance.toFixed(1)} km away</p>
              )}
            </div>

            {event._count && (
              <div className="flex items-center space-x-2 text-sm">
                <span>👥 {event._count.rsvps} going</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
