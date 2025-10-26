# Phase B: ML Embeddings & Taste Vectors

This document describes the Phase B implementation of machine learning-powered event embeddings and user taste vectors for the Boards recommendation system.

## Overview

Phase B upgrades the recommendation engine from hardcoded embeddings to automatically generated, semantically meaningful vectors that capture event characteristics and user preferences.

### Key Features

- **Automated Event Embedding Generation**: 8-dimensional vectors generated from event metadata
- **User Taste Vector Learning**: Computed from interaction history with recency decay
- **Batch Processing APIs**: Endpoints for updating embeddings at scale
- **Comprehensive Testing**: 18 unit tests covering embedding generation and taste vector computation

## Architecture

### Embedding System (`embeddings.js`)

The embedding system uses a **feature-based approach** to generate 8-dimensional vectors:

**Dimensions:**
0. **Energy Level**: Chill (0) → Wild/Loud (1)
1. **Creativity/Arts**: Practical (0) → Artistic (1)
2. **Social Scale**: Intimate (0) → Large Community (1)
3. **Food/Culinary**: Not food-related (0) → Food-centric (1)
4. **Physical Activity**: Sedentary (0) → Active/Sports (1)
5. **Nightlife Intensity**: Daytime (0) → Nightlife/Party (1)
6. **Professional/Networking**: Social (0) → Professional (1)
7. **Wellness/Mindfulness**: Not wellness (0) → Wellness-focused (1)

### Input Signals

Event embeddings are generated from multiple signals:

1. **Vibe Tags**: Direct mapping (e.g., "Wild" → high energy, "Zen" → high wellness)
2. **Event Type**: Strong semantic signal (e.g., "party" → high energy + nightlife)
3. **Text Content**: Keyword patterns in title + description
4. **Temporal Signals**: Start time (evening → nightlife boost)
5. **Capacity**: Size → social scale (small → intimate, large → community)
6. **Age Restrictions**: 19+/21+ → nightlife boost

All vectors are normalized to unit length for cosine similarity computation.

## API Endpoints

### 1. Generate Event Embedding

Generate or update embedding for a single event.

```http
POST /api/embeddings/generate/:eventId
```

**Response:**
```json
{
  "success": true,
  "eventId": "uuid",
  "embedding": {
    "id": "uuid",
    "vector": [0.523, 0.412, ...],
    "generatedAt": "2025-10-26T..."
  },
  "explanation": [
    {
      "dimension": 0,
      "label": "Energy (chill → wild)",
      "value": "0.523"
    },
    ...
  ]
}
```

### 2. Batch Generate Embeddings

Generate embeddings for multiple events or regenerate all.

```http
POST /api/embeddings/batch
Content-Type: application/json

{
  "eventIds": ["uuid1", "uuid2"],  // Optional: specific events
  "regenerateAll": false            // Optional: regenerate all events
}
```

**Default behavior (no body)**: Generate embeddings only for events without existing embeddings.

**Response:**
```json
{
  "success": true,
  "generated": 10,
  "results": [
    {
      "eventId": "uuid",
      "embeddingId": "uuid",
      "title": "Event Title"
    },
    ...
  ]
}
```

### 3. Compute User Taste Vector

Compute and update a user's taste vector from their interaction history.

```http
POST /api/users/:userId/taste-vector
Content-Type: application/json

{
  "actionWeights": {              // Optional: custom action weights
    "going": 1.0,
    "cosign": 0.8,
    "view": 0.1,
    "hide": -0.5
  },
  "recencyDecay": true,            // Optional: enable recency decay
  "decayHalfLifeDays": 30          // Optional: decay half-life in days
}
```

**Response:**
```json
{
  "success": true,
  "userId": "uuid",
  "tasteVector": [0.612, 0.523, ...],
  "interactionCount": 47,
  "explanation": [
    {
      "dimension": 0,
      "label": "Energy (chill → wild)",
      "value": "0.612"
    },
    ...
  ]
}
```

### 4. Batch Update User Taste Vectors

Update taste vectors for multiple users or all users.

```http
POST /api/embeddings/batch-users
Content-Type: application/json

{
  "userIds": ["uuid1", "uuid2"],   // Optional: specific users
  "minInteractions": 1             // Optional: minimum interactions required
}
```

**Response:**
```json
{
  "success": true,
  "processed": 50,
  "updated": 42,
  "skipped": 8,
  "results": [
    {
      "userId": "uuid",
      "username": "alice",
      "updated": true,
      "interactionCount": 23
    },
    {
      "userId": "uuid",
      "username": "bob",
      "skipped": true,
      "reason": "Only 0 interactions (min: 1)"
    },
    ...
  ]
}
```

## Taste Vector Learning

User taste vectors are computed as a **weighted average** of event embeddings from their interaction history.

### Action Weights (Default)

- **going**: 1.0 (strong positive signal)
- **cosign**: 0.8 (positive signal)
- **view**: 0.1 (weak positive signal)
- **hide**: -0.5 (negative signal)

### Recency Decay

By default, recency decay is enabled with a **30-day half-life**:

```javascript
decayFactor = 0.5 ^ (daysSince / 30)
```

This ensures recent interactions have more influence than older ones.

### Dwell Time Boost

For "view" actions, longer dwell times increase the weight (capped at 2x):

```javascript
dwellBoost = min(2, 1 + (dwellMs / 30000))
```

## Integration with Recommendation Engine

The recommendation engine (`/api/reco/feed`) now uses:

1. **Persistent taste vectors** from the database (if available)
2. **Fallback computation** if user has no taste vector but has interactions
3. **Cosine similarity** between user taste vector and event embeddings
4. **Weighted scoring** with configurable `W_EMBED` environment variable (default: 1)

