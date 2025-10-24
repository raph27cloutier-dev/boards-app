const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🎃 Seeding Boards database...');

  const passwordHash = await bcrypt.hash('boards2025', 10);
  
  const raph = await prisma.user.upsert({
    where: { email: 'raph@boards.app' },
    update: {},
    create: {
      email: 'raph@boards.app',
      username: 'raph27',
      passwordHash: passwordHash,
      displayName: 'Raph',
      bio: 'Founder of Boards',
    },
  });

  console.log('✅ Created user:', raph.username);

  const halloweenRager = await prisma.event.create({
    data: {
      title: 'Halloween Rager',
      description: 'Cool house party pour célébrer Halloween! 🎃',
      imageUrl: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=800',
      startTime: new Date('2025-10-31T20:00:00-04:00'),
      endTime: new Date('2025-11-01T02:00:00-04:00'),
      venueName: 'House Party',
      address: '15 Avenue Personne, Montreal, QC',
      neighborhood: 'Plateau Mont-Royal',
      latitude: 45.5276,
      longitude: -73.5789,
      vibe: ['Chill', 'Wild', 'Creative'],
      eventType: 'party',
      capacity: 50,
      ageRestriction: 'All ages',
      ticketLink: null,
      hostId: raph.id,
    },
  });

  console.log('🎃 Created event:', halloweenRager.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
