import { CustomTestType } from '../../entities/custom-test-suite';
import { ThresholdType } from '../../snowflake-api/post-anomaly-feedback';

export interface CustomTestAlertDto {
  alertId: string;
  testType: CustomTestType;
  name: string;
  message: string;
  expectedUpperBound: string;
  expectedLowerBound: string;
  detectedOn: string;
  databaseName?: string;
  schemaName?: string;
  materializationName?: string;
  columnName?: string;
  deviation: string;
  targetResourceId?: string;
  chartUrl: string;
  testSuiteId: string;
  detectedValue: string;
  thresholdType: ThresholdType;
}