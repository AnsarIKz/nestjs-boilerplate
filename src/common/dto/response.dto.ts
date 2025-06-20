import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Сообщение ответа',
    example: 'Операция выполнена успешно',
  })
  message: string;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Список элементов',
    type: 'array',
  })
  items: T[];

  @ApiProperty({
    description: 'Общее количество элементов',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Текущая страница',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Количество элементов на странице',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Общее количество страниц',
    example: 10,
  })
  totalPages: number;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP статус код',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Сообщение об ошибке',
    example: 'Некорректные данные',
  })
  message: string;

  @ApiProperty({
    description: 'Тип ошибки',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'Временная метка',
    example: '2024-12-20T10:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Путь запроса',
    example: '/api/v1/restaurants',
  })
  path: string;
}
