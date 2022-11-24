import { NominalTestResult } from '../value-types/nominal-test-result';
import { IDbConnection} from '../services/i-db';

export interface INominalTestResultRepo {
  insertOne(
    nominalTestResult: NominalTestResult,
    dbConnection: IDbConnection,
  ): Promise<string>;
}
