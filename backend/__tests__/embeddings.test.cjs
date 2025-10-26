// embeddings.test.cjs - Tests for embedding generation and taste vectors
const { test } = require('node:test');
const assert = require('node:assert');

const {
  generateEventEmbedding,
  computeUserTasteVector,
  cosineSimilarity,
  normalizeVector,
  explainEmbedding,
} = require('../embeddings.js');

test('generateEventEmbedding - high energy party event', () => {
  const event = {
    title: 'Halloween Rager',
    description: 'Wild night party with DJ and dancing',
    vibe: ['Wild', 'Loud'],
    eventType: 'party',
    startTime: new Date('2025-10-31T22:00:00'),
    ageRestriction: '19+',
    capacity: 300,
  };

  const embedding = generateEventEmbedding(event);

  assert.ok(Array.isArray(embedding), 'Embedding should be an array');
  assert.strictEqual(embedding.length, 8, 'Embedding should have 8 dimensions');

  // High energy event should have high scores on dimensions 0 (energy) and 5 (nightlife)
  assert.ok(embedding[0] > 0.5, 'Energy dimension should be high for wild party');
  assert.ok(embedding[5] > 0.4, 'Nightlife dimension should be high for night event');

  // Vector should be normalized (magnitude ~1)
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  assert.ok(Math.abs(magnitude - 1) < 0.01, 'Vector should be normalized to unit length');
});

test('generateEventEmbedding - wellness event', () => {
  const event = {
    title: 'Morning Yoga and Sound Bath',
    description: 'Peaceful mindfulness session with meditation and healing sounds',
    vibe: ['Chill', 'Zen'],
    eventType: 'wellness',
    startTime: new Date('2025-10-26T07:00:00'),
    ageRestriction: 'All ages',
    capacity: 25,
  };

  const embedding = generateEventEmbedding(event);

  assert.strictEqual(embedding.length, 8);

  // Wellness event should have high wellness dimension (7) and low energy (0)
  assert.ok(embedding[7] > 0.5, 'Wellness dimension should be high');
  assert.ok(embedding[0] < 0.5, 'Energy dimension should be low for chill event');

  // Small capacity should indicate intimate event (low dimension 2)
  assert.ok(embedding[2] < 0.5, 'Social scale should be low for small capacity');
});

test('generateEventEmbedding - food event', () => {
  const event = {
    title: 'Street Food Festival',
    description: 'Enjoy amazing cuisine from local chefs and restaurants',
    vibe: ['Foodie', 'Community'],
    eventType: 'food',
    startTime: new Date('2025-10-26T17:00:00'),
    capacity: 500,
  };

  const embedding = generateEventEmbedding(event);

  assert.strictEqual(embedding.length, 8);
  assert.ok(embedding[3] > 0.5, 'Food dimension should be high');
  assert.ok(embedding[2] > 0.5, 'Community dimension should be high for large event');
});

test('generateEventEmbedding - creative/art event', () => {
  const event = {
    title: 'Gallery Opening',
    description: 'Contemporary art exhibition with live painting and music',
    vibe: ['Creative', 'Artsy'],
    eventType: 'art',
    startTime: new Date('2025-10-26T19:00:00'),
    capacity: 80,
  };

  const embedding = generateEventEmbedding(event);

  assert.strictEqual(embedding.length, 8);
  assert.ok(embedding[1] > 0.5, 'Creativity dimension should be high for art event');
});

test('computeUserTasteVector - single interaction', () => {
  const interactions = [
    {
      action: 'going',
      createdAt: new Date(),
      event: {
        embedding: {
          vector: [0.8, 0.2, 0.5, 0.1, 0.3, 0.7, 0.1, 0.2],
        },
      },
    },
  ];

  const tasteVector = computeUserTasteVector(interactions);

  assert.ok(Array.isArray(tasteVector));
  assert.strictEqual(tasteVector.length, 8);

  // Should be normalized
  const magnitude = Math.sqrt(tasteVector.reduce((sum, val) => sum + val * val, 0));
  assert.ok(Math.abs(magnitude - 1) < 0.01, 'Taste vector should be normalized');
});

test('computeUserTasteVector - multiple interactions with different actions', () => {
  const baseVector1 = [1, 0, 0, 0, 0, 0, 0, 0]; // High energy
  const baseVector2 = [0, 0, 0, 0, 0, 0, 0, 1]; // High wellness

  const interactions = [
    {
      action: 'going', // weight 1.0
      createdAt: new Date(),
      event: { embedding: { vector: baseVector1 } },
    },
    {
      action: 'cosign', // weight 0.8
      createdAt: new Date(),
      event: { embedding: { vector: baseVector1 } },
    },
    {
      action: 'view', // weight 0.1
      createdAt: new Date(),
      event: { embedding: { vector: baseVector2 } },
    },
  ];

  const tasteVector = computeUserTasteVector(interactions);

  assert.strictEqual(tasteVector.length, 8);

  // Should favor dimension 0 (energy) since going + cosign have higher weights than view
  assert.ok(tasteVector[0] > tasteVector[7], 'Should favor higher-weighted interactions');
});

