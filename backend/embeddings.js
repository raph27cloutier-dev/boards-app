// embeddings.js - Event Embedding Generation System
// Phase B: ML-based event embeddings and user taste vectors

/**
 * Generate an 8-dimensional embedding vector from event data
 *
 * Dimensions:
 * 0: Energy level (0=chill, 1=wild/loud)
 * 1: Creativity/Arts (0=practical, 1=creative/artistic)
 * 2: Social scale (0=intimate, 1=large/community)
 * 3: Food/Culinary focus (0=not food-related, 1=food-centric)
 * 4: Physical activity (0=sedentary, 1=active/sports)
 * 5: Nightlife intensity (0=daytime/casual, 1=nightlife/party)
 * 6: Professional/Networking (0=social, 1=professional)
 * 7: Wellness/Mindfulness (0=not wellness, 1=wellness-focused)
 */

const VIBE_WEIGHTS = {
  // Energy dimension (0)
  Wild: { 0: 1.0, 5: 0.7 },
  Loud: { 0: 0.9, 5: 0.6 },
  Chill: { 0: -0.8, 7: 0.4 },
  Intimate: { 0: -0.6, 2: -0.7 },

  // Creativity dimension (1)
  Creative: { 1: 0.9 },
  Artsy: { 1: 0.8, 7: 0.3 },

  // Social scale dimension (2)
  Community: { 2: 0.8 },

  // Food dimension (3)
  Foodie: { 3: 1.0 },

  // Professional dimension (6)
  Professional: { 6: 0.9 },

  // Wellness dimension (7)
  Zen: { 7: 0.9, 0: -0.5 },
};

const EVENT_TYPE_WEIGHTS = {
  // High energy events
  party: { 0: 0.9, 5: 0.9, 2: 0.5 },
  dance: { 0: 0.8, 5: 0.7, 4: 0.6 },
  concert: { 0: 0.7, 1: 0.6, 5: 0.6, 2: 0.4 },
  festival: { 0: 0.6, 2: 0.9, 1: 0.5 },

  // Creative/Arts events
  art: { 1: 0.9, 0: -0.3 },
  theatre: { 1: 0.8, 0: -0.2 },
  music: { 1: 0.7, 0: 0.3 },
  workshop: { 1: 0.6, 6: 0.4 },

  // Food events
  food: { 3: 0.9, 2: 0.3 },
  market: { 3: 0.5, 2: 0.6, 1: 0.4 },

  // Active events
  sports: { 4: 0.9, 0: 0.4 },

  // Professional events
  networking: { 6: 0.9, 0: -0.4 },
  talk: { 6: 0.7, 1: 0.3 },
  meetup: { 6: 0.5, 2: 0.5 },

  // Wellness events
  wellness: { 7: 0.9, 0: -0.6 },

  // Community events
  community: { 2: 0.8, 0: 0.1 },

  // Default
  other: {},
};

const KEYWORD_PATTERNS = {
  // Energy patterns
  energy: [
    { pattern: /\b(rave|rager|wild|crazy|insane|lit)\b/i, weights: { 0: 0.3, 5: 0.3 } },
    { pattern: /\b(chill|relax|calm|peaceful|quiet)\b/i, weights: { 0: -0.3, 7: 0.2 } },
    { pattern: /\b(intense|hardcore|aggressive)\b/i, weights: { 0: 0.4, 4: 0.2 } },
  ],

  // Creative patterns
  creative: [
    { pattern: /\b(art|artistic|creative|gallery|exhibition)\b/i, weights: { 1: 0.3 } },
    { pattern: /\b(paint|drawing|sculpture|installation)\b/i, weights: { 1: 0.4 } },
    { pattern: /\b(music|musical|band|dj|live)\b/i, weights: { 1: 0.2, 0: 0.2 } },
  ],

  // Social scale patterns
  social: [
    { pattern: /\b(intimate|small|exclusive|limited)\b/i, weights: { 2: -0.3 } },
    { pattern: /\b(community|everyone|open|public)\b/i, weights: { 2: 0.3 } },
    { pattern: /\b(massive|huge|big|large)\b/i, weights: { 2: 0.4 } },
  ],

  // Food patterns
  food: [
    { pattern: /\b(food|eat|dining|restaurant|cuisine)\b/i, weights: { 3: 0.3 } },
    { pattern: /\b(wine|beer|cocktail|drinks)\b/i, weights: { 3: 0.2, 5: 0.2 } },
    { pattern: /\b(chef|cooking|tasting|culinary)\b/i, weights: { 3: 0.4 } },
  ],

  // Activity patterns
  activity: [
    { pattern: /\b(sport|athletic|fitness|exercise|workout)\b/i, weights: { 4: 0.4 } },
    { pattern: /\b(run|bike|hike|climb|skate)\b/i, weights: { 4: 0.3 } },
  ],

  // Nightlife patterns
  nightlife: [
    { pattern: /\b(night|midnight|late|after.?dark)\b/i, weights: { 5: 0.3 } },
    { pattern: /\b(club|clubbing|dancing|nightclub)\b/i, weights: { 5: 0.4, 0: 0.3 } },
  ],

  // Professional patterns
  professional: [
    { pattern: /\b(network|business|career|professional)\b/i, weights: { 6: 0.3 } },
    { pattern: /\b(startup|entrepreneur|tech|innovation)\b/i, weights: { 6: 0.4 } },
    { pattern: /\b(conference|seminar|presentation|talk)\b/i, weights: { 6: 0.3 } },
  ],

  // Wellness patterns
  wellness: [
    { pattern: /\b(wellness|meditation|yoga|mindful)\b/i, weights: { 7: 0.4 } },
    { pattern: /\b(healing|therapy|spiritual|zen)\b/i, weights: { 7: 0.3 } },
    { pattern: /\b(sound.?bath|breathwork|holistic)\b/i, weights: { 7: 0.5 } },
  ],
};

