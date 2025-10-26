// server.js - Boards Backend API
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');
const { ZodError } = require('zod');
const {
  validateEventCreate,
  validateEventUpdate,
  validateRecommendationInput,
  validateImageMimeType,
} = require('./validation');
const {
  generateEventEmbedding,
  computeUserTasteVector,
  cosineSimilarity: cosineSim,
  explainEmbedding,
} = require('./embeddings');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Cloudinary config
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const allowOrigins = (process.env.CORS_ALLOWLIST || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  const commonHeaders = ['Content-Type', 'Authorization'];

  if (!origin) {
    callback(null, {
      origin: true,
      credentials: true,
      allowedHeaders: commonHeaders,
      methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
    });
    return;
  }

  if (req.method === 'GET' || req.method === 'OPTIONS') {
    callback(null, {
      origin: true,
      credentials: true,
      allowedHeaders: commonHeaders,
      methods: ['GET', 'HEAD', 'OPTIONS'],
    });
    return;
  }

  if (allowOrigins.length === 0 || allowOrigins.includes(origin)) {
    callback(null, {
      origin,
      credentials: true,
      allowedHeaders: commonHeaders,
    });
    return;
  }

  callback(new Error('CORS_NOT_ALLOWED'));
};

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  next();
});

app.use(cors(corsOptionsDelegate));
app.options('*', cors(corsOptionsDelegate));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));

// ===============
// Helpers
// ===============

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const weights = {
  vibe: Number(process.env.W_VIBE ?? 2),
  distance: Number(process.env.W_DISTANCE ?? 1.5),
  time: Number(process.env.W_TIME ?? 1.2),
  popularity: Number(process.env.W_POPULARITY ?? 1),
  trust: Number(process.env.W_TRUST ?? 0.5),
  embed: Number(process.env.W_EMBED ?? 1),
};

const POPULARITY_IMPACT = {
  view: 0.1,
  cosign: 0.6,
  going: 1,
  hide: -0.8,
};

// Auth middleware
const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Please authenticate' });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

  if (!user) {
    return res.status(401).json({ error: 'Please authenticate' });
  }

  req.user = user;
  next();
});

// ===============
// Utility functions
// ===============

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function buildTimeFilter(query) {
  const { startDate, endDate, when } = query;
  if (startDate || endDate) {
    const range = {};
    if (startDate) range.gte = new Date(startDate);
    if (endDate) range.lte = new Date(endDate);
    return range;
  }

  if (!when) return undefined;

  const now = new Date();
  const window = { gte: now };
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(startOfDay.getDate() + 1);

  switch (when) {
    case 'now': {
      window.gte = now;
      const twoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      window.lte = twoHours;
      break;
    }
    case 'tonight': {
      const tonight = new Date(startOfDay);
      tonight.setHours(17, 0, 0, 0);
      window.gte = tonight;
      window.lte = endOfDay;
      break;
    }
    case 'weekend': {
      const day = now.getDay();
      const daysUntilSaturday = (6 - day + 7) % 7;
      const saturday = new Date(startOfDay);
      saturday.setDate(startOfDay.getDate() + daysUntilSaturday);
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      sunday.setHours(23, 59, 59, 999);
      window.gte = saturday;
      window.lte = sunday;
      break;
    }
    case 'month': {
      const monthAhead = new Date(startOfDay);
      monthAhead.setMonth(monthAhead.getMonth() + 1);
      window.gte = now;
      window.lte = monthAhead;
      break;
    }
    default:
      return undefined;
  }

  return window;
}

// Cosine similarity function now imported from embeddings.js
// Using cosineSim as alias to avoid conflicts

