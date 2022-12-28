// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
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
  handleScheduleUpdate,
} from '../../../domain/services/schedule';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';

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

      await handleScheduleUpdate(authDto.callerOrgId, requestDto.updateObjects);

      return UpdateNominalTestSuitesController.ok(
        res,
        resultValue,
        CodeHttp.OK
      );
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return UpdateNominalTestSuitesController.fail(
        res,
        'update nominal test suites - Unknown error occurred'
      );
    }
  }
}
