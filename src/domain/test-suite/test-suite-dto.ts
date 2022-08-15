import {
  MaterializationType,
  TestSuite,
  TestType,
} from '../entities/test-suite';

export interface TestSuiteDto {
  id: string;
  activated: boolean;
  type: TestType;
  threshold: number;
  executionFrequency: number;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
  targetResourceId: string;
  organizationId: string;
}

export const buildTestSuiteDto = (testSuite: TestSuite): TestSuiteDto => ({
  id: testSuite.id,
  activated: testSuite.activated,
  type: testSuite.type,
  threshold: testSuite.threshold,
  executionFrequency: testSuite.executionFrequency,
  databaseName: testSuite.databaseName,
  schemaName: testSuite.schemaName,
  materializationName: testSuite.materializationName,
  materializationType: testSuite.materializationType,
  columnName: testSuite.columnName,
  targetResourceId: testSuite.targetResourceId,
  organizationId: testSuite.organizationId,
});
