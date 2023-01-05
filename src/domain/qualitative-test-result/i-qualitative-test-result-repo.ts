import { QualitativeTestResult } from '../value-types/qualitative-test-result';
import { IDbConnection} from '../services/i-db';

export interface IQualitativeTestResultRepo {
  insertOne(
    qualitativeTestResult: QualitativeTestResult,
    dbConnection: IDbConnection,
  ): Promise<string>;
}
