import Result from '../value-types/transient-types/result';

import { ExecutionType } from '../value-types/execution-type';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export interface UpdateCustomTestSuiteRequestDto {
  id: string;
  props?: {
    activated?: boolean;
    threshold?: number;
    frequency?: number;
    targetResourceIds?: string[];
    name?: string;
    description?: string;
    sqlLogic?: string;
    cron?: string;
    executionType?: ExecutionType;
  };
}

export type UpdateCustomTestSuiteAuthDto = BaseAuth;

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

  async execute(
    request: UpdateCustomTestSuiteRequestDto,
    auth: UpdateCustomTestSuiteAuthDto,
    connPool: IConnectionPool
  ): Promise<UpdateCustomTestSuiteResponseDto> {
    try {
      if (!request.props) return Result.ok(request.id);

      const testSuite = await this.#repo.findOne(request.id, auth, connPool);

      if (!testSuite) throw new Error('Test suite not found');

      const updateResult = await this.#repo.updateOne(
        request.id,
        request.props,
        auth,
        connPool
      );

      return Result.ok(updateResult);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
