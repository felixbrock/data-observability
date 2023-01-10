import { v4 as uuidv4 } from 'uuid';
import QualTestSuiteRepo from '../../infrastructure/persistence/qual-test-suite-repo';
import { QualTestSuite, QualTestType } from '../entities/qual-test-suite';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { ExecutionType } from '../value-types/execution-type';
import { MaterializationType } from '../value-types/materialization-type';
import Result from '../value-types/transient-types/result';
import { IQualTestSuiteRepo } from './i-qual-test-suite-repo';

interface CreateObject {
  activated: boolean;
  type: QualTestType;
  cron: string;
  executionType: ExecutionType;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
  targetResourceId: string;
}

export interface CreateQualTestSuitesRequestDto {
  createObjects: CreateObject[];
}

export type CreateQualTestSuitesAuthDto = null;

export type CreateQualTestSuitesResponseDto = Result<QualTestSuite[]>;

export class CreateQualTestSuites
  implements
    IUseCase<
      CreateQualTestSuitesRequestDto,
      CreateQualTestSuitesResponseDto,
      CreateQualTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: IQualTestSuiteRepo;

  constructor(qualTestSuiteRepo: QualTestSuiteRepo) {
    this.#repo = qualTestSuiteRepo;
  }

  async execute(props: {
    req: CreateQualTestSuitesRequestDto;
    connPool: IConnectionPool;
  }): Promise<CreateQualTestSuitesResponseDto> {
    const { req, connPool } = props;

    try {
      const testSuites = req.createObjects.map((createObject) =>
        QualTestSuite.create({
          id: uuidv4(),
          activated: createObject.activated,
          type: createObject.type,
          target: {
            databaseName: createObject.databaseName,
            schemaName: createObject.schemaName,
            materializationName: createObject.materializationName,
            materializationType: createObject.materializationType,
            columnName: createObject.columnName,
            targetResourceId: createObject.targetResourceId,
          },
          cron: createObject.cron,
          executionType: createObject.executionType,
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