import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<'going' | 'interested' | 'maybe'>('going');

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getById(id!),
    enabled: !!id,
  });

  const { data: attendees } = useQuery({
    queryKey: ['attendees', id],
    queryFn: () => eventsAPI.getAttendees(id!),
    enabled: !!id && isAuthenticated,
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: 'going' | 'interested' | 'maybe') =>
      eventsAPI.rsvp(id!, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['attendees', id] });
      showToast(`You're ${status === 'going' ? 'going' : status} to this event!`, 'success');
    },
    onError: () => {
      showToast('Failed to RSVP. Please try again.', 'error');
    },
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: () => eventsAPI.cancelRsvp(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['attendees', id] });
      showToast('RSVP cancelled successfully', 'success');
    },
    onError: () => {
      showToast('Failed to cancel RSVP. Please try again.', 'error');
    },
  });

  const handleRsvp = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    rsvpMutation.mutate(selectedStatus);
  };

  const handleCancelRsvp = () => {
    cancelRsvpMutation.mutate();
  };

  const userRsvp = attendees?.find((rsvp) => rsvp.userId === user?.id);
  const isHost = event?.hostId === user?.id;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-400">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="text-red-400 text-lg">Event not found</div>
        <Link to="/" className="text-accent-purple mt-4 hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.startTime);
  const endDate = event.endTime ? new Date(event.endTime) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-accent-purple hover:underline mb-4 inline-block">
        ← Back to events
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Event Image */}
        <div>
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full rounded-lg aspect-[3/4] object-cover"
            />
          ) : (
            <div className="w-full rounded-lg aspect-[3/4] bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
              <span className="text-8xl">🎉</span>
            </div>
          )}

          {/* Attendees */}
          {attendees && attendees.length > 0 && (
            <div className="mt-4 p-4 bg-dark-card border border-dark-border rounded-lg">
              <h3 className="font-semibold mb-3">
                {attendees.length} {attendees.length === 1 ? 'Person' : 'People'} Going
              </h3>
              <div className="flex flex-wrap gap-2">
                {attendees.slice(0, 10).map((rsvp) => (
                  <Link
                    key={rsvp.id}
                    to={`/profile/${rsvp.userId}`}
                    className="flex items-center space-x-2 px-3 py-2 bg-dark-bg rounded-lg hover:bg-dark-border transition-colors"
                  >
                    {rsvp.user?.avatarUrl ? (
                      <img
                        src={rsvp.user.avatarUrl}
                        alt={rsvp.user.username}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-accent-purple flex items-center justify-center text-xs">
                        {rsvp.user?.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm">{rsvp.user?.username}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {event.vibe.map((vibe) => (
                <span
                  key={vibe}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-accent-purple/20 text-accent-purple"
                >
                  {vibe}
                </span>
              ))}
            </div>

            <h1 className="text-4xl font-bold mb-2">{event.title}</h1>

            <div className="flex items-center space-x-2 text-gray-400">
              <span>Hosted by</span>
              <Link
                to={`/profile/${event.hostId}`}
                className="text-accent-purple hover:underline"
              >
                {event.host?.displayName || event.host?.username || 'Unknown'}
              </Link>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-semibold">
                  {format(startDate, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-gray-400">
                  {format(startDate, 'h:mm a')}
                  {endDate && ` - ${format(endDate, 'h:mm a')}`}
                </p>
              </div>
            </div>

            {/* Location */}
            {(event.venueName || event.address) && (
              <div className="flex items-start space-x-3">
                <span className="text-2xl">📍</span>
                <div>
                  {event.venueName && <p className="font-semibold">{event.venueName}</p>}
                  {event.address && <p className="text-gray-400">{event.address}</p>}
                  {event.neighborhood && (
                    <p className="text-accent-purple">{event.neighborhood}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-2">About This Event</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Additional Info */}
          <div className="space-y-2 text-sm">
            {event.eventType && (
              <p>
                <span className="text-gray-400">Type:</span>{' '}
                <span className="capitalize">{event.eventType}</span>
              </p>
            )}
            {event.capacity && (
              <p>
                <span className="text-gray-400">Capacity:</span> {event.capacity} people
              </p>
            )}
            {event.ageRestriction && (
              <p>
                <span className="text-gray-400">Age Restriction:</span> {event.ageRestriction}+
              </p>
            )}
          </div>

          {/* RSVP Section */}
          <div className="space-y-3">
            {userRsvp ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 mb-3">
                  You're {userRsvp.status === 'going' ? 'going' : userRsvp.status} to this event!
                </p>
                <button
                  onClick={handleCancelRsvp}
                  disabled={cancelRsvpMutation.isPending}
                  className="w-full py-2 px-4 rounded-lg border border-dark-border hover:bg-dark-card disabled:opacity-50 transition-colors btn-press"
                >
                  {cancelRsvpMutation.isPending ? 'Canceling...' : 'Cancel RSVP'}
                </button>
              </div>
            ) : (
              <>
                <div className="flex space-x-2">
                  {(['going', 'interested', 'maybe'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 btn-press ${
                        selectedStatus === status
                          ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/20'
                          : 'bg-dark-card border border-dark-border hover:border-accent-purple'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleRsvp}
                  disabled={rsvpMutation.isPending}
                  className="w-full py-3 px-4 rounded-lg bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-50 font-medium transition-all duration-300 btn-press hover:shadow-lg hover:shadow-accent-purple/50"
                >
                  {rsvpMutation.isPending ? 'RSVPing...' : 'RSVP to Event'}
                </button>
              </>
            )}

            {event.ticketLink && (
              <a
                href={event.ticketLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-4 rounded-lg border-2 border-accent-purple text-accent-purple hover:bg-accent-purple hover:text-white font-medium transition-colors text-center"
              >
                Get Tickets
              </a>
            )}

            {isHost && (
              <Link
                to={`/events/${event.id}/edit`}
                className="block w-full py-3 px-4 rounded-lg border border-dark-border hover:bg-dark-card font-medium transition-colors text-center"
              >
                Edit Event
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
