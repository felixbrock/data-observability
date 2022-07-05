import { Db, Document, InsertOneResult, ObjectId } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { ITestExecutionRepo } from '../../domain/test-execution/i-test-execution-repo';
import {
  DataValidationResult,
  TestExecution,
  TestExecutionProperties,
} from '../../domain/value-types/test-execution';

interface TestExecutionPersistence {
  testSuiteId: string;
  dataValidationResult: DataValidationResult;
}

const collectionName = 'testExecution';

export default class TestExecutionRepo
  implements ITestExecutionRepo
{
  findOne = async (
    id: string,
    dbConnection: Db
  ): Promise<TestExecution | null> => {
    try {
      const result: any = await dbConnection
        .collection(collectionName)
        .findOne({ _id: new ObjectId(sanitize(id)) });

      if (!result) return null;

      return this.#toEntity(this.#buildProperties(result));
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  insertOne = async (
    testExecution: TestExecution,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(this.#toPersistence(sanitize(testExecution)));

      if (!result.acknowledged)
        throw new Error(
          'TestExecution creation failed. Insert not acknowledged'
        );

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #toEntity = (
    properties: TestExecutionProperties
  ): TestExecution => TestExecution.create(properties);

  #buildProperties = (
    testExecution: TestExecutionPersistence
  ): TestExecutionProperties => ({
    testSuiteId: testExecution.testSuiteId,
    dataValidationResult: testExecution.dataValidationResult,
  });

  #toPersistence = (testExecution: TestExecution): Document => {
    const persistenceObject: TestExecutionPersistence = {
      testSuiteId: testExecution.testSuiteId,
      dataValidationResult: testExecution.dataValidationResult,
    };

    return persistenceObject;
  };
}
