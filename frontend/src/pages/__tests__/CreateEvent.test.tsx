import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/test-utils';
import { CreateEvent } from '../CreateEvent';
import { eventsAPI } from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  eventsAPI: {
    create: vi.fn(),
  },
  authAPI: {
    me: vi.fn(),
  },
}));

// Mock useAuth with authenticated user while preserving other exports
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      },
      isAuthenticated: true,
    }),
  };
});

// Mock useToast while preserving other exports
const mockShowToast = vi.fn();
vi.mock('../../contexts/ToastContext', async () => {
  const actual = await vi.importActual('../../contexts/ToastContext');
  return {
    ...actual,
    useToast: () => ({
      showToast: mockShowToast,
    }),
  };
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreateEvent Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create event form', () => {
    render(<CreateEvent />);

    expect(screen.getByRole('heading', { name: /create event/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/event title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date & time/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
  });

  it('shows all vibes as selectable buttons', () => {
    render(<CreateEvent />);

    // These are the actual vibes from the types file
    const vibes = ['Wild', 'Chill', 'Creative', 'Foodie', 'Active', 'Artsy', 'Social', 'Intimate', 'Professional', 'Wellness'];

    vibes.forEach((vibe) => {
      expect(screen.getByRole('button', { name: vibe })).toBeInTheDocument();
    });
  });

  it('successfully creates event with required fields', async () => {
    const user = userEvent.setup();
    const mockEvent = {
      id: '1',
      title: 'Test Event',
      description: 'A great test event',
    };

    vi.mocked(eventsAPI.create).mockResolvedValue(mockEvent);

    render(<CreateEvent />);

    // Fill required fields
    await user.type(screen.getByLabelText(/event title/i), 'Test Event');
    await user.type(screen.getByLabelText(/description/i), 'A great test event');
    await user.type(screen.getByLabelText(/start date & time/i), '2025-12-01T19:00');

    // Select at least one vibe
    await user.click(screen.getByRole('button', { name: 'Chill' }));

    // Submit form
    await user.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => {
      expect(eventsAPI.create).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Event created successfully!', 'success');
      expect(mockNavigate).toHaveBeenCalledWith('/events/1');
    });
  });

  it('requires at least one vibe to be selected', async () => {
    const user = userEvent.setup();
    render(<CreateEvent />);

    // Fill required fields but don't select a vibe
    await user.type(screen.getByLabelText(/event title/i), 'Test Event');
    await user.type(screen.getByLabelText(/description/i), 'A great test event');
    await user.type(screen.getByLabelText(/start date & time/i), '2025-12-01T19:00');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => {
      expect(screen.getByText(/please select at least one vibe/i)).toBeInTheDocument();
      expect(eventsAPI.create).not.toHaveBeenCalled();
    });
  });

  it('toggles vibe selection', async () => {
    const user = userEvent.setup();
    render(<CreateEvent />);

    const chillButton = screen.getByRole('button', { name: 'Chill' });

    // Initially not selected (should have inactive class)
    expect(chillButton).toHaveClass('filter-button-inactive');

    // Click to select
    await user.click(chillButton);
    expect(chillButton).toHaveClass('filter-button-active');

    // Click to deselect
    await user.click(chillButton);
    expect(chillButton).toHaveClass('filter-button-inactive');
  });

  it('allows selecting multiple vibes', async () => {
    const user = userEvent.setup();
    render(<CreateEvent />);

    const chillButton = screen.getByRole('button', { name: 'Chill' });
    const wildButton = screen.getByRole('button', { name: 'Wild' });

    await user.click(chillButton);
    await user.click(wildButton);

    expect(chillButton).toHaveClass('filter-button-active');
    expect(wildButton).toHaveClass('filter-button-active');
  });

  it('handles image file selection and preview', async () => {
    const user = userEvent.setup();
    render(<CreateEvent />);

    const file = new File(['dummy image'], 'test.png', { type: 'image/png' });
    // The input has id="image-upload" and is hidden
    const input = document.getElementById('image-upload') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      const preview = screen.getByAltText(/preview/i);
      expect(preview).toBeInTheDocument();
    });
  });

  it('populates optional fields correctly', async () => {
    const user = userEvent.setup();
    render(<CreateEvent />);

    await user.type(screen.getByLabelText(/venue name/i), 'Cool Venue');
    await user.type(screen.getByLabelText(/address/i), '123 Test St, Montreal');
    await user.type(screen.getByLabelText(/capacity/i), '100');
    await user.type(screen.getByLabelText(/age restriction/i), '18');
    await user.type(screen.getByLabelText(/ticket link/i), 'https://example.com/tickets');

    expect(screen.getByLabelText(/venue name/i)).toHaveValue('Cool Venue');
    expect(screen.getByLabelText(/address/i)).toHaveValue('123 Test St, Montreal');
    expect(screen.getByLabelText(/capacity/i)).toHaveValue(100);
    expect(screen.getByLabelText(/age restriction/i)).toHaveValue(18);
    expect(screen.getByLabelText(/ticket link/i)).toHaveValue('https://example.com/tickets');
  });

  it('displays error message on failed creation', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to create event';

    vi.mocked(eventsAPI.create).mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    render(<CreateEvent />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/event title/i), 'Test Event');
    await user.type(screen.getByLabelText(/description/i), 'A great test event');
    await user.type(screen.getByLabelText(/start date & time/i), '2025-12-01T19:00');
    await user.click(screen.getByRole('button', { name: 'Chill' }));
    await user.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockShowToast).toHaveBeenCalledWith(errorMessage, 'error');
    });
  });

  it('disables submit button during creation', async () => {
    const user = userEvent.setup();

    vi.mocked(eventsAPI.create).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<CreateEvent />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/event title/i), 'Test Event');
    await user.type(screen.getByLabelText(/description/i), 'A great test event');
    await user.type(screen.getByLabelText(/start date & time/i), '2025-12-01T19:00');
    await user.click(screen.getByRole('button', { name: 'Chill' }));

    const submitButton = screen.getByRole('button', { name: /create event/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating event/i)).toBeInTheDocument();
  });

  it('has cancel button that navigates back', async () => {
    const user = userEvent.setup();
    render(<CreateEvent />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
