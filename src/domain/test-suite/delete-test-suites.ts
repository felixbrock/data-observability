import Result from '../value-types/transient-types/result';
import { ITestSuiteRepo } from './i-test-suite-repo';
import IUseCase from '../services/use-case';
import { deleteSchedules } from '../services/schedule';
import { IDbConnection } from '../services/i-db';

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
      IDbConnection
    >
{
  readonly #repo: ITestSuiteRepo;

  constructor(testSuiteRepo: ITestSuiteRepo) {
    this.#repo = testSuiteRepo;
  }

  async execute(props: {
    req: DeleteTestSuitesRequestDto;
    auth: DeleteTestSuitesAuthDto;
    dbConnection: IDbConnection;
  }): Promise<DeleteTestSuitesResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      switch (req.mode) {
        case 'soft':
          await this.#repo.softDeleteMany(
            { targetResourceIds: req.targetResourceIds, testSuiteIds: [] },
            dbConnection, auth.callerOrgId
          );
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
            deleted: false,
          },
          dbConnection, auth.callerOrgId
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
