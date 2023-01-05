import { QualTestResult } from '../value-types/qualitative-test-result';
import { IDbConnection} from '../services/i-db';

export interface IQualTestResultRepo {
  insertOne(
    qualTestResult: QualTestResult,
    dbConnection: IDbConnection,
  ): Promise<string>;
}
