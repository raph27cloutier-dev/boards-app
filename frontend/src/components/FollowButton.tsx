import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface FollowButtonProps {
  userId: string;
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ userId, className = '' }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Don't show button if viewing own profile
  if (user?.id === userId) {
    return null;
  }

  // Check if currently following
  const { data: followData } = useQuery({
    queryKey: ['is-following', userId],
    queryFn: async () => {
      const response = await api.get(`/api/users/${userId}/is-following`);
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following', userId] });
      queryClient.invalidateQueries({ queryKey: ['follow-stats', userId] });
      showToast('Successfully followed user', 'success');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to follow user';
      showToast(message, 'error');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following', userId] });
      queryClient.invalidateQueries({ queryKey: ['follow-stats', userId] });
      showToast('Successfully unfollowed user', 'success');
    },
    onError: () => {
      showToast('Failed to unfollow user', 'error');
    },
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (followData?.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;
  const isFollowing = followData?.isFollowing;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        px-6 py-2 rounded-lg font-medium transition-all duration-300 btn-press
        ${
          isFollowing
            ? 'bg-dark-card border-2 border-accent-purple text-accent-purple hover:bg-accent-purple hover:text-white'
            : 'bg-accent-purple text-white hover:bg-accent-purple/90 hover:shadow-lg hover:shadow-accent-purple/50'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
};
