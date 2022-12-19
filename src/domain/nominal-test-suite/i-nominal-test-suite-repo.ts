import { NominalTestSuite } from '../entities/nominal-test-suite';
import { IServiceRepo } from '../services/i-service-repo';
import { ExecutionType } from '../value-types/execution-type';

export interface NominalTestSuiteUpdateDto {
  activated?: boolean;
  cron?: string;
  executionType?: ExecutionType;
}

export interface NominalTestSuiteQueryDto {
  activated?: boolean;
  ids?: string[];
}

export type INominalTestSuiteRepo = IServiceRepo<
  NominalTestSuite,
  NominalTestSuiteQueryDto,
  NominalTestSuiteUpdateDto
>;
