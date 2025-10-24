const { z, ZodError, ZodIssueCode } = require('zod');

const EVENT_TYPES = [
  'art',
  'community',
  'concert',
  'dance',
  'festival',
  'food',
  'market',
  'meetup',
  'music',
  'networking',
  'party',
  'sports',
  'talk',
  'theatre',
  'wellness',
  'workshop',
  'other',
];

const AGE_RESTRICTIONS = ['All ages', '13+', '16+', '18+', '19+', '21+'];
const WHEN_VALUES = ['now', 'tonight', 'weekend', 'month'];

const toTrimmedString = (value) => (value == null ? value : String(value).trim());

const requiredTrimmedString = (field, max) =>
  z.preprocess(
    (value) => {
      const str = toTrimmedString(value);
      return str == null || str === '' ? undefined : str;
    },
    z
      .string({ required_error: `${field} is required` })
      .min(1, { message: `${field} is required` })
      .max(max, { message: `${field} must be at most ${max} characters` })
  );

const optionalTrimmedString = (field, max) =>
  z
    .preprocess(
      (value) => {
        const str = toTrimmedString(value);
        return str == null || str === '' ? undefined : str;
      },
      z.string().min(1, { message: `${field} must not be empty` }).max(max, {
        message: `${field} must be at most ${max} characters`,
      })
    )
    .optional();

const descriptionSchema = z
  .preprocess((value) => (value == null ? '' : String(value)), z.string().max(5000, {
    message: 'Description must be at most 5000 characters',
  }))
  .transform((value) => value.trim());

const dateFromInput = (field) =>
  z.preprocess(
    (value) => {
      if (value == null || value === '') return undefined;
      if (value instanceof Date) return value;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? value : parsed;
    },
    z.date({
      required_error: `${field} is required`,
      invalid_type_error: `${field} must be a valid date`,
    })
  );

const optionalDateFromInput = (field) =>
  z.preprocess(
    (value) => {
      if (value == null || value === '') return undefined;
      if (value instanceof Date) return value;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? value : parsed;
    },
    z
      .date({
        invalid_type_error: `${field} must be a valid date`,
      })
      .optional()
  );

const nullableDateFromInput = (field) =>
  z
    .union([z.literal(null), optionalDateFromInput(field)])
    .optional();

const numberFromInput = (value) => {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const latitudeSchema = z.preprocess(
  (value) => {
    const parsed = numberFromInput(value);
    return parsed === undefined ? undefined : parsed;
  },
  z
    .number({
      required_error: 'Latitude is required',
      invalid_type_error: 'Latitude must be a number',
    })
    .gte(-90, { message: 'Latitude must be between -90 and 90' })
    .lte(90, { message: 'Latitude must be between -90 and 90' })
);

const longitudeSchema = z.preprocess(
  (value) => {
    const parsed = numberFromInput(value);
    return parsed === undefined ? undefined : parsed;
  },
  z
    .number({
      required_error: 'Longitude is required',
      invalid_type_error: 'Longitude must be a number',
    })
    .gte(-180, { message: 'Longitude must be between -180 and 180' })
    .lte(180, { message: 'Longitude must be between -180 and 180' })
);

const capacityCreateSchema = z
  .preprocess(numberFromInput, z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .int({ message: 'Capacity must be an integer' })
    .positive({ message: 'Capacity must be greater than zero' })
    .max(500000, { message: 'Capacity must be less than or equal to 500000' }))
  .optional();

const capacityUpdateSchema = z
  .preprocess((value) => {
    if (value === null) return null;
    return numberFromInput(value);
  },
  z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .int({ message: 'Capacity must be an integer' })
    .positive({ message: 'Capacity must be greater than zero' })
    .max(500000, { message: 'Capacity must be less than or equal to 500000' }))
  .nullable()
  .optional();

const matchEnumValue = (value, values) => {
  if (value == null || value === '') return undefined;
  const lowered = String(value).trim();
  const match = values.find((option) => option.toLowerCase() === lowered.toLowerCase());
  return match ?? value;
};

const eventTypeCreateSchema = z.preprocess(
  (value) => {
    if (value == null || value === '') return 'other';
    return String(value).trim().toLowerCase();
  },
  z.enum(EVENT_TYPES, { errorMap: () => ({ message: 'eventType is not supported' }) })
);

const eventTypeUpdateSchema = z
  .preprocess((value) => {
    if (value == null || value === '') return undefined;
    return String(value).trim().toLowerCase();
  }, z.enum(EVENT_TYPES, { errorMap: () => ({ message: 'eventType is not supported' }) }))
  .optional();

const ageRestrictionCreateSchema = z
  .preprocess((value) => matchEnumValue(value, AGE_RESTRICTIONS), z.enum(AGE_RESTRICTIONS, {
    errorMap: () => ({ message: 'ageRestriction is not supported' }),
  }))
  .optional();

const ageRestrictionUpdateSchema = z
  .union([
    z.literal(null),
    z.preprocess((value) => matchEnumValue(value, AGE_RESTRICTIONS), z.enum(AGE_RESTRICTIONS, {
      errorMap: () => ({ message: 'ageRestriction is not supported' }),
    })),
  ])
  .optional();

const urlSchema = z.string().url({ message: 'Ticket link must be a valid URL' });

const ticketLinkCreateSchema = z
  .preprocess((value) => {
    const trimmed = toTrimmedString(value);
    return trimmed == null || trimmed === '' ? undefined : trimmed;
  }, urlSchema)
  .optional();

const ticketLinkUpdateSchema = z
  .union([
    z.literal(null),
    z.preprocess((value) => {
      const trimmed = toTrimmedString(value);
      return trimmed == null || trimmed === '' ? undefined : trimmed;
    }, urlSchema),
  ])
  .optional();

const locationSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
});

