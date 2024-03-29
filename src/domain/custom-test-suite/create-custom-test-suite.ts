import { v4 as uuidv4 } from 'uuid';
import Result from '../value-types/transient-types/result';
import { CustomTestSuite } from '../entities/custom-test-suite';
import { ExecutionType } from '../value-types/execution-type';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import IUseCase from '../services/use-case';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { createSchedules } from '../services/schedule';
import { IDbConnection } from '../services/i-db';

export interface CreateCustomTestSuiteRequestDto {
  entityProps: {
    activated: boolean;
    cron: string;
    executionType: ExecutionType;
    name: string;
    description: string;
    sqlLogic: string;
    targetResourceIds: string[];
  };
}

export type CreateCustomTestSuiteAuthDto = { callerOrgId: string };

export type CreateCustomTestSuiteResponseDto = Result<CustomTestSuite>;

export class CreateCustomTestSuite
  implements
    IUseCase<
      CreateCustomTestSuiteRequestDto,
      CreateCustomTestSuiteResponseDto,
      CreateCustomTestSuiteAuthDto,
      IDbConnection
    >
{
  readonly #repo: ICustomTestSuiteRepo;

  constructor(customTestSuiteRepo: CustomTestSuiteRepo) {
    this.#repo = customTestSuiteRepo;
  }

  async execute(props: {
    req: CreateCustomTestSuiteRequestDto;
    auth: CreateCustomTestSuiteAuthDto;
    dbConnection: IDbConnection;
  }): Promise<CreateCustomTestSuiteResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      const customTestSuite = CustomTestSuite.create({
        id: uuidv4(),
        name: req.entityProps.name,
        description: req.entityProps.description,
        sqlLogic: req.entityProps.sqlLogic,
        activated: req.entityProps.activated,
        cron: req.entityProps.cron,
        executionType: req.entityProps.executionType,
        customLowerThreshold: undefined,
        customUpperThreshold: undefined,
        customLowerThresholdMode: 'absolute',
        customUpperThresholdMode: 'absolute',
        feedbackLowerThreshold: undefined,
        feedbackUpperThreshold: undefined,
        targetResourceIds: req.entityProps.targetResourceIds,
        lastAlertSent: undefined,
      });

      await this.#repo.insertOne(customTestSuite, dbConnection, auth.callerOrgId);

      await createSchedules(auth.callerOrgId, 'custom-test', [
        {
          cron: customTestSuite.cron,
          executionType: customTestSuite.executionType,
          testSuiteId: customTestSuite.id,
          toBeActivated: true,
        },
      ]);

      return Result.ok(customTestSuite);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
