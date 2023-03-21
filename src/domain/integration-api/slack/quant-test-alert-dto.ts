import { TestType } from '../../entities/quant-test-suite';

export interface QuantTestAlertDto {
  alertId: string;
  value: string;
  testType: TestType;
  message: string;
  expectedUpperBound: string;
  expectedLowerBound: string;
  detectedOn: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  columnName?: string;
  deviation: string;
  targetResourceId: string;
  chartUrl: string;
  importance: string;

  testSuiteId: string;
}
