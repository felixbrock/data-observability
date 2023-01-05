import { v4 as uuidv4 } from 'uuid';
import QualTestSuiteRepo from '../../infrastructure/persistence/qualitative-test-suite-repo';
import {
  QualTestSuite,
  QualTestType,
} from '../entities/qualitative-test-suite';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { ExecutionType } from '../value-types/execution-type';
import { MaterializationType } from '../value-types/materialization-type';
import Result from '../value-types/transient-types/result';
import { IQualTestSuiteRepo } from './i-qualitative-test-suite-repo';

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

export interface CreateQualTestSuitesAuthDto
  extends Omit<BaseAuth, 'callerOrgId'> {
  callerOrgId: string;
}

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

  async execute(
    request: CreateQualTestSuitesRequestDto,
    auth: CreateQualTestSuitesAuthDto,

    connPool: IConnectionPool
  ): Promise<CreateQualTestSuitesResponseDto> {
    try {
      const testSuites = request.createObjects.map((createObject) =>
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

      await this.#repo.insertMany(testSuites, auth, connPool);

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
