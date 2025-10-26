const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateEventEmbedding } = require('../embeddings.js');

const prisma = new PrismaClient();

const baseDate = new Date();

const eventBlueprints = [
  {
    id: '7398c6f1-651c-4c91-9c4d-1f0a3f5fb001',
    title: 'Halloween Rager',
    description: 'Cool house party pour célébrer Halloween! 🎃 3 floors, bass till late, costumes mandatory.',
    imageUrl: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=800',
    dayOffset: 12,
    hour: 20,
    durationHours: 6,
    venueName: 'Secret Loft',
    address: '15 Avenue Personne, Montreal, QC',
    neighborhood: 'Plateau Mont-Royal',
    latitude: 45.5276,
    longitude: -73.5789,
    vibe: ['Wild', 'Creative', 'Loud'],
    eventType: 'party',
    capacity: 120,
    ageRestriction: '18+',
    ticketLink: 'https://boards.app/events/halloween-rager',
    popularityScore: 2.5,
    trustScore: 0.6,
  },
  {
    id: '7398c6f1-651c-4c91-9c4d-1f0a3f5fb002',
    title: 'Sunrise Sound Bath',
    description: 'Start your weekend with an immersive ambient sound bath led by local healers.',
    imageUrl: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800',
    dayOffset: 3,
    hour: 8,
    durationHours: 2,
    venueName: 'Studio Namaste',
    address: '403 Rue Saint-Sulpice, Montreal, QC',
    neighborhood: 'Old Montreal',
    latitude: 45.5032,
    longitude: -73.554,
    vibe: ['Chill', 'Intimate', 'Creative'],
    eventType: 'wellness',
    capacity: 45,
    ageRestriction: 'All ages',
    ticketLink: 'https://boards.app/events/sunrise-sound-bath',
    popularityScore: 1.2,
    trustScore: 0.7,
  },
  {
    id: '7398c6f1-651c-4c91-9c4d-1f0a3f5fb003',
    title: 'Late Night Vinyl Club',
    description: 'Selectors from Tiohtià:ke spinning deep cuts all night. BYO records for the open deck hour.',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    dayOffset: 5,
    hour: 22,
    durationHours: 5,
    venueName: 'La Voute',
    address: '360 Rue Saint-Jacques, Montreal, QC',
    neighborhood: 'Old Montreal',
    latitude: 45.5025,
    longitude: -73.5592,
    vibe: ['Loud', 'Creative', 'Intimate'],
    eventType: 'music',
    capacity: 80,
    ageRestriction: '21+',
    ticketLink: 'https://boards.app/events/vinyl-club',
    popularityScore: 1.8,
    trustScore: 0.65,
  },
  {
    id: '7398c6f1-651c-4c91-9c4d-1f0a3f5fb004',
    title: 'Plateau Night Market',
    description: '30+ DIY makers, neon lights, late-night snacks, and rooftop DJ sets.',
    imageUrl: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?w=800',
    dayOffset: 7,
    hour: 18,
    durationHours: 5,
    venueName: 'Marché Noir',
    address: '55 Avenue du Mont-Royal O, Montreal, QC',
    neighborhood: 'Plateau Mont-Royal',
    latitude: 45.5211,
    longitude: -73.5798,
    vibe: ['Creative', 'Foodie', 'Loud'],
    eventType: 'market',
    capacity: 300,
    ageRestriction: 'All ages',
    ticketLink: 'https://boards.app/events/plateau-night-market',
    popularityScore: 2.1,
    trustScore: 0.7,
  },
  {
    id: '7398c6f1-651c-4c91-9c4d-1f0a3f5fb005',
    title: 'Griffintown Street Murals Walk',
    description: 'Guided twilight walk through new large-scale murals with artists on-site.',
    imageUrl: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800',
    dayOffset: 9,
    hour: 19,
    durationHours: 2,
    venueName: 'Griffintown Hub',
    address: '174 Rue Peel, Montreal, QC',
    neighborhood: 'Griffintown',
    latitude: 45.4935,
    longitude: -73.5612,
    vibe: ['Creative', 'Chill', 'Intimate'],
    eventType: 'art',
    capacity: 60,
    ageRestriction: 'All ages',
    ticketLink: 'https://boards.app/events/griffintown-murals',
    popularityScore: 1.5,
    trustScore: 0.62,
  },
  {
    id: '7398c6f1-651c-4c91-9c4d-1f0a3f5fb006',
    title: 'NDG Backyard Jazz',
    description: 'Cozy backyard session featuring Montreal jazz quartet + mulled cider.',
    imageUrl: 'https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=800',
    dayOffset: 2,
    hour: 19,
    durationHours: 3,
    venueName: 'NDG Secret Garden',
    address: '2150 Avenue Marcil, Montreal, QC',
    neighborhood: 'Notre-Dame-de-Grâce',
    latitude: 45.4651,
    longitude: -73.6172,
    vibe: ['Chill', 'Intimate', 'Creative'],
    eventType: 'music',
    capacity: 55,
    ageRestriction: 'All ages',
    ticketLink: 'https://boards.app/events/ndg-backyard-jazz',
    popularityScore: 1.1,
    trustScore: 0.58,
  },
  {
    id: '7398c6f1-651c-4c91-9c4d-1f0a3f5fb007',
    title: 'Mile-End Maker Lab',
    description: 'Hands-on evening to build zines, pins, and mini-screenprints with local artists.',
    imageUrl: 'https://images.unsplash.com/photo-1529078155058-5d716f45d604?w=800',
    dayOffset: 6,
    hour: 19,
    durationHours: 4,
    venueName: 'La Centrale',
    address: '4296 Boulevard Saint-Laurent, Montreal, QC',
    neighborhood: 'Mile End',
    latitude: 45.5257,
    longitude: -73.5971,
    vibe: ['Creative', 'Intimate', 'Wild'],
    eventType: 'workshop',
    capacity: 40,
    ageRestriction: 'All ages',
    ticketLink: 'https://boards.app/events/mile-end-maker-lab',
    popularityScore: 1.4,
    trustScore: 0.66,
  },
  {
    id: '7398c6f1-651c-4c91-9c4d-1f0a3f5fb008',
    title: 'Underground Boiler Room',
    description: 'Warehouse techno with modular live sets and projection-mapped visuals.',
    imageUrl: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&sat=-100',
    dayOffset: 14,
    hour: 23,
    durationHours: 7,
    venueName: 'Bassin 21',
    address: '555 Rue Wellington, Montreal, QC',
    neighborhood: 'Cité du Multimédia',
    latitude: 45.4959,
    longitude: -73.5599,
    vibe: ['Loud', 'Wild'],
    eventType: 'party',
    capacity: 500,
    ageRestriction: '19+',
    ticketLink: 'https://boards.app/events/underground-boiler-room',
    popularityScore: 3.1,
    trustScore: 0.55,
  },
  {
    id: '7398c6f1-651c-4c91-9c4d-1f0a3f5fb009',
    title: 'Little Italy Pasta Club',
    description: 'Community supper with pasta-making workshop, DJ set, and natural wine.',
    imageUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800',
    dayOffset: 10,
    hour: 18,
    durationHours: 4,
    venueName: 'Casa de la Nonna',
    address: '6829 Boulevard Saint-Laurent, Montreal, QC',
    neighborhood: 'Little Italy',
    latitude: 45.5359,
    longitude: -73.614,
    vibe: ['Foodie', 'Intimate', 'Chill'],
    eventType: 'food',
    capacity: 65,
    ageRestriction: 'All ages',
    ticketLink: 'https://boards.app/events/pasta-club',
    popularityScore: 1.9,
    trustScore: 0.64,
  },
  {
    id: '7398c6f1-651c-4c91-9c4d-1f0a3f5fb010',
    title: 'Hochelaga Street Sport Jam',
    description: 'Pickup basketball, roller disco pop-up, and open decks on the asphalt.',
    imageUrl: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=800',
    dayOffset: 4,
    hour: 17,
    durationHours: 5,
    venueName: 'Hochelaga Park Courts',
    address: '4200 Rue Ontario E, Montreal, QC',
    neighborhood: 'Hochelaga-Maisonneuve',
    latitude: 45.5498,
    longitude: -73.5351,
    vibe: ['Wild', 'Creative', 'Loud'],
    eventType: 'community',
    capacity: 200,
    ageRestriction: 'All ages',
    ticketLink: 'https://boards.app/events/hochelaga-jam',
    popularityScore: 2.3,
    trustScore: 0.6,
  },
];

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  console.log('🎃 Seeding Boards database...');

  const passwordHash = await bcrypt.hash('boards2025', 10);

  const raph = await prisma.user.upsert({
    where: { email: 'raph@boards.app' },
    update: {
      displayName: 'Raph',
      bio: 'Founder of Boards',
      vibePrefs: ['Creative', 'Wild', 'Chill'],
      homeNeighborhood: 'Plateau Mont-Royal',
      trustScore: 0.7,
    },
    create: {
      email: 'raph@boards.app',
      username: 'raph27',
      passwordHash: passwordHash,
      displayName: 'Raph',
      bio: 'Founder of Boards',
      vibePrefs: ['Creative', 'Wild', 'Chill'],
      homeNeighborhood: 'Plateau Mont-Royal',
      trustScore: 0.7,
    },
  });

  console.log('✅ Host account ready:', raph.username);

  let createdCount = 0;
  for (const blueprint of eventBlueprints) {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() + blueprint.dayOffset);
    start.setHours(blueprint.hour, 0, 0, 0);
    const end = addHours(start, blueprint.durationHours);

    const event = await prisma.event.upsert({
      where: { id: blueprint.id },
      update: {
        title: blueprint.title,
        description: blueprint.description,
        imageUrl: blueprint.imageUrl,
        startTime: start,
        endTime: end,
        venueName: blueprint.venueName,
        address: blueprint.address,
        neighborhood: blueprint.neighborhood,
        latitude: blueprint.latitude,
        longitude: blueprint.longitude,
        vibe: blueprint.vibe,
        eventType: blueprint.eventType,
        capacity: blueprint.capacity,
        ageRestriction: blueprint.ageRestriction,
        ticketLink: blueprint.ticketLink,
        popularityScore: blueprint.popularityScore,
        trustScore: blueprint.trustScore,
        hostId: raph.id,
      },
      create: {
        id: blueprint.id,
        title: blueprint.title,
        description: blueprint.description,
        imageUrl: blueprint.imageUrl,
        startTime: start,
        endTime: end,
        venueName: blueprint.venueName,
        address: blueprint.address,
        neighborhood: blueprint.neighborhood,
        latitude: blueprint.latitude,
        longitude: blueprint.longitude,
        vibe: blueprint.vibe,
        eventType: blueprint.eventType,
        capacity: blueprint.capacity,
        ageRestriction: blueprint.ageRestriction,
        ticketLink: blueprint.ticketLink,
        popularityScore: blueprint.popularityScore,
        trustScore: blueprint.trustScore,
        hostId: raph.id,
      },
    });

    // Generate embedding from event data (Phase B)
    const embedding = generateEventEmbedding(event);
    await prisma.eventEmbedding.upsert({
      where: { eventId: event.id },
      update: {
        vector: embedding,
      },
      create: {
        eventId: event.id,
        vector: embedding,
      },
    });

    createdCount += 1;
  }

  console.log(`✨ Seeded ${createdCount} Montréal events.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
