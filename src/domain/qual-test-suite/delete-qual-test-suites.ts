import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { deleteSchedules } from '../services/schedule';
import { IQualTestSuiteRepo } from './i-qual-test-suite-repo';

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

export interface DeleteQualTestSuitesRequestDto {
  targetResourceIds: string[];
  mode: Mode;
}

export type DeleteQualTestSuitesAuthDto = {
  callerOrgId: string;
};

export type DeleteQualTestSuitesResponseDto = Result<null>;

export class DeleteQualTestSuites
  implements
    IUseCase<
      DeleteQualTestSuitesRequestDto,
      DeleteQualTestSuitesResponseDto,
      DeleteQualTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: IQualTestSuiteRepo;

  constructor(qualTestSuiteRepo: IQualTestSuiteRepo) {
    this.#repo = qualTestSuiteRepo;
  }

  async execute(props: {
    req: DeleteQualTestSuitesRequestDto;
    auth: DeleteQualTestSuitesAuthDto;
    connPool: IConnectionPool;
  }): Promise<DeleteQualTestSuitesResponseDto> {
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
