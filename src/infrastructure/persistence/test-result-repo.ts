// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import { Db, Document, InsertOneResult } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { ITestResultRepo } from '../../domain/test-result/i-test-result-repo';
import { TestResult } from '../../domain/value-types/test-result';

interface TestResultPersistence {
  testSuiteId: string;
  testType: string;
  executionId: string;
  executedOn: string;
  isAnomolous: boolean;
  threshold: number;
  executionFrequency: number;
  modifiedZScore: number;
  deviation: number;
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
      organizationId: testResult.organizationId,
      testSuiteId: testResult.testSuiteId,
      testType: testResult.testType,
      executionId: testResult.executionId,
      executedOn: testResult.executedOn,
      isAnomolous: testResult.isAnomolous,
      threshold: testResult.threshold,
      executionFrequency: testResult.executionFrequency,
      modifiedZScore: testResult.modifiedZScore,
      deviation: testResult.deviation,
    };

    return persistenceObject;
  };
}
