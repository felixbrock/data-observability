import { v4 as uuidv4 } from 'uuid';
import QualitativeTestSuiteRepo from '../../infrastructure/persistence/qualitative-test-suite-repo';
import {
  QualitativeTestSuite,
  QualitativeTestType,
} from '../entities/qualitative-test-suite';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { ExecutionType } from '../value-types/execution-type';
import { MaterializationType } from '../value-types/materialization-type';
import Result from '../value-types/transient-types/result';
import { IQualitativeTestSuiteRepo } from './i-qualitative-test-suite-repo';

interface CreateObject {
  activated: boolean;
  type: QualitativeTestType;
  cron: string;
  executionType: ExecutionType;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
  targetResourceId: string;
}

export interface CreateQualitativeTestSuitesRequestDto {
  createObjects: CreateObject[];
}

export interface CreateQualitativeTestSuitesAuthDto
  extends Omit<BaseAuth, 'callerOrgId'> {
  callerOrgId: string;
}

export type CreateQualitativeTestSuitesResponseDto = Result<QualitativeTestSuite[]>;

export class CreateQualitativeTestSuites
  implements
    IUseCase<
      CreateQualitativeTestSuitesRequestDto,
      CreateQualitativeTestSuitesResponseDto,
      CreateQualitativeTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: IQualitativeTestSuiteRepo;

  constructor(qualitativeTestSuiteRepo: QualitativeTestSuiteRepo) {
    this.#repo = qualitativeTestSuiteRepo;
  }

  async execute(
    request: CreateQualitativeTestSuitesRequestDto,
    auth: CreateQualitativeTestSuitesAuthDto,

    connPool: IConnectionPool
  ): Promise<CreateQualitativeTestSuitesResponseDto> {
    try {
      const testSuites = request.createObjects.map((createObject) =>
        QualitativeTestSuite.create({
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
