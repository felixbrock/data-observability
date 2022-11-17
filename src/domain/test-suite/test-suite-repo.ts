import { TestSuite } from '../entities/test-suite';
import { IBaseServiceRepo } from '../services/i-base-service-repo';
import { ExecutionType } from '../value-types/execution-type';

export interface TestSuiteUpdateDto {
  activated?: boolean;
  threshold?: number;
  frequency?: number;
  cron?: string;
  executionType?: ExecutionType;
}

export interface TestSuiteQueryDto {
  activated?: boolean;
}

export type ITestSuiteRepo = IBaseServiceRepo<
  TestSuite,
  TestSuiteQueryDto,
  TestSuiteUpdateDto
>;