function buildReasons({
  vibeOverlap,
  distanceKm,
  radiusKm,
  timeBucket,
  hostTrust,
  popularity,
  cosine,
}) {
  const reasons = [];
  if (vibeOverlap >= 2) {
    reasons.push('Matches multiple of your vibes');
  } else if (vibeOverlap === 1) {
    reasons.push('Matches one of your vibes');
  }

  if (distanceKm != null) {
    if (distanceKm <= Math.max(radiusKm * 0.4, 1)) {
      reasons.push('Very close to you');
    } else if (distanceKm <= radiusKm) {
      reasons.push('Near your location');
    }
  }

  if (timeBucket === 'now') {
    reasons.push('Happening right now');
  } else if (timeBucket === 'tonight') {
    reasons.push('Hitting tonight');
  } else if (timeBucket === 'weekend') {
    reasons.push('Weekend highlight');
  }

  if (hostTrust >= 0.7) {
    reasons.push('Trusted host');
  }

  if (popularity >= 2) {
    reasons.push('Trending with the community');
  }

  if (cosine >= 0.6) {
    reasons.push('Feels like your taste');
  }

  return reasons;
}

function bucketByWhen(eventDate, when) {
  if (!when) return null;
  const now = new Date();
  if (when === 'now' && eventDate <= new Date(now.getTime() + 2 * 60 * 60 * 1000)) {
    return 'now';
  }
  if (when === 'tonight') {
    const tonightStart = new Date();
    tonightStart.setHours(17, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    if (eventDate >= tonightStart && eventDate <= endOfDay) {
      return 'tonight';
    }
  }
  if (when === 'weekend') {
    const day = now.getDay();
    const saturday = new Date();
    saturday.setDate(now.getDate() + ((6 - day + 7) % 7));
    saturday.setHours(0, 0, 0, 0);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    sunday.setHours(23, 59, 59, 999);
    if (eventDate >= saturday && eventDate <= sunday) {
      return 'weekend';
    }
  }
  return 'later';
}

// ===============
// Routes
// ===============

app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

app.get('/status', (req, res) => {
  res.sendFile(path.join(__dirname, 'status.html'));
});

// Signup
app.post(
  '/api/auth/signup',
  asyncHandler(async (req, res) => {
    const { email, username, password, displayName, vibePrefs = [], homeNeighborhood } = req.body;

    if (!email || !username || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName,
        vibePrefs,
        homeNeighborhood,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_TTL || '7d',
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
      token,
    });
  })
);

// Login
app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_TTL || '7d',
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
      token,
    });
  })
);

// Get current user
app.get(
  '/api/auth/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      displayName: req.user.displayName,
      bio: req.user.bio,
      avatarUrl: req.user.avatarUrl,
      vibePrefs: req.user.vibePrefs,
      homeNeighborhood: req.user.homeNeighborhood,
    });
  })
);

// Events feed
app.get(
  '/api/events',
  asyncHandler(async (req, res) => {
    const { near, lat, lng, radius, radiusKm, vibe, vibes, search } = req.query;

    const where = {};

    const timeRange = buildTimeFilter(req.query);
    if (timeRange) {
      where.startTime = timeRange;
    }

    const vibeTags = new Set();
    if (vibe) {
      vibeTags.add(String(vibe));
    }
    const rawVibes = Array.isArray(vibes) ? vibes : vibes ? [vibes] : [];
    rawVibes.forEach((value) => {
      String(value)
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .forEach((tag) => vibeTags.add(tag));
    });

    if (vibeTags.size) {
      where.vibe = { hasSome: Array.from(vibeTags) };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { neighborhood: { contains: search, mode: 'insensitive' } },
      ];
    }

    const location = (() => {
      if (near) {
        const [nearLat, nearLng] = String(near)
          .split(',')
          .map((value) => parseFloat(value.trim()));
        if (!Number.isNaN(nearLat) && !Number.isNaN(nearLng)) {
          return { lat: nearLat, lng: nearLng };
        }
      }
      if (lat != null && lng != null) {
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);
        if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
          return { lat: parsedLat, lng: parsedLng };
        }
      }
      return null;
    })();

    const parsedRadius = [radiusKm, radius]
      .map((value) => (value != null ? parseFloat(value) : NaN))
      .find((value) => !Number.isNaN(value) && value > 0);
    const maxRadiusKm = parsedRadius || (location ? 10 : null);

    let events = await prisma.event.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
          },
        },
        _count: { select: { rsvps: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    if (location) {
      events = events
        .map((event) => {
          const distanceKm = calculateDistance(location.lat, location.lng, event.latitude, event.longitude);
          return { ...event, distanceKm };
        })
        .filter((event) =>
          maxRadiusKm != null ? event.distanceKm != null && event.distanceKm <= maxRadiusKm : event.distanceKm != null
        )
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    res.json(events);
  })
);

