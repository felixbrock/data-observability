import { TestType } from '../entities/test-suite';
import { MaterializationType } from '../value-types/materialization-type';

export interface AnomalyTestExecutionResultDto {
  testSuiteId: string;
  testType: TestType;
  executionId: string;
  isWarmup: boolean;
  testData?: {
    executedOn: string;
    isAnomolous: boolean;
    modifiedZScore: number;
    deviation: number;
  };
  alertData?: {
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
  targetResourceId: string;
  organizationId: string;
}
