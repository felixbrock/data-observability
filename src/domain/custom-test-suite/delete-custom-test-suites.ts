import Result from '../value-types/transient-types/result';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
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

export interface DeleteCustomTestSuitesRequestDto {
  targetResourceIds: string[];
  mode: Mode;
}

export type DeleteCustomTestSuitesAuthDto = {
  callerOrgId: string;
};

export type DeleteCustomTestSuitesResponseDto = Result<null>;

export class DeleteCustomTestSuites
  implements
    IUseCase<
      DeleteCustomTestSuitesRequestDto,
      DeleteCustomTestSuitesResponseDto,
      DeleteCustomTestSuitesAuthDto,
      IDbConnection
    >
{
  readonly #repo: ICustomTestSuiteRepo;

  constructor(testSuiteRepo: ICustomTestSuiteRepo) {
    this.#repo = testSuiteRepo;
  }

  async execute(props: {
    req: DeleteCustomTestSuitesRequestDto;
    auth: DeleteCustomTestSuitesAuthDto;
    dbConnection: IDbConnection;
  }): Promise<DeleteCustomTestSuitesResponseDto> {
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
          dbConnection, auth.callerOrgId, true
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
