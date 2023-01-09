import { QualTestType } from '../../entities/qual-test-suite';
import { SchemaDiff } from '../../test-execution-api/qual-test-execution-result-dto';

export interface QualTestAlertDto {
  alertId: string;
  testType: QualTestType;
  message: string;
  detectedOn: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  deviations: SchemaDiff[];
  resourceId: string;
}