// Single event
app.get(
  '/api/events/:id',
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            trustScore: true,
          },
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  })
);

// Create event
app.post(
  '/api/events',
  authenticate,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const payload = validateEventCreate(req.body);
    let imageUrl = '';

    if (req.file) {
      validateImageMimeType(req.file);
      if (!cloudinary.config().cloud_name) {
        return res.status(503).json({ error: 'Uploads unavailable' });
      }

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'boards-events' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    const event = await prisma.event.create({
      data: {
        title: payload.title,
        description: payload.description || '',
        imageUrl,
        startTime: payload.startTime,
        endTime: payload.endTime,
        venueName: payload.venueName,
        address: payload.address,
        neighborhood: payload.neighborhood || req.user.homeNeighborhood || 'Montreal',
        latitude: payload.latitude,
        longitude: payload.longitude,
        vibe: payload.vibe,
        eventType: payload.eventType,
        capacity: payload.capacity,
        ageRestriction: payload.ageRestriction,
        ticketLink: payload.ticketLink,
        hostId: req.user.id,
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
          },
        },
      },
    });

    res.status(201).json(event);
  })
);

// Update event
app.put(
  '/api/events/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const data = validateEventUpdate(req.body);

    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data,
    });

    res.json(updated);
  })
);

// Delete event
app.delete(
  '/api/events/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.event.delete({ where: { id: req.params.id } });

    res.json({ message: 'Event deleted' });
  })
);

// RSVP routes
app.post(
  '/api/events/:id/rsvp',
  authenticate,
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    const rsvp = await prisma.rSVP.upsert({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId: req.params.id,
        },
      },
      update: { status },
      create: {
        userId: req.user.id,
        eventId: req.params.id,
        status: status || 'going',
      },
    });

    res.json(rsvp);
  })
);

app.delete(
  '/api/events/:id/rsvp',
  authenticate,
  asyncHandler(async (req, res) => {
    await prisma.rSVP.delete({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId: req.params.id,
        },
      },
    });

    res.json({ message: 'RSVP removed' });
  })
);

