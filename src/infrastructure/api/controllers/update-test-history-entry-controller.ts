// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import {
  UpdateTestHistoryEntry,
  UpdateTestHistoryEntryAuthDto,
  UpdateTestHistoryEntryRequestDto,
  UpdateTestHistoryEntryResponseDto,
} from '../../../domain/snowflake-api/update-test-history-entry';
import Result from '../../../domain/value-types/transient-types/result';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class UpdateTestHistoryEntryController extends BaseController {
  readonly #updateTestHistoryEntry: UpdateTestHistoryEntry;

  constructor(
    updateTestHistoryEntry: UpdateTestHistoryEntry,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#updateTestHistoryEntry = updateTestHistoryEntry;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): UpdateTestHistoryEntryRequestDto => ({
    alertId: httpRequest.params.alertId,
    testType: httpRequest.body.testType,
    userFeedbackIsAnomaly: httpRequest.body.userFeedbackIsAnomaly,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): UpdateTestHistoryEntryAuthDto => {
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
        return UpdateTestHistoryEntryController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return UpdateTestHistoryEntryController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: UpdateTestHistoryEntryRequestDto =
        this.#buildRequestDto(req);
      const authDto: UpdateTestHistoryEntryAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value,
        jwt
      );

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: UpdateTestHistoryEntryResponseDto =
        await this.#updateTestHistoryEntry.execute(
          requestDto,
          authDto,
          connPool
        );

      if (!useCaseResult.success) {
        return UpdateTestHistoryEntryController.badRequest(res);
      }

      const resultValue = useCaseResult.value;

      await connPool.drain();
      await connPool.clear();

      return UpdateTestHistoryEntryController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return UpdateTestHistoryEntryController.fail(
        res,
        'udpate test history - Unknown error occured'
      );
    }
  }
}
