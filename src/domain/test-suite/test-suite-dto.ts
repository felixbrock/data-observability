import { Expectation } from '../entities/expectation';
import { Job } from '../entities/job';
import { TestSuite } from '../entities/test-suite';

interface ExpectationDto {
  localId: string;
  type: string;
  threshold: number;
}

const buildExpectationDto = (expectation: Expectation): ExpectationDto => ({
  localId: expectation.localId,
  type: expectation.type,
  threshold: expectation.threshold,
});

interface JobDto {
  localId: string;
  frequency: number;
}

const buildJobDto = (job: Job): JobDto => ({
  localId: job.localId,
  frequency: job.frequency,
});

export interface TestSuiteDto {
  id: string;
  expectation: ExpectationDto;
  job: JobDto;
}

export const buildTestSuiteDto = (testSuite: TestSuite): TestSuiteDto => ({
  id: testSuite.id,
  expectation: buildExpectationDto(testSuite.expectation),
  job: buildJobDto(testSuite.job),
});
