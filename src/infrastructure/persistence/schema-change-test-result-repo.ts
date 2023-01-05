// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import { Db, Document, InsertOneResult } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { IQualitativeTestResultRepo } from '../../domain/qualitative-test-result/i-qualitative-test-result-repo';
import { QualitativeTestResult } from '../../domain/value-types/qualitative-test-result';

interface QualitativeTestResultPersistence {
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

const collectionName = 'qualitativeTestResult';

export default class QualitativeTestResultRepo implements IQualitativeTestResultRepo {
  insertOne = async (
    qualitativeTestResult: QualitativeTestResult,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(await this.#toPersistence(sanitize(qualitativeTestResult)));

      if (!result.acknowledged)
        throw new Error(
          'QualitativeTestResult creation failed. Insert not acknowledged'
        );

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  #toPersistence = async (
    qualitativeTestResult: QualitativeTestResult
  ): Promise<Document> => {
    const persistenceObject: QualitativeTestResultPersistence = {
      ...qualitativeTestResult,
    };

    return persistenceObject;
  };
}
