import { QualTestType } from '../entities/qual-test-suite';
import { MaterializationType } from '../value-types/materialization-type';

export interface SchemaDiff {
  column_name: [string | undefined, string | undefined];
  ordinal_position: [number | undefined, number | undefined];
  data_type: [string | undefined, string | undefined] | undefined;
  is_identity: [boolean | undefined, boolean | undefined] | undefined;
  is_nullable: [boolean | undefined, boolean | undefined] | undefined;
}

export interface QualTestTestData {
  executedOn: string;
  isIdentical: boolean;
  deviations: SchemaDiff[];
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
  lastAlertSent?: string;
}
