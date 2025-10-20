// server.js - Boards Backend API
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error();
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// ============================================
// AUTH ROUTES
// ============================================

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, username, password, displayName } = req.body;
    
    // Validation
    if (!email || !username || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: { email, username, passwordHash, displayName }
    });
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authenticate, async (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    username: req.user.username,
    displayName: req.user.displayName,
    bio: req.user.bio,
    avatarUrl: req.user.avatarUrl
  });
});

// ============================================
// EVENT ROUTES
// ============================================

// Get events with filters
app.get('/api/events', async (req, res) => {
  try {
    const { lat, lng, radius, vibe, startDate, endDate, search } = req.query;
    
    let where = {};
    
    // Time filter
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }
    
    // Vibe filter
    if (vibe) {
      where.vibe = { has: vibe };
    }
    
    // Search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { neighborhood: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    let events = await prisma.event.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        _count: {
          select: { rsvps: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });
    
    // Distance filter (if lat/lng provided)
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = radius ? parseFloat(radius) : 10; // 10km default
      
      events = events.filter(event => {
        const distance = calculateDistance(
          userLat, userLng,
          event.latitude, event.longitude
        );
        event.distance = distance;
        return distance <= maxRadius;
      }).sort((a, b) => a.distance - b.distance);
    }
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true
          }
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event (with image upload)
app.post('/api/events', authenticate, upload.single('image'), async (req, res) => {
  try {
    const {
      title, description, startTime, endTime,
      venueName, address, neighborhood,
      latitude, longitude, vibe, eventType,
      capacity, ageRestriction, ticketLink
    } = req.body;
    
    // Validation
    if (!title || !startTime || !address || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    let imageUrl = null;
    
    // Upload image to Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'boards-events' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }
    
    // Parse vibe if it's a string
    const vibeArray = typeof vibe === 'string' ? JSON.parse(vibe) : vibe;
    
    const event = await prisma.event.create({
      data: {
        title,
        description: description || '',
        imageUrl: imageUrl || '',
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        venueName,
        address,
        neighborhood: neighborhood || 'Montreal',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        vibe: vibeArray || [],
        eventType: eventType || 'other',
        capacity: capacity ? parseInt(capacity) : null,
        ageRestriction,
        ticketLink,
        hostId: req.user.id
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
app.put('/api/events/:id', authenticate, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data: req.body
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event
app.delete('/api/events/:id', authenticate, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.event.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RSVP ROUTES
// ============================================

// RSVP to event
app.post('/api/events/:id/rsvp', authenticate, async (req, res) => {
  try {
    const { status } = req.body; // "going", "interested", "maybe"
    
    const rsvp = await prisma.rSVP.upsert({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId: req.params.id
        }
      },
      update: { status },
      create: {
        userId: req.user.id,
        eventId: req.params.id,
        status: status || 'going'
      }
    });
    
    res.json(rsvp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove RSVP
app.delete('/api/events/:id/rsvp', authenticate, async (req, res) => {
  try {
    await prisma.rSVP.delete({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId: req.params.id
        }
      }
    });
    
    res.json({ message: 'RSVP removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event attendees
app.get('/api/events/:id/attendees', async (req, res) => {
  try {
    const rsvps = await prisma.rSVP.findMany({
      where: { eventId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });
    
    res.json(rsvps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// USER ROUTES
// ============================================

// Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            events: true,
            followers: true,
            following: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's hosted events
app.get('/api/users/:id/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { hostId: req.params.id },
      include: {
        _count: {
          select: { rsvps: true }
        }
      },
      orderBy: { startTime: 'desc' }
    });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎪 Boards API running on port ${PORT}`);
});
