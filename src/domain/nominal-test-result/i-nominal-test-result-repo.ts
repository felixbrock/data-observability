import { NominalTestResult } from '../value-types/nominal-test-result';
import { DbConnection} from '../services/i-db';

export interface INominalTestResultRepo {
  insertOne(
    nominalTestResult: NominalTestResult,
    dbConnection: DbConnection,
  ): Promise<string>;
}
