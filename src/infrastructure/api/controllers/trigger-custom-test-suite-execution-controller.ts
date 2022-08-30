// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  TriggerCustomTestSuiteExecution,
  TriggerCustomTestSuiteExecutionAuthDto,
  TriggerCustomTestSuiteExecutionRequestDto,
  TriggerCustomTestSuiteExecutionResponseDto,
} from '../../../domain/custom-test-suite/trigger-custom-test-suite-execution';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class TriggerCustomTestSuiteExecutionController extends BaseController {
  readonly #triggerCustomTestSuiteExecution: TriggerCustomTestSuiteExecution;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    triggerCustomTestSuiteExecution: TriggerCustomTestSuiteExecution,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#triggerCustomTestSuiteExecution = triggerCustomTestSuiteExecution;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): TriggerCustomTestSuiteExecutionRequestDto => {
    if (Number.isNaN(httpRequest.body.frequency))
      throw new Error('Provided frequency not in the right format');

    return { frequency: httpRequest.body.frequency };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo,
    jwt: string
  ): TriggerCustomTestSuiteExecutionAuthDto => ({
    isSystemInternal: userAccountInfo.isSystemInternal,
    jwt,
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
        await TriggerCustomTestSuiteExecutionController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return TriggerCustomTestSuiteExecutionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.isSystemInternal)
        return TriggerCustomTestSuiteExecutionController.unauthorized(
          res,
          'Unauthorized'
        );

      const requestDto: TriggerCustomTestSuiteExecutionRequestDto =
        this.#buildRequestDto(req);

      const authDto = this.#buildAuthDto(getUserAccountInfoResult.value, jwt);

      const useCaseResult: TriggerCustomTestSuiteExecutionResponseDto =
        await this.#triggerCustomTestSuiteExecution.execute(
          requestDto,
          authDto
        );

      if (!useCaseResult.success) {
        return TriggerCustomTestSuiteExecutionController.badRequest(
          res,
          useCaseResult.error
        );
      }

      return TriggerCustomTestSuiteExecutionController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === 'string')
        return TriggerCustomTestSuiteExecutionController.fail(res, error);
      if (error instanceof Error)
        return TriggerCustomTestSuiteExecutionController.fail(res, error);
      return TriggerCustomTestSuiteExecutionController.fail(
        res,
        'Unknown error occured'
      );
    }
  }
}
