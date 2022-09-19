import { MaterializationType, TestType } from '../entities/test-suite';

export interface SchemaChangeTestExecutionResultDto {
  testSuiteId: string;
  testType: TestType;
  executionId: string;
  testData: {
    executedOn: string;
    isAnomolous: boolean;
    schemaDiffs: any;
  };
  alertData?: {
    alertId: string;
    message: string;
    databaseName: string;
    schemaName: string;
    materializationName: string;
    materializationType: MaterializationType;
  };
  targetResourceId: string;
  organizationId: string;
}
