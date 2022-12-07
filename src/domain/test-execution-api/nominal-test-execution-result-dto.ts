import { NominalTestType } from '../entities/nominal-test-suite';
import { MaterializationType } from '../value-types/materialization-type';

export interface NominalTestExecutionResultDto {
  testSuiteId: string;
  testType: NominalTestType;
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
