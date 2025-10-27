import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { eventsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { VIBES, NEIGHBORHOODS } from '../types';

export const CreateEvent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    venueName: '',
    address: '',
    neighborhood: '',
    eventType: '',
    capacity: '',
    ageRestriction: '',
    ticketLink: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const createMutation = useMutation({
    mutationFn: (formDataToSend: FormData) => eventsAPI.create(formDataToSend),
    onSuccess: (event) => {
      navigate(`/events/${event.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create event');
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleVibe = (vibe: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedVibes.length === 0) {
      setError('Please select at least one vibe');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('startTime', new Date(formData.startTime).toISOString());

    if (formData.endTime) {
      formDataToSend.append('endTime', new Date(formData.endTime).toISOString());
    }

    if (formData.venueName) formDataToSend.append('venueName', formData.venueName);
    if (formData.address) formDataToSend.append('address', formData.address);
    if (formData.neighborhood) formDataToSend.append('neighborhood', formData.neighborhood);
    if (formData.eventType) formDataToSend.append('eventType', formData.eventType);
    if (formData.capacity) formDataToSend.append('capacity', formData.capacity);
    if (formData.ageRestriction) formDataToSend.append('ageRestriction', formData.ageRestriction);
    if (formData.ticketLink) formDataToSend.append('ticketLink', formData.ticketLink);

    selectedVibes.forEach((vibe) => formDataToSend.append('vibe', vibe));

    if (imageFile) {
      formDataToSend.append('image', imageFile);
    }

    createMutation.mutate(formDataToSend);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create Event</h1>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Event Poster</label>
          <div className="flex items-start gap-4">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-48 h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-48 h-64 bg-dark-card border-2 border-dashed border-dark-border rounded-lg flex items-center justify-center">
                <span className="text-4xl">🖼️</span>
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-block px-4 py-2 rounded-lg bg-dark-card border border-dark-border hover:border-accent-purple cursor-pointer transition-colors"
              >
                Choose Image
              </label>
              <p className="text-sm text-gray-400 mt-2">
                Recommended: 3:4 aspect ratio (e.g., 900x1200px)
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Event Title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
            placeholder="Amazing Event Name"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
            placeholder="Tell people what your event is about..."
          />
        </div>

        {/* Vibes */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Vibes * (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((vibe) => (
              <button
                key={vibe}
                type="button"
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
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium mb-2">
              Start Date & Time *
            </label>
            <input
              id="startTime"
              name="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium mb-2">
              End Date & Time
            </label>
            <input
              id="endTime"
              name="endTime"
              type="datetime-local"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="venueName" className="block text-sm font-medium mb-2">
              Venue Name
            </label>
            <input
              id="venueName"
              name="venueName"
              type="text"
              value={formData.venueName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
              placeholder="Cool Venue"
            />
          </div>

          <div>
            <label htmlFor="neighborhood" className="block text-sm font-medium mb-2">
              Neighborhood
            </label>
            <select
              id="neighborhood"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
            >
              <option value="">Select neighborhood</option>
              {NEIGHBORHOODS.map((neighborhood) => (
                <option key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-2">
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
            placeholder="123 Street Name, Montreal, QC"
          />
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="eventType" className="block text-sm font-medium mb-2">
              Event Type
            </label>
            <select
              id="eventType"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
            >
              <option value="">Select type</option>
              <option value="party">Party</option>
              <option value="concert">Concert</option>
              <option value="art">Art</option>
              <option value="food">Food</option>
              <option value="sports">Sports</option>
              <option value="networking">Networking</option>
              <option value="wellness">Wellness</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium mb-2">
              Capacity
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
              placeholder="100"
            />
          </div>

          <div>
            <label htmlFor="ageRestriction" className="block text-sm font-medium mb-2">
              Age Restriction
            </label>
            <input
              id="ageRestriction"
              name="ageRestriction"
              type="number"
              min="0"
              value={formData.ageRestriction}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
              placeholder="18"
            />
          </div>
        </div>

        {/* Ticket Link */}
        <div>
          <label htmlFor="ticketLink" className="block text-sm font-medium mb-2">
            Ticket Link
          </label>
          <input
            id="ticketLink"
            name="ticketLink"
            type="url"
            value={formData.ticketLink}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
            placeholder="https://tickets.example.com"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 py-3 px-4 rounded-lg bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {createMutation.isPending ? 'Creating Event...' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-lg border border-dark-border hover:bg-dark-card transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
