import Result from '../value-types/transient-types/result';
import { ITestSuiteRepo } from './i-test-suite-repo';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { deleteSchedules } from '../services/schedule';

export type Mode = 'soft' | 'hard';

export const parseMode = (obj: unknown): Mode => {
  if (typeof obj !== 'string') throw new Error('Provision of invalid type');

  switch (obj) {
    case 'soft':
      return 'soft';
    case 'hard':
      return 'hard';
    default:
      throw new Error('Provision of invalid type');
  }
};

export interface DeleteTestSuitesRequestDto {
  targetResourceIds: string[];
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

  constructor(testSuiteRepo: ITestSuiteRepo) {
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
          await this.#repo.softDeleteMany(req.targetResourceIds, connPool);
          break;
        case 'hard':
          throw new Error('Hard delete not implemented yet');
        default:
          throw new Error('Received unknown test suite deletion mode');
      }

      const testSuiteIds = (
        await this.#repo.findBy(
          {
            targetResourceIds: req.targetResourceIds,
          },
          connPool
        )
      ).map((el) => el.id);

      await deleteSchedules(auth.callerOrgId, testSuiteIds);

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
