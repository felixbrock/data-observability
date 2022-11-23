import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { ExecutionType } from '../value-types/execution-type';
import BaseAuth from '../services/base-auth';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { INominalTestSuiteRepo } from './i-nominal-test-suite-repo';
import NominalTestSuiteRepo from '../../infrastructure/persistence/nominal-test-suite-repo';
import { NominalTestSuite } from '../entities/nominal-test-suite';

interface UpdateObject {
  id: string;
  props: {
    activated?: boolean;
    frequency?: number;
    cron?: string;
    executionType?: ExecutionType;
  };
}

export interface UpdateNominalTestSuitesRequestDto {
  updateObjects: UpdateObject[];
}

export interface UpdateNominalTestSuitesAuthDto
  extends Omit<BaseAuth, 'callerOrgId'> {
  callerOrgId: string;
}

export type UpdateNominalTestSuitesResponseDto = Result<number>;

export class UpdateNominalTestSuites
  implements
    IUseCase<
      UpdateNominalTestSuitesRequestDto,
      UpdateNominalTestSuitesResponseDto,
      UpdateNominalTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: INominalTestSuiteRepo;

  constructor(nominalTestSuiteRepo: NominalTestSuiteRepo) {
    this.#repo = nominalTestSuiteRepo;
  }

  #getReplacement = (
    testSuite: NominalTestSuite,
    updateObj: UpdateObject
  ): NominalTestSuite =>
    NominalTestSuite.create({
      id: testSuite.id,
      organizationId: testSuite.organizationId,
      target: testSuite.target,
      type: testSuite.type,
      activated: updateObj.props.activated || testSuite.activated,
      executionFrequency:
        updateObj.props.frequency || testSuite.executionFrequency,
      executionType: updateObj.props.executionType || testSuite.executionType,
      cron: updateObj.props.cron || testSuite.cron,
    });

  async execute(
    req: UpdateNominalTestSuitesRequestDto,
    auth: UpdateNominalTestSuitesAuthDto,
    connPool: IConnectionPool
  ): Promise<UpdateNominalTestSuitesResponseDto> {
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
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