const radiusSchema = z
  .preprocess(numberFromInput, z
    .number({ invalid_type_error: 'radiusKm must be a number' })
    .positive({ message: 'radiusKm must be greater than zero' })
    .max(200, { message: 'radiusKm must be less than or equal to 200' }))
  .default(10);

const maxResultsSchema = z
  .preprocess(numberFromInput, z
    .number({ invalid_type_error: 'max must be a number' })
    .int({ message: 'max must be an integer' })
    .positive({ message: 'max must be greater than zero' })
    .max(50, { message: 'max cannot be greater than 50' }))
  .default(20);

const whenSchema = z
  .preprocess((value) => {
    if (value == null || value === '') return undefined;
    return String(value).trim();
  }, z.enum(WHEN_VALUES, { errorMap: () => ({ message: 'when is not supported' }) }))
  .optional();

const eventCreateSchema = z
  .object({
    title: requiredTrimmedString('Title', 140),
    description: descriptionSchema,
    startTime: dateFromInput('Start time'),
    endTime: optionalDateFromInput('End time'),
    venueName: optionalTrimmedString('Venue name', 140),
    address: requiredTrimmedString('Address', 280),
    neighborhood: optionalTrimmedString('Neighborhood', 120),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    vibe: z.any().optional(),
    eventType: eventTypeCreateSchema,
    capacity: capacityCreateSchema,
    ageRestriction: ageRestrictionCreateSchema,
    ticketLink: ticketLinkCreateSchema,
  })
  .strict();

const eventUpdateSchema = z
  .object({
    title: optionalTrimmedString('Title', 140),
    description: descriptionSchema.optional(),
    startTime: optionalDateFromInput('Start time'),
    endTime: nullableDateFromInput('End time'),
    venueName: optionalTrimmedString('Venue name', 140),
    address: optionalTrimmedString('Address', 280),
    neighborhood: optionalTrimmedString('Neighborhood', 120),
    latitude: latitudeSchema.optional(),
    longitude: longitudeSchema.optional(),
    vibe: z.any().optional(),
    eventType: eventTypeUpdateSchema,
    capacity: capacityUpdateSchema,
    ageRestriction: ageRestrictionUpdateSchema,
    ticketLink: ticketLinkUpdateSchema,
  })
  .strict();

const recommendationSchema = z
  .object({
    userId: z
      .string({ required_error: 'userId is required' })
      .uuid({ message: 'userId must be a valid UUID' }),
    location: locationSchema,
    radiusKm: radiusSchema,
    when: whenSchema,
    vibes: z.any().optional(),
    max: maxResultsSchema,
  })
  .strict();

const vibeArraySchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, { message: 'Vibe tags must not be empty' })
      .max(40, { message: 'Vibe tags must be at most 40 characters' })
  )
  .max(25, { message: 'No more than 25 vibe tags are allowed' });

function parseVibeInput(vibeInput) {
  if (!vibeInput) return [];
  if (Array.isArray(vibeInput)) return vibeInput;
  if (typeof vibeInput === 'string') {
    try {
      const parsed = JSON.parse(vibeInput);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      throw new Error('Invalid vibe payload');
    }
  }
  return [];
}

function normalizeVibes(value, { defaultEmpty = true, path = ['vibe'] } = {}) {
  if (value === undefined) {
    return defaultEmpty ? [] : undefined;
  }

  let parsed;
  try {
    parsed = parseVibeInput(value);
  } catch (error) {
    throw new ZodError([
      {
        code: ZodIssueCode.custom,
        path,
        message: error.message || 'Invalid vibe payload',
      },
    ]);
  }

  const sanitized = parsed
    .map((item) => toTrimmedString(item))
    .filter((item) => typeof item === 'string' && item.length);

  return vibeArraySchema.parse(sanitized);
}

function validateEventCreate(input = {}) {
  const { vibe, ...rest } = eventCreateSchema.parse(input);
  const normalizedVibes = normalizeVibes(vibe, { defaultEmpty: true, path: ['vibe'] });

  return {
    ...rest,
    description: rest.description ?? '',
    endTime: rest.endTime ?? null,
    venueName: rest.venueName ?? null,
    neighborhood: rest.neighborhood,
    capacity: rest.capacity ?? null,
    ageRestriction: rest.ageRestriction ?? null,
    ticketLink: rest.ticketLink ?? null,
    vibe: normalizedVibes,
  };
}

function validateEventUpdate(input = {}) {
  const { vibe, ...rest } = eventUpdateSchema.parse(input);
  const sanitized = {};

  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  });

  if (vibe !== undefined) {
    sanitized.vibe = normalizeVibes(vibe, { defaultEmpty: true, path: ['vibe'] });
  }

  return sanitized;
}

function validateRecommendationInput(input = {}) {
  const { vibes, ...rest } = recommendationSchema.parse(input);
  const normalizedVibes = normalizeVibes(vibes, { defaultEmpty: true, path: ['vibes'] });

  return {
    ...rest,
    vibes: normalizedVibes,
  };
}

function validateImageMimeType(file) {
  if (!file) return;
  const mimetype = toTrimmedString(file.mimetype)?.toLowerCase();
  if (!mimetype || !mimetype.startsWith('image/')) {
    const error = new Error('Unsupported file type. Only image uploads are allowed.');
    error.status = 415;
    throw error;
  }
}

module.exports = {
  validateEventCreate,
  validateEventUpdate,
  validateRecommendationInput,
  validateImageMimeType,
  EVENT_TYPES,
  WHEN_VALUES,
  AGE_RESTRICTIONS,
};
