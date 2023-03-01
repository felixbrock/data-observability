import Result from '../value-types/transient-types/result';
import { ITestSuiteRepo } from './i-test-suite-repo';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { deleteSchedules } from '../services/schedule';
import { TestSuite } from '../entities/quant-test-suite';

export interface DeleteTestSuiteDuplicatesRequestDto {
  testSuiteIds: string[];
  targetOrgId: string;
}

export type DeleteTestSuiteDuplicatesAuthDto = undefined;

export type DeleteTestSuiteDuplicatesResponseDto = Result<null>;

export class DeleteTestSuiteDuplicates
  implements
    IUseCase<
      DeleteTestSuiteDuplicatesRequestDto,
      DeleteTestSuiteDuplicatesResponseDto,
      DeleteTestSuiteDuplicatesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: ITestSuiteRepo;

  constructor(testSuiteRepo: ITestSuiteRepo) {
    this.#repo = testSuiteRepo;
  }

  #getDuplicateTestSuiteIds = (
    testSuites: TestSuite[]
  ): { [key: string]: string[] } =>
    testSuites.reduce((acc: { [key: string]: string[] }, el: TestSuite) => {
      const localAcc = acc;

      const matches = testSuites.filter(
        (ele) =>
          el.type === ele.type &&
          el.target.databaseName === ele.target.databaseName &&
          el.target.schemaName === ele.target.schemaName &&
          el.target.materializationName === ele.target.materializationName &&
          el.target.columnName === ele.target.columnName
      );

      if (matches.length > 1) {
        const key = `${el.type}-${el.target.databaseName}.${
          el.target.schemaName
        }.${el.target.materializationName}.${el.target.columnName || ''}`;
        if (!localAcc[key]) localAcc[key] = matches.map((m) => m.id);
      }

      return localAcc;
    }, {});

  async execute(props: {
    req: DeleteTestSuiteDuplicatesRequestDto;
    connPool: IConnectionPool;
  }): Promise<DeleteTestSuiteDuplicatesResponseDto> {
    const { req, connPool } = props;

    try {
      let toDeleteIds: string[];

      if (req.testSuiteIds.length) toDeleteIds = req.testSuiteIds;
      else {
        const testSuites = await this.#repo.findBy(
          { deleted: false },
          connPool
        );

        const duplicateIds = this.#getDuplicateTestSuiteIds(testSuites);

        const testSuiteIds = Object.entries(duplicateIds)
          .map((entry: [string, string[]]) => {
            const ids = entry[1];

            ids.shift();

            return ids;
          })
          .flat();

        toDeleteIds = testSuiteIds;
      }
      console.log(
        `Removing ${toDeleteIds.length} test suites for org ${req.targetOrgId}`
      );

      await this.#repo.softDeleteMany(
        { targetResourceIds: [], testSuiteIds: toDeleteIds },
        connPool
      );

      await deleteSchedules(req.targetOrgId, toDeleteIds);

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
