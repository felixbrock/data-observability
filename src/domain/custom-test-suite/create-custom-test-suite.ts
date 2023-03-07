import { v4 as uuidv4 } from 'uuid';
import Result from '../value-types/transient-types/result';
import { CustomTestSuite } from '../entities/custom-test-suite';
import { ExecutionType } from '../value-types/execution-type';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import IUseCase from '../services/use-case';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { createSchedules } from '../services/schedule';
import { CustomThresholdMode } from '../value-types/custom-threshold-mode';

export interface CreateCustomTestSuiteRequestDto {
  entityProps: {
    activated: boolean;
    cron: string;
    executionType: ExecutionType;
    name: string;
    description: string;
    sqlLogic: string;
    targetResourceIds: string[];
    customLowerThreshold?: { value: number; mode: CustomThresholdMode };
    customUpperThreshold?: { value: number; mode: CustomThresholdMode };
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
      IConnectionPool
    >
{
  readonly #repo: ICustomTestSuiteRepo;

  constructor(customTestSuiteRepo: CustomTestSuiteRepo) {
    this.#repo = customTestSuiteRepo;
  }

  async execute(props: {
    req: CreateCustomTestSuiteRequestDto;
    connPool: IConnectionPool;
    auth: CreateCustomTestSuiteAuthDto;
  }): Promise<CreateCustomTestSuiteResponseDto> {
    const { req, connPool, auth } = props;

    try {
      const customTestSuite = CustomTestSuite.create({
        id: uuidv4(),
        name: req.entityProps.name,
        description: req.entityProps.description,
        sqlLogic: req.entityProps.sqlLogic,
        activated: req.entityProps.activated,
        cron: req.entityProps.cron,
        executionType: req.entityProps.executionType,
        customLowerThreshold: req.entityProps.customLowerThreshold
          ? req.entityProps.customLowerThreshold.value
          : undefined,
        customUpperThresholdMode: req.entityProps.customLowerThreshold
          ? req.entityProps.customLowerThreshold.mode
          : 'absolute',
        customUpperThreshold: req.entityProps.customLowerThreshold
          ? req.entityProps.customLowerThreshold.value
          : undefined,
        customLowerThresholdMode: req.entityProps.customLowerThreshold
          ? req.entityProps.customLowerThreshold.mode
          : 'absolute',
        targetResourceIds: req.entityProps.targetResourceIds,
        importanceThreshold: -1,
        boundsIntervalRelative: 0,
      });

      await this.#repo.insertOne(customTestSuite, connPool);

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
