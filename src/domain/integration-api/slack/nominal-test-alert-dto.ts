import { NominalTestType } from "../../entities/nominal-test-suite";

export interface NominalTestAlertDto {
  alertId: string;
  testType: NominalTestType;
  message: string;
  detectedOn: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  schemaDiffs: any;
  resourceId: string;
}