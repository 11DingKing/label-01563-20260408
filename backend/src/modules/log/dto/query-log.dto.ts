import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class QueryLogDto extends PaginationDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