app.get(
  '/api/events/:id/attendees',
  asyncHandler(async (req, res) => {
    const rsvps = await prisma.rSVP.findMany({
      where: { eventId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(rsvps);
  })
);

// User profile
app.get(
  '/api/users/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        trustScore: true,
        vibePrefs: true,
        homeNeighborhood: true,
        _count: {
          select: {
            events: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  })
);

app.get(
  '/api/users/:id/events',
  asyncHandler(async (req, res) => {
    const events = await prisma.event.findMany({
      where: { hostId: req.params.id },
      include: {
        _count: { select: { rsvps: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json(events);
  })
);

// Recommendation feed
app.post(
  '/api/reco/feed',
  asyncHandler(async (req, res) => {
    const { userId, location, radiusKm, when, vibes, max } = validateRecommendationInput(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const eventTimeRange = buildTimeFilter({ when }) || { gte: now };

    const events = await prisma.event.findMany({
      where: {
        startTime: eventTimeRange,
      },
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            trustScore: true,
          },
        },
        embedding: true,
        _count: { select: { rsvps: true } },
      },
    });

    const userInteractions = await prisma.interaction.findMany({
      where: { userId, action: { in: ['going', 'cosign'] } },
      include: {
        event: {
          include: {
            embedding: true,
          },
        },
      },
    });

    let userVector = Array.isArray(user.tasteVector) ? user.tasteVector : [];
    if (!userVector.length && userInteractions.length) {
      const vectors = userInteractions
        .map((interaction) => interaction.event.embedding?.vector)
        .filter((vector) => Array.isArray(vector) && vector.length);
      if (vectors.length) {
        const dimension = vectors[0].length;
        const sums = new Array(dimension).fill(0);
        for (const vector of vectors) {
          vector.forEach((value, index) => {
            sums[index] += value;
          });
        }
        userVector = sums.map((value) => value / vectors.length);
      }
    }

    const searchVibes = new Set([...(user.vibePrefs || []), ...vibes]);

    const scored = events
      .map((event) => {
        const distanceKm = calculateDistance(location.lat, location.lng, event.latitude, event.longitude);
        if (distanceKm != null && distanceKm > radiusKm) {
          return null;
        }

        const vibeOverlap = event.vibe.reduce(
          (count, tag) => (searchVibes.has(tag) ? count + 1 : count),
          0
        );
        const vibeScore = vibeOverlap * weights.vibe;

        const distanceScore = distanceKm != null ? weights.distance * Math.max(0, 1 - distanceKm / Math.max(radiusKm, 1)) : 0;

        const timeBucket = bucketByWhen(event.startTime, when || null);
        let timeScore = 0;
        if (timeBucket === 'now') timeScore = weights.time;
        else if (timeBucket === 'tonight') timeScore = weights.time * 0.75;
        else if (timeBucket === 'weekend') timeScore = weights.time * 0.6;
        else timeScore = weights.time * 0.4;

        const popularityScore = (event.popularityScore || 0) + (event._count?.rsvps || 0) * 0.1;
        const trustScore = event.host?.trustScore || event.trustScore || 0.5;

        const cosine = cosineSim(userVector, event.embedding?.vector);
        const embedScore = cosine * weights.embed;

        const total =
          vibeScore +
          distanceScore +
          timeScore +
          popularityScore * weights.popularity +
          trustScore * weights.trust +
          embedScore;

        const reasons = buildReasons({
          vibeOverlap,
          distanceKm,
          radiusKm,
          timeBucket,
          hostTrust: trustScore,
          popularity: popularityScore,
          cosine,
        });

        return {
          ...event,
          distanceKm,
          score: Number(total.toFixed(3)),
          reasons,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(max, 50));

    res.json({
      generatedAt: new Date().toISOString(),
      count: scored.length,
      events: scored,
    });
  })
);

app.post(
  '/api/reco/feedback',
  asyncHandler(async (req, res) => {
    const { userId, eventId, action, dwellMs } = req.body || {};

    if (!userId || !eventId || !action) {
      return res.status(400).json({ error: 'userId, eventId, and action are required' });
    }

    const [user, event] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.event.findUnique({ where: { id: eventId } }),
    ]);

    if (!user || !event) {
      return res.status(404).json({ error: 'User or event not found' });
    }

    const interaction = await prisma.interaction.create({
      data: {
        userId,
        eventId,
        action,
        dwellMs: dwellMs != null ? Number(dwellMs) : null,
      },
    });

    const popularityDelta = POPULARITY_IMPACT[action] ?? 0;
    if (popularityDelta !== 0) {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          popularityScore: { increment: popularityDelta },
        },
      });

      if (action === 'going' || action === 'cosign') {
        await prisma.user.update({
          where: { id: event.hostId },
          data: {
            trustScore: {
              increment: Math.max(popularityDelta, 0) * 0.05,
            },
          },
        });
      }
    }

    res.status(201).json({ success: true, interaction });
  })
);

// ===============
// Embedding & Taste Vector Management (Phase B)
// ===============

// Generate embedding for a single event
app.post(
  '/api/embeddings/generate/:eventId',
  asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const vector = generateEventEmbedding(event);

    const embedding = await prisma.eventEmbedding.upsert({
      where: { eventId },
      create: {
        eventId,
        vector,
      },
      update: {
        vector,
        generatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      eventId,
      embedding: {
        id: embedding.id,
        vector: embedding.vector,
        generatedAt: embedding.generatedAt,
      },
      explanation: explainEmbedding(vector),
    });
  })
);

// Batch generate embeddings for all events (or filtered set)
app.post(
  '/api/embeddings/batch',
  asyncHandler(async (req, res) => {
    const { eventIds, regenerateAll = false } = req.body || {};

    let whereClause = {};
    if (Array.isArray(eventIds) && eventIds.length > 0) {
      whereClause = { id: { in: eventIds } };
    } else if (!regenerateAll) {
      // Default: only generate for events without embeddings
      const eventsWithEmbeddings = await prisma.eventEmbedding.findMany({
        select: { eventId: true },
      });
      const eventIdsWithEmbeddings = eventsWithEmbeddings.map(e => e.eventId);
      whereClause = { id: { notIn: eventIdsWithEmbeddings } };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
    });

    const results = [];
    for (const event of events) {
      const vector = generateEventEmbedding(event);
      const embedding = await prisma.eventEmbedding.upsert({
        where: { eventId: event.id },
        create: {
          eventId: event.id,
          vector,
        },
        update: {
          vector,
          generatedAt: new Date(),
        },
      });
      results.push({
        eventId: event.id,
        embeddingId: embedding.id,
        title: event.title,
      });
    }

    res.json({
      success: true,
      generated: results.length,
      results,
    });
  })
);

// Compute and update user taste vector from interaction history
app.post(
  '/api/users/:userId/taste-vector',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { actionWeights, recencyDecay, decayHalfLifeDays } = req.body || {};

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch user interactions with event embeddings
    const interactions = await prisma.interaction.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            embedding: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (interactions.length === 0) {
      return res.json({
        success: true,
        userId,
        tasteVector: [],
        interactionCount: 0,
        message: 'No interactions found - taste vector not updated',
      });
    }

    const options = {};
    if (actionWeights) options.actionWeights = actionWeights;
    if (recencyDecay !== undefined) options.recencyDecay = recencyDecay;
    if (decayHalfLifeDays) options.decayHalfLifeDays = decayHalfLifeDays;

    const tasteVector = computeUserTasteVector(interactions, options);

    // Update user's taste vector
    await prisma.user.update({
      where: { id: userId },
      data: { tasteVector },
    });

    res.json({
      success: true,
      userId,
      tasteVector,
      interactionCount: interactions.length,
      explanation: explainEmbedding(tasteVector),
    });
  })
);

