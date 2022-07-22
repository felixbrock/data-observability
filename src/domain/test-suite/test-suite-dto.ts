import { Job } from '../value-types/job';
import { Target, TestSuite, TestType } from '../entities/test-suite';

interface JobDto {
  frequency: string;
}

const buildJobDto = (job: Job): JobDto => ({
  frequency: job.frequency,
});

export interface TestSuiteDto {
  id: string;
  activated: boolean;
  job: JobDto;
  target: Target;
  type: TestType;
}

export const buildTestSuiteDto = (testSuite: TestSuite): TestSuiteDto => ({
  id: testSuite.id,
  activated: testSuite.activated,
  job: buildJobDto(testSuite.job),
  target: testSuite.target,
  type: testSuite.type
});
