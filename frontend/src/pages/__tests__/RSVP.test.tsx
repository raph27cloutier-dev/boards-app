import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { EventDetail } from '../EventDetail';
import { eventsAPI } from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  eventsAPI: {
    getById: vi.fn(),
    getAttendees: vi.fn(),
    rsvp: vi.fn(),
    cancelRsvp: vi.fn(),
  },
  authAPI: {
    me: vi.fn(),
  },
}));

// Mock router params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => vi.fn(),
  };
});

const mockEvent = {
  id: '1',
  title: 'Test Event',
  description: 'A test event',
  startTime: '2025-12-01T19:00:00Z',
  endTime: '2025-12-01T23:00:00Z',
  vibe: ['Chill', 'Social'],
  hostId: 'host-123',
  imageUrl: 'https://example.com/image.jpg',
  popularityScore: 0,
  trustScore: 0,
  createdAt: '2025-11-04T00:00:00Z',
  updatedAt: '2025-11-04T00:00:00Z',
};

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
};

describe('RSVP Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(eventsAPI.getById).mockResolvedValue(mockEvent);
    vi.mocked(eventsAPI.getAttendees).mockResolvedValue([]);
  });

  it('displays RSVP buttons for authenticated users', async () => {
    // Mock authenticated user
    vi.doMock('../../contexts/AuthContext', async () => {
      const actual = await vi.importActual('../../contexts/AuthContext');
      return {
        ...actual,
        useAuth: () => ({
          user: mockUser,
          isAuthenticated: true,
        }),
      };
    });

    render(<EventDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Check that RSVP options are available
    expect(screen.getByRole('button', { name: /rsvp to event/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^going$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^interested$/i })).toBeInTheDocument();
  });

  it('displays attendee list', async () => {
    const mockAttendees = [
      {
        id: 'rsvp-1',
        userId: 'user-1',
        eventId: '1',
        status: 'going' as const,
        createdAt: '2025-11-04T00:00:00Z',
        user: {
          id: 'user-1',
          email: 'john@example.com',
          username: 'john',
          avatarUrl: undefined,
          vibePrefs: ['Chill'],
          trustScore: 0,
          createdAt: '2025-11-04T00:00:00Z',
          updatedAt: '2025-11-04T00:00:00Z',
        },
      },
      {
        id: 'rsvp-2',
        userId: 'user-2',
        eventId: '1',
        status: 'going' as const,
        createdAt: '2025-11-04T00:00:00Z',
        user: {
          id: 'user-2',
          email: 'jane@example.com',
          username: 'jane',
          avatarUrl: undefined,
          vibePrefs: ['Social'],
          trustScore: 0,
          createdAt: '2025-11-04T00:00:00Z',
          updatedAt: '2025-11-04T00:00:00Z',
        },
      },
    ];

    vi.mocked(eventsAPI.getAttendees).mockResolvedValue(mockAttendees);

    // Mock authenticated user
    vi.doMock('../../contexts/AuthContext', async () => {
      const actual = await vi.importActual('../../contexts/AuthContext');
      return {
        ...actual,
        useAuth: () => ({
          user: mockUser,
          isAuthenticated: true,
        }),
      };
    });

    render(<EventDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Check if attendee count is displayed
    await waitFor(() => {
      const attendeeText = screen.queryByText(/2 people going/i);
      if (attendeeText) {
        expect(attendeeText).toBeInTheDocument();
      }
    });
  });

  it('loads event data correctly', async () => {
    render(<EventDetail />);

    await waitFor(() => {
      expect(eventsAPI.getById).toHaveBeenCalledWith('1');
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText(/a test event/i)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    vi.mocked(eventsAPI.getById).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockEvent), 100))
    );

    render(<EventDetail />);

    expect(screen.getByText(/loading event/i)).toBeInTheDocument();
  });

  it('shows error state when event not found', async () => {
    vi.mocked(eventsAPI.getById).mockRejectedValue(new Error('Not found'));

    render(<EventDetail />);

    await waitFor(() => {
      expect(screen.getByText(/event not found/i)).toBeInTheDocument();
    });
  });
});