/**
 * Generate embedding vector from event data
 * @param {Object} event - Event object with title, description, vibe, eventType
 * @returns {number[]} 8-dimensional embedding vector
 */
function generateEventEmbedding(event) {
  const vector = new Array(8).fill(0);

  // 1. Process vibe tags
  if (Array.isArray(event.vibe)) {
    event.vibe.forEach(vibe => {
      const weights = VIBE_WEIGHTS[vibe];
      if (weights) {
        Object.entries(weights).forEach(([dim, weight]) => {
          vector[parseInt(dim)] += weight;
        });
      }
    });
  }

  // 2. Process event type
  const typeWeights = EVENT_TYPE_WEIGHTS[event.eventType] || EVENT_TYPE_WEIGHTS.other;
  Object.entries(typeWeights).forEach(([dim, weight]) => {
    vector[parseInt(dim)] += weight * 1.2; // Event type is a strong signal
  });

  // 3. Process text content (title + description)
  const text = `${event.title || ''} ${event.description || ''}`.toLowerCase();

  Object.values(KEYWORD_PATTERNS).forEach(patterns => {
    patterns.forEach(({ pattern, weights }) => {
      if (pattern.test(text)) {
        Object.entries(weights).forEach(([dim, weight]) => {
          vector[parseInt(dim)] += weight;
        });
      }
    });
  });

  // 4. Time-based signals
  if (event.startTime) {
    const hour = new Date(event.startTime).getHours();
    // Evening/night events (6pm - 2am)
    if (hour >= 18 || hour <= 2) {
      vector[5] += 0.4; // Nightlife dimension
    }
    // Early morning events (6am - 9am)
    if (hour >= 6 && hour <= 9) {
      vector[7] += 0.3; // Wellness dimension (morning wellness)
    }
  }

  // 5. Capacity-based social scale signal
  if (event.capacity) {
    if (event.capacity <= 30) {
      vector[2] -= 0.3; // Intimate
    } else if (event.capacity >= 200) {
      vector[2] += 0.4; // Large community event
    }
  }

  // 6. Age restriction signals
  if (event.ageRestriction) {
    if (event.ageRestriction === '19+' || event.ageRestriction === '21+') {
      vector[5] += 0.3; // Nightlife
      vector[0] += 0.2; // Higher energy
    } else if (event.ageRestriction === 'All ages') {
      vector[2] += 0.2; // More community-oriented
    }
  }

  // Normalize to unit vector
  return normalizeVector(vector);
}

/**
 * Compute user taste vector from their interaction history
 * @param {Array} interactions - Array of interaction objects with event.embedding
 * @param {Object} options - Weighting options
 * @returns {number[]} 8-dimensional taste vector
 */
function computeUserTasteVector(interactions, options = {}) {
  const {
    actionWeights = { going: 1.0, cosign: 0.8, view: 0.1, hide: -0.5 },
    recencyDecay = true,
    decayHalfLifeDays = 30,
  } = options;

  if (!interactions || interactions.length === 0) {
    return [];
  }

  const now = new Date();
  const vector = new Array(8).fill(0);
  let totalWeight = 0;

  interactions.forEach(interaction => {
    const embedding = interaction.event?.embedding?.vector;
    if (!Array.isArray(embedding) || embedding.length !== 8) {
      return;
    }

    // Get action weight
    let weight = actionWeights[interaction.action] || 0;

    // Apply recency decay if enabled
    if (recencyDecay && interaction.createdAt) {
      const daysSince = (now - new Date(interaction.createdAt)) / (1000 * 60 * 60 * 24);
      const decayFactor = Math.pow(0.5, daysSince / decayHalfLifeDays);
      weight *= decayFactor;
    }

    // Apply dwell time boost for views
    if (interaction.action === 'view' && interaction.dwellMs) {
      // Boost weight for longer dwell times (capped at 2x)
      const dwellBoost = Math.min(2, 1 + (interaction.dwellMs / 30000));
      weight *= dwellBoost;
    }

    if (weight !== 0) {
      embedding.forEach((value, index) => {
        vector[index] += value * weight;
      });
      totalWeight += Math.abs(weight);
    }
  });

  // Average by total weight
  if (totalWeight > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= totalWeight;
    }
  }

  return normalizeVector(vector);
}

/**
 * Normalize vector to unit length
 * @param {number[]} vector
 * @returns {number[]} Normalized vector
 */
function normalizeVector(vector) {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0)
  );

  if (magnitude === 0) {
    return vector;
  }

  return vector.map(value => value / magnitude);
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} Cosine similarity [-1, 1]
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) {
    return 0;
  }

  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const normA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const normB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (normA * normB);
}

/**
 * Explain embedding dimensions for debugging
 * @param {number[]} vector
 * @returns {Object} Dimension explanations
 */
function explainEmbedding(vector) {
  if (!Array.isArray(vector) || vector.length !== 8) {
    return null;
  }

  const labels = [
    'Energy (chill → wild)',
    'Creativity (practical → artistic)',
    'Social scale (intimate → community)',
    'Food/Culinary focus',
    'Physical activity',
    'Nightlife intensity',
    'Professional/Networking',
    'Wellness/Mindfulness',
  ];

  return vector.map((value, index) => ({
    dimension: index,
    label: labels[index],
    value: value.toFixed(3),
  }));
}

module.exports = {
  generateEventEmbedding,
  computeUserTasteVector,
  cosineSimilarity,
  normalizeVector,
  explainEmbedding,
};
