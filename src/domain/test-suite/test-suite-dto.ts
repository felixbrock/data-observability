import {
  Expectation,
} from '../value-types/expectation';
import { Job } from '../value-types/job';
import { TestSuite } from '../entities/test-suite';
import {
  DataType,
  IStatisticalModel,
} from '../statistical-model/i-statistical-model';

interface JobDto {
  frequency: string;
}

const buildJobDto = (job: Job): JobDto => ({
  frequency: job.frequency,
});
interface ExpectationDto {
  type: string;
  configuration: { [key: string]: string | number };
}

const buildExpectationDto = (expectation: Expectation): ExpectationDto => ({
  type: expectation.type,
  configuration: expectation.configuration,
});

interface StatisticalModelDto {
  expectation: ExpectationDto;
}

const buildStatisticalModelDto = (
  statisticalModel: IStatisticalModel<DataType>
): StatisticalModelDto => ({
  expectation: buildExpectationDto(statisticalModel.expectation),
});

export interface TestSuiteDto {
  id: string;
  activated: boolean;
  statisticalModel: StatisticalModelDto;
  job: JobDto;
  targetId: string;
}

export const buildTestSuiteDto = (testSuite: TestSuite): TestSuiteDto => ({
  id: testSuite.id,
  activated: testSuite.activated,
  statisticalModel: buildStatisticalModelDto(testSuite.statisticalModel),
  job: buildJobDto(testSuite.job),
  targetId: testSuite.targetId,
});
