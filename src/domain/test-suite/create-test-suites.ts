import { v4 as uuidv4 } from 'uuid';
import Result from '../value-types/transient-types/result';
import { TestSuite, TestType } from '../entities/quant-test-suite';
import { MaterializationType } from '../value-types/materialization-type';
import { ExecutionType } from '../value-types/execution-type';
import { ITestSuiteRepo } from './i-test-suite-repo';
import IUseCase from '../services/use-case';
import { createSchedules } from '../services/schedule';
import { IDbConnection } from '../services/i-db';

interface CreateObject {
  activated: boolean;
  type: TestType;
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

export type CreateTestSuitesAuthDto = { callerOrgId: string };

export type CreateTestSuitesResponseDto = Result<TestSuite[]>;

export class CreateTestSuites
  implements
    IUseCase<
      CreateTestSuitesRequestDto,
      CreateTestSuitesResponseDto,
      CreateTestSuitesAuthDto,
      IDbConnection
    >
{
  readonly #repo: ITestSuiteRepo;

  constructor(testSuiteRepo: ITestSuiteRepo) {
    this.#repo = testSuiteRepo;
  }

  async execute(props: {
    req: CreateTestSuitesRequestDto;
    auth: CreateTestSuitesAuthDto;
    dbConnection: IDbConnection;
  }): Promise<CreateTestSuitesResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      const testSuites = req.createObjects.map((el) =>
        TestSuite.create({
          id: uuidv4(),
          activated: el.activated,
          type: el.type,
          customLowerThreshold: undefined,
          customUpperThreshold: undefined,
          customLowerThresholdMode: 'absolute',
          customUpperThresholdMode: 'absolute',
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
          feedbackLowerThreshold: undefined,
          feedbackUpperThreshold: undefined,
          lastAlertSent: undefined,
        })
      );

      await this.#repo.insertMany(testSuites, dbConnection, auth.callerOrgId);

      await createSchedules(
        auth.callerOrgId,
        'test',
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
