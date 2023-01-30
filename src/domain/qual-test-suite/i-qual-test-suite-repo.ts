import { QualTestSuite } from '../entities/qual-test-suite';
import { IServiceRepo } from '../services/i-service-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { ExecutionType } from '../value-types/execution-type';

export interface QualTestSuiteUpdateDto {
  activated?: boolean;
  cron?: string;
  executionType?: ExecutionType;
}

export interface QualTestSuiteQueryDto {
  activated?: boolean;
  ids?: string[];
  targetResourceId?: string;
}

export type IQualTestSuiteRepo = IServiceRepo<
  QualTestSuite,
  QualTestSuiteQueryDto,
  QualTestSuiteUpdateDto
> & {
  softDeleteMany(
    targetResourceId: string,
    connPool: IConnectionPool
  ): Promise<void>;
};
