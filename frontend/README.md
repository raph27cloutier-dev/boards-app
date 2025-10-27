# Boards Frontend

Dark-mode, poster-wall inspired events discovery platform for Montréal.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling with dark mode
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Axios** - HTTP client
- **date-fns** - Date formatting

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:
```env
VITE_API_URL=http://localhost:3000
```

### Development

Start the dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/      # Reusable UI components
│   └── Layout.tsx   # Main layout with navigation
├── contexts/        # React contexts
│   └── AuthContext.tsx  # Authentication state
├── lib/            # Utilities and API client
│   └── api.ts      # Axios instance and API methods
├── pages/          # Page components
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── EventFeed.tsx
│   ├── EventDetail.tsx
│   ├── Recommendations.tsx
│   ├── Profile.tsx
│   └── CreateEvent.tsx
├── types/          # TypeScript type definitions
│   └── index.ts
├── App.tsx         # Main app with routing
├── main.tsx        # App entry point
└── index.css       # Global styles and Tailwind
```

## Features

### Public Features
- Browse all events with filters (vibes, search, location)
- View event details
- Poster-wall grid layout with dark mode aesthetic

### Authenticated Features
- User signup and login with JWT
- Create and manage events
- RSVP to events (going/interested/maybe)
- ML-powered personalized recommendations
- View user profiles
- Upload event posters

### Pages

1. **Event Feed** (`/`) - Browse all events with poster-wall grid
2. **Event Detail** (`/events/:id`) - Full event info with RSVP
3. **Recommendations** (`/recommendations`) - ML-powered personalized feed
4. **Profile** (`/profile/:id`) - User profile and hosted events
5. **Create Event** (`/create-event`) - Create new events with image upload
6. **Login** (`/login`) - User authentication
7. **Signup** (`/signup`) - User registration

## API Integration

The frontend connects to the Boards backend API. Key endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/events` - Browse events with filters
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (auth required)
- `POST /api/events/:id/rsvp` - RSVP to event
- `POST /api/reco/feed` - Get ML recommendations
- `GET /api/users/:id` - Get user profile

See `src/lib/api.ts` for complete API client.

## Styling

The app uses Tailwind CSS with a custom dark mode theme:

- **Background**: `#0a0a0a`
- **Cards**: `#161616`
- **Borders**: `#2a2a2a`
- **Accent Purple**: `#a855f7`
- **Accent Pink**: `#ec4899`
- **Accent Blue**: `#3b82f6`

Custom utility classes:
- `.poster-card` - Event card with hover effects
- `.poster-image` - 3:4 aspect ratio poster images
- `.gradient-overlay` - Dark gradient for text readability

## Environment Variables

Create a `.env` file with:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Learn More

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TanStack Query](https://tanstack.com/query/latest)
