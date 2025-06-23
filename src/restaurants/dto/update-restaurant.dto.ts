import { PartialType } from '@nestjs/mapped-types';
import { CreateRestaurantDto } from './create-restaurant.dto';
import { CuisineType } from '@prisma/client';

export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {}
