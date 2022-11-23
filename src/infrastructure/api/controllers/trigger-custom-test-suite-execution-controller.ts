// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  TriggerCustomTestSuiteExecution,
  TriggerCustomTestSuiteExecutionAuthDto,
  TriggerCustomTestSuiteExecutionRequestDto,
  TriggerCustomTestSuiteExecutionResponseDto,
} from '../../../domain/custom-test-suite/trigger-custom-test-suite-execution';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class TriggerCustomTestSuiteExecutionController extends BaseController {
  readonly #triggerCustomTestSuiteExecution: TriggerCustomTestSuiteExecution;

  readonly #dbo: Dbo;

  constructor(
    triggerCustomTestSuiteExecution: TriggerCustomTestSuiteExecution,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#triggerCustomTestSuiteExecution = triggerCustomTestSuiteExecution;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): TriggerCustomTestSuiteExecutionRequestDto => {
    const { id } = httpRequest.params;

    return {
      id,
      targetOrgId: httpRequest.body.targetOrgId,
      executionType: httpRequest.body.executionType,
    };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerCustomTestSuiteExecutionAuthDto => ({
    jwt,
    callerOrgId: userAccountInfo.callerOrgId,
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return TriggerCustomTestSuiteExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(
          jwt,
        );

      if (!getUserAccountInfoResult.success)
        return TriggerCustomTestSuiteExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: TriggerCustomTestSuiteExecutionRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const connPool = await this.createConnectionPool(jwt, createPool);


      const useCaseResult: TriggerCustomTestSuiteExecutionResponseDto =
        await this.#triggerCustomTestSuiteExecution.execute(
          requestDto,
          authDto,
          {mongoConn: this.#dbo.dbConnection, sfConnPool: connPool}
        );

      if (!useCaseResult.success) {
        return TriggerCustomTestSuiteExecutionController.badRequest(res);
      }

      await connPool.drain();
      await connPool.clear();

      return TriggerCustomTestSuiteExecutionController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return TriggerCustomTestSuiteExecutionController.fail(
        res,
        'trigger custom test suite execution - Unknown error occured'
      );
    }
  }
}
