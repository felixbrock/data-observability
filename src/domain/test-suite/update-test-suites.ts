import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { ExecutionType } from '../value-types/execution-type';
import { ITestSuiteRepo } from './i-test-suite-repo';
import TestSuiteRepo from '../../infrastructure/persistence/test-suite-repo';
import { TestSuite } from '../entities/quant-test-suite';
import { updateSchedules } from '../services/schedule';
import { CustomThresholdMode } from '../value-types/custom-threshold-mode';
import { IDbConnection } from '../services/i-db';

interface UpdateObject {
  id: string;
  props: {
    activated?: boolean;
    customLowerThreshold?: { value: number; mode: CustomThresholdMode };
    customUpperThreshold?: { value: number; mode: CustomThresholdMode };
    cron?: string;
    executionType?: ExecutionType;
    feedbackLowerThreshold?: number;
    feedbackUpperThreshold?: number;
    lastAlertSent?: string;
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
      IDbConnection
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
      customLowerThreshold: updateObj.props.customLowerThreshold
        ? updateObj.props.customLowerThreshold.value
        : testSuite.customLowerThreshold,
      customUpperThreshold: updateObj.props.customUpperThreshold
        ? updateObj.props.customUpperThreshold.value
        : testSuite.customUpperThreshold,
      customLowerThresholdMode: updateObj.props.customLowerThreshold
        ? updateObj.props.customLowerThreshold.mode
        : testSuite.customLowerThresholdMode,
      customUpperThresholdMode: updateObj.props.customUpperThreshold
        ? updateObj.props.customUpperThreshold.mode
        : testSuite.customUpperThresholdMode,
      executionType: updateObj.props.executionType || testSuite.executionType,
      feedbackLowerThreshold: updateObj.props.feedbackLowerThreshold
        ? updateObj.props.feedbackLowerThreshold
        : testSuite.feedbackLowerThreshold,
      feedbackUpperThreshold: updateObj.props.feedbackUpperThreshold
        ? updateObj.props.feedbackUpperThreshold
        : testSuite.feedbackUpperThreshold,
      cron: updateObj.props.cron || testSuite.cron,
      lastAlertSent: updateObj.props.lastAlertSent
        ? updateObj.props.lastAlertSent
        : testSuite.lastAlertSent,
    });

  async execute(props: {
    req: UpdateTestSuitesRequestDto;
    auth: UpdateTestSuitesAuthDto;
    dbConnection: IDbConnection
  }): Promise<UpdateTestSuitesResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      if (req.updateObjects.every((el) => !el.props)) return Result.ok();

      const testSuites = await this.#repo.findBy(
        { ids: req.updateObjects.map((el) => el.id), deleted: false },
        dbConnection, auth.callerOrgId, true
      ) as TestSuite[];

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
        dbConnection, auth.callerOrgId
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
