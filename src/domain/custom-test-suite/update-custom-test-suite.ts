import Result from '../value-types/transient-types/result';
import { ExecutionType } from '../value-types/execution-type';
import IUseCase from '../services/use-case';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import { updateSchedules } from '../services/schedule';
import { CustomThresholdMode } from '../value-types/custom-threshold-mode';
import { IDbConnection } from '../services/i-db';

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
    feedbackLowerThreshold?: number;
    feedbackUpperThreshold?: number;
    lastAlertSent?: string;
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
      IDbConnection
    >
{
  readonly #repo: ICustomTestSuiteRepo;

  constructor(customTestSuiteRepo: CustomTestSuiteRepo) {
    this.#repo = customTestSuiteRepo;
  }

  async execute(props: {
    req: UpdateCustomTestSuiteRequestDto;
    auth: UpdateCustomTestSuiteAuthDto;
    dbConnection: IDbConnection;
  }): Promise<UpdateCustomTestSuiteResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      if (!req.props) return Result.ok(req.id);

      const testSuite = await this.#repo.findOne(req.id, dbConnection, auth.callerOrgId);

      if (!testSuite) throw new Error('Test suite not found');

      const updateResult = await this.#repo.updateOne(
        req.id,
        req.props,
        dbConnection,
        auth.callerOrgId
      );

      await updateSchedules(auth.callerOrgId, 'custom-test', [
        {
          cron: req.props.cron || testSuite.cron,
          executionType: req.props.executionType || testSuite.executionType,
          testSuiteId: req.id,
          toBeActivated: req.props.activated !== undefined 
            ? req.props.activated : testSuite.activated 
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
