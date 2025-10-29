import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import { VIBES, NEIGHBORHOODS } from '../types';

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    homeNeighborhood: '',
  });
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.getById(id!),
    enabled: !!id,
  });

  // Initialize form data when user data loads
  React.useEffect(() => {
    if (user && currentUser?.id === id) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        homeNeighborhood: user.homeNeighborhood || '',
      });
      setSelectedVibes(user.vibePrefs || []);
    }
  }, [user, currentUser?.id, id]);

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['userEvents', id],
    queryFn: () => usersAPI.getEvents(id!),
    enabled: !!id,
  });

  const isOwnProfile = currentUser?.id === id;

  const updateMutation = useMutation({
    mutationFn: (formDataToSend: FormData) => usersAPI.updateProfile(formDataToSend),
    onSuccess: (updatedUser) => {
      showToast('Profile updated successfully!', 'success');
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      showToast(errorMessage, 'error');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleVibe = (vibe: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleEditToggle = () => {
    if (isEditing && user) {
      // Cancel edit - reset form
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        homeNeighborhood: user.homeNeighborhood || '',
      });
      setSelectedVibes(user.vibePrefs || []);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
    setIsEditing(!isEditing);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    if (formData.displayName) formDataToSend.append('displayName', formData.displayName);
    if (formData.bio) formDataToSend.append('bio', formData.bio);
    if (formData.homeNeighborhood) formDataToSend.append('homeNeighborhood', formData.homeNeighborhood);

    selectedVibes.forEach((vibe) => formDataToSend.append('vibePrefs', vibe));

    if (avatarFile) {
      formDataToSend.append('avatar', avatarFile);
    }

    updateMutation.mutate(formDataToSend);
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

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

  // At this point, TypeScript knows user is defined
  const profile = user;

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4">
      {/* Profile Header */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-8">
        {!isEditing ? (
          /* View Mode */
          <>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName || profile.username}
                  className="w-32 h-32 rounded-full border-4 border-accent-purple"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-5xl font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}

              {/* User Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">{profile.displayName || profile.username}</h1>
                  <p className="text-gray-400">@{profile.username}</p>
                </div>

                {profile.bio && <p className="text-gray-300">{profile.bio}</p>}

                <div className="flex flex-wrap gap-4 text-sm">
                  {profile.homeNeighborhood && (
                    <div className="flex items-center space-x-2">
                      <span>📍</span>
                      <span>{profile.homeNeighborhood}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span>⭐</span>
                    <span>Trust Score: {profile.trustScore.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📅</span>
                    <span>Joined {format(new Date(profile.createdAt), 'MMM yyyy')}</span>
                  </div>
                </div>

                {/* Vibes */}
                {profile.vibePrefs && profile.vibePrefs.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-2">Vibes</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.vibePrefs.map((vibe) => (
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

            {/* Action Buttons */}
            {isOwnProfile && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleEditToggle}
                  className="px-6 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/90 transition-colors font-medium"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 rounded-lg border border-dark-border hover:bg-dark-bg transition-colors font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full border-4 border-accent-purple object-cover"
                  />
                ) : profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName || profile.username}
                    className="w-32 h-32 rounded-full border-4 border-accent-purple object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-5xl font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="px-4 py-2 rounded-lg bg-dark-bg border border-dark-border hover:border-accent-purple cursor-pointer transition-colors text-sm"
                >
                  Change Avatar
                </label>
              </div>

              {/* Edit Form */}
              <div className="flex-1 space-y-4 w-full">
                {/* Display Name */}
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-dark-bg border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
                    placeholder={profile.username}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-dark-bg border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Home Neighborhood */}
                <div>
                  <label htmlFor="homeNeighborhood" className="block text-sm font-medium mb-2">
                    Home Neighborhood
                  </label>
                  <select
                    id="homeNeighborhood"
                    name="homeNeighborhood"
                    value={formData.homeNeighborhood}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-dark-bg border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
                  >
                    <option value="">Select neighborhood</option>
                    {NEIGHBORHOODS.map((neighborhood) => (
                      <option key={neighborhood} value={neighborhood}>
                        {neighborhood}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vibes */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Vibes (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {VIBES.map((vibe) => (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() => toggleVibe(vibe)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedVibes.includes(vibe)
                            ? 'bg-accent-purple text-white'
                            : 'bg-dark-bg border border-dark-border hover:border-accent-purple'
                        }`}
                      >
                        {vibe}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-dark-border">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleEditToggle}
                disabled={updateMutation.isPending}
                className="px-6 py-2 rounded-lg border border-dark-border hover:bg-dark-bg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
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
