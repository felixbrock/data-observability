import { QuantTestResult } from '../value-types/quantitative-test-result';
import { IDbConnection} from '../services/i-db';

export interface IQuantTestResultRepo {
  insertOne(
    quantTestResult: QuantTestResult,
    dbConnection: IDbConnection,
  ): Promise<string>;
}
