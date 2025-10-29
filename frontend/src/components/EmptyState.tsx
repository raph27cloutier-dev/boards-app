import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = ({ title, message, icon, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      {/* Icon or Illustration */}
      <div className="mb-6 text-gray-600 animate-bounce-subtle">
        {icon || (
          <svg
            className="w-24 h-24"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-dark-text mb-2 animate-slide-up">
        {title}
      </h3>

      {/* Message */}
      <p className="text-gray-400 text-center max-w-md mb-6 animate-slide-up stagger-1">
        {message}
      </p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-all duration-200 btn-press animate-slide-up stagger-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Specific empty state components

export const NoEventsFound = ({ onClearFilters }: { onClearFilters?: () => void }) => {
  return (
    <EmptyState
      title="No events found"
      message="We couldn't find any events matching your criteria. Try adjusting your filters or check back later for new events."
      icon={
        <svg
          className="w-24 h-24"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      action={
        onClearFilters
          ? {
              label: 'Clear Filters',
              onClick: onClearFilters,
            }
          : undefined
      }
    />
  );
};

export const NoRecommendations = () => {
  return (
    <EmptyState
      title="No recommendations yet"
      message="We're still learning your preferences. Browse and RSVP to events to get personalized recommendations."
      icon={
        <svg
          className="w-24 h-24"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      }
    />
  );
};

export const NoHostedEvents = () => {
  return (
    <EmptyState
      title="No events hosted yet"
      message="This user hasn't hosted any events yet. Check back later or explore other events in the meantime."
      icon={
        <svg
          className="w-24 h-24"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      }
    />
  );
};

export const NoSearchResults = ({ searchQuery }: { searchQuery: string }) => {
  return (
    <EmptyState
      title="No results found"
      message={`We couldn't find any events matching "${searchQuery}". Try a different search term or browse all events.`}
      icon={
        <svg
          className="w-24 h-24"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
    />
  );
};

export default EmptyState;