**Embedding Score Calculation:**
```javascript
embedScore = cosineSimilarity(userVector, eventVector) * W_EMBED
```

This is combined with other signals (vibe overlap, proximity, time, popularity, trust) to produce the final recommendation score.

## Database Schema

### EventEmbedding Model

```prisma
model EventEmbedding {
  id          String   @id @default(uuid())
  eventId     String   @unique
  vector      Float[]  // 8-dimensional array
  generatedAt DateTime @default(now())

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
}
```

### User.tasteVector Field

```prisma
model User {
  ...
  tasteVector Float[] @default([])  // 8-dimensional array
  ...
}
```

## Automated Seeding

The seed script (`prisma/seed.js`) now automatically generates embeddings for all events:

```javascript
const embedding = generateEventEmbedding(event);
await prisma.eventEmbedding.upsert({
  where: { eventId: event.id },
  update: { vector: embedding },
  create: { eventId: event.id, vector: embedding }
});
```

**Dimension Change**: Embeddings upgraded from 5 to 8 dimensions for better semantic representation.

## Testing

Run the full test suite including embedding tests:

```bash
npm test
```

**Test Coverage:**
- Event embedding generation (party, wellness, food, art)
- User taste vector computation (single/multiple interactions)
- Action weighting (going, cosign, view, hide)
- Recency decay
- Dwell time boost
- Cosine similarity edge cases
- Vector normalization
- Embedding explanations

**Current status**: 26 tests passing (18 embedding + 8 validation)

## Usage Examples

### Example 1: Generate Embeddings for New Events

After creating events via `/api/events`, generate embeddings:

```bash
# Generate embeddings for all events without embeddings
curl -X POST http://localhost:3000/api/embeddings/batch

# Or for specific events
curl -X POST http://localhost:3000/api/embeddings/batch \
  -H "Content-Type: application/json" \
  -d '{"eventIds": ["event-uuid-1", "event-uuid-2"]}'
```

### Example 2: Update User Taste Vectors

After users interact with events, update their taste vectors:

```bash
# Update specific user
curl -X POST http://localhost:3000/api/users/USER_UUID/taste-vector

# Batch update all users with 5+ interactions
curl -X POST http://localhost:3000/api/embeddings/batch-users \
  -H "Content-Type: application/json" \
  -d '{"minInteractions": 5}'
```

### Example 3: Custom Taste Vector Weighting

Emphasize recent interactions and downweight views:

```bash
curl -X POST http://localhost:3000/api/users/USER_UUID/taste-vector \
  -H "Content-Type: application/json" \
  -d '{
    "actionWeights": {
      "going": 1.0,
      "cosign": 0.9,
      "view": 0.05,
      "hide": -1.0
    },
    "recencyDecay": true,
    "decayHalfLifeDays": 14
  }'
```

## Performance Considerations

### Event Embedding Generation

- **Computation**: O(1) per event (fast, no external APIs)
- **Storage**: 8 floats per event (~32-64 bytes depending on precision)
- **When to regenerate**:
  - After event updates (title, description, vibe, type changes)
  - During seeding
  - On-demand via API

### User Taste Vector Computation

- **Computation**: O(n) where n = interaction count
- **Storage**: 8 floats per user (~32-64 bytes)
- **When to regenerate**:
  - After new interactions (async recommended)
  - Periodic batch updates (e.g., daily cron job)
  - On-demand via API

### Recommendation Performance

The recommendation engine now:
- Uses pre-computed taste vectors (no recalculation per request)
- Falls back to on-the-fly computation only if taste vector is empty
- Caches user vectors in recommendation request context

## Future Enhancements (Phase C+)

Potential improvements for future phases:

1. **Deep Learning Embeddings**: Replace feature-based with trained embeddings (Word2Vec, Sentence-BERT)
2. **Collaborative Filtering**: Incorporate user-user similarity
3. **A/B Testing**: Compare feature-based vs ML-based embeddings
4. **Embedding Updates**: Auto-regenerate on event edits
5. **Taste Vector Triggers**: Database triggers to update taste vectors on new interactions
6. **Dimensionality**: Experiment with higher-dimensional embeddings (16, 32, 64)
7. **Context-Aware Embeddings**: Time of day, weather, season modulation

## Migration Notes

### Upgrading from Phase A

Phase B is **backward compatible** with Phase A:

1. Existing 5-dimensional embeddings will be replaced by 8-dimensional ones during seeding
2. The recommendation engine gracefully handles missing taste vectors (fallback computation)
3. Database schema changes: None (Float[] supports variable dimensions)

### Breaking Changes

- **Embedding dimensions**: Changed from 5 to 8
- **Hardcoded embeddings**: Removed from seed blueprints (now auto-generated)
- **Taste vectors**: No longer hardcoded in user seed data

### Post-Deployment Steps

1. Run database seed to regenerate all event embeddings:
   ```bash
   npm run seed
   ```

2. Batch generate taste vectors for existing users:
   ```bash
   curl -X POST http://localhost:3000/api/embeddings/batch-users
   ```

3. (Optional) Set up cron job for periodic taste vector updates

## Configuration

### Environment Variables

No new required variables. Optional tuning:

```bash
# Embedding weight in recommendation scoring (default: 1)
W_EMBED=1.5

# Existing recommendation weights still apply
W_VIBE=2
W_DISTANCE=1.5
W_TIME=1.2
W_POPULARITY=1
W_TRUST=0.5
```

## Support

For issues or questions about Phase B embeddings:
- Review test cases in `__tests__/embeddings.test.cjs`
- Check embedding explanations via API responses
- Inspect generated vectors in database: `SELECT * FROM event_embeddings LIMIT 10;`

---

**Phase B Implementation Date**: October 26, 2025
**Embedding Dimension**: 8
**Test Coverage**: 18 tests
