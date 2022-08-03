import { TestSuite, TestType } from '../entities/test-suite';

export interface TestSuiteDto {
  id: string;
  activated: boolean;
  type: TestType;
  threshold: number;
  executionFrequency: number;
  materializationAddress: string;
  columnName?: string;
}

export const buildTestSuiteDto = (testSuite: TestSuite): TestSuiteDto => ({
  id: testSuite.id,
  activated: testSuite.activated,
  type: testSuite.type,
  threshold: testSuite.threshold,
  executionFrequency: testSuite.executionFrequency,
  materializationAddress: testSuite.materializationAddress,
  columnName: testSuite.columnName,
});
