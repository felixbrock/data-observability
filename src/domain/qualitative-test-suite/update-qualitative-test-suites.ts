import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { ExecutionType } from '../value-types/execution-type';
import BaseAuth from '../services/base-auth';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { IQualTestSuiteRepo } from './i-qualitative-test-suite-repo';
import QualTestSuiteRepo from '../../infrastructure/persistence/qualitative-test-suite-repo';
import { QualTestSuite } from '../entities/qualitative-test-suite';

interface UpdateObject {
  id: string;
  props: {
    activated?: boolean;
    cron?: string;
    executionType?: ExecutionType;
  };
}

export interface UpdateQualTestSuitesRequestDto {
  updateObjects: UpdateObject[];
}

export interface UpdateQualTestSuitesAuthDto
  extends Omit<BaseAuth, 'callerOrgId'> {
  callerOrgId: string;
}

export type UpdateQualTestSuitesResponseDto = Result<number>;

export class UpdateQualTestSuites
  implements
    IUseCase<
      UpdateQualTestSuitesRequestDto,
      UpdateQualTestSuitesResponseDto,
      UpdateQualTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: IQualTestSuiteRepo;

  constructor(qualTestSuiteRepo: QualTestSuiteRepo) {
    this.#repo = qualTestSuiteRepo;
  }

  #getReplacement = (
    testSuite: QualTestSuite,
    updateObj: UpdateObject
  ): QualTestSuite =>
    QualTestSuite.create({
      id: testSuite.id,
      target: testSuite.target,
      type: testSuite.type,
      activated:
        updateObj.props.activated !== undefined
          ? updateObj.props.activated
          : testSuite.activated,
      executionType: updateObj.props.executionType || testSuite.executionType,
      cron: updateObj.props.cron || testSuite.cron,
    });

  async execute(
    req: UpdateQualTestSuitesRequestDto,
    auth: UpdateQualTestSuitesAuthDto,
    connPool: IConnectionPool
  ): Promise<UpdateQualTestSuitesResponseDto> {
    try {
      if (req.updateObjects.every((el) => !el.props)) return Result.ok();

      const testSuites = await this.#repo.findBy(
        { ids: req.updateObjects.map((el) => el.id) },
        auth,
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
        auth,
        connPool
      );

      return Result.ok(replaceResult);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
