// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  TriggerTestSuitesExecution,
  TriggerTestSuitesExecutionAuthDto,
  TriggerTestSuitesExecutionRequestDto,
  TriggerTestSuitesExecutionResponseDto,
} from '../../../domain/test-suite/trigger-test-suites-execution';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class TriggerTestSuitesExecutionController extends BaseController {
  readonly #triggerTestSuitesExecution: TriggerTestSuitesExecution;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    triggerTestSuitesExecution: TriggerTestSuitesExecution,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#triggerTestSuitesExecution = triggerTestSuitesExecution;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): TriggerTestSuitesExecutionRequestDto => {
    if (Number.isNaN(httpRequest.body.frequency))
      throw new Error('Provided frequency not in the right format');

    return { frequency: httpRequest.body.frequency };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerTestSuitesExecutionAuthDto => ({
    isSystemInternal: userAccountInfo.isSystemInternal,
    jwt,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return TriggerTestSuitesExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await TriggerTestSuitesExecutionController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return TriggerTestSuitesExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.isSystemInternal)
        return TriggerTestSuitesExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const requestDto: TriggerTestSuitesExecutionRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: TriggerTestSuitesExecutionResponseDto =
        await this.#triggerTestSuitesExecution.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return TriggerTestSuitesExecutionController.badRequest(res);
      }

      return TriggerTestSuitesExecutionController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return TriggerTestSuitesExecutionController.fail(
        res,
        'trigger test suites execution - Unknown error occured'
      );
    }
  }
}
