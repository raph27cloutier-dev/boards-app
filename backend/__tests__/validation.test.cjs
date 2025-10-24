const test = require('node:test');
const assert = require('assert');
const { ZodError } = require('zod');
const {
  validateEventCreate,
  validateEventUpdate,
  validateRecommendationInput,
  validateImageMimeType,
} = require('../validation');

test('validateEventCreate normalizes valid payloads', () => {
  const payload = {
    title: 'Test Event',
    description: '  A great time awaits  ',
    startTime: new Date().toISOString(),
    endTime: '',
    venueName: 'Loft',
    address: '123 Main Street',
    neighborhood: 'Downtown',
    latitude: '45.5017',
    longitude: '-73.5673',
    vibe: JSON.stringify(['chill', 'fun']),
    eventType: 'Party',
    capacity: '150',
    ageRestriction: '19+',
    ticketLink: 'https://tickets.example.com/event',
  };

  const result = validateEventCreate(payload);

  assert.strictEqual(result.title, 'Test Event');
  assert.strictEqual(result.description, 'A great time awaits');
  assert.ok(result.startTime instanceof Date);
  assert.strictEqual(result.endTime, null);
  assert.strictEqual(result.eventType, 'party');
  assert.strictEqual(result.capacity, 150);
  assert.deepStrictEqual(result.vibe, ['chill', 'fun']);
  assert.strictEqual(result.ageRestriction, '19+');
  assert.strictEqual(result.ticketLink, 'https://tickets.example.com/event');
});

test('validateEventCreate rejects invalid coordinates', () => {
  assert.throws(
    () =>
      validateEventCreate({
        title: 'Invalid Event',
        description: 'Test',
        startTime: new Date().toISOString(),
        address: '123 Main Street',
        latitude: '190',
        longitude: '-73.5673',
        vibe: JSON.stringify(['chill']),
        eventType: 'party',
      }),
    ZodError
  );
});

test('validateEventUpdate handles partial payloads', () => {
  const result = validateEventUpdate({
    description: '  Updated details  ',
    capacity: null,
    vibe: JSON.stringify(['relaxed']),
    ticketLink: null,
  });

  assert.deepStrictEqual(result, {
    description: 'Updated details',
    capacity: null,
    ticketLink: null,
    vibe: ['relaxed'],
  });
});

test('validateEventUpdate rejects unsupported event types', () => {
  assert.throws(() => validateEventUpdate({ eventType: 'unknown-type' }), ZodError);
});

test('validateRecommendationInput parses and coerces values', () => {
  const request = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    location: { lat: 45.5, lng: -73.5 },
    radiusKm: '25',
    when: 'tonight',
    vibes: ['dance', 'music'],
    max: '10',
  };

  const result = validateRecommendationInput(request);

  assert.strictEqual(result.radiusKm, 25);
  assert.strictEqual(result.when, 'tonight');
  assert.deepStrictEqual(result.vibes, ['dance', 'music']);
  assert.strictEqual(result.max, 10);
});

test('validateRecommendationInput rejects unsupported when values', () => {
  assert.throws(
    () =>
      validateRecommendationInput({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        location: { lat: 45.5, lng: -73.5 },
        when: 'later',
      }),
    ZodError
  );
});

test('validateImageMimeType accepts image mimetypes', () => {
  assert.doesNotThrow(() => validateImageMimeType({ mimetype: 'image/png' }));
});

test('validateImageMimeType rejects unsupported uploads', () => {
  assert.throws(() => validateImageMimeType({ mimetype: 'application/pdf' }), /Unsupported file type/);

  try {
    validateImageMimeType({ mimetype: 'application/pdf' });
  } catch (error) {
    assert.strictEqual(error.status, 415);
  }
});
