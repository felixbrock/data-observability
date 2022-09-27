import { TestType } from "../../entities/test-suite";

export interface NominalTestAlertDto {
  alertId: string;
  testType: TestType;
  message: string;
  detectedOn: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  schemaDiffs: any;
  resourceId: string;
}