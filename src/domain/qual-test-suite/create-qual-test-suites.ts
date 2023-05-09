import { v4 as uuidv4 } from 'uuid';
import { QualTestSuite, QualTestType } from '../entities/qual-test-suite';
import { createSchedules } from '../services/schedule';
import IUseCase from '../services/use-case';
import { ExecutionType } from '../value-types/execution-type';
import { MaterializationType } from '../value-types/materialization-type';
import Result from '../value-types/transient-types/result';
import { IQualTestSuiteRepo } from './i-qual-test-suite-repo';
import { IDbConnection } from '../services/i-db';

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

export type CreateQualTestSuitesAuthDto = {
  callerOrgId: string;
};

export type CreateQualTestSuitesResponseDto = Result<QualTestSuite[]>;

export class CreateQualTestSuites
  implements
    IUseCase<
      CreateQualTestSuitesRequestDto,
      CreateQualTestSuitesResponseDto,
      CreateQualTestSuitesAuthDto,
      IDbConnection
    >
{
  readonly #repo: IQualTestSuiteRepo;

  constructor(qualTestSuiteRepo: IQualTestSuiteRepo) {
    this.#repo = qualTestSuiteRepo;
  }

  async execute(props: {
    req: CreateQualTestSuitesRequestDto;
    auth: CreateQualTestSuitesAuthDto;
    dbConnection: IDbConnection;
  }): Promise<CreateQualTestSuitesResponseDto> {
    const { req, auth, dbConnection } = props;

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
          lastAlertSent: undefined,
        })
      );

      await this.#repo.insertMany(testSuites, dbConnection, auth.callerOrgId);

      await createSchedules(
        auth.callerOrgId,
        'nominal-test',
        testSuites.map((testSuite) => ({
          cron: testSuite.cron,
          testSuiteId: testSuite.id,
          executionType: testSuite.executionType,
          toBeActivated: true,
        }))
      );

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
