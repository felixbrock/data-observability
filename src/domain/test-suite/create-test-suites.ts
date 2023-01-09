import { v4 as uuidv4 } from 'uuid';
import Result from '../value-types/transient-types/result';
import { TestSuite, TestType } from '../entities/quant-test-suite';
import { MaterializationType } from '../value-types/materialization-type';
import { ExecutionType } from '../value-types/execution-type';
import { ITestSuiteRepo } from './i-test-suite-repo';
import TestSuiteRepo from '../../infrastructure/persistence/test-suite-repo';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

interface CreateObject {
  activated: boolean;
  type: TestType;
  threshold: number;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
  targetResourceId: string;
  cron: string;
  executionType: ExecutionType;
}

export interface CreateTestSuitesRequestDto {
  createObjects: CreateObject[];
}

export type CreateTestSuitesAuthDto = null;

export type CreateTestSuitesResponseDto = Result<TestSuite[]>;

export class CreateTestSuites
  implements
    IUseCase<
      CreateTestSuitesRequestDto,
      CreateTestSuitesResponseDto,
      CreateTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: ITestSuiteRepo;

  constructor(testSuiteRepo: TestSuiteRepo) {
    this.#repo = testSuiteRepo;
  }

  async execute(props: {
    req: CreateTestSuitesRequestDto;
    connPool: IConnectionPool;
  }): Promise<CreateTestSuitesResponseDto> {
    const { req, connPool } = props;

    try {
      const testSuites = req.createObjects.map((el) =>
        TestSuite.create({
          id: uuidv4(),
          activated: el.activated,
          type: el.type,
          threshold: el.threshold,
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

      await this.#repo.insertMany(testSuites, connPool);

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
