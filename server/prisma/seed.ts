import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GlobeTrotter database seeding...');

  // Clean existing data
  await prisma.expense.deleteMany();
  await prisma.tripActivity.deleteMany();
  await prisma.tripStop.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.savedDestination.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  // Create Demo User
  const passwordHash = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.create({
    data: {
      email: 'alex@globetrotter.com',
      passwordHash,
      name: 'Alex Rivera',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'Wanderlust explorer, photography enthusiast, and food hunter. Planned 15+ countries!',
      language: 'en',
      defaultCurrency: 'USD',
    },
  });
  console.log(`👤 Created Demo User: ${demoUser.email} (Password: password123)`);

  // Create Cities
  const Tokyo = await prisma.city.create({
    data: {
      name: 'Tokyo',
      country: 'Japan',
      region: 'Asia',
      latitude: 35.6762,
      longitude: 139.6503,
      costIndex: 4.2,
      popularity: 4.9,
      description: 'A captivating blend of ultramodern skyscrapers, historic temples, neon lights, and world-class culinary scenes.',
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

  const Rome = await prisma.city.create({
    data: {
      name: 'Rome',
      country: 'Italy',
      region: 'Europe',
      latitude: 41.9028,
      longitude: 12.4964,
      costIndex: 3.8,
      popularity: 4.8,
      description: 'The Eternal City packed with 3,000 years of globally influential art, architecture, and mouthwatering pasta.',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
      heroImage: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=1600&q=80',
    },
  });

  const Bali = await prisma.city.create({
    data: {
      name: 'Bali',
      country: 'Indonesia',
      region: 'Asia',
      latitude: -8.4095,
      longitude: 115.1889,
      costIndex: 2.2,
      popularity: 4.9,
      description: 'Tropical paradise of volcanic mountains, iconic rice paddies, serene beaches, and vibrant coral reefs.',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
      heroImage: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1600&q=80',
    },
  });

  const NewYork = await prisma.city.create({
    data: {
      name: 'New York City',
      country: 'United States',
      region: 'North America',
      latitude: 40.7128,
      longitude: -74.006,
      costIndex: 4.8,
      popularity: 4.9,
      description: 'The Big Apple: global hub of culture, Broadway theater, world-famous museums, and non-stop energy.',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
      heroImage: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1600&q=80',
    },
  });

  const Kyoto = await prisma.city.create({
    data: {
      name: 'Kyoto',
      country: 'Japan',
      region: 'Asia',
      latitude: 35.0116,
      longitude: 135.7681,
      costIndex: 3.6,
      popularity: 4.7,
      description: 'Japan’s cultural heartland, famed for classical Buddhist temples, gardens, imperial palaces, and geisha traditions.',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      heroImage: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1600&q=80',
    },
  });

  const Barcelona = await prisma.city.create({
    data: {
      name: 'Barcelona',
      country: 'Spain',
      region: 'Europe',
      latitude: 41.3851,
      longitude: 2.1734,
      costIndex: 3.5,
      popularity: 4.7,
      description: 'Vibrant Mediterranean city celebrated for Antoni Gaudí architecture, sun-soaked beaches, and tapas culture.',
      image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80',
      heroImage: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1600&q=80',
    },
  });

  console.log('🏙️ Created 7 Global Cities.');

  // Create Activities
  // Tokyo Activities
  const actTokyo1 = await prisma.activity.create({
    data: {
      cityId: Tokyo.id,
      name: 'Senso-ji Temple & Asakusa Street Food',
      description: 'Explore Tokyo’s oldest temple founded in 645 AD and sample fresh melon pan and dango along Nakamise Street.',
      category: 'Culture',
      estimatedCost: 15,
      durationMinutes: 120,
      image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      address: '2 Chome-3-1 Asakusa, Taito City, Tokyo',
    },
  });

  const actTokyo2 = await prisma.activity.create({
    data: {
      cityId: Tokyo.id,
      name: 'Shibuya Crossing & Skytree Observatory',
      description: 'Walk the world’s busiest pedestrian crossing and witness 360-degree panoramic skyline views from 450 meters up.',
      category: 'Sightseeing',
      estimatedCost: 25,
      durationMinutes: 180,
      image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80',
      rating: 4.8,
      address: 'Shibuya City, Tokyo',
    },
  });

  const actTokyo3 = await prisma.activity.create({
    data: {
      cityId: Tokyo.id,
      name: 'Tsukiji Outer Market Omakase Tasting',
      description: 'Indulge in ultra-fresh sashimi, tamagoyaki, and A5 Wagyu skewers from authentic local vendors.',
      category: 'Food',
      estimatedCost: 65,
      durationMinutes: 90,
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80',
      rating: 4.95,
      address: '4 Chome-16-2 Tsukiji, Chuo City, Tokyo',
    },
  });

  // Kyoto Activities
  const actKyoto1 = await prisma.activity.create({
    data: {
      cityId: Kyoto.id,
      name: 'Fushimi Inari Shrine Morning Walk',
      description: 'Hike through thousands of vibrant vermilion torii gates winding up sacred Mount Inari.',
      category: 'Sightseeing',
      estimatedCost: 0,
      durationMinutes: 150,
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
      rating: 4.95,
      address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto',
    },
  });

  const actKyoto2 = await prisma.activity.create({
    data: {
      cityId: Kyoto.id,
      name: 'Arashiyama Bamboo Grove & Tenryu-ji Temple',
      description: 'Stroll among towering bamboo stalks and experience UNESCO Zen garden landscaping.',
      category: 'Nature',
      estimatedCost: 10,
      durationMinutes: 120,
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
      rating: 4.85,
      address: 'Arashiyama, Ukyo Ward, Kyoto',
    },
  });

  // Paris Activities
  await prisma.activity.create({
    data: {
      cityId: Paris.id,
      name: 'Louvre Museum Priority Guided Tour',
      description: 'Skip-the-line access to see the Mona Lisa, Venus de Milo, and Winged Victory of Samothrace.',
      category: 'Culture',
      estimatedCost: 45,
      durationMinutes: 180,
      image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      address: '75001 Paris, France',
    },
  });

  await prisma.activity.create({
    data: {
      cityId: Paris.id,
      name: 'Seine River Sunset Dinner Cruise',
      description: 'Romantic 3-course French dinner onboard a glass-topped boat while gliding past illuminated monuments.',
      category: 'Food',
      estimatedCost: 110,
      durationMinutes: 150,
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
      rating: 4.88,
      address: 'Port de la Bourdonnais, Paris',
    },
  });

  // Bali Activities
  await prisma.activity.create({
    data: {
      cityId: Bali.id,
      name: 'Tegallalang Rice Terrace & Jungle Swing',
      description: 'Fly high above lush emerald valley palms on the famous Bali swing with breathtaking photos.',
      category: 'Adventure',
      estimatedCost: 20,
      durationMinutes: 120,
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
      rating: 4.75,
      address: 'Ubud, Gianyar, Bali',
    },
  });

  console.log('📍 Created sample activities for cities.');

  // Create Demo Trip for Alex
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 10);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 8);

  const demoTrip = await prisma.trip.create({
    data: {
      userId: demoUser.id,
      name: 'Ultimate Japan Heritage Expedition',
      description: '8-day immersive journey across Tokyo neon skylines and Kyoto serene temples.',
      startDate,
      endDate,
      coverPhoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      visibility: 'PUBLIC',
      totalBudget: 2500,
      currency: 'USD',
      shareToken: 'japan-expedition-2026-demo',
    },
  });

  // Trip Stop 1: Tokyo
  const stop1Start = new Date(startDate);
  const stop1End = new Date(startDate);
  stop1End.setDate(stop1End.getDate() + 4);

  const stop1 = await prisma.tripStop.create({
    data: {
      tripId: demoTrip.id,
      cityId: Tokyo.id,
      startDate: stop1Start,
      endDate: stop1End,
      order: 1,
      notes: 'Hotel in Shinjuku area near train station.',
    },
  });

  // Trip Stop 2: Kyoto
  const stop2Start = new Date(stop1End);
  const stop2End = new Date(endDate);

  const stop2 = await prisma.tripStop.create({
    data: {
      tripId: demoTrip.id,
      cityId: Kyoto.id,
      startDate: stop2Start,
      endDate: stop2End,
      order: 2,
      notes: 'Traditional Ryokan stay with Onsen experience.',
    },
  });

  // Scheduled Activities
  const day1Date = new Date(stop1Start);
  await prisma.tripActivity.create({
    data: {
      tripStopId: stop1.id,
      activityId: actTokyo1.id,
      scheduledDate: day1Date,
      startTime: '09:30',
      endTime: '12:00',
      customCost: 15,
      order: 1,
      notes: 'Meet guide at Kaminarimon Gate.',
      isCompleted: true,
    },
  });

  await prisma.tripActivity.create({
    data: {
      tripStopId: stop1.id,
      activityId: actTokyo3.id,
      scheduledDate: day1Date,
      startTime: '13:00',
      endTime: '14:30',
      customCost: 65,
      order: 2,
      notes: 'Reserve counter seat at Sushi Dai.',
    },
  });

  const day5Date = new Date(stop2Start);
  await prisma.tripActivity.create({
    data: {
      tripStopId: stop2.id,
      activityId: actKyoto1.id,
      scheduledDate: day5Date,
      startTime: '07:00',
      endTime: '09:30',
      customCost: 0,
      order: 1,
      notes: 'Early start to avoid crowds!',
    },
  });

  // Sample Expenses
  await prisma.expense.create({
    data: {
      tripId: demoTrip.id,
      tripStopId: stop1.id,
      category: 'Accommodation',
      amount: 620,
      currency: 'USD',
      description: 'Shinjuku Prince Hotel (4 Nights)',
      date: stop1Start,
    },
  });

  await prisma.expense.create({
    data: {
      tripId: demoTrip.id,
      tripStopId: stop1.id,
      category: 'Transport',
      amount: 210,
      currency: 'USD',
      description: '7-Day JR Pass Ticket',
      date: startDate,
    },
  });

  await prisma.expense.create({
    data: {
      tripId: demoTrip.id,
      tripStopId: stop2.id,
      category: 'Food',
      amount: 180,
      currency: 'USD',
      description: 'Kyoto Kaiseki Dinner Course',
      date: stop2Start,
    },
  });

  // Save Destination bookmark
  await prisma.savedDestination.create({
    data: {
      userId: demoUser.id,
      cityId: Paris.id,
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
