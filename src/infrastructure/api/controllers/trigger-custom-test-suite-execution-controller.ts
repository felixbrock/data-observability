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
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return TriggerCustomTestSuiteExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: TriggerCustomTestSuiteExecutionRequestDto =
        this.#buildRequestDto(req);

      console.log(
        `Handling trigger request for custom test-suite ${requestDto.id} of org ${requestDto.targetOrgId}`
      );

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const connPool = await this.createConnectionPool(
        jwt,
        createPool,
        requestDto.targetOrgId
      );

      const useCaseResult: TriggerCustomTestSuiteExecutionResponseDto =
        await this.#triggerCustomTestSuiteExecution.execute({
          req: requestDto,
          auth: authDto,
          db: { mongoConn: this.#dbo.dbConnection, sfConnPool: connPool },
        });

      await connPool.drain();
      await connPool.clear();
      await this.#dbo.releaseConnections();

      if (!useCaseResult.success) {
        return TriggerCustomTestSuiteExecutionController.badRequest(res);
      }

      return TriggerCustomTestSuiteExecutionController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return TriggerCustomTestSuiteExecutionController.fail(
        res,
        'trigger custom test suite execution - Unknown error occurred'
      );
    }
  }
}
