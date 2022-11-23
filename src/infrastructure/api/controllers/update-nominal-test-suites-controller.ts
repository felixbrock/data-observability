// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
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
} from './shared/base-controller';
import {
  getAutomaticCronExpression,
  getFrequencyCronExpression,
  patchCronJob,
  patchTarget,
  updateCronJobState,
} from '../../../domain/services/cron-job';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import { appConfig } from '../../../config';

export default class UpdateNominalTestSuitesController extends BaseController {
  readonly #updateNominalTestSuites: UpdateNominalTestSuites;

  constructor(
    updateNominalTestSuites: UpdateNominalTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
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
    if (!userAccountInfo.callerOrgId) throw new Error('callerOrgId missing');
    return {
      jwt,
      callerOrgId: userAccountInfo.callerOrgId,
      isSystemInternal: userAccountInfo.isSystemInternal,
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
        await this.getUserAccountInfo(jwt);

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

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: UpdateNominalTestSuitesResponseDto =
        await this.#updateNominalTestSuites.execute(
          requestDto,
          authDto,
          connPool
        );

      await connPool.drain();
      await connPool.clear();

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

      const eventBridgeClient = new EventBridgeClient({
        region: appConfig.cloud.region,
      });

      await Promise.all(
        requestDto.updateObjects.map(async (el) => {
          const { id } = el;
          const { cron, frequency, executionType, activated } = el.props;

          if (cron || frequency || executionType) {
            let localCron: string | undefined;
            if (executionType === 'automatic')
              localCron = getAutomaticCronExpression();
            else if (cron) localCron = cron;
            else if (frequency)
              localCron = getFrequencyCronExpression(frequency);

            await patchCronJob(
              id,
              {
                cron: localCron,
              },
              eventBridgeClient
            );

            if (executionType)
              await patchTarget(
                id,
                {
                  executionType,
                },
                eventBridgeClient
              );
          }

          if (activated !== undefined)
            await updateCronJobState(id, activated, eventBridgeClient);
        })
      );

      eventBridgeClient.destroy();

      return UpdateNominalTestSuitesController.ok(
        res,
        resultValue,
        CodeHttp.OK
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return UpdateNominalTestSuitesController.fail(
        res,
        'update nominal test suites - Unknown error occured'
      );
    }
  }
}