test('computeUserTasteVector - hide action (negative weight)', () => {
  const baseVector = [1, 0, 0, 0, 0, 0, 0, 0];

  const interactions = [
    {
      action: 'going',
      createdAt: new Date(),
      event: { embedding: { vector: baseVector } },
    },
    {
      action: 'hide', // negative weight
      createdAt: new Date(),
      event: { embedding: { vector: baseVector } },
    },
  ];

  const tasteVector = computeUserTasteVector(interactions);

  assert.strictEqual(tasteVector.length, 8);
  // Hide should reduce the influence of that dimension
});

test('computeUserTasteVector - empty interactions', () => {
  const tasteVector = computeUserTasteVector([]);
  assert.deepStrictEqual(tasteVector, []);
});

test('computeUserTasteVector - dwell time boost for views', () => {
  const baseVector = [1, 0, 0, 0, 0, 0, 0, 0];

  const interactions = [
    {
      action: 'view',
      dwellMs: 60000, // 60 seconds = long dwell
      createdAt: new Date(),
      event: { embedding: { vector: baseVector } },
    },
  ];

  const tasteVector = computeUserTasteVector(interactions);

  assert.strictEqual(tasteVector.length, 8);
  assert.ok(tasteVector[0] > 0, 'Should have non-zero value from boosted view');
});

test('cosineSimilarity - identical vectors', () => {
  const v1 = [1, 0, 0, 0, 0, 0, 0, 0];
  const v2 = [1, 0, 0, 0, 0, 0, 0, 0];
  const similarity = cosineSimilarity(v1, v2);
  assert.ok(Math.abs(similarity - 1) < 0.01, 'Identical vectors should have similarity ~1');
});

test('cosineSimilarity - orthogonal vectors', () => {
  const v1 = [1, 0, 0, 0, 0, 0, 0, 0];
  const v2 = [0, 1, 0, 0, 0, 0, 0, 0];
  const similarity = cosineSimilarity(v1, v2);
  assert.ok(Math.abs(similarity) < 0.01, 'Orthogonal vectors should have similarity ~0');
});

test('cosineSimilarity - opposite vectors', () => {
  const v1 = [1, 1, 1, 1, 1, 1, 1, 1];
  const v2 = [-1, -1, -1, -1, -1, -1, -1, -1];
  const similarity = cosineSimilarity(v1, v2);
  assert.ok(similarity < -0.99, 'Opposite vectors should have similarity ~-1');
});

test('cosineSimilarity - different length vectors', () => {
  const v1 = [1, 0, 0];
  const v2 = [1, 0, 0, 0, 0];
  const similarity = cosineSimilarity(v1, v2);
  assert.strictEqual(similarity, 0, 'Different length vectors should return 0');
});

test('cosineSimilarity - empty vectors', () => {
  assert.strictEqual(cosineSimilarity([], []), 0);
  assert.strictEqual(cosineSimilarity([1, 2, 3], []), 0);
  assert.strictEqual(cosineSimilarity([], [1, 2, 3]), 0);
});

test('normalizeVector - basic normalization', () => {
  const vector = [3, 4, 0, 0, 0, 0, 0, 0]; // magnitude = 5
  const normalized = normalizeVector(vector);

  assert.strictEqual(normalized.length, 8);
  assert.ok(Math.abs(normalized[0] - 0.6) < 0.01); // 3/5 = 0.6
  assert.ok(Math.abs(normalized[1] - 0.8) < 0.01); // 4/5 = 0.8

  const magnitude = Math.sqrt(normalized.reduce((sum, val) => sum + val * val, 0));
  assert.ok(Math.abs(magnitude - 1) < 0.01);
});

test('normalizeVector - zero vector', () => {
  const vector = [0, 0, 0, 0, 0, 0, 0, 0];
  const normalized = normalizeVector(vector);
  assert.deepStrictEqual(normalized, vector, 'Zero vector should remain unchanged');
});

test('explainEmbedding - returns correct structure', () => {
  const vector = [0.5, 0.3, 0.7, 0.1, 0.2, 0.8, 0.4, 0.6];
  const explanation = explainEmbedding(vector);

  assert.ok(Array.isArray(explanation));
  assert.strictEqual(explanation.length, 8);

  explanation.forEach((item, index) => {
    assert.strictEqual(item.dimension, index);
    assert.ok(typeof item.label === 'string');
    assert.ok(typeof item.value === 'string');
    assert.strictEqual(item.value, vector[index].toFixed(3));
  });
});

test('explainEmbedding - invalid input', () => {
  assert.strictEqual(explainEmbedding([1, 2, 3]), null, 'Wrong dimension count should return null');
  assert.strictEqual(explainEmbedding(null), null);
  assert.strictEqual(explainEmbedding('not an array'), null);
});
