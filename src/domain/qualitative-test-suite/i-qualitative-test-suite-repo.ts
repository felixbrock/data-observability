import { BaseQualTestSuite } from '../entities/qualitative-test-suite';
import { IServiceRepo } from '../services/i-service-repo';
import { ExecutionType } from '../value-types/execution-type';

export interface QualTestSuiteUpdateDto {
  activated?: boolean;
  cron?: string;
  executionType?: ExecutionType;
}

export interface QualTestSuiteQueryDto {
  activated?: boolean;
  ids?: string[];
}

export type IQualTestSuiteRepo = IServiceRepo<
  BaseQualTestSuite,
  QualTestSuiteQueryDto,
  QualTestSuiteUpdateDto
>;
