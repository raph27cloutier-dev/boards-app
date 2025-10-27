const EventCardSkeleton = () => {
  return (
    <div className="poster-card animate-pulse">
      {/* Image skeleton */}
      <div className="poster-image skeleton-shimmer" />

      {/* Content skeleton */}
      <div className="gradient-overlay" />
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-700/50 rounded w-3/4 skeleton-shimmer" />

        {/* Date and venue skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-700/50 rounded w-1/2 skeleton-shimmer" />
          <div className="h-4 bg-gray-700/50 rounded w-2/3 skeleton-shimmer" />
        </div>

        {/* Vibes skeleton */}
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-700/50 rounded-full skeleton-shimmer" />
          <div className="h-6 w-20 bg-gray-700/50 rounded-full skeleton-shimmer" />
        </div>

        {/* RSVP count skeleton */}
        <div className="h-4 bg-gray-700/50 rounded w-1/3 skeleton-shimmer" />
      </div>
    </div>
  );
};

const EventListSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  );
};

const RecommendationCardSkeleton = () => {
  return (
    <div className="bg-dark-card rounded-lg border border-dark-border p-6 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Rank badge skeleton */}
        <div className="w-10 h-10 bg-gray-700/50 rounded-lg skeleton-shimmer" />

        {/* Image skeleton */}
        <div className="w-24 h-32 bg-gray-700/50 rounded-lg skeleton-shimmer" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gray-700/50 rounded w-3/4 skeleton-shimmer" />
          <div className="h-4 bg-gray-700/50 rounded w-1/2 skeleton-shimmer" />
          <div className="h-4 bg-gray-700/50 rounded w-2/3 skeleton-shimmer" />

          {/* Match score skeleton */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-700/50 rounded w-1/4 skeleton-shimmer" />
            <div className="h-2 bg-gray-700/50 rounded-full w-full skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};

const RecommendationListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <RecommendationCardSkeleton key={index} />
      ))}
    </div>
  );
};

export { EventCardSkeleton, EventListSkeleton, RecommendationCardSkeleton, RecommendationListSkeleton };
