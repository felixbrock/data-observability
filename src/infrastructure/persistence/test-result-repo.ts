// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import { Db, Document, InsertOneResult } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { ITestResultRepo } from '../../domain/test-result/i-test-result-repo';
import { TestResult } from '../../domain/value-types/test-result';
import { TestType } from '../../domain/entities/test-suite';

interface TestResultPersistence {
  testSuiteId: string;
  testType: TestType;
  threshold: number;
  executionFrequency: number;
  executionId: string;
  isWarmup: boolean;
  testSpecificData?: {
    executedOn: string;
    isAnomolous: boolean;
    modifiedZScore: number;
    deviation: number;
  };
  alertSpecificData?: {
    alertId: string;
  };
  targetResourceId: string;
  organizationId: string;
}

const collectionName = 'testResult';

export default class TestResultRepo implements ITestResultRepo {
  insertOne = async (
    testResult: TestResult,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(await this.#toPersistence(sanitize(testResult)));

      if (!result.acknowledged)
        throw new Error('TestResult creation failed. Insert not acknowledged');

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #toPersistence = async (testResult: TestResult): Promise<Document> => {
    const persistenceObject: TestResultPersistence = {
      ...testResult,
    };

    return persistenceObject;
  };
}
