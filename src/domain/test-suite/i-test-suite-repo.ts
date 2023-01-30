import { TestSuite } from '../entities/quant-test-suite';
import { IServiceRepo } from '../services/i-service-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { ExecutionType } from '../value-types/execution-type';

export interface TestSuiteUpdateDto {
  activated?: boolean;
  threshold?: number;
  cron?: string;
  executionType?: ExecutionType;
  importanceThreshold?: number;
  boundsIntervalRelative?: number;
}

export interface TestSuiteQueryDto {
  activated?: boolean;
  ids?: string[];
  targetResourceId?: string;
}

export type ITestSuiteRepo = IServiceRepo<
  TestSuite,
  TestSuiteQueryDto,
  TestSuiteUpdateDto
> & {
  softDeleteMany(
    targetResourceId: string,
    connPool: IConnectionPool
  ): Promise<void>;
};
