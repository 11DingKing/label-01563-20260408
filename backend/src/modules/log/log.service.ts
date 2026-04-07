import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { OperationLog } from './entities/operation-log.entity';
import { QueryLogDto } from './dto/query-log.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

export interface CreateLogDto {
  userId?: number;
  username?: string;
  action: string;
  module: string;
  method: string;
  path: string;
  params?: string;
  result?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  status?: number;
}

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(OperationLog)
    private readonly logRepository: Repository<OperationLog>,
  ) {}

  async create(createLogDto: CreateLogDto): Promise<OperationLog> {
    const log = this.logRepository.create(createLogDto);
    return this.logRepository.save(log);
  }

  async findAll(queryDto: QueryLogDto): Promise<PaginatedResult<OperationLog>> {
    const {
      page = 1,
      pageSize = 10,
      username,
      module,
      action,
      status,
      startDate,
      endDate,
    } = queryDto;

    const queryBuilder = this.logRepository.createQueryBuilder('log');

    if (username) {
      queryBuilder.andWhere('log.username LIKE :username', {
        username: `%${username}%`,
      });
    }

    if (module) {
      queryBuilder.andWhere('log.module = :module', { module });
    }

    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }

    if (status !== undefined) {
      queryBuilder.andWhere('log.status = :status', { status });
    }

    if (startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', {
        endDate: new Date(endDate + ' 23:59:59'),
      });
    }

    queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResult(logs, total, page, pageSize);
  }

  async findOne(id: number): Promise<OperationLog> {
    const log = await this.logRepository.findOne({ where: { id } });

    if (!log) {
      throw new NotFoundException(`日志 ID ${id} 不存在`);
    }

    return log;
  }
}
