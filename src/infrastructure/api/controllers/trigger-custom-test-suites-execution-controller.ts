// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  TriggerCustomTestSuitesExecution,
  TriggerCustomTestSuitesExecutionAuthDto,
  TriggerCustomTestSuitesExecutionRequestDto,
  TriggerCustomTestSuitesExecutionResponseDto,
} from '../../../domain/custom-test-suite/trigger-custom-test-suites-execution';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class TriggerCustomTestSuitesExecutionController extends BaseController {
  readonly #triggerCustomTestSuitesExecution: TriggerCustomTestSuitesExecution;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    triggerCustomTestSuitesExecution: TriggerCustomTestSuitesExecution,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#triggerCustomTestSuitesExecution = triggerCustomTestSuitesExecution;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): TriggerCustomTestSuitesExecutionRequestDto => {
    if (Number.isNaN(httpRequest.body.frequency))
      throw new Error('Provided frequency not in the right format');

    return { frequency: httpRequest.body.frequency };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerCustomTestSuitesExecutionAuthDto => ({
    isSystemInternal: userAccountInfo.isSystemInternal,
    jwt,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return TriggerCustomTestSuitesExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await TriggerCustomTestSuitesExecutionController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return TriggerCustomTestSuitesExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.isSystemInternal)
        return TriggerCustomTestSuitesExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const requestDto: TriggerCustomTestSuitesExecutionRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: TriggerCustomTestSuitesExecutionResponseDto =
        await this.#triggerCustomTestSuitesExecution.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return TriggerCustomTestSuitesExecutionController.badRequest(
          res,
        );
      }

      return TriggerCustomTestSuitesExecutionController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      return TriggerCustomTestSuitesExecutionController.fail(
        res,
        'trigger custom test suites execution - Unknown error occured'
      );
    }
  }
}
