import Result from '../value-types/transient-types/result';
import { ExecutionType } from '../value-types/execution-type';
import IUseCase from '../services/use-case';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { updateSchedules } from '../services/schedule';
import { CustomThresholdMode } from '../value-types/custom-threshold-mode';

export interface UpdateCustomTestSuiteRequestDto {
  id: string;
  props?: {
    activated?: boolean;
    customLowerThreshold?: { value: number; mode: CustomThresholdMode };
    customUpperThreshold?: { value: number; mode: CustomThresholdMode };
    targetResourceIds?: string[];
    name?: string;
    description?: string;
    sqlLogic?: string;
    cron?: string;
    executionType?: ExecutionType;
    importanceThreshold?: number;
    boundsIntervalRelative?: number;
  };
}

export type UpdateCustomTestSuiteAuthDto = { callerOrgId: string };

export type UpdateCustomTestSuiteResponseDto = Result<string>;

export class UpdateCustomTestSuite
  implements
    IUseCase<
      UpdateCustomTestSuiteRequestDto,
      UpdateCustomTestSuiteResponseDto,
      UpdateCustomTestSuiteAuthDto,
      IConnectionPool
    >
{
  readonly #repo: ICustomTestSuiteRepo;

  constructor(customTestSuiteRepo: CustomTestSuiteRepo) {
    this.#repo = customTestSuiteRepo;
  }

  async execute(props: {
    req: UpdateCustomTestSuiteRequestDto;
    connPool: IConnectionPool;
    auth: UpdateCustomTestSuiteAuthDto;
  }): Promise<UpdateCustomTestSuiteResponseDto> {
    const { req, connPool, auth } = props;

    try {
      if (!req.props) return Result.ok(req.id);

      const testSuite = await this.#repo.findOne(req.id, connPool);

      if (!testSuite) throw new Error('Test suite not found');

      const updateResult = await this.#repo.updateOne(
        req.id,
        req.props,
        connPool
      );

      await updateSchedules(auth.callerOrgId, 'custom-test', [
        {
          cron: req.props.cron || testSuite.cron,
          executionType: req.props.executionType || testSuite.executionType,
          testSuiteId: req.id,
          toBeActivated: req.props.activated || testSuite.activated,
        },
      ]);

      return Result.ok(updateResult);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
