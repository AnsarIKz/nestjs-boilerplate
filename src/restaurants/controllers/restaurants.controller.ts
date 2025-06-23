import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { RestaurantsService } from '../services/restaurants.service';
import { CreateRestaurantDto } from '../dto/create-restaurant.dto';
import { UpdateRestaurantDto } from '../dto/update-restaurant.dto';
import { SearchRestaurantsDto } from '../dto/search-restaurants.dto';
import { AdvancedSearchDto } from '../dto/advanced-search.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'RESTAURANT_OWNER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Создать ресторан',
    description: 'Создание нового ресторана (только для админов и владельцев ресторанов)',
  })
  @ApiResponse({
    status: 201,
    description: 'Ресторан успешно создан',
    schema: {
      example: {
        id: 'uuid-string',
        name: 'Новый ресторан',
        description: 'Описание ресторана',
        address: 'ул. Абая 123, Алматы',
        phoneNumber: '+77001234567',
        email: 'info@restaurant.kz',
        cuisine: ['ITALIAN'],
        priceRange: 'MODERATE',
        rating: 0,
        capacity: 50,
        features: ['WIFI', 'PARKING'],
        isActive: true,
        createdAt: '2024-12-20T10:30:00.000Z',
        updatedAt: '2024-12-20T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantsService.create(createRestaurantDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список ресторанов',
    description: 'Получение списка ресторанов с возможностью фильтрации и поиска',
  })
  @ApiResponse({
    status: 200,
    description: 'Список ресторанов получен успешно',
    schema: {
      example: {
        data: {
          restaurants: [
            {
              id: 'uuid-string',
              name: 'Хинкали House',
              description: 'Аутентичный грузинский ресторан с традиционными хинкали',
              address: 'ул. Достык 123, Алматы',
              phoneNumber: '+77771234567',
              email: 'info@khinkalihouse.kz',
              website: 'https://khinkalihouse.kz',
              cuisine: ['GEORGIAN'],
              priceRange: 'MODERATE',
              rating: 4.8,
              capacity: 80,
              imageUrls: ['https://example.com/khinkali1.jpg'],
              features: ['KHINKALI', 'KHACHAPURI', 'GEORGIAN_CUISINE', 'WIFI', 'PARKING'],
              openingHours: {
                monday: { open: '10:00', close: '23:00' },
                tuesday: { open: '10:00', close: '23:00' },
              },
              isActive: true,
              createdAt: '2024-12-20T10:30:00.000Z',
              updatedAt: '2024-12-20T10:30:00.000Z',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        statusCode: 200,
        message: 'Success',
      },
    },
  })
  @ApiQuery({ name: 'page', required: false, description: 'Номер страницы', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Количество элементов на странице',
    example: 10,
  })
  @ApiQuery({
    name: 'cuisine',
    required: false,
    description: 'Тип кухни для фильтрации',
    example: 'ITALIAN',
  })
  @ApiQuery({
    name: 'priceRange',
    required: false,
    description: 'Ценовая категория',
    enum: ['BUDGET', 'MODERATE', 'EXPENSIVE', 'LUXURY'],
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: 'Минимальный рейтинг',
    example: 4.0,
  })
  @ApiQuery({ name: 'search', required: false, description: 'Поисковый запрос', example: 'Pizza' })
  @ApiQuery({
    name: 'features',
    required: false,
    description: 'Фильтр по особенностям ресторана',
    type: [String],
    enum: [
      'WIFI',
      'PARKING',
      'OUTDOOR_SEATING',
      'LIVE_MUSIC',
      'KARAOKE',
      'PRIVATE_DINING',
      'KIDS_MENU',
      'PLAYGROUND',
      'PET_FRIENDLY',
      'WHEELCHAIR_ACCESSIBLE',
      'AIR_CONDITIONING',
      'FIREPLACE',
      'BAR',
      'WINE_CELLAR',
      'BUFFET',
      'TAKEAWAY',
      'DELIVERY',
      'RESERVATION_REQUIRED',
      'CREDIT_CARDS_ACCEPTED',
      'CASH_ONLY',
      'VEGAN_OPTIONS',
      'GLUTEN_FREE_OPTIONS',
      'HALAL_FOOD',
      'KOSHER_FOOD',
      'BREAKFAST',
      'BRUNCH',
      'LUNCH',
      'DINNER',
      'LATE_NIGHT',
      'HOOKAH',
      'GEORGIAN_CUISINE',
      'KHINKALI',
      'KHACHAPURI',
      'MTSVADI',
      'CHURCHKHELA',
      'CHACHA_TASTING',
      'TRADITIONAL_MUSIC',
      'NATIONAL_COSTUMES',
      'TAMADA_SERVICE',
    ],
    example: ['WIFI', 'PARKING'],
  })
  findAll(@Query() searchDto: SearchRestaurantsDto) {
    return this.restaurantsService.findAll(searchDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить ресторан по ID',
    description: 'Получение детальной информации о ресторане по его ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Уникальный идентификатор ресторана',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация о ресторане получена успешно',
    schema: {
      example: {
        id: 'uuid-string',
        name: 'Хинкали House',
        description: 'Аутентичный грузинский ресторан с традиционными хинкали',
        address: 'ул. Достык 123, Алматы',
        phoneNumber: '+77771234567',
        email: 'info@khinkalihouse.kz',
        website: 'https://khinkalihouse.kz',
        cuisine: ['GEORGIAN'],
        priceRange: 'MODERATE',
        rating: 4.8,
        capacity: 80,
        imageUrls: ['https://example.com/khinkali1.jpg', 'https://example.com/khinkali2.jpg'],
        features: [
          'KHINKALI',
          'KHACHAPURI',
          'GEORGIAN_CUISINE',
          'TRADITIONAL_MUSIC',
          'CHACHA_TASTING',
          'WIFI',
          'PARKING',
          'PRIVATE_DINING',
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
        isActive: true,
        createdAt: '2024-12-20T10:30:00.000Z',
        updatedAt: '2024-12-20T10:30:00.000Z',
        bookings: [
          {
            id: 'booking-uuid',
            bookingDate: '2024-12-25T00:00:00.000Z',
            bookingTime: '19:00',
            guestCount: 4,
            status: 'CONFIRMED',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Ресторан не найден' })
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Get(':id/available-slots')
  @ApiOperation({
    summary: 'Получить доступные временные слоты',
    description:
      'Получение доступных для бронирования временных слотов в ресторане на указанную дату',
  })
  @ApiParam({
    name: 'id',
    description: 'Уникальный идентификатор ресторана',
    example: 'uuid-string',
  })
  @ApiQuery({ name: 'date', description: 'Дата для проверки доступности', example: '2024-12-25' })
  @ApiResponse({
    status: 200,
    description: 'Список доступных временных слотов',
    schema: { type: 'array', items: { type: 'string', example: '19:00' } },
  })
  @ApiResponse({ status: 404, description: 'Ресторан не найден' })
  getAvailableTimeSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.restaurantsService.getAvailableTimeSlots(id, new Date(date));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'RESTAURANT_OWNER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обновить ресторан',
    description: 'Обновление информации о ресторане (только для админов и владельцев ресторанов)',
  })
  @ApiParam({
    name: 'id',
    description: 'Уникальный идентификатор ресторана',
    example: 'uuid-string',
  })
  @ApiResponse({ status: 200, description: 'Ресторан успешно обновлен' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Ресторан не найден' })
  update(@Param('id') id: string, @Body() updateRestaurantDto: UpdateRestaurantDto) {
    return this.restaurantsService.update(id, updateRestaurantDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Продвинутый поиск ресторанов',
    description: 'Расширенный поиск ресторанов с множественными фильтрами и сортировкой',
  })
  @ApiResponse({
    status: 200,
    description: 'Результаты поиска ресторанов',
    schema: {
      example: {
        data: {
          restaurants: [
            {
              id: 'uuid-string',
              name: 'Хинкали House',
              description: 'Аутентичный грузинский ресторан с традиционными хинкали',
              address: 'ул. Достык 123, Алматы',
              phoneNumber: '+77771234567',
              cuisine: ['Georgian', 'Traditional'],
              priceRange: 'MODERATE',
              rating: 4.8,
              capacity: 80,
              features: ['KHINKALI', 'KHACHAPURI', 'GEORGIAN_CUISINE', 'WIFI', 'PARKING'],
              isActive: true,
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        statusCode: 200,
        message: 'Success',
      },
    },
  })
  advancedSearch(@Query() searchDto: AdvancedSearchDto) {
    return this.restaurantsService.advancedSearch(searchDto);
  }

  @Get('top-features')
  @ApiOperation({
    summary: 'Получить топ-10 популярных фич ресторанов',
    description: 'Получение списка самых популярных фич среди ресторанов',
  })
  @ApiResponse({
    status: 200,
    description: 'Топ-10 фич с количеством ресторанов',
    schema: {
      example: {
        data: [
          { feature: 'WIFI', count: 150 },
          { feature: 'PARKING', count: 120 },
          { feature: 'OUTDOOR_SEATING', count: 100 },
          { feature: 'LIVE_MUSIC', count: 85 },
          { feature: 'BAR', count: 75 },
        ],
        statusCode: 200,
        message: 'Success',
      },
    },
  })
  getTopFeatures() {
    return this.restaurantsService.getTopFeatures();
  }

  @Get('cuisine-types')
  @ApiOperation({
    summary: 'Получить все типы кухни',
    description: 'Получение всех доступных типов кухни для фильтрации',
  })
  @ApiResponse({
    status: 200,
    description: 'Список всех типов кухни',
    schema: {
      example: {
        data: [
          'GEORGIAN',
          'ITALIAN',
          'JAPANESE',
          'CHINESE',
          'KOREAN',
          'INDIAN',
          'THAI',
          'VIETNAMESE',
          'MEXICAN',
          'AMERICAN',
          'FRENCH',
          'GERMAN',
          'TURKISH',
          'ARABIC',
          'MEDITERRANEAN',
          'EUROPEAN',
          'ASIAN',
          'KAZAKH',
          'UZBEK',
          'KYRGYZ',
          'RUSSIAN',
          'UKRAINIAN',
          'ARMENIAN',
          'AZERBAIJANI',
          'GREEK',
          'SPANISH',
          'BRITISH',
          'IRISH',
          'LEBANESE',
          'PERSIAN',
          'AFGHAN',
          'PAKISTANI',
          'BANGLADESHI',
          'SRI_LANKAN',
          'NEPALESE',
          'TIBETAN',
          'MONGOLIAN',
          'BRAZILIAN',
          'ARGENTINIAN',
          'PERUVIAN',
          'CHILEAN',
          'COLOMBIAN',
          'VENEZUELAN',
          'CUBAN',
          'JAMAICAN',
          'CARIBBEAN',
          'AFRICAN',
          'ETHIOPIAN',
          'MOROCCAN',
          'EGYPTIAN',
          'TUNISIAN',
          'SOUTH_AFRICAN',
          'NIGERIAN',
          'KENYAN',
          'AUSTRALIAN',
          'NEW_ZEALAND',
          'FUSION',
          'INTERNATIONAL',
          'VEGETARIAN',
          'VEGAN',
          'GLUTEN_FREE',
          'ORGANIC',
          'FAST_FOOD',
          'STREET_FOOD',
          'SEAFOOD',
          'STEAKHOUSE',
          'BARBECUE',
          'PIZZA',
          'PASTA',
          'SUSHI',
          'RAMEN',
          'BURGER',
          'SANDWICH',
          'SALAD',
          'SOUP',
          'DESSERT',
          'BAKERY',
          'CAFE',
          'COFFEE',
          'TEA',
          'JUICE_BAR',
          'SMOOTHIE',
          'ICE_CREAM',
        ],
        statusCode: 200,
        message: 'Success',
      },
    },
  })
  getCuisineTypes() {
    return this.restaurantsService.getCuisineTypes();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Удалить ресторан',
    description: 'Деактивация ресторана (только для админов)',
  })
  @ApiParam({
    name: 'id',
    description: 'Уникальный идентификатор ресторана',
    example: 'uuid-string',
  })
  @ApiResponse({ status: 200, description: 'Ресторан успешно деактивирован' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав (только админы)' })
  @ApiResponse({ status: 404, description: 'Ресторан не найден' })
  remove(@Param('id') id: string) {
    return this.restaurantsService.remove(id);
  }
}
