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
  getFrequencyCronExpression,
  patchCronJob,
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
    if (!userAccountInfo.callerOrganizationId)
      throw new Error('callerOrganizationId missing');
    return {
      jwt,
      callerOrganizationId: userAccountInfo.callerOrganizationId,
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
          if (el.cron || el.frequency || el.activated !== undefined) {
            let cron: string | undefined;
            if (el.cron) cron = el.cron;
            else if (el.frequency)
              cron = getFrequencyCronExpression(el.frequency);

            await patchCronJob(el.id, {
              cron,
              toBeActivated: el.activated,
            });
          }
        })
      );

      return UpdateTestSuitesController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      return UpdateTestSuitesController.fail(
        res,
        'update test suites - Unknown error occured'
      );
    }
  }
}
