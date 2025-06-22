import { PrismaClient, RestaurantFeature, PriceRange } from '@prisma/client';

const prisma = new PrismaClient();

const restaurantsWithFeatures = [
  {
    name: 'Хинкали House',
    description: 'Аутентичный грузинский ресторан с традиционными хинкали',
    address: 'ул. Достык 123, Алматы',
    phoneNumber: '+77771234567',
    email: 'info@khinkalihouse.kz',
    website: 'https://khinkalihouse.kz',
    cuisine: ['Georgian', 'Traditional'],
    priceRange: PriceRange.MODERATE,
    rating: 4.8,
    capacity: 80,
    imageUrls: ['https://example.com/khinkali1.jpg', 'https://example.com/khinkali2.jpg'],
    features: [
      RestaurantFeature.KHINKALI,
      RestaurantFeature.KHACHAPURI,
      RestaurantFeature.GEORGIAN_CUISINE,
      RestaurantFeature.TRADITIONAL_MUSIC,
      RestaurantFeature.CHACHA_TASTING,
      RestaurantFeature.WIFI,
      RestaurantFeature.PARKING,
      RestaurantFeature.PRIVATE_DINING,
    ],
    openingHours: {
      monday: { open: '10:00', close: '23:00' },
      tuesday: { open: '10:00', close: '23:00' },
      wednesday: { open: '10:00', close: '23:00' },
      thursday: { open: '10:00', close: '23:00' },
      friday: { open: '10:00', close: '24:00' },
      saturday: { open: '10:00', close: '24:00' },
      sunday: { open: '10:00', close: '23:00' },
    },
  },
  {
    name: 'Pizza Palace',
    description: 'Современная пиццерия с wood-fired печью',
    address: 'ул. Абая 456, Алматы',
    phoneNumber: '+77772345678',
    email: 'hello@pizzapalace.kz',
    cuisine: ['Italian', 'Pizza'],
    priceRange: PriceRange.BUDGET,
    rating: 4.3,
    capacity: 60,
    features: [
      RestaurantFeature.WIFI,
      RestaurantFeature.TAKEAWAY,
      RestaurantFeature.DELIVERY,
      RestaurantFeature.KIDS_MENU,
      RestaurantFeature.OUTDOOR_SEATING,
      RestaurantFeature.VEGAN_OPTIONS,
      RestaurantFeature.CREDIT_CARDS_ACCEPTED,
    ],
    openingHours: {
      monday: { open: '11:00', close: '22:00' },
      tuesday: { open: '11:00', close: '22:00' },
      wednesday: { open: '11:00', close: '22:00' },
      thursday: { open: '11:00', close: '22:00' },
      friday: { open: '11:00', close: '23:00' },
      saturday: { open: '11:00', close: '23:00' },
      sunday: { open: '12:00', close: '22:00' },
    },
  },
  {
    name: 'Sushi Zen',
    description: 'Японский ресторан с свежими морепродуктами',
    address: 'пр. Назарбаева 789, Алматы',
    phoneNumber: '+77773456789',
    email: 'info@sushizen.kz',
    website: 'https://sushizen.kz',
    cuisine: ['Japanese', 'Sushi'],
    priceRange: PriceRange.EXPENSIVE,
    rating: 4.7,
    capacity: 40,
    features: [
      RestaurantFeature.WIFI,
      RestaurantFeature.PRIVATE_DINING,
      RestaurantFeature.BAR,
      RestaurantFeature.RESERVATION_REQUIRED,
      RestaurantFeature.CREDIT_CARDS_ACCEPTED,
      RestaurantFeature.AIR_CONDITIONING,
      RestaurantFeature.HALAL_FOOD,
    ],
    openingHours: {
      monday: { open: '12:00', close: '23:00' },
      tuesday: { open: '12:00', close: '23:00' },
      wednesday: { open: '12:00', close: '23:00' },
      thursday: { open: '12:00', close: '23:00' },
      friday: { open: '12:00', close: '24:00' },
      saturday: { open: '12:00', close: '24:00' },
      sunday: { open: '12:00', close: '23:00' },
    },
  },
  {
    name: 'Karaoke Café',
    description: 'Кафе с караоке и живой музыкой',
    address: 'ул. Толе би 321, Алматы',
    phoneNumber: '+77774567890',
    cuisine: ['International', 'Fusion'],
    priceRange: PriceRange.MODERATE,
    rating: 4.2,
    capacity: 100,
    features: [
      RestaurantFeature.KARAOKE,
      RestaurantFeature.LIVE_MUSIC,
      RestaurantFeature.BAR,
      RestaurantFeature.WIFI,
      RestaurantFeature.PARKING,
      RestaurantFeature.LATE_NIGHT,
      RestaurantFeature.PRIVATE_DINING,
      RestaurantFeature.HOOKAH,
    ],
    openingHours: {
      monday: { open: '18:00', close: '02:00' },
      tuesday: { open: '18:00', close: '02:00' },
      wednesday: { open: '18:00', close: '02:00' },
      thursday: { open: '18:00', close: '03:00' },
      friday: { open: '18:00', close: '04:00' },
      saturday: { open: '18:00', close: '04:00' },
      sunday: { open: '18:00', close: '02:00' },
    },
  },
  {
    name: 'Family Garden',
    description: 'Семейный ресторан с детской площадкой',
    address: 'ул. Розыбакиева 654, Алматы',
    phoneNumber: '+77775678901',
    email: 'contact@familygarden.kz',
    cuisine: ['European', 'International'],
    priceRange: PriceRange.MODERATE,
    rating: 4.5,
    capacity: 120,
    features: [
      RestaurantFeature.PLAYGROUND,
      RestaurantFeature.KIDS_MENU,
      RestaurantFeature.OUTDOOR_SEATING,
      RestaurantFeature.PARKING,
      RestaurantFeature.WIFI,
      RestaurantFeature.PET_FRIENDLY,
      RestaurantFeature.BUFFET,
      RestaurantFeature.BREAKFAST,
      RestaurantFeature.BRUNCH,
      RestaurantFeature.WHEELCHAIR_ACCESSIBLE,
    ],
    openingHours: {
      monday: { open: '08:00', close: '22:00' },
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '23:00' },
      saturday: { open: '09:00', close: '23:00' },
      sunday: { open: '09:00', close: '22:00' },
    },
  },
  {
    name: 'Vegan Paradise',
    description: 'Первый полностью веганский ресторан в городе',
    address: 'ул. Жамбыла 987, Алматы',
    phoneNumber: '+77776789012',
    email: 'hello@veganparadise.kz',
    website: 'https://veganparadise.kz',
    cuisine: ['Vegan', 'Healthy'],
    priceRange: PriceRange.MODERATE,
    rating: 4.6,
    capacity: 50,
    features: [
      RestaurantFeature.VEGAN_OPTIONS,
      RestaurantFeature.GLUTEN_FREE_OPTIONS,
      RestaurantFeature.WIFI,
      RestaurantFeature.TAKEAWAY,
      RestaurantFeature.DELIVERY,
      RestaurantFeature.OUTDOOR_SEATING,
      RestaurantFeature.BREAKFAST,
      RestaurantFeature.LUNCH,
      RestaurantFeature.AIR_CONDITIONING,
    ],
    openingHours: {
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
      wednesday: { open: '09:00', close: '21:00' },
      thursday: { open: '09:00', close: '21:00' },
      friday: { open: '09:00', close: '22:00' },
      saturday: { open: '10:00', close: '22:00' },
      sunday: { open: '10:00', close: '21:00' },
    },
  },
  {
    name: 'Luxury Steakhouse',
    description: 'Премиальный стейк-хаус с винным погребом',
    address: 'пр. Аль-Фараби 147, Алматы',
    phoneNumber: '+77777890123',
    email: 'reservations@luxurysteakhouse.kz',
    website: 'https://luxurysteakhouse.kz',
    cuisine: ['American', 'Steakhouse'],
    priceRange: PriceRange.LUXURY,
    rating: 4.9,
    capacity: 60,
    features: [
      RestaurantFeature.WINE_CELLAR,
      RestaurantFeature.PRIVATE_DINING,
      RestaurantFeature.RESERVATION_REQUIRED,
      RestaurantFeature.FIREPLACE,
      RestaurantFeature.BAR,

      RestaurantFeature.CREDIT_CARDS_ACCEPTED,
      RestaurantFeature.DINNER,
      RestaurantFeature.AIR_CONDITIONING,
    ],
    openingHours: {
      monday: { open: '17:00', close: '23:00' },
      tuesday: { open: '17:00', close: '23:00' },
      wednesday: { open: '17:00', close: '23:00' },
      thursday: { open: '17:00', close: '23:00' },
      friday: { open: '17:00', close: '24:00' },
      saturday: { open: '17:00', close: '24:00' },
      sunday: { open: '17:00', close: '23:00' },
    },
  },
  {
    name: 'Traditional Dastarkhan',
    description: 'Казахский ресторан с национальной кухней',
    address: 'ул. Богенбай батыра 258, Алматы',
    phoneNumber: '+77778901234',
    email: 'info@dastarkhan.kz',
    cuisine: ['Kazakh', 'Traditional'],
    priceRange: PriceRange.MODERATE,
    rating: 4.4,
    capacity: 90,
    features: [
      RestaurantFeature.NATIONAL_COSTUMES,
      RestaurantFeature.TRADITIONAL_MUSIC,
      RestaurantFeature.TAMADA_SERVICE,
      RestaurantFeature.PRIVATE_DINING,
      RestaurantFeature.PARKING,
      RestaurantFeature.WIFI,
      RestaurantFeature.HALAL_FOOD,
      RestaurantFeature.LUNCH,
      RestaurantFeature.DINNER,
    ],
    openingHours: {
      monday: { open: '11:00', close: '23:00' },
      tuesday: { open: '11:00', close: '23:00' },
      wednesday: { open: '11:00', close: '23:00' },
      thursday: { open: '11:00', close: '23:00' },
      friday: { open: '11:00', close: '24:00' },
      saturday: { open: '11:00', close: '24:00' },
      sunday: { open: '11:00', close: '23:00' },
    },
  },
];

export async function seedRestaurantFeatures() {
  console.log('🌱 Seeding restaurants with features...');

  for (const restaurant of restaurantsWithFeatures) {
    try {
      const created = await prisma.restaurant.create({
        data: restaurant,
      });
      console.log(`✅ Created restaurant: ${created.name}`);
    } catch (error) {
      console.error(`❌ Failed to create restaurant ${restaurant.name}:`, error);
    }
  }

  console.log('🎉 Restaurant features seeding completed!');
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedRestaurantFeatures()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
