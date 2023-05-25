import { Document } from 'mongodb';
import { IDbConnection } from '../services/i-db';

export interface ICustomQueryRepo {
  readAlertHistory: (
    testSuiteIds: string[],
    dbConnection: IDbConnection,
    callerOrgId: string
  ) => Promise<Document[]>;
  readTestHistory: (
    pipeline: Document[],
    callerOrgId: string,
    dbConnection: IDbConnection
  ) => Promise<Document[]>;
}
