// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { createPool } from 'snowflake-sdk';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { GetSnowflakeProfile } from '../../../domain/integration-api/get-snowflake-profile';
import {
  TriggerNominalTestSuiteExecution,
  TriggerNominalTestSuiteExecutionAuthDto,
  TriggerNominalTestSuiteExecutionRequestDto,
  TriggerNominalTestSuiteExecutionResponseDto,
} from '../../../domain/nominal-test-suite/trigger-nominal-test-suite-execution';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from './shared/base-controller';

export default class TriggerNominalTestSuiteExecutionController extends BaseController {
  readonly #triggerNominalTestSuiteExecution: TriggerNominalTestSuiteExecution;

  readonly #dbo: Dbo;

  constructor(
    triggerNominalTestSuiteExecution: TriggerNominalTestSuiteExecution,
    getAccounts: GetAccounts,
    getSnowflakeProfile: GetSnowflakeProfile,
    dbo: Dbo
  ) {
    super(getAccounts, getSnowflakeProfile);
    this.#triggerNominalTestSuiteExecution = triggerNominalTestSuiteExecution;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): TriggerNominalTestSuiteExecutionRequestDto => ({
    id: httpRequest.params.id,
    targetOrgId: httpRequest.body.targetOrgId,
    executionType: httpRequest.body.executionType,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerNominalTestSuiteExecutionAuthDto => ({
    jwt,
    callerOrgId: userAccountInfo.callerOrgId,
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return TriggerNominalTestSuiteExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await this.getUserAccountInfo(jwt);

      if (!getUserAccountInfoResult.success)
        return TriggerNominalTestSuiteExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: TriggerNominalTestSuiteExecutionRequestDto =
        this.#buildRequestDto(req);

      console.log(`Handling trigger request for nominal test-suite ${requestDto.id} of org ${requestDto.targetOrgId}`);


      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const connPool = await this.createConnectionPool(jwt, createPool, requestDto.targetOrgId);

      const useCaseResult: TriggerNominalTestSuiteExecutionResponseDto =
        await this.#triggerNominalTestSuiteExecution.execute(
          requestDto,
          authDto,
          { mongoConn: this.#dbo.dbConnection, sfConnPool: connPool }
        );

      await connPool.drain();
      await connPool.clear();

      if (!useCaseResult.success) {
        return TriggerNominalTestSuiteExecutionController.badRequest(res);
      }

      return TriggerNominalTestSuiteExecutionController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return TriggerNominalTestSuiteExecutionController.fail(
        res,
        'trigger nominal test suite - Unknown error occured'
      );
    }
  }
}
