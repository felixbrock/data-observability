import Result from '../value-types/transient-types/result';
import { ITestSuiteRepo } from './i-test-suite-repo';
import TestSuiteRepo from '../../infrastructure/persistence/test-suite-repo';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { createSchedules } from '../services/schedule';

type Mode = 'soft' | 'hard';

export interface DeleteTestSuitesRequestDto {
  targetResourceId: string;
  mode: Mode;
}

export type DeleteTestSuitesAuthDto = {
  callerOrgId: string;
};

export type DeleteTestSuitesResponseDto = Result<null>;

export class DeleteTestSuites
  implements
    IUseCase<
      DeleteTestSuitesRequestDto,
      DeleteTestSuitesResponseDto,
      DeleteTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: ITestSuiteRepo;

  constructor(testSuiteRepo: TestSuiteRepo) {
    this.#repo = testSuiteRepo;
  }

  async execute(props: {
    req: DeleteTestSuitesRequestDto;
    auth: DeleteTestSuitesAuthDto;
    connPool: IConnectionPool;
  }): Promise<DeleteTestSuitesResponseDto> {
    const { req, auth, connPool } = props;

    try {
      switch (req.mode) {
        case 'soft':
          await this.#repo.softDeleteMany(req.targetResourceId, connPool);
          break;
        case 'hard':
          throw new Error('Hard delete not implemented yet');
        default:
          throw new Error('Received unknown test suite deletion mode');
      }

      const testSuiteIds = (
        await this.#repo.findBy(
          {
            targetResourceId: req.targetResourceId,
          },
          connPool
        )
      ).map((el) => el.id);

      await createSchedules(auth.callerOrgId, 'test', testSuiteIds);

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
