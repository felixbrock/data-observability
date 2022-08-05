import { MaterializationType, TestType } from '../entities/test-suite';

export interface TestExecutionResultDto {
  testSuiteId: string;
  testType: TestType;
  executionId: string;
  executedOn: string;
  isAnomolous: boolean;
  alertSpecificData?: {
    alertId: string;
    message: string;
    value: number;
    expectedUpperBound: number;
    expectedLowerBound: number;
    databaseName: string;
    schemaName: string;
    materializationName: string;
    materializationType: MaterializationType;
    columnName?: string;
  };
  threshold: number;
  executionFrequency: number;
  modifiedZScore: number;
  deviation: number;
  organizationId: string;
}
