import { MaterializationType, TestType } from "../../entities/test-suite";

export interface AlertDto {
  value: number;
  testType: TestType;
  message: string;
  expectedUpperBound: number;
  expectedLowerBound: number;
  detectedOn: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
  deviation: number;
  organizationId: string;
}