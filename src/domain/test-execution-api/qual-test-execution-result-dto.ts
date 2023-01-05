import { QualTestType } from '../entities/qual-test-suite';
import { MaterializationType } from '../value-types/materialization-type';

export interface QualTestTestData {
  executedOn: string;
  isAnomolous: boolean;
  schemaDiffs: any;
}

export interface QualTestAlertData {
  alertId: string;
  message: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
}

export interface QualTestExecutionResultDto {
  testSuiteId: string;
  testType: QualTestType;
  executionId: string;
  testData: QualTestTestData;
  alertData?: QualTestAlertData;
  targetResourceId: string;
  organizationId: string;
}
