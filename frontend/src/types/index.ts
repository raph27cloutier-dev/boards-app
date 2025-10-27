// User types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  vibePrefs: string[];
  homeNeighborhood?: string;
  tasteVector?: number[];
  trustScore: number;
  createdAt: string;
  updatedAt: string;
}

// Event types
export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startTime: string;
  endTime?: string;
  venueName?: string;
  address?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  vibe: string[];
  eventType?: string;
  capacity?: number;
  ageRestriction?: number;
  ticketLink?: string;
  popularityScore: number;
  trustScore: number;
  hostId: string;
  host?: User;
  createdAt: string;
  updatedAt: string;
  distance?: number;
  _count?: {
    rsvps: number;
  };
}

// RSVP types
export interface RSVP {
  id: string;
  userId: string;
  eventId: string;
  status: 'going' | 'interested' | 'maybe';
  createdAt: string;
  user?: User;
}

// Recommendation types
export interface RecommendationRequest {
  userId: string;
  location: {
    lat: number;
    lng: number;
  };
  radiusKm?: number;
  when?: 'now' | 'tonight' | 'weekend' | 'later';
  vibes?: string[];
  max?: number;
}

export interface ScoredEvent extends Event {
  score: number;
  reasons: string[];
  scoreBreakdown?: {
    vibe: number;
    distance: number;
    time: number;
    popularity: number;
    trust: number;
    embedding: number;
    total: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  vibePrefs: string[];
  homeNeighborhood?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Interaction types
export interface InteractionRequest {
  userId: string;
  eventId: string;
  action: 'view' | 'cosign' | 'going' | 'hide';
  dwellMs?: number;
}

// Available vibes
export const VIBES = [
  'Wild',
  'Chill',
  'Creative',
  'Foodie',
  'Active',
  'Artsy',
  'Social',
  'Intimate',
  'Professional',
  'Wellness'
] as const;

export type Vibe = typeof VIBES[number];

// Montreal neighborhoods
export const NEIGHBORHOODS = [
  'Plateau',
  'Mile-End',
  'Old Montreal',
  'Downtown',
  'NDG',
  'Griffintown',
  'Little Italy',
  'Verdun',
  'Rosemont',
  'Villeray',
  'Saint-Henri',
  'Gay Village',
  'Hochelaga',
  'Outremont'
] as const;

export type Neighborhood = typeof NEIGHBORHOODS[number];
