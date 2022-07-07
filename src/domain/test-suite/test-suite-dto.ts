import { Expectation } from '../value-types/expectation';
import { Job } from '../value-types/job';
import { TestSuite } from '../entities/test-suite';


interface JobDto {
  frequency: string;
}

const buildJobDto = (job: Job): JobDto => ({
  frequency: job.frequency
});
interface ExpectationDto {
  type: string;
  testType: string;
  configuration: {[key: string]: string | number};
}

const buildExpectationDto = (expectation: Expectation): ExpectationDto => ({
  type: expectation.type,
  testType: expectation.testType,
  configuration: expectation.configuration,
});

export interface TestSuiteDto {
  id: string;
  activated: boolean;
  expectation: ExpectationDto;
  job: JobDto;
  targetId: string;
}

export const buildTestSuiteDto = (testSuite: TestSuite): TestSuiteDto => ({
  id: testSuite.id,
  activated: testSuite.activated,
  expectation: buildExpectationDto(testSuite.expectation),
  job: buildJobDto(testSuite.job),
  targetId: testSuite.targetId
});
