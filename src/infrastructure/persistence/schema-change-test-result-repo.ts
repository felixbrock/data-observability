// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import { Db, Document, InsertOneResult } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { IQualTestResultRepo } from '../../domain/qualitative-test-result/i-qualitative-test-result-repo';
import { QualTestResult } from '../../domain/value-types/qualitative-test-result';

interface QualTestResultPersistence {
  testSuiteId: string;
  executionId: string;
  testData?: {
    executedOn: string;
    isAnomolous: boolean;
    schemaDiffs: any;
  };
  alertData?: {
    alertId: string;
  };
  targetResourceId: string;
  organizationId: string;
}

const collectionName = 'qualTestResult';

export default class QualTestResultRepo implements IQualTestResultRepo {
  insertOne = async (
    qualTestResult: QualTestResult,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(await this.#toPersistence(sanitize(qualTestResult)));

      if (!result.acknowledged)
        throw new Error(
          'QualTestResult creation failed. Insert not acknowledged'
        );

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  #toPersistence = async (
    qualTestResult: QualTestResult
  ): Promise<Document> => {
    const persistenceObject: QualTestResultPersistence = {
      ...qualTestResult,
    };

    return persistenceObject;
  };
}
