import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { ExecutionType } from '../value-types/execution-type';
import { IQualTestSuiteRepo } from './i-qual-test-suite-repo';
import QualTestSuiteRepo from '../../infrastructure/persistence/qual-test-suite-repo';
import { QualTestSuite } from '../entities/qual-test-suite';
import { updateSchedules } from '../services/schedule';
import { IDbConnection } from '../services/i-db';

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

export type UpdateQualTestSuitesAuthDto = { callerOrgId: string };

export type UpdateQualTestSuitesResponseDto = Result<number>;

export class UpdateQualTestSuites
  implements
    IUseCase<
      UpdateQualTestSuitesRequestDto,
      UpdateQualTestSuitesResponseDto,
      UpdateQualTestSuitesAuthDto,
      IDbConnection
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

  async execute(props: {
    req: UpdateQualTestSuitesRequestDto;
    auth: UpdateQualTestSuitesAuthDto;
    dbConnection: IDbConnection;
  }): Promise<UpdateQualTestSuitesResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      if (req.updateObjects.every((el) => !el.props)) return Result.ok();

      const testSuites = await this.#repo.findBy(
        { ids: req.updateObjects.map((el) => el.id), deleted: false },
        dbConnection, auth.callerOrgId, true
      ) as QualTestSuite[];

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
        dbConnection,
        auth.callerOrgId
      );

      await updateSchedules(
        auth.callerOrgId,
        'nominal-test',
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
