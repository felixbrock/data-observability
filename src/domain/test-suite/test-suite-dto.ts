import { Expectation } from '../entities/expectation';
import { TestSuite } from '../entities/test-suite';

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
  expectation: ExpectationDto;
}

export const buildTestSuiteDto = (testSuite: TestSuite): TestSuiteDto => ({
  id: testSuite.id,
  expectation: buildExpectationDto(testSuite.expectation),
});