// Batch update taste vectors for all users (or filtered set)
app.post(
  '/api/embeddings/batch-users',
  asyncHandler(async (req, res) => {
    const { userIds, minInteractions = 1 } = req.body || {};

    let whereClause = {};
    if (Array.isArray(userIds) && userIds.length > 0) {
      whereClause = { id: { in: userIds } };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
    });

    const results = [];
    for (const user of users) {
      const interactions = await prisma.interaction.findMany({
        where: { userId: user.id },
        include: {
          event: {
            include: {
              embedding: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (interactions.length < minInteractions) {
        results.push({
          userId: user.id,
          username: user.username,
          skipped: true,
          reason: `Only ${interactions.length} interactions (min: ${minInteractions})`,
        });
        continue;
      }

      const tasteVector = computeUserTasteVector(interactions);
      await prisma.user.update({
        where: { id: user.id },
        data: { tasteVector },
      });

      results.push({
        userId: user.id,
        username: user.username,
        updated: true,
        interactionCount: interactions.length,
      });
    }

    res.json({
      success: true,
      processed: results.length,
      updated: results.filter(r => r.updated).length,
      skipped: results.filter(r => r.skipped).length,
      results,
    });
  })
);

// ===============
// Error handling & shutdown
// ===============

app.use((err, req, res, next) => {
  if (err.message === 'CORS_NOT_ALLOWED') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.') || 'root',
        message: issue.message,
      })),
    });
  }

  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🎪 Boards API running on port ${PORT}`);
});

async function shutdown() {
  console.log('Gracefully shutting down');
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
