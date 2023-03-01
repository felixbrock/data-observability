import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { ExecutionType } from '../value-types/execution-type';
import { ITestSuiteRepo } from './i-test-suite-repo';
import TestSuiteRepo from '../../infrastructure/persistence/test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { TestSuite } from '../entities/quant-test-suite';
import { updateSchedules } from '../services/schedule';

interface UpdateObject {
  id: string;
  props: {
    activated?: boolean;
    threshold?: number;
    cron?: string;
    executionType?: ExecutionType;
    importanceThreshold?: number;
    boundsIntervalRelative?: number;
  };
}

export interface UpdateTestSuitesRequestDto {
  updateObjects: UpdateObject[];
}

export type UpdateTestSuitesAuthDto = { callerOrgId: string };

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
      importanceThreshold:
        updateObj.props.importanceThreshold || testSuite.importanceThreshold,
      boundsIntervalRelative:
        updateObj.props.boundsIntervalRelative ||
        testSuite.boundsIntervalRelative,
    });

  async execute(props: {
    req: UpdateTestSuitesRequestDto;
    connPool: IConnectionPool;
    auth: UpdateTestSuitesAuthDto;
  }): Promise<UpdateTestSuitesResponseDto> {
    const { req, connPool, auth } = props;

    try {
      if (req.updateObjects.every((el) => !el.props)) return Result.ok();

      const testSuites = await this.#repo.findBy(
        { ids: req.updateObjects.map((el) => el.id), deleted: false },
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

      await updateSchedules(
        auth.callerOrgId,
        'test',
        replacements.map((el) => ({
          cron: el.cron,
          testSuiteId: el.id,
          executionType: el.executionType,
          toBeActivated: el.activated,
        }))
      );

      return Result.ok(replaceResult);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
