import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { INITIAL_EVENTS } from '../lib/data/initial-events';
import { INITIAL_ACHIEVEMENTS } from '../lib/data/initial-achievements';

/**
 * =============================================================================
 * NEXORA PLATFORM - DATABASE SEED SCRIPT
 * Populates initial content categories, sample events, and default admin.
 * Run via: bun run prisma/seed.ts (or bunx prisma db seed)
 * =============================================================================
 */

const DEFAULT_CATEGORIES = [
  { name: 'Hackathon', type: 'event', description: 'Competitive programming and rapid prototype development' },
  { name: 'Technical Fest', type: 'event', description: 'Department and college-wide technical symposia' },
  { name: 'Workshop', type: 'event', description: 'Hands-on skill building and technical masterclasses' },
  { name: 'Artificial Intelligence', type: 'event', description: 'Machine learning, deep learning, and AI tech talks' },
  { name: 'Cybersecurity', type: 'event', description: 'Ethical hacking, CTFs, and information security' },
  { name: 'Project Exhibition', type: 'event', description: 'Capstone showcases and innovation displays' },
  { name: 'notes', type: 'resource', description: 'Lecture notes and comprehensive semester study materials' },
  { name: 'question-papers', type: 'resource', description: 'VTU previous semester examination question papers' },
  { name: 'lab-manuals', type: 'resource', description: 'Official laboratory manuals and code templates' },
  { name: 'syllabus', type: 'resource', description: 'Official VTU curriculum syllabi and course schemes' },
];

async function seed() {
  console.log('🌱 Starting Nexora database seeding...');

  // 1. Seed Content Categories
  console.log('📦 Seeding content categories...');
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.contentCategory.upsert({
      where: { name: cat.name },
      update: { type: cat.type, description: cat.description },
      create: {
        name: cat.name,
        type: cat.type,
        description: cat.description,
      },
    });
  }
  console.log(`✓ Seeded ${DEFAULT_CATEGORIES.length} content categories.`);

  // 2. Seed Default Administrator (if no admin exists)
  const existingAdminCount = await prisma.admin.count();
  if (existingAdminCount === 0) {
    console.log('👤 No administrator accounts found. Creating default Super Admin...');
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'NexoraAdmin@2026!';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

    const defaultAdmin = await prisma.admin.create({
      data: {
        email: 'admin@ajiet.edu.in',
        name: 'Nexora Super Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });
    console.log(`✓ Created default administrator: ${defaultAdmin.email}`);
    console.log(`  Default password: ${defaultPassword}`);
    console.log('  ⚠️  Please change this password immediately in production!');
  } else {
    console.log(`✓ Found ${existingAdminCount} existing admin account(s). Skipping default admin creation.`);
  }

  // 3. Seed Initial Events from initial-events.ts
  console.log('📅 Seeding initial events...');
  let seededEventsCount = 0;
  for (const event of INITIAL_EVENTS) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: {
        title: event.title,
        category: event.category,
        description: event.description,
        fullDescription: event.fullDescription,
        imageUrl: event.imageUrl,
        iconName: event.iconName,
        dateDisplay: event.dateDisplay,
        venueDisplay: event.venueDisplay,
        status: 'PUBLISHED',
        registrationOpen: event.registrationOpen,
        eligibility: event.eligibility,
        organizer: event.organizer,
        tags: event.tags,
      },
      create: {
        title: event.title,
        slug: event.slug,
        category: event.category,
        description: event.description,
        fullDescription: event.fullDescription,
        imageUrl: event.imageUrl,
        iconName: event.iconName,
        dateDisplay: event.dateDisplay,
        venueDisplay: event.venueDisplay,
        status: 'PUBLISHED',
        registrationOpen: event.registrationOpen,
        eligibility: event.eligibility,
        organizer: event.organizer,
        tags: event.tags,
      },
    });
    seededEventsCount++;
  }
  console.log(`✓ Seeded ${seededEventsCount} initial events.`);

  // 4. Seed verified ISE achievements
  console.log('🏆 Seeding initial achievements...');
  for (const achievement of INITIAL_ACHIEVEMENTS) {
    const data = {
      title: achievement.title,
      description: achievement.description,
      studentOrTeamName: achievement.studentOrTeamName ?? null,
      category: achievement.category,
      competitionOrEvent: achievement.competitionOrEvent ?? null,
      awardOrPosition: achievement.awardOrPosition ?? null,
      achievementDate: achievement.achievementDate
        ? new Date(achievement.achievementDate)
        : null,
      dateDisplay: achievement.dateDisplay ?? null,
      image: achievement.image ?? null,
      externalUrl: achievement.externalUrl ?? null,
      status: 'PUBLISHED' as const,
    };

    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: data,
      create: { ...data, slug: achievement.slug },
    });
  }
  console.log(`✓ Seeded ${INITIAL_ACHIEVEMENTS.length} initial achievements.`);

  console.log('✨ Database seeding completed successfully.');
}

seed()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
