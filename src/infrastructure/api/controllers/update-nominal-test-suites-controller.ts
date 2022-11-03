// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateNominalTestSuites,
  UpdateNominalTestSuitesAuthDto,
  UpdateNominalTestSuitesRequestDto,
  UpdateNominalTestSuitesResponseDto,
} from '../../../domain/nominal-test-suite/update-nominal-test-suites';
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

export default class UpdateNominalTestSuitesController extends BaseController {
  readonly #updateNominalTestSuites: UpdateNominalTestSuites;

  readonly #getAccounts: GetAccounts;

  constructor(
    updateNominalTestSuites: UpdateNominalTestSuites,
    getAccounts: GetAccounts
  ) {
    super();
    this.#getAccounts = getAccounts;
    this.#updateNominalTestSuites = updateNominalTestSuites;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): UpdateNominalTestSuitesRequestDto => ({
    updateObjects: httpRequest.body.updateObjects,
  });

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): UpdateNominalTestSuitesAuthDto => {
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
        return UpdateNominalTestSuitesController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await UpdateNominalTestSuitesController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return UpdateNominalTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: UpdateNominalTestSuitesRequestDto =
        this.#buildRequestDto(req);
      const authDto: UpdateNominalTestSuitesAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const useCaseResult: UpdateNominalTestSuitesResponseDto =
        await this.#updateNominalTestSuites.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return UpdateNominalTestSuitesController.badRequest(
          res,
          useCaseResult.error
        );
      }

      const resultValue = useCaseResult.value;
      if (!resultValue)
        UpdateNominalTestSuitesController.fail(
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

      return UpdateNominalTestSuitesController.ok(
        res,
        resultValue,
        CodeHttp.OK
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return UpdateNominalTestSuitesController.fail(
        res,
        'update nominal test suites - Unknown error occured'
      );
    }
  }
}
