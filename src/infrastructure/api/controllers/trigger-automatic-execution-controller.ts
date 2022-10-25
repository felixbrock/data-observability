// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  TriggerAutomaticExecution,
  TriggerAutomaticExecutionAuthDto,
  TriggerAutomaticExecutionRequestDto,
  TriggerAutomaticExecutionResponseDto,
} from '../../../domain/test-suite/trigger-automatic-execution';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class TriggerAutomaticExecutionController extends BaseController {
  readonly #triggerAutomaticExecution: TriggerAutomaticExecution;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    triggerAutomaticExecution: TriggerAutomaticExecution,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#triggerAutomaticExecution = triggerAutomaticExecution;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }


  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerAutomaticExecutionAuthDto => ({
    isSystemInternal: userAccountInfo.isSystemInternal,
    jwt,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return TriggerAutomaticExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await TriggerAutomaticExecutionController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return TriggerAutomaticExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.isSystemInternal)
        return TriggerAutomaticExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const requestDto: TriggerAutomaticExecutionRequestDto =
        null;

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: TriggerAutomaticExecutionResponseDto =
        await this.#triggerAutomaticExecution.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return TriggerAutomaticExecutionController.badRequest(res);
      }

      return TriggerAutomaticExecutionController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return TriggerAutomaticExecutionController.fail(
        res,
        'trigger test suites execution - Unknown error occured'
      );
    }
  }
}
