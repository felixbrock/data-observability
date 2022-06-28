import { TestSuite } from '../entities/test-suite';
import { DbConnection } from '../services/i-db';

export interface ITestSuiteRepo {
  findOne(id: string, dbConnection: DbConnection): Promise<TestSuite | null>;
  all(dbConnection: DbConnection): Promise<TestSuite[]>;
  insertOne(testSuite: TestSuite, dbConnection: DbConnection): Promise<string>;
  insertMany(
    testSuites: TestSuite[],
    dbConnection: DbConnection
  ): Promise<string[]>;
  deleteOne(id: string, dbConnection: DbConnection): Promise<string>;
}
