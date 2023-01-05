import { QualitativeTestSuite } from '../entities/qualitative-test-suite';
import { IServiceRepo } from '../services/i-service-repo';
import { ExecutionType } from '../value-types/execution-type';

export interface QualitativeTestSuiteUpdateDto {
  activated?: boolean;
  cron?: string;
  executionType?: ExecutionType;
}

export interface QualitativeTestSuiteQueryDto {
  activated?: boolean;
  ids?: string[];
}

export type IQualitativeTestSuiteRepo = IServiceRepo<
  QualitativeTestSuite,
  QualitativeTestSuiteQueryDto,
  QualitativeTestSuiteUpdateDto
>;
