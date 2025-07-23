// src/common/dto/pagination.dto.ts
import { IsOptional, IsString, IsIn } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string; // tìm theo name

  @IsOptional()
  @IsString()
  sortBy?: string; // name | price | createdAt

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc'; // thứ tự tăng/giảm
}
