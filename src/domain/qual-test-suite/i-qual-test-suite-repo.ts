import { QualTestSuite } from '../entities/qual-test-suite';
import { IServiceRepo } from '../services/i-service-repo';
import { ExecutionType } from '../value-types/execution-type';

export interface QualTestSuiteUpdateDto {
  activated?: boolean;
  cron?: string;
  executionType?: ExecutionType;
  lastAlertSent?: string;
}

export interface QualTestSuiteQueryDto {
  activated?: boolean;
  ids?: string[];
  targetResourceIds?: string[];
  deleted: boolean;
}

export type IQualTestSuiteRepo = IServiceRepo<
  QualTestSuite,
  QualTestSuiteQueryDto,
  QualTestSuiteUpdateDto
>;
