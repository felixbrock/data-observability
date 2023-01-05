// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import {
  TriggerQualTestSuiteExecution,
  TriggerQualTestSuiteExecutionAuthDto,
  TriggerQualTestSuiteExecutionRequestDto,
  TriggerQualTestSuiteExecutionResponseDto,
} from '../../../domain/qual-test-suite/trigger-qual-test-suite-execution';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class TriggerQualTestSuiteExecutionController extends BaseController {
  readonly #triggerQualTestSuiteExecution: TriggerQualTestSuiteExecution;

  readonly #dbo: Dbo;

  constructor(
    triggerQualTestSuiteExecution: TriggerQualTestSuiteExecution,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#triggerQualTestSuiteExecution = triggerQualTestSuiteExecution;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): TriggerQualTestSuiteExecutionRequestDto => ({
    id: httpRequest.params.id,
    targetOrgId: httpRequest.body.targetOrgId,
    executionType: httpRequest.body.executionType,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerQualTestSuiteExecutionAuthDto => ({
    jwt,
    callerOrgId: userAccountInfo.callerOrgId,
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return TriggerQualTestSuiteExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return TriggerQualTestSuiteExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: TriggerQualTestSuiteExecutionRequestDto =
        this.#buildRequestDto(req);

      console.log(`Handling trigger request for qual test-suite ${requestDto.id} of org ${requestDto.targetOrgId}`);


      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const connPool = await this.createConnectionPool(jwt, createPool, requestDto.targetOrgId);

      const useCaseResult: TriggerQualTestSuiteExecutionResponseDto =
        await this.#triggerQualTestSuiteExecution.execute(
          requestDto,
          authDto,
          { mongoConn: this.#dbo.dbConnection, sfConnPool: connPool }
        );

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return TriggerQualTestSuiteExecutionController.badRequest(res);
      }

      return TriggerQualTestSuiteExecutionController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return TriggerQualTestSuiteExecutionController.fail(
        res,
        'trigger qual test suite - Unknown error occurred'
      );
    }
  }
}
