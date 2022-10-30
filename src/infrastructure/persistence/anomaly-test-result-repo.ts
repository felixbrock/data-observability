// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import { Db, Document, InsertOneResult } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { IAnomalyTestResultRepo } from '../../domain/anomaly-test-result/i-anomaly-test-result-repo';
import { AnomalyTestResult } from '../../domain/value-types/anomaly-test-result';

interface AnomalyTestResultPersistence {
  testSuiteId: string;
  executionId: string;
  isWarmup: boolean;
  testData?: {
    executedOn: string;
    isAnomolous: boolean;
    modifiedZScore: number;
    deviation: number;
  };
  alertData?: {
    alertId: string;
  };
  targetResourceId: string;
  organizationId: string;
}

const collectionName = 'anomalyTestResult';

export default class AnomalyTestResultRepo implements IAnomalyTestResultRepo {
  insertOne = async (
    anomalyTestResult: AnomalyTestResult,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(await this.#toPersistence(sanitize(anomalyTestResult)));

      if (!result.acknowledged)
        throw new Error('AnomalyTestResult creation failed. Insert not acknowledged');

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message); 
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  #toPersistence = async (anomalyTestResult: AnomalyTestResult): Promise<Document> => {
    const persistenceObject: AnomalyTestResultPersistence = {
      ...anomalyTestResult,
    };

    return persistenceObject;
  };
}
