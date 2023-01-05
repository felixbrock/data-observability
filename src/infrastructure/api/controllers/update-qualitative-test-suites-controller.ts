// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateQualitativeTestSuites,
  UpdateQualitativeTestSuitesAuthDto,
  UpdateQualitativeTestSuitesRequestDto,
  UpdateQualitativeTestSuitesResponseDto,
} from '../../../domain/qualitative-test-suite/update-qualitative-test-suites';
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

export default class UpdateQualitativeTestSuitesController extends BaseController {
  readonly #updateQualitativeTestSuites: UpdateQualitativeTestSuites;

  constructor(
    updateQualitativeTestSuites: UpdateQualitativeTestSuites,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#updateQualitativeTestSuites = updateQualitativeTestSuites;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): UpdateQualitativeTestSuitesRequestDto => ({
    updateObjects: httpRequest.body.updateObjects,
  });

  #buildAuthDto = (
    jwt: string,
    userAccountInfo: UserAccountInfo
  ): UpdateQualitativeTestSuitesAuthDto => {
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
        return UpdateQualitativeTestSuitesController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return UpdateQualitativeTestSuitesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: UpdateQualitativeTestSuitesRequestDto =
        this.#buildRequestDto(req);
      const authDto: UpdateQualitativeTestSuitesAuthDto = this.#buildAuthDto(
        jwt,
        getUserAccountInfoResult.value
      );

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: UpdateQualitativeTestSuitesResponseDto =
        await this.#updateQualitativeTestSuites.execute(
          requestDto,
          authDto,
          connPool
        );

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return UpdateQualitativeTestSuitesController.badRequest(
          res,
          useCaseResult.error
        );
      }

      const resultValue = useCaseResult.value;
      if (!resultValue)
        UpdateQualitativeTestSuitesController.fail(
          res,
          'Update of test suites failed. Internal error.'
        );

      await handleScheduleUpdate(authDto.callerOrgId, requestDto.updateObjects);

      return UpdateQualitativeTestSuitesController.ok(
        res,
        resultValue,
        CodeHttp.OK
      );
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return UpdateQualitativeTestSuitesController.fail(
        res,
        'update qualitative test suites - Unknown error occurred'
      );
    }
  }
}
