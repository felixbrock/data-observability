import { DbConnection } from '../services/i-db';
import {TestExecution} from '../value-types/test-execution';

export interface ITestExecutionRepo {
  findOne(id: string, dbConnection: DbConnection): Promise<TestExecution | null>;
  insertOne(testExecution: TestExecution, dbConnection: DbConnection): Promise<string>;
}
