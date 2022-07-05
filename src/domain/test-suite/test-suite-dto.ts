import { Expectation } from '../entities/expectation';
import { Job } from '../entities/job';
import { TestSuite } from '../entities/test-suite';


interface JobDto {
  localId: string;
  frequency: string;
}

const buildJobDto = (job: Job): JobDto => ({
  localId: job.localId,
  frequency: job.frequency
});
interface ExpectationDto {
  localId: string;
  type: string;
  testType: string;
  configuration: {[key: string]: string | number};
}

const buildExpectationDto = (expectation: Expectation): ExpectationDto => ({
  localId: expectation.localId,
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
