import {
  TestSuite,
  TestTarget,
  TestType,
} from '../entities/test-suite';

export interface TestSuiteDto {
  id: string;
  activated: boolean;
  type: TestType;
  threshold: number;
  executionFrequency: number;
  target: TestTarget;
  organizationId: string;
}

export const buildTestSuiteDto = (testSuite: TestSuite): TestSuiteDto => ({
  id: testSuite.id,
  activated: testSuite.activated,
  type: testSuite.type,
  threshold: testSuite.threshold,
  executionFrequency: testSuite.executionFrequency,
  target: testSuite.target,
  organizationId: testSuite.organizationId,
});
