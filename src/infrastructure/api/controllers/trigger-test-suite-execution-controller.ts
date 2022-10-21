// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
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
} from '../../shared/base-controller';

export default class TriggerTestSuiteExecutionController extends BaseController {
  readonly #triggerTestSuiteExecution: TriggerTestSuiteExecution;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    triggerTestSuiteExecution: TriggerTestSuiteExecution,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#triggerTestSuiteExecution = triggerTestSuiteExecution;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): TriggerTestSuiteExecutionRequestDto => ({ id: httpRequest.body.id });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerTestSuiteExecutionAuthDto => {
    if (!userAccountInfo.callerOrganizationId)
      throw new Error('tigger-test-execution - callerOrganizationId missing');

    return {
      jwt,
      callerOrganizationId: userAccountInfo.callerOrganizationId,
    };
  };

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
        await TriggerTestSuiteExecutionController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

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

      const useCaseResult: TriggerTestSuiteExecutionResponseDto =
        await this.#triggerTestSuiteExecution.execute(requestDto, authDto,
          this.#dbo.dbConnection
          );

      if (!useCaseResult.success) {
        return TriggerTestSuiteExecutionController.badRequest(
          res,
        );
      }

      return TriggerTestSuiteExecutionController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return TriggerTestSuiteExecutionController.fail(
        res,
        'trigger test suite execution - Unknown error occured'
      );
    }
  }
}
