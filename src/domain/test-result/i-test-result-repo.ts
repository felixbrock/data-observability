import { TestResult } from '../value-types/test-result';
import { DbConnection} from '../services/i-db';

export interface ITestResultRepo {
  insertOne(
    testResult: TestResult,
    dbConnection: DbConnection,
  ): Promise<string>;
}
