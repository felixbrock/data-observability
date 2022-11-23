import { v4 as uuidv4 } from 'uuid';
import NominalTestSuiteRepo from '../../infrastructure/persistence/nominal-test-suite-repo';
import {
  NominalTestSuite,
  NominalTestType,
} from '../entities/nominal-test-suite';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { ExecutionType } from '../value-types/execution-type';
import { MaterializationType } from '../value-types/materialization-type';
import Result from '../value-types/transient-types/result';
import { INominalTestSuiteRepo } from './i-nominal-test-suite-repo';

interface CreateObject {
  activated: boolean;
  type: NominalTestType;
  executionFrequency: number;
  cron?: string;
  executionType: ExecutionType;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
  targetResourceId: string;
}

export interface CreateNominalTestSuitesRequestDto {
  createObjects: CreateObject[];
}

export interface CreateNominalTestSuitesAuthDto
  extends Omit<BaseAuth, 'callerOrgId'> {
  callerOrgId: string;
}

export type CreateNominalTestSuitesResponseDto = Result<NominalTestSuite[]>;

export class CreateNominalTestSuites
  implements
    IUseCase<
      CreateNominalTestSuitesRequestDto,
      CreateNominalTestSuitesResponseDto,
      CreateNominalTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: INominalTestSuiteRepo;

  constructor(nominalTestSuiteRepo: NominalTestSuiteRepo) {
    this.#repo = nominalTestSuiteRepo;
  }

  async execute(
    request: CreateNominalTestSuitesRequestDto,
    auth: CreateNominalTestSuitesAuthDto,

    connPool: IConnectionPool
  ): Promise<CreateNominalTestSuitesResponseDto> {
    try {
      const testSuites = request.createObjects.map((createObject) =>
        NominalTestSuite.create({
          id: uuidv4(),
          activated: createObject.activated,
          type: createObject.type,
          executionFrequency: createObject.executionFrequency,
          target: {
            databaseName: createObject.databaseName,
            schemaName: createObject.schemaName,
            materializationName: createObject.materializationName,
            materializationType: createObject.materializationType,
            columnName: createObject.columnName,
            targetResourceId: createObject.targetResourceId,
          },
          organizationId: auth.callerOrgId,
          cron: createObject.cron,
          executionType: createObject.executionType,
        })
      );

      await this.#repo.insertMany(testSuites, auth, connPool);

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
