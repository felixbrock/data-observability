import { CustomTestResult } from '../value-types/custom-test-result';
import { IDbConnection} from '../services/i-db';

export interface ICustomTestResultRepo {
  insertOne(
    customTestResult: CustomTestResult,
    dbConnection: IDbConnection,
  ): Promise<string>;
}