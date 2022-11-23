// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import {
  TriggerTestSuiteExecution,
  TriggerTestSuiteExecutionAuthDto,
  TriggerTestSuiteExecutionRequestDto,
  TriggerTestSuiteExecutionResponseDto,
} from '../../../domain/test-suite/trigger-test-suite-execution';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class TriggerTestSuiteExecutionController extends BaseController {
  readonly #triggerTestSuiteExecution: TriggerTestSuiteExecution;

  readonly #dbo: Dbo;

  constructor(
    triggerTestSuiteExecution: TriggerTestSuiteExecution,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#triggerTestSuiteExecution = triggerTestSuiteExecution;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): TriggerTestSuiteExecutionRequestDto => ({
    id: httpRequest.params.id,
    targetOrgId: httpRequest.body.targetOrgId,
    executionType: httpRequest.body.executionType,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerTestSuiteExecutionAuthDto => ({
    jwt,
    callerOrgId: userAccountInfo.callerOrgId,
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return TriggerTestSuiteExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return TriggerTestSuiteExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: TriggerTestSuiteExecutionRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const connPool = await this.createConnectionPool(jwt, createPool);

      const useCaseResult: TriggerTestSuiteExecutionResponseDto =
        await this.#triggerTestSuiteExecution.execute(requestDto, authDto, {
          mongoConn: this.#dbo.dbConnection,
          sfConnPool: connPool,
        });

      if (!useCaseResult.success) {
        return TriggerTestSuiteExecutionController.badRequest(res);
      }

      await connPool.drain();
      await connPool.clear();

      return TriggerTestSuiteExecutionController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return TriggerTestSuiteExecutionController.fail(
        res,
        'trigger test suite execution - Unknown error occured'
      );
    }
  }
}
