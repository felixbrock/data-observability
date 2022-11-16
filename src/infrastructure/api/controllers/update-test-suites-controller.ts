// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateTestSuites,
  UpdateTestSuitesAuthDto,
  UpdateTestSuitesRequestDto,
  UpdateTestSuitesResponseDto,
} from '../../../domain/test-suite/update-test-suites';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';
import {
  getAutomaticCronExpression,
  getFrequencyCronExpression,
  patchCronJob,
  patchTarget,
  updateCronJobState,
} from '../../../domain/services/cron-job';

export default class UpdateTestSuitesController extends BaseController {
  readonly #updateTestSuites: UpdateTestSuites;

  readonly #getAccounts: GetAccounts;

  constructor(updateTestSuites: UpdateTestSuites, getAccounts: GetAccounts) {
    super();
    this.#getAccounts = getAccounts;
    this.#updateTestSuites = updateTestSuites;
  }

  #buildRequestDto = (httpRequest: Request): UpdateTestSuitesRequestDto => ({
    updateObjects: httpRequest.body.updateObjects,
  });

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): UpdateTestSuitesAuthDto => {
    if (!userAccountInfo.callerOrgId)
      throw new Error('callerOrgId missing');
    return {
      jwt,
      callerOrgId: userAccountInfo.callerOrgId,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return UpdateTestSuitesController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await UpdateTestSuitesController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return UpdateTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: UpdateTestSuitesRequestDto = this.#buildRequestDto(req);
      const authDto: UpdateTestSuitesAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const useCaseResult: UpdateTestSuitesResponseDto =
        await this.#updateTestSuites.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return UpdateTestSuitesController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value;
      if (!resultValue)
        UpdateTestSuitesController.fail(
          res,
          'Update of test suites failed. Internal error.'
        );

      await Promise.all(
        requestDto.updateObjects.map(async (el) => {
          const { id, cron, frequency, executionType, activated } = el;

          if (cron || frequency || executionType) {
            let localCron: string | undefined;
            if (executionType === 'automatic')
              localCron = getAutomaticCronExpression();
            else if (cron) localCron = cron;
            else if (frequency)
              localCron = getFrequencyCronExpression(frequency);

            await patchCronJob(id, {
              cron: localCron,
            });

            if (executionType)
              await patchTarget(id, {
                executionType,
              });
          }

          if (activated !== undefined) await updateCronJobState(id, activated);
        })
      );

      return UpdateTestSuitesController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return UpdateTestSuitesController.fail(
        res,
        'update test suites - Unknown error occured'
      );
    }
  }
}
