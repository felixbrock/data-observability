import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { ExecutionType } from '../value-types/execution-type';
import { ITestSuiteRepo } from './i-test-suite-repo';
import TestSuiteRepo from '../../infrastructure/persistence/test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { TestSuite } from '../entities/quant-test-suite';

interface UpdateObject {
  id: string;
  props: {
    activated?: boolean;
    threshold?: number;
    cron?: string;
    executionType?: ExecutionType;
  };
}

export interface UpdateTestSuitesRequestDto {
  updateObjects: UpdateObject[];
}

export type UpdateTestSuitesAuthDto = null;

export type UpdateTestSuitesResponseDto = Result<number>;

export class UpdateTestSuites
  implements
    IUseCase<
      UpdateTestSuitesRequestDto,
      UpdateTestSuitesResponseDto,
      UpdateTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: ITestSuiteRepo;

  constructor(testSuiteRepo: TestSuiteRepo) {
    this.#repo = testSuiteRepo;
  }

  #getReplacement = (
    testSuite: TestSuite,
    updateObj: UpdateObject
  ): TestSuite =>
    TestSuite.create({
      id: testSuite.id,
      target: testSuite.target,
      type: testSuite.type,
      activated:
        updateObj.props.activated !== undefined
          ? updateObj.props.activated
          : testSuite.activated,
      threshold: updateObj.props.threshold || testSuite.threshold,
      executionType: updateObj.props.executionType || testSuite.executionType,
      cron: updateObj.props.cron || testSuite.cron,
    });

  async execute(props: {
    req: UpdateTestSuitesRequestDto;
    connPool: IConnectionPool;
  }): Promise<UpdateTestSuitesResponseDto> {
    const { req, connPool } = props;

    try {
      if (req.updateObjects.every((el) => !el.props)) return Result.ok();

      const testSuites = await this.#repo.findBy(
        { ids: req.updateObjects.map((el) => el.id) },
        connPool
      );

      if (req.updateObjects.length !== testSuites.length)
        throw new Error('Not all requested (to be updated) test suites found');

      const replacements = testSuites.map((el) => {
        const updateObj = req.updateObjects.find((obj) => el.id === obj.id);
        if (!updateObj)
          throw new Error(
            `Update Obj for test suite with id ${el.id} not found`
          );

        return this.#getReplacement(el, updateObj);
      });

      const replaceResult = await this.#repo.replaceMany(
        replacements,
        connPool
      );

      return Result.ok(replaceResult);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
