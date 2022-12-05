import { v4 as uuidv4 } from 'uuid';
import Result from '../value-types/transient-types/result';
import { TestSuite, TestType } from '../entities/test-suite';
import { MaterializationType } from '../value-types/materialization-type';
import { ExecutionType } from '../value-types/execution-type';
import { ITestSuiteRepo } from './i-test-suite-repo';
import BaseAuth from '../services/base-auth';
import TestSuiteRepo from '../../infrastructure/persistence/test-suite-repo';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

interface CreateObject {
  activated: boolean;
  type: TestType;
  threshold: number;
  executionFrequency: number;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
  targetResourceId: string;
  cron?: string;
  executionType: ExecutionType;
}

export interface CreateTestSuitesRequestDto {
  createObjects: CreateObject[];
  
}

export interface CreateTestSuitesAuthDto extends Omit<BaseAuth, 'callerOrgId'>{
  callerOrgId: string;
};

export type CreateTestSuitesResponseDto = Result<TestSuite[]>;

export class CreateTestSuites
  implements IUseCase<
      CreateTestSuitesRequestDto,
      CreateTestSuitesResponseDto,
      CreateTestSuitesAuthDto, IConnectionPool
    >
{

  readonly #repo:  ITestSuiteRepo;

  constructor(
    testSuiteRepo: TestSuiteRepo
  ) {
    this.#repo = testSuiteRepo;
  }

  async execute(
    request: CreateTestSuitesRequestDto,
    auth: CreateTestSuitesAuthDto, connPool: IConnectionPool
  ): Promise<CreateTestSuitesResponseDto> {
    try {
      const testSuites = request.createObjects.map((el) =>
        TestSuite.create({
          id: uuidv4(),
          activated: el.activated,
          type: el.type,
          threshold: el.threshold,
          executionFrequency: el.executionFrequency,
          target: {
            databaseName: el.databaseName,
            schemaName: el.schemaName,
            materializationName: el.materializationName,
            materializationType: el.materializationType,
            columnName: el.columnName,
            targetResourceId: el.targetResourceId,
          },
          cron: el.cron,
          executionType: el.executionType,
        })
      );

      await this.#repo.insertMany(testSuites, auth, connPool);

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}