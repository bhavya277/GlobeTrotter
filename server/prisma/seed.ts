import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GlobeTrotter database seeding with INR support & Indian cities...');

  // Clean existing data
  await prisma.expense.deleteMany();
  await prisma.tripActivity.deleteMany();
  await prisma.tripStop.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.savedDestination.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.city.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  // Create Demo User
  const passwordHash = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.create({
    data: {
      email: 'alex@globetrotter.com',
      passwordHash,
      name: 'Alex Rivera',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'Wanderlust explorer, photography enthusiast, and food hunter.',
      language: 'en',
      defaultCurrency: 'INR',
    },
  });
  console.log(`👤 Created Demo User: ${demoUser.email} (Password: password123)`);

  // Create Indian Cities & Global Cities
  const Mumbai = await prisma.city.create({
    data: {
      name: 'Mumbai',
      country: 'India',
      region: 'Asia',
      latitude: 19.076,
      longitude: 72.8777,
      costIndex: 2.8,
      popularity: 4.9,
      description: 'The City of Dreams: Gateway of India, vibrant Marine Drive, Bollywood culture, and mouthwatering street food.',
      image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80',
      heroImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=80',
    },
  });

  const Jaipur = await prisma.city.create({
    data: {
      name: 'Jaipur',
      country: 'India',
      region: 'Asia',
      latitude: 26.9124,
      longitude: 75.7873,
      costIndex: 2.2,
      popularity: 4.85,
      description: 'The Pink City of Rajasthan: majestic fortresses, royal palaces, vibrant bazaars, and rich cultural heritage.',
      image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
      heroImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1600&q=80',
    },
  });

  const Goa = await prisma.city.create({
    data: {
      name: 'Goa',
      country: 'India',
      region: 'Asia',
      latitude: 15.2993,
      longitude: 74.124,
      costIndex: 2.0,
      popularity: 4.95,
      description: 'India’s beach capital: golden palm-lined sands, Portuguese heritage architecture, water sports, and nightlife.',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
      heroImage: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?auto=format&fit=crop&w=1600&q=80',
    },
  });

  const Tokyo = await prisma.city.create({
    data: {
      name: 'Tokyo',
      country: 'Japan',
      region: 'Asia',
      latitude: 35.6762,
      longitude: 139.6503,
      costIndex: 4.2,
      popularity: 4.9,
      description: 'A captivating blend of ultramodern skyscrapers, historic temples, neon lights, and world-class cuisine.',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      heroImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80',
    },
  });

  const Paris = await prisma.city.create({
    data: {
      name: 'Paris',
      country: 'France',
      region: 'Europe',
      latitude: 48.8566,
      longitude: 2.3522,
      costIndex: 4.5,
      popularity: 5.0,
      description: 'The City of Light, famous for romantic boulevards, iconic architecture, haute couture, and art masterpieces.',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
      heroImage: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1600&q=80',
    },
  });

  console.log('🏙️ Created Global & Indian Cities.');

  // Create Activities
  await prisma.activity.create({
    data: {
      cityId: Mumbai.id,
      name: 'Gateway of India & Taj Mahal Palace Walk',
      description: 'Sunset promenade along Colaba waterfront facing the Arabian Sea and historic Taj Hotel.',
      category: 'Sightseeing',
      estimatedCost: 0,
      durationMinutes: 120,
      image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      address: 'Apollo Bandar, Colaba, Mumbai',
    },
  });

  await prisma.activity.create({
    data: {
      cityId: Mumbai.id,
      name: 'Girgaon Chowpatty Pav Bhaji & Kulfi Tasting',
      description: 'Authentic Mumbai street food experience with butter pav bhaji and spicy bhel puri.',
      category: 'Food',
      estimatedCost: 350,
      durationMinutes: 90,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
      rating: 4.88,
      address: 'Marine Drive Chowpatty, Mumbai',
    },
  });

  await prisma.activity.create({
    data: {
      cityId: Jaipur.id,
      name: 'Amber Fort Elephant Rampart Guided Tour',
      description: 'Explore UNESCO hill fort with mirror palaces (Sheesh Mahal) and panoramic lake views.',
      category: 'Culture',
      estimatedCost: 500,
      durationMinutes: 180,
      image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80',
      rating: 4.95,
      address: 'Devisinghpura, Amer, Jaipur',
    },
  });

  await prisma.activity.create({
    data: {
      cityId: Goa.id,
      name: 'Baga Beach Water Sports Package',
      description: 'Thrill-seeking parasailing, jet skiing, and banana boat rides on North Goa coast.',
      category: 'Adventure',
      estimatedCost: 2200,
      durationMinutes: 150,
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
      rating: 4.82,
      address: 'Baga Beach, Calangute, Goa',
    },
  });

  // Create Demo Trip for Alex (Golden Triangle & Coast of India)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 10);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 12);

  const demoTrip = await prisma.trip.create({
    data: {
      userId: demoUser.id,
      name: 'Grand Royal India Tour: Mumbai & Jaipur',
      description: 'Multi-city expedition exploring Mumbai coastal skylines and Jaipur royal fortresses.',
      startDate,
      endDate,
      coverPhoto: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80',
      visibility: 'PUBLIC',
      totalBudget: 75000,
      currency: 'INR',
      shareToken: 'india-royal-tour-2026-demo',
    },
  });

  // Stop 1: Mumbai
  const stop1Start = new Date(startDate);
  const stop1End = new Date(startDate);
  stop1End.setDate(stop1End.getDate() + 5);

  const stop1 = await prisma.tripStop.create({
    data: {
      tripId: demoTrip.id,
      cityId: Mumbai.id,
      startDate: stop1Start,
      endDate: stop1End,
      order: 1,
      notes: 'Hotel near Marine Drive seafront.',
    },
  });

  // Stop 2: Jaipur
  const stop2Start = new Date(stop1End);
  const stop2End = new Date(endDate);

  const stop2 = await prisma.tripStop.create({
    data: {
      tripId: demoTrip.id,
      cityId: Jaipur.id,
      startDate: stop2Start,
      endDate: stop2End,
      order: 2,
      notes: 'Heritage Haveli stay in Pink City center.',
    },
  });

  // Sample Expenses in INR
  await prisma.expense.create({
    data: {
      tripId: demoTrip.id,
      tripStopId: stop1.id,
      category: 'Accommodation',
      amount: 28000,
      currency: 'INR',
      description: 'Marine Drive Seafront Hotel (5 Nights)',
      date: stop1Start,
    },
  });

  await prisma.expense.create({
    data: {
      tripId: demoTrip.id,
      tripStopId: stop2.id,
      category: 'Transport',
      amount: 8500,
      currency: 'INR',
      description: 'Vande Bharat Express Train Tickets',
      date: stop2Start,
    },
  });

  console.log('✅ Seeding completed with INR support!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
