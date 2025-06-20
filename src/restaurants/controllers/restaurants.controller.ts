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
  @ApiResponse({ status: 201, description: 'Ресторан успешно создан' })
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
  @ApiResponse({ status: 200, description: 'Список ресторанов получен успешно' })
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
    example: 'Italian',
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
  @ApiResponse({ status: 200, description: 'Информация о ресторане получена успешно' })
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
